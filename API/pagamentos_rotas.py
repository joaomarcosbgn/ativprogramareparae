"""Pagamento Pix via Mercado Pago: cobrança, consulta, histórico e webhook."""
import logging
import os
import time
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import models
import mercadopago_pix as mp
from database import get_db

log = logging.getLogger("reparae.pagamentos")

SOLICITACAO_PAGAVEL = ("Pendente", "Aceita", "Concluída")
INTERVALO_CONSULTA_S = 4


class PagamentoCreate(BaseModel):
    solicitacao_id: int = Field(..., gt=0)


class PagamentoOut(BaseModel):
    id: int
    solicitacao_id: int
    servico: str
    valor: float
    status: str
    qr_code: str | None = None
    qr_code_base64: str | None = None
    expiracao: str
    criado_em: str
    pago_em: str | None = None


def _agora() -> datetime:
    return datetime.now(timezone.utc)


def _iso(d: datetime) -> str:
    return d.isoformat()


def _parse(iso: str) -> datetime:
    d = datetime.fromisoformat(iso)
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


def _expiracao_mp(d: datetime) -> str:
    return d.strftime("%Y-%m-%dT%H:%M:%S.000+00:00")


def _notification_url() -> str:
    return os.getenv("MERCADOPAGO_NOTIFICATION_URL", "").strip() or "https://reparae-api.onrender.com/webhooks/mercadopago"


def _referencia(pag) -> str:
    return f"reparae-pag-{pag.id}"


def _saida(db: Session, pag) -> PagamentoOut:
    sol = db.get(models.Solicitacao, pag.solicitacao_id)
    servico = db.get(models.Servico, sol.servico_id)
    mostrar_qr = pag.status == "pendente"
    return PagamentoOut(
        id=pag.id,
        solicitacao_id=pag.solicitacao_id,
        servico=servico.nome,
        valor=pag.valor_centavos / 100,
        status=pag.status,
        qr_code=pag.qr_code if mostrar_qr else None,
        qr_code_base64=pag.qr_code_base64 if mostrar_qr else None,
        expiracao=pag.expiracao,
        criado_em=pag.criado_em,
        pago_em=pag.pago_em,
    )


# ---------------------------------------------------------------------------
# Regras centrais
# ---------------------------------------------------------------------------

def aplicar_dados_mp(db: Session, pag, dados: dict) -> None:
    """Atualiza o pagamento local SOMENTE com dados lidos da API do Mercado Pago.

    'pago' exige: id, referência, método Pix, moeda e valor idênticos ao banco.
    """
    mp_id = str(dados.get("id", ""))
    if pag.mp_payment_id and pag.mp_payment_id != mp_id:
        log.warning("Pagamento %s: id MP %s ignorado (atual %s).", pag.id, mp_id, pag.mp_payment_id)
        return
    novo = mp.MAPA_STATUS.get(dados.get("status"))
    if novo is None:
        return
    if novo == "pago":
        valor_mp = mp.centavos(dados.get("transaction_amount", 0))
        coerente = (
            dados.get("external_reference") == _referencia(pag)
            and dados.get("payment_method_id") == "pix"
            and dados.get("currency_id", "BRL") == "BRL"
            and valor_mp == pag.valor_centavos
        )
        if not coerente:
            log.error("Pagamento %s: divergência (ref/valor/método) no MP %s.", pag.id, mp_id)
            db.execute(update(models.Pagamento).where(
                models.Pagamento.id == pag.id, models.Pagamento.status != "pago"
            ).values(status="divergente", atualizado_em=_iso(_agora())))
            db.commit()
            db.refresh(pag)
            return
    agora = _iso(_agora())
    valores = {"status": novo, "atualizado_em": agora}
    if novo == "pago":
        valores["pago_em"] = agora
    if not pag.mp_payment_id:
        valores["mp_payment_id"] = mp_id
    # Idempotente: 'pago' nunca regride, exceto para 'estornado'.
    cond = [models.Pagamento.id == pag.id]
    if novo == "estornado":
        cond.append(models.Pagamento.status == "pago")
    else:
        cond.append(models.Pagamento.status.notin_(("pago", "estornado", "divergente")))
    db.execute(update(models.Pagamento).where(*cond).values(**valores))
    db.commit()
    db.refresh(pag)


