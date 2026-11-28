// ==========================================================================
// PAGAMENTO.JS — REPARAÊ
// Tela de pagamento Pix (Mercado Pago). O valor e o QR Code vêm SEMPRE do
// back-end; o status só muda aqui depois que a API confirma (polling).
// Depende de: config.js, utilitarios.js, app.js (requisicaoAutenticada).
// ==========================================================================
(function () {
  const raiz = document.getElementById("pagamentoConteudo");
  if (!raiz) return;

  const solicitacaoId = Number(new URLSearchParams(window.location.search).get("solicitacao"));
  const INTERVALO_MS = 4000;
  let temporizador = null, contagem = null, pagamento = null;
  let consultando = false, iniciando = false;

  function parar() { clearTimeout(temporizador); clearInterval(contagem); }

  function mensagemFalha(texto, permitirTentar) {
    parar();
    raiz.innerHTML = `<div class="cartao pix-cartao"><span class="pix-status falha"><span class="icone">error</span>${escaparHtml(texto)}</span>
      <div class="pix-acoes">${permitirTentar ? '<button type="button" class="btn btn-primario" id="pixTentar">Tentar novamente</button>' : ""}
      <a class="btn btn-secundario" href="solicitacoes-cliente.html">Voltar às solicitações</a></div></div>`;
    const b = document.getElementById("pixTentar");
    if (b) b.addEventListener("click", iniciar);
  }

  function render(p) {
    pagamento = p;
    parar();
    const base = `<h1>Pagamento Pix</h1><p class="pix-servico">${escaparHtml(p.servico)}</p><p class="pix-valor">${formatarMoeda(p.valor)}</p>`;
    const voltar = `<a class="btn btn-secundario" href="solicitacao-detalhe.html?id=${p.solicitacao_id}">Ver solicitação</a>`;
    if (p.status === "pago") {
      raiz.innerHTML = `<div class="cartao pix-cartao">${base}<span class="pix-status pago" role="status"><span class="icone">check_circle</span>Pagamento confirmado</span><div class="pix-acoes">${voltar}</div></div>`;
      return;
    }
    if (p.status === "pendente") {
      raiz.innerHTML = `<div class="cartao pix-cartao">${base}
        <span class="pix-status" role="status" id="pixStatus"><span class="icone">schedule</span>Aguardando pagamento</span>
        <img class="pix-qr" alt="QR Code Pix" src="data:image/png;base64,${escaparHtml(p.qr_code_base64 || "")}">
        <textarea class="pix-codigo" id="pixCodigo" readonly aria-label="Pix copia e cola">${escaparHtml(p.qr_code || "")}</textarea>
        <div class="pix-acoes"><button type="button" class="btn btn-primario" id="pixCopiar"><span class="icone">content_copy</span> Copiar código Pix</button>${voltar}</div>
        <p class="pix-expira" id="pixExpira"></p>
        <p class="pix-aviso">Abra o app do seu banco, escolha Pix e pague com o QR Code ou o código. Esta tela atualiza sozinha.</p></div>`;
      document.getElementById("pixCopiar").addEventListener("click", copiar);
      iniciarContagem(p.expiracao);
      temporizador = setTimeout(atualizar, INTERVALO_MS);
      return;
    }
    const rotulos = { expirado: "Este Pix expirou", rejeitado: "Pagamento recusado", cancelado: "Cobrança cancelada" };
    if (rotulos[p.status]) {
      raiz.innerHTML = `<div class="cartao pix-cartao">${base}<span class="pix-status falha" role="status"><span class="icone">error</span>${rotulos[p.status]}</span>
        <div class="pix-acoes"><button type="button" class="btn btn-primario" id="pixNovo">Gerar novo Pix</button>${voltar}</div></div>`;
      document.getElementById("pixNovo").addEventListener("click", iniciar);
      return;
    }
    mensagemFalha("Pagamento em análise. Entre em contato com o suporte.", false);
  }

  function iniciarContagem(expiracao) {
    const alvo = document.getElementById("pixExpira");
    const fim = new Date(expiracao).getTime();
    function tick() {
      const resta = Math.max(0, Math.floor((fim - Date.now()) / 1000));
      alvo.textContent = resta > 0
        ? `Expira em ${String(Math.floor(resta / 60)).padStart(2, "0")}:${String(resta % 60).padStart(2, "0")}`
        : "Este Pix expirou. Gerando atualização…";
      if (resta === 0 || !Number.isFinite(fim)) { clearInterval(contagem); }
    }
    contagem = setInterval(tick, 1000);
    tick();
  }

  async function copiar() {
    const botao = document.getElementById("pixCopiar");
    const campo = document.getElementById("pixCodigo");
    try { await navigator.clipboard.writeText(campo.value); }
    catch (_) { campo.select(); document.execCommand("copy"); }
    botao.textContent = "Código copiado!";
    setTimeout(function () { botao.innerHTML = '<span class="icone">content_copy</span> Copiar código Pix'; }, 2000);
  }

  async function atualizar() {
    if (consultando || iniciando || !pagamento || pagamento.status !== "pendente") return;
    clearTimeout(temporizador);
    consultando = true;
    try {
      const p = await requisicaoAutenticada(`/pagamentos/solicitacao/${solicitacaoId}`);
      if (p.status !== (pagamento && pagamento.status) || p.status !== "pendente") render(p);
      else temporizador = setTimeout(atualizar, INTERVALO_MS);
    } catch (_) { temporizador = setTimeout(atualizar, INTERVALO_MS * 2); }
    finally { consultando = false; }
  }

  async function iniciar() {
    if (!Number.isInteger(solicitacaoId) || solicitacaoId <= 0) { mensagemFalha("Solicitação inválida.", false); return; }
    if (iniciando || consultando) return;
    iniciando = true;
    parar();
    raiz.innerHTML = '<div class="cartao pix-cartao"><p>Gerando cobrança Pix…</p></div>';
    try {
      render(await requisicaoAutenticada("/pagamentos/pix", { method: "POST", body: JSON.stringify({ solicitacao_id: solicitacaoId }) }));
    } catch (erro) { mensagemFalha(erro.message, true); }
    finally { iniciando = false; }
  }

  document.addEventListener("visibilitychange", function () { if (!document.hidden && pagamento && pagamento.status === "pendente") { clearTimeout(temporizador); atualizar(); } });
  document.addEventListener("DOMContentLoaded", iniciar);
})();
