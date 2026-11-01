// ==========================================================================
// PAGAMENTOS.JS — REPARAÊ
// Histórico de pagamentos para cliente (pagos/pendentes que ele deve) e
// profissional (recebidos/a receber). Perfil definido por
// <body data-tipo-usuario="...">.
// Depende de: config.js, utilitarios.js, dados.js.
//
// COMO FUNCIONA HOJE:
//  - Esta tela é SOMENTE CONSULTA. Não existe gateway de pagamento nem
//    endpoint de pagamentos no backend ainda; por isso não há botão
//    "Pagar" — ele seria um botão que finge funcionar.
//  - A página tenta GET /pagamentos. Se o servidor não responder como
//    esperado, entra em MODO DEMONSTRAÇÃO com valores fictícios e um aviso
//    fixo na tela. Contrato em INTEGRACAO-BACKEND.md.
// ==========================================================================

const pagamentosPagina = { tipo: "cliente", modo: "demo", itens: [], filtro: "todos" };

// Rótulos por perfil: o backend usa o mesmo status para os dois lados.
const ROTULOS_PAGAMENTO = {
  cliente:      { pago: "Pago",     pendente: "Pendente",   cancelado: "Cancelado",
                  totalPago: "Total pago", totalPendente: "A pagar", abaPago: "Pagos" },
  profissional: { pago: "Recebido", pendente: "A receber",  cancelado: "Cancelado",
                  totalPago: "Total recebido", totalPendente: "A receber", abaPago: "Recebidos" },
};

const CLASSE_STATUS_PAGAMENTO = { pago: "status-concluida", pendente: "status-aceita", cancelado: "status-cancelada" };
const ICONE_STATUS_PAGAMENTO = { pago: "check_circle", pendente: "schedule", cancelado: "cancel" };

document.addEventListener("DOMContentLoaded", function () {
  if (!document.getElementById("listaPagamentos")) return;
  pagamentosPagina.tipo = document.body.dataset.tipoUsuario === "profissional" ? "profissional" : "cliente";
  iniciarPagamentos();
});

async function iniciarPagamentos() {
  const resultado = await chamarApi("/pagamentos");

  if (resultado.ok && Array.isArray(resultado.dados)) {
    pagamentosPagina.modo = "api";
    pagamentosPagina.itens = resultado.dados;
  } else {
    pagamentosPagina.modo = "demo";
    pagamentosPagina.itens = pagamentosPagina.tipo === "profissional" ? PAGAMENTOS_PROFISSIONAL_MOCK : PAGAMENTOS_CLIENTE_MOCK;
    const aviso = document.getElementById("avisoModoPagamentos");
    aviso.hidden = false;
    aviso.innerHTML = '<span class="icone">science</span><span><strong>Modo demonstração.</strong> O servidor ainda não oferece pagamentos (ou não respondeu). Os valores abaixo são fictícios e nenhuma cobrança real é feita.</span>';
  }

  document.getElementById("abaPagos").textContent = ROTULOS_PAGAMENTO[pagamentosPagina.tipo].abaPago;

  document.querySelectorAll("#abasPagamentos .aba").forEach(function (aba) {
    aba.addEventListener("click", function () {
      document.querySelectorAll("#abasPagamentos .aba").forEach(function (a) { a.classList.remove("ativa"); });
      aba.classList.add("ativa");
      pagamentosPagina.filtro = aba.dataset.filtro;
      renderizarListaPagamentos();
    });
  });

  renderizarResumoPagamentos();
  renderizarListaPagamentos();
}

function somarPorStatus(status) {
  return pagamentosPagina.itens
    .filter(function (p) { return p.status === status; })
    .reduce(function (total, p) { return total + Number(p.valor); }, 0);
}

function renderizarResumoPagamentos() {
  const r = ROTULOS_PAGAMENTO[pagamentosPagina.tipo];
  const quantidade = pagamentosPagina.itens.length;
  document.getElementById("resumoPagamentos").innerHTML = `
    <div class="cartao resumo-card"><span class="icone">check_circle</span><span class="numero">${formatarMoeda(somarPorStatus("pago"))}</span><span class="rotulo">${r.totalPago}</span></div>
    <div class="cartao resumo-card resumo-card-alerta"><span class="icone">schedule</span><span class="numero">${formatarMoeda(somarPorStatus("pendente"))}</span><span class="rotulo">${r.totalPendente}</span></div>
    <div class="cartao resumo-card"><span class="icone">receipt_long</span><span class="numero">${quantidade}</span><span class="rotulo">Transações</span></div>
  `;
}

function renderizarListaPagamentos() {
  const r = ROTULOS_PAGAMENTO[pagamentosPagina.tipo];
  const contraparteRotulo = pagamentosPagina.tipo === "profissional" ? "de" : "para";

  const visiveis = pagamentosPagina.itens
    .filter(function (p) { return pagamentosPagina.filtro === "todos" || p.status === pagamentosPagina.filtro; })
    .slice()
    .sort(function (a, b) { return new Date(b.data) - new Date(a.data); });

  const lista = document.getElementById("listaPagamentos");
  if (visiveis.length === 0) {
    lista.innerHTML = '<div class="estado-vazio"><span class="icone">payments</span><p>Nenhum pagamento nesta categoria.</p></div>';
    return;
  }

  lista.innerHTML = visiveis.map(function (p) {
    const status = CLASSE_STATUS_PAGAMENTO[p.status] ? p.status : "pendente";
    return `
      <div class="cartao card-solicitacao card-pagamento">
        <div class="pagamento-principal">
          <span class="pagamento-icone pagamento-${status}"><span class="icone">${ICONE_STATUS_PAGAMENTO[status]}</span></span>
          <div>
            <h3>${escaparHtml(p.servico)}</h3>
            <p class="pessoa">${contraparteRotulo} ${escaparHtml(p.contraparte && p.contraparte.nome)}</p>
          </div>
        </div>
        <div class="card-solicitacao-meta">
          <strong class="pagamento-valor">${formatarMoeda(p.valor)}</strong>
          <span class="data">${formatarData(p.data)}</span>
          <span class="status-badge ${CLASSE_STATUS_PAGAMENTO[status]}">${r[status]}</span>
        </div>
      </div>
    `;
  }).join("");
}