def sincronizar(db: Session, pag, forcar: bool = False) -> None:
    """Consulta a API do MP (fonte da verdade) com limite de frequência."""
    if pag.status != "pendente" or not pag.mp_payment_id:
        return
    agora = time.time()
    if not forcar and pag.consultado_em and agora - pag.consultado_em < INTERVALO_CONSULTA_S:
        return
    try:
        dados = mp.consultar_pagamento(pag.mp_payment_id)
    except mp.MercadoPagoErro as erro:
        log.warning("Consulta MP falhou (pagamento %s): %s", pag.id, erro)
        return
    pag.consultado_em = agora
    db.commit()
    aplicar_dados_mp(db, pag, dados)


def _emitir_cobranca(db: Session, pag, usuario, servico) -> None:
    try:
        dados = mp.criar_pix(
            idempotency_key=f"{_referencia(pag)}-t{pag.tentativa}",
            valor_centavos=pag.valor_centavos,
            descricao=servico.nome,
            email=usuario.email,
            nome=usuario.nome,
            referencia=_referencia(pag),
            expiracao_iso=_expiracao_mp(_parse(pag.expiracao)),
            notification_url=_notification_url(),
        )
        tx = (dados.get("point_of_interaction") or {}).get("transaction_data") or {}
        if not dados.get("id") or not tx.get("qr_code"):
            raise mp.MercadoPagoErro("Resposta do MP sem QR Code Pix.")
    except mp.MercadoPagoNaoConfigurado:
        log.error("MERCADOPAGO_ACCESS_TOKEN ausente.")
        raise HTTPException(503, "Pix não configurado no servidor. Contate o suporte.")
    except mp.MercadoPagoErro as erro:
        log.error("Falha ao criar Pix (pagamento %s): %s", pag.id, erro)
        raise HTTPException(502, "Não foi possível gerar a cobrança Pix agora. Tente novamente.")
    db.execute(update(models.Pagamento).where(
        models.Pagamento.id == pag.id,
        models.Pagamento.tentativa == pag.tentativa,
        models.Pagamento.status == "criando",
    ).values(
        mp_payment_id=str(dados["id"]), status="pendente",
        qr_code=tx.get("qr_code"), qr_code_base64=tx.get("qr_code_base64"),
        atualizado_em=_iso(_agora()),
    ))
    db.commit()
    db.refresh(pag)
    aplicar_dados_mp(db, pag, dados)  # caso o MP já devolva status final


def _regenerar(db: Session, pag) -> bool:
    """Nova tentativa na mesma linha; UPDATE condicional evita duas cobranças simultâneas."""
    expira = _agora() + timedelta(minutes=int(os.getenv("PIX_EXPIRACAO_MINUTOS", "30")))
    r = db.execute(update(models.Pagamento).where(
        models.Pagamento.id == pag.id,
        models.Pagamento.tentativa == pag.tentativa,
        models.Pagamento.status == pag.status,
    ).values(
        tentativa=pag.tentativa + 1, status="criando", mp_payment_id=None,
        qr_code=None, qr_code_base64=None, expiracao=_iso(expira),
        atualizado_em=_iso(_agora()), consultado_em=None,
    ))
    db.commit()
    db.refresh(pag)
    return r.rowcount == 1


def cancelar_pagamento_pendente(db: Session, solicitacao_id: int) -> None:
    """Chamado quando a solicitação é cancelada/recusada: cancela o Pix em aberto."""
    pag = db.query(models.Pagamento).filter_by(solicitacao_id=solicitacao_id).first()
    if not pag or pag.status not in ("pendente", "criando"):
        return
    if pag.mp_payment_id:
        try:
            mp.cancelar_pagamento(pag.mp_payment_id)
        except mp.MercadoPagoErro as erro:
            log.warning("Cancelamento MP falhou (pagamento %s): %s", pag.id, erro)
            sincronizar(db, pag, forcar=True)
            if pag.status == "pago":
                return
    db.execute(update(models.Pagamento).where(
        models.Pagamento.id == pag.id, models.Pagamento.status.in_(("pendente", "criando"))
    ).values(status="cancelado", atualizado_em=_iso(_agora())))
    db.commit()


