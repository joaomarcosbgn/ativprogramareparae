"""Cliente mínimo da API do Mercado Pago para Pix (somente biblioteca padrão).

Credenciais vêm exclusivamente de variáveis de ambiente do servidor:
  MERCADOPAGO_ACCESS_TOKEN   token de teste (TEST-...) ou produção
  MERCADOPAGO_WEBHOOK_SECRET segredo de assinatura do webhook (painel MP)
"""
import hashlib
import hmac
import json
import os
import re
import urllib.error
import urllib.request
from decimal import Decimal, ROUND_HALF_UP

API_BASE = "https://api.mercadopago.com"
TIMEOUT_SEGUNDOS = 15


class MercadoPagoErro(Exception):
    def __init__(self, mensagem, status=None):
        super().__init__(mensagem)
        self.status = status


class MercadoPagoNaoConfigurado(MercadoPagoErro):
    pass


def centavos(preco) -> int:
    """Converte o preço do banco (reais) em centavos inteiros, sem erro de float."""
    valor = (Decimal(str(preco)) * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return int(valor)


def _requisitar(metodo, caminho, corpo=None, idempotency_key=None):
    token = os.getenv("MERCADOPAGO_ACCESS_TOKEN", "").strip()
    if not token:
        raise MercadoPagoNaoConfigurado("MERCADOPAGO_ACCESS_TOKEN não configurado.")
    cabecalhos = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
    dados = None
    if corpo is not None:
        dados = json.dumps(corpo).encode("utf-8")
        cabecalhos["Content-Type"] = "application/json"
    if idempotency_key:
        cabecalhos["X-Idempotency-Key"] = idempotency_key
    req = urllib.request.Request(API_BASE + caminho, data=dados, headers=cabecalhos, method=metodo)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_SEGUNDOS) as resp:
            return json.loads(resp.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as erro:
        # Não registrar corpo remoto: pode conter dados pessoais.
        raise MercadoPagoErro(f"HTTP {erro.code}", status=erro.code)
    except (urllib.error.URLError, TimeoutError, OSError, ValueError) as erro:
        raise MercadoPagoErro(f"Falha de comunicação: {erro}")


def criar_pix(*, idempotency_key, valor_centavos, descricao, email, nome,
              referencia, expiracao_iso, notification_url):
    corpo = {
        "transaction_amount": float(Decimal(valor_centavos) / 100),
        "description": descricao[:200],
        "payment_method_id": "pix",
        "external_reference": referencia,
        "date_of_expiration": expiracao_iso,
        "notification_url": notification_url,
        "payer": {"email": email, "first_name": (nome or "Cliente").split()[0][:60]},
    }
    return _requisitar("POST", "/v1/payments", corpo, idempotency_key)


def consultar_pagamento(mp_id):
    if not re.fullmatch(r"\d{1,20}", str(mp_id)):
        raise MercadoPagoErro("ID de pagamento inválido.", status=400)
    return _requisitar("GET", f"/v1/payments/{mp_id}")


def cancelar_pagamento(mp_id):
    if not re.fullmatch(r"\d{1,20}", str(mp_id)):
        raise MercadoPagoErro("ID de pagamento inválido.", status=400)
    return _requisitar("PUT", f"/v1/payments/{mp_id}", {"status": "cancelled"})


def validar_assinatura(segredo, x_signature, x_request_id, data_id) -> bool:
    """Valida o header x-signature do webhook (HMAC SHA-256 do manifest)."""
    if not segredo or not x_signature or not data_id:
        return False
    partes = {}
    for trecho in x_signature.split(","):
        chave, _, valor = trecho.strip().partition("=")
        partes[chave] = valor
    ts, v1 = partes.get("ts"), partes.get("v1")
    if not ts or not v1:
        return False
    data_id = str(data_id)
    if data_id.isalnum():
        data_id = data_id.lower()
    manifest = f"id:{data_id};"
    if x_request_id:
        manifest += f"request-id:{x_request_id};"
    manifest += f"ts:{ts};"
    esperado = hmac.new(segredo.encode(), manifest.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(esperado, v1)


# Status do Mercado Pago -> status interno
MAPA_STATUS = {
    "approved": "pago",
    "pending": "pendente",
    "in_process": "pendente",
    "authorized": "pendente",
    "rejected": "rejeitado",
    "cancelled": "expirado",
    "expired": "expirado",
    "refunded": "estornado",
    "charged_back": "estornado",
}