# ---------------------------------------------------------------------------
# Rotas
# ---------------------------------------------------------------------------

def criar_router(obter_usuario_atual) -> APIRouter:
    router = APIRouter()

    def _solicitacao_do_usuario(db, solicitacao_id, usuario):
        sol = db.get(models.Solicitacao, solicitacao_id)
        if not sol:
            raise HTTPException(404, "Solicitação não encontrada.")
        eh_profissional = usuario.tipo == "profissional" and bool(
            db.query(models.Profissional.id).filter(
                models.Profissional.id == sol.profissional_id,
                models.Profissional.usuario_id == usuario.id,
            ).first()
        )
        if usuario.tipo != "admin" and sol.usuario_id != usuario.id and not eh_profissional:
            raise HTTPException(403, "Acesso negado.")
        return sol

    @router.post("/pagamentos/pix", response_model=PagamentoOut)
    def criar_pagamento_pix(
        dados: PagamentoCreate,
        db: Session = Depends(get_db),
        usuario=Depends(obter_usuario_atual),
    ):
        sol = db.get(models.Solicitacao, dados.solicitacao_id)
        if not sol or usuario.tipo != "cliente" or sol.usuario_id != usuario.id:
            raise HTTPException(404, "Solicitação não encontrada.")
        if sol.status not in SOLICITACAO_PAGAVEL:
            raise HTTPException(409, "Esta solicitação não aceita pagamento.")
        if not os.getenv("MERCADOPAGO_ACCESS_TOKEN", "").strip():
            log.error("MERCADOPAGO_ACCESS_TOKEN ausente no processo da API.")
            raise HTTPException(503, "Pix não configurado no servidor. Contate o suporte.")
        servico = db.get(models.Servico, sol.servico_id)
        valor = mp.centavos(servico.preco)  # valor SEMPRE vindo do banco
        if valor < 1:
            raise HTTPException(400, "Serviço sem valor para cobrança.")

        for _ in range(2):
            pag = db.query(models.Pagamento).filter_by(solicitacao_id=sol.id).first()
            if pag is None:
                agora = _agora()
                pag = models.Pagamento(
                    solicitacao_id=sol.id, valor_centavos=valor, status="criando", tentativa=1,
                    expiracao=_iso(agora + timedelta(minutes=int(os.getenv("PIX_EXPIRACAO_MINUTOS", "30")))),
                    criado_em=_iso(agora), atualizado_em=_iso(agora),
                )
                db.add(pag)
                try:
                    db.commit()
                except IntegrityError:  # outra requisição criou antes (UNIQUE)
                    db.rollback()
                    continue
                db.refresh(pag)
            break

        if pag.status == "pendente":
            sincronizar(db, pag, forcar=True)
        if pag.status == "pago":
            raise HTTPException(409, "Esta solicitação já foi paga.")
        if pag.status in ("estornado", "divergente"):
            raise HTTPException(409, "Pagamento em análise. Entre em contato com o suporte.")
        if pag.status == "pendente":
            if _agora() < _parse(pag.expiracao):
                return _saida(db, pag)
            try:  # expirado localmente: encerra no MP antes de gerar outro
                mp.cancelar_pagamento(pag.mp_payment_id)
            except mp.MercadoPagoErro:
                pass
            sincronizar(db, pag, forcar=True)
            if pag.status == "pago":
                raise HTTPException(409, "Esta solicitação já foi paga.")
        if pag.status == "pendente":
            raise HTTPException(503, "Não foi possível confirmar a situação do Pix anterior. Tente novamente.")
        if pag.status in ("expirado", "cancelado", "rejeitado"):
            if not _regenerar(db, pag):
                db.refresh(pag)
                return _saida(db, pag)
        if pag.status == "criando":
            if _agora() >= _parse(pag.expiracao):
                # Não trocar a chave de idempotência sem confirmar o resultado anterior.
                raise HTTPException(409, "Cobrança anterior expirada sem confirmação. Contate o suporte.")
            if pag.valor_centavos != valor:
                db.execute(update(models.Pagamento).where(
                    models.Pagamento.id == pag.id, models.Pagamento.status == "criando"
                ).values(valor_centavos=valor))
                db.commit()
                db.refresh(pag)
            _emitir_cobranca(db, pag, usuario, servico)
        return _saida(db, pag)

    @router.get("/pagamentos/solicitacao/{solicitacao_id}", response_model=PagamentoOut)
    def consultar_pagamento_solicitacao(
        solicitacao_id: int,
        db: Session = Depends(get_db),
        usuario=Depends(obter_usuario_atual),
    ):
        _solicitacao_do_usuario(db, solicitacao_id, usuario)
        pag = db.query(models.Pagamento).filter_by(solicitacao_id=solicitacao_id).first()
        if not pag:
            raise HTTPException(404, "Pagamento não encontrado.")
        sincronizar(db, pag)
        return _saida(db, pag)

    @router.get("/pagamentos")
    def listar_pagamentos(db: Session = Depends(get_db), usuario=Depends(obter_usuario_atual)):
        q = (
            db.query(models.Pagamento, models.Solicitacao, models.Servico)
            .join(models.Solicitacao, models.Solicitacao.id == models.Pagamento.solicitacao_id)
            .join(models.Servico, models.Servico.id == models.Solicitacao.servico_id)
        )
        if usuario.tipo == "cliente":
            q = q.filter(models.Solicitacao.usuario_id == usuario.id)
        elif usuario.tipo == "profissional":
            q = q.join(models.Profissional, models.Profissional.id == models.Solicitacao.profissional_id)\
                 .filter(models.Profissional.usuario_id == usuario.id)
        elif usuario.tipo != "admin":
            raise HTTPException(403, "Acesso negado.")
        resultado = []
        for pag, sol, servico in q.order_by(models.Pagamento.id.desc()).all():
            if usuario.tipo == "profissional":
                outro = db.get(models.Usuario, sol.usuario_id)
            else:
                prof = db.get(models.Profissional, sol.profissional_id)
                outro = db.get(models.Usuario, prof.usuario_id)
            grupo = "pago" if pag.status == "pago" else (
                "pendente" if pag.status in ("criando", "pendente") else "cancelado")
            resultado.append({
                "id": pag.id, "solicitacao_id": sol.id, "servico": servico.nome,
                "contraparte": {"nome": outro.nome if outro else ""},
                "valor": pag.valor_centavos / 100, "status": grupo, "data": pag.criado_em,
            })
        return resultado

    @router.post("/webhooks/mercadopago")
    def webhook_mercadopago(request: Request, db: Session = Depends(get_db)):
        segredo = os.getenv("MERCADOPAGO_WEBHOOK_SECRET", "").strip()
        if not segredo:
            log.error("MERCADOPAGO_WEBHOOK_SECRET ausente: webhook recusado.")
            raise HTTPException(503, "Webhook não configurado.")
        data_id = request.query_params.get("data.id")
        if not mp.validar_assinatura(
            segredo, request.headers.get("x-signature"), request.headers.get("x-request-id"), data_id
        ):
            raise HTTPException(401, "Assinatura inválida.")
        tipo = request.query_params.get("type") or request.query_params.get("topic")
        if tipo != "payment":
            return {"ok": True}
        try:
            dados = mp.consultar_pagamento(data_id)  # nunca confia no corpo da notificação
        except mp.MercadoPagoErro as erro:
            if erro.status in (400, 404):
                return {"ok": True}  # id desconhecido (ex.: simulação do painel)
            raise HTTPException(503, "Falha ao validar com o Mercado Pago.")  # MP reenvia
        ref = str(dados.get("external_reference") or "")
        if ref.startswith("reparae-pag-") and ref[12:].isdigit():
            pag = db.get(models.Pagamento, int(ref[12:]))
            if pag:
                aplicar_dados_mp(db, pag, dados)
        return {"ok": True}

    return router
