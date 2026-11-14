// ==========================================================================
// APP.JS — REPARAÊ
// Comportamento das páginas internas logadas. Cada função só executa se
// os elementos da respectiva página existirem no HTML atual — por isso um
// único arquivo pode ser incluído em todas as páginas internas sem
// conflito. Depende de: config.js, utilitarios.js, dados.js, navegacao.js.
// ==========================================================================

document.addEventListener("DOMContentLoaded", function () {
    const token = sessionStorage.getItem("token");

  if (!token) {
    window.location.replace("login.html");
    return;
  }
  const tipoUsuario = document.body.dataset.tipoUsuario;
  const paginaAtiva = document.body.dataset.pagina;
  if (tipoUsuario && paginaAtiva && typeof renderizarNavegacao === "function") {
    renderizarNavegacao(tipoUsuario, paginaAtiva);
  }

  configurarHomeCliente();
  configurarBusca();
  configurarPerfilProfissionalPublico();
  configurarSolicitacoesCliente();
  configurarSolicitacoesProfissional();
  configurarSolicitacaoDetalhe();
  configurarContaCliente();
  configurarDashboardProfissional();
  configurarServicosProfissional();
  configurarPerfilProfissionalEditar();

  // Identifica o usuário logado no widget do Chatbase (ver utilitarios.js
  // para a explicação completa e o que falta no backend).
  identificarUsuarioNoChatbase();
});

/* ---------------------------------------------------------------------- */
/* Helpers de renderização reaproveitados entre páginas                   */
/* ---------------------------------------------------------------------- */

function iniciaisDoNome(nome) {
  return nome.split(" ").map(function (p) { return p[0]; }).join("").slice(0, 2).toUpperCase();
}

function renderizarEstrelas(nota) {
  const cheias = Math.round(nota);
  return '<span class="icone">star</span>'.repeat(cheias);
}

function iconeDaCategoria(categoriaId) {
  const categoria = CATEGORIAS.find(function (c) { return c.id === categoriaId; });
  return categoria ? categoria.icone : "handyman";
}

function htmlCardProfissional(p) {
  return `
    <article class="cartao-midia card-profissional" data-categoria="${p.categoria}">
      <div class="midia-banner${p.foto ? " com-foto" : ""}"${p.foto ? ` style="background-image:url('${p.foto}')"` : ""}>
        <span class="selo">${p.servico}</span>
        <button type="button" class="favorito" aria-label="Favoritar ${p.nome}"><span class="icone">favorite</span></button>
        <span class="icone">${iconeDaCategoria(p.categoria)}</span>
      </div>
      <div class="midia-corpo">
        <div class="card-profissional-topo">
          <span class="avatar">${iniciaisDoNome(p.nome)}</span>
          <div class="card-profissional-nome">
            <strong>${p.nome}</strong>
            <span><span class="icone" style="font-size:14px;vertical-align:-2px;">location_on</span> ${p.regiao}</span>
          </div>
        </div>
        <div class="badge-avaliacao">${renderizarEstrelas(p.nota)} ${p.nota.toFixed(1)} <span class="contagem">(${p.numAvaliacoes})</span></div>
        <p class="descricao">${p.descricaoCurta}</p>
        <div class="card-profissional-acoes">
          <a class="btn btn-secundario" href="perfil-profissional.html?id=${p.id}">Ver perfil</a>
          <button type="button" class="btn btn-primario" data-solicitar="${p.id}">Solicitar</button>
        </div>
      </div>
    </article>
  `;
}

function configurarBotoesSolicitar(container) {
  container.querySelectorAll("[data-solicitar]").forEach(function (botao) {
    botao.addEventListener("click", function () {
      window.location.href = `perfil-profissional.html?id=${encodeURIComponent(botao.dataset.solicitar)}`;
    });
  });
  container.querySelectorAll(".favorito").forEach(function (botao) {
    botao.addEventListener("click", function () { botao.classList.toggle("ativo"); });
  });
}

async function requisicaoAutenticada(caminho, opcoes = {}) {
  const token = sessionStorage.getItem("token");
  if (!token) throw new Error("Sua sessão expirou. Faça login novamente.");
  const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
    ...opcoes,
    headers: { "Authorization": `Bearer ${token}`, ...(opcoes.body ? { "Content-Type": "application/json" } : {}), ...opcoes.headers }
  });
  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    const detalhe = dados?.detail;
    throw new Error(typeof detalhe === "string" ? detalhe : `Falha na operação (${resposta.status}).`);
  }
  return dados;
}

function escaparSolicitacao(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

async function escolherServicoSolicitacao(profissionalId, botao) {
  let usuario = null;
  try { usuario = JSON.parse(sessionStorage.getItem("usuario") || "null"); } catch (_) {}
  if (usuario?.tipo !== "cliente") { alert("Entre com uma conta de cliente para solicitar serviços."); return; }
  const servicos = await fetch(`${API_BASE_URL}/servicos?limit=100`).then(async r => {
    if (!r.ok) throw new Error("Não foi possível carregar os serviços disponíveis.");
    return r.json();
  });
  if (!servicos.length) throw new Error("Ainda não há serviços cadastrados.");
  const painel = document.createElement("div");
  painel.className = "cartao";
  painel.style.cssText = "padding:16px;margin-top:16px";
  painel.innerHTML = `<label for="servicoSolicitacao">Escolha o serviço desejado</label><select id="servicoSolicitacao" style="width:100%;margin:12px 0;padding:10px"><option value="">Selecione...</option>${servicos.map(s => `<option value="${s.id}">${escaparSolicitacao(s.nome)} — R$ ${Number(s.preco).toFixed(2)}</option>`).join("")}</select><button type="button" class="btn btn-primario" id="confirmarSolicitacao">Confirmar solicitação</button><p id="erroSolicitacao" role="alert"></p>`;
  botao.insertAdjacentElement("afterend", painel);
  botao.disabled = true;
  painel.querySelector("#confirmarSolicitacao").addEventListener("click", async () => {
    const servico_id = Number(painel.querySelector("#servicoSolicitacao").value);
    if (!servico_id) { painel.querySelector("#erroSolicitacao").textContent = "Escolha um serviço."; return; }
    const confirmar = painel.querySelector("#confirmarSolicitacao");
    confirmar.disabled = true;
    try {
      const item = await requisicaoAutenticada("/solicitacoes", { method: "POST", body: JSON.stringify({ profissional_id: profissionalId, servico_id }) });
      window.location.href = `solicitacao-detalhe.html?id=${item.id}`;
    } catch (erro) { painel.querySelector("#erroSolicitacao").textContent = erro.message; confirmar.disabled = false; }
  });
}

function htmlEstadoVazio(icone, texto) {
  return `<div class="estado-vazio"><span class="icone">${icone}</span><p>${texto}</p></div>`;
}

function renderizarAvaliacoesEm(idContainer) {
  const container = document.getElementById(idContainer);
  if (!container) return;

  container.innerHTML = htmlEstadoVazio("star_outline", "Ainda não há avaliações registradas.");
  return;
  /* Dados de demonstração desativados.
  container.innerHTML = AVALIACOES_MOCK.map(function (item) {
    return `
      <article class="cartao avaliacao-card">
        <div class="badge-avaliacao">${renderizarEstrelas(item.nota)}</div>
        <p class="depoimento">"${item.depoimento}"</p>
        <div class="avaliacao-autor">
          <span class="avaliacao-avatar">${iniciaisDoNome(item.nome)}</span>
          <div class="info">
            <strong>${item.nome}</strong>
            <span>${item.papel} · ${item.servico}</span>
          </div>
        </div>
      </article>
    `;
  }).join("");
  */
}

/* ---------------------------------------------------------------------- */
/* HOME DO CLIENTE                                                        */
/* ---------------------------------------------------------------------- */

function configurarHomeCliente() {
  const saudacao = document.getElementById("saudacaoNome");
  if (!saudacao) return;

  
const usuarioSalvo = sessionStorage.getItem("usuario");
let usuarioLogado = null;

try {
  usuarioLogado = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
} catch (erro) {
  console.error("Erro ao ler os dados do usuário:", erro);
}

saudacao.textContent = usuarioLogado?.nome || "Cliente";


  const formBusca = document.getElementById("formBuscaApp");
  if (formBusca) {
    formBusca.addEventListener("submit", function (evento) {
      evento.preventDefault();
      const termo = document.getElementById("campoBuscaApp").value.trim();
      window.location.href = "busca.html" + (termo ? `?q=${encodeURIComponent(termo)}` : "");
    });
  }

  const gradeCategorias = document.getElementById("gradeCategoriasApp");
  if (gradeCategorias) {
    gradeCategorias.textContent = "Carregando especialidades...";
    fetch(`${API_BASE_URL}/profissionais?limit=100`)
      .then(r => { if (!r.ok) throw new Error("Falha ao consultar especialidades"); return r.json(); })
      .then(lista => {
        const nomes = [...new Set(lista.map(p => String(p.especialidade || "").trim()).filter(Boolean))].sort();
        gradeCategorias.innerHTML = nomes.length ? nomes.map(nome =>
          `<a class="categoria-card" href="busca.html?categoria=${encodeURIComponent(nome)}"><span class="categoria-icone icone">handyman</span><span class="nome">${escaparHtml(nome)}</span></a>`
        ).join("") : htmlEstadoVazio("category", "Ainda não há especialidades cadastradas.");
      }).catch(() => { gradeCategorias.textContent = "Não foi possível carregar as especialidades."; });
  }

  const gradeRecomendados = document.getElementById("gradeProfissionaisRecomendados");
  if (gradeRecomendados) {
    gradeRecomendados.textContent = "Carregando profissionais...";
    fetch(`${API_BASE_URL}/profissionais?limit=3`)
      .then(resposta => { if (!resposta.ok) throw new Error("Falha na consulta"); return resposta.json(); })
      .then(profissionais => {
        gradeRecomendados.innerHTML = profissionais.length ? profissionais.map(p => `
          <article class="cartao card-profissional">
            <div class="midia-corpo">
              <div class="card-profissional-topo">
                <span class="avatar">${escaparHtml(iniciaisDoNome(p.nome))}</span>
                <div class="card-profissional-nome"><strong>${escaparHtml(p.nome)}</strong>
                  <span>${escaparHtml(p.especialidade)}</span></div>
              </div>
              <p class="descricao">Profissional cadastrado no Reparaê</p>
              <div class="card-profissional-acoes"><a class="btn btn-secundario" href="perfil-profissional.html?id=${encodeURIComponent(p.id)}">Ver perfil</a></div>
            </div>
          </article>`).join("") : htmlEstadoVazio("search_off", "Ainda não há profissionais cadastrados.");
      })
      .catch(() => { gradeRecomendados.textContent = "Não foi possível carregar os profissionais."; });
  }

  const listaHome = document.getElementById("listaSolicitacoesHome");
  if (listaHome) listaHome.innerHTML = htmlEstadoVazio("inbox", "Nenhuma solicitação disponível. O acompanhamento será ativado quando a API de solicitações estiver pronta.");

  renderizarAvaliacoesEm("gradeAvaliacoesApp");
}

/* ---------------------------------------------------------------------- */
/* BUSCA E RESULTADOS                                                     */
/* ---------------------------------------------------------------------- */

function escaparHtml(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function configurarBusca() {
  const formulario = document.getElementById("formBuscaResultados");
  if (!formulario) return;
  const campo = document.getElementById("campoBuscaResultados");
  const filtro = document.getElementById("filtroCategoria");
  const regiao = document.getElementById("filtroRegiao");
  const ordenar = document.getElementById("ordenarProfissionais");
  const limpar = document.getElementById("limparFiltros");
  const resultados = document.getElementById("resultadosBusca");
  const resumo = document.getElementById("resumoBusca");
  const chips = document.getElementById("chipsCategorias");
  const paginacao = document.getElementById("paginacaoBusca");
  const porPagina = 6;
  const parametros = new URLSearchParams(location.search);
  campo.value = parametros.get("q") || "";
  regiao.value = parametros.get("regiao") || "";
  const ordensValidas = [...ordenar.options].map(o => o.value);
  ordenar.value = ordensValidas.includes(parametros.get("ordenar")) ? parametros.get("ordenar") : "nome_asc";
  const categoriaURL = parametros.get("categoria") || "";
  let especialidades = [];
  let requisicao = 0;
  const paginaURL = Number(parametros.get("pagina"));
  let paginaAtual = Number.isSafeInteger(paginaURL) && paginaURL > 0 ? paginaURL : 1;

  function renderizarChips() {
    if (!chips) return;
    chips.replaceChildren();
    for (const nome of ["", ...especialidades]) {
      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "chip" + (filtro.value === nome ? " ativo" : "");
      botao.dataset.cat = nome;
      botao.textContent = nome || "Todos";
      chips.append(botao);
    }
  }
  function atualizarURL() {
    const url = new URL(location.href);
    for (const [chave, valor] of Object.entries({q: campo.value.trim(), categoria: filtro.value, regiao: regiao.value.trim(), ordenar: ordenar.value})) {
      if (valor && !(chave === "ordenar" && valor === "nome_asc")) url.searchParams.set(chave, valor);
      else url.searchParams.delete(chave);
    }
    if (paginaAtual > 1) url.searchParams.set("pagina", String(paginaAtual));
    else url.searchParams.delete("pagina");
    history.replaceState(null, "", url.pathname + url.search + url.hash);
  }
  function renderizarPaginacao(totalPaginas) {
    if (!paginacao) return;
    paginacao.replaceChildren();
    paginacao.hidden = totalPaginas <= 1;
    if (totalPaginas <= 1) return;

    function botao(rotulo, pagina, desabilitado = false, atual = false) {
      const elemento = document.createElement("button");
      elemento.type = "button";
      elemento.className = "btn btn-secundario" + (atual ? " pagina-ativa" : "");
      elemento.textContent = rotulo;
      elemento.disabled = desabilitado;
      if (atual) elemento.setAttribute("aria-current", "page");
      elemento.addEventListener("click", () => {
        paginaAtual = pagina;
        executarBusca();
      });
      paginacao.append(elemento);
    }
    botao("Anterior", paginaAtual - 1, paginaAtual <= 1);
    const inicio = Math.max(1, Math.min(paginaAtual - 2, totalPaginas - 4));
    const fim = Math.min(totalPaginas, inicio + 4);
    for (let numero = inicio; numero <= fim; numero++) {
      botao(String(numero), numero, numero === paginaAtual, numero === paginaAtual);
    }
    botao("Próxima", paginaAtual + 1, paginaAtual >= totalPaginas);
  }

  async function executarBusca() {
    const atual = ++requisicao;
    atualizarURL();
    const params = new URLSearchParams({
      q: campo.value.trim(), categoria: filtro.value, regiao: regiao.value.trim(),
      ordenar: ordenar.value, pagina: String(paginaAtual), por_pagina: String(porPagina)
    });
    resultados.textContent = "Buscando profissionais cadastrados...";
    resumo.textContent = "Consultando profissionais...";
    if (paginacao) paginacao.hidden = true;
    try {
      const resposta = await fetch(`${API_BASE_URL}/profissionais/paginados?${params}`);
      if (!resposta.ok) throw new Error("Falha ao consultar profissionais.");
      const dados = await resposta.json();
      if (!dados || !Array.isArray(dados.itens) || !Number.isInteger(dados.total) || !Number.isInteger(dados.total_paginas)) {
        throw new Error("Resposta inesperada da API.");
      }
      if (atual !== requisicao) return;
      // Uma URL antiga pode apontar para uma página que deixou de existir.
      if (dados.total_paginas > 0 && paginaAtual > dados.total_paginas) {
        paginaAtual = dados.total_paginas;
        return executarBusca();
      }
      if (dados.total_paginas === 0 && paginaAtual !== 1) {
        paginaAtual = 1;
        atualizarURL();
      }
      const profissionais = dados.itens;
      resumo.textContent = dados.total === 0 ? "0 profissionais encontrados" :
        `${dados.total} ${dados.total === 1 ? "profissional encontrado" : "profissionais encontrados"} — Página ${paginaAtual} de ${dados.total_paginas}`;
      resultados.innerHTML = profissionais.length ? profissionais.map(p => `
        <article class="cartao card-profissional">
          <div class="midia-corpo">
            <div class="card-profissional-topo">
              <span class="avatar">${escaparHtml(iniciaisDoNome(p.nome))}</span>
              <div class="card-profissional-nome"><strong>${escaparHtml(p.nome)}</strong>
                <span>${escaparHtml(p.especialidade)}</span></div>
            </div>
            <p class="descricao">${escaparHtml(p.regiao || "Região não informada")}</p>
            <div class="card-profissional-acoes">
              <a class="btn btn-secundario" href="perfil-profissional.html?id=${encodeURIComponent(p.id)}">Ver perfil</a>
            </div>
          </div>
        </article>`).join("") : htmlEstadoVazio("search_off", "Nenhum profissional encontrado para os filtros escolhidos.");
      renderizarPaginacao(dados.total_paginas);
    } catch (_) {
      if (atual === requisicao) {
        resumo.textContent = "Não foi possível consultar os profissionais.";
        resultados.textContent = "Verifique sua conexão e se a API está funcionando.";
        if (paginacao) paginacao.hidden = true;
      }
    }
  }
  async function carregarEspecialidades() {
    try {
      const resposta = await fetch(`${API_BASE_URL}/profissionais?limit=100`);
      if (!resposta.ok) throw new Error("Falha ao carregar especialidades");
      const profissionais = await resposta.json();
      especialidades = [...new Set(profissionais.map(p => String(p.especialidade || "").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
      filtro.replaceChildren();
      const todos = document.createElement("option"); todos.value = ""; todos.textContent = "Todas as especialidades"; filtro.append(todos);
      especialidades.forEach(nome => {const option = document.createElement("option"); option.value = nome; option.textContent = nome; filtro.append(option);});
      const antiga = typeof CATEGORIAS !== "undefined" ? CATEGORIAS.find(c => String(c.id) === categoriaURL) : null;
      const selecionada = antiga?.nome || categoriaURL;
      if (especialidades.includes(selecionada)) filtro.value = selecionada;
    } catch (_) {
      filtro.innerHTML = '<option value="">Todas as especialidades</option>';
    }
    renderizarChips();
    executarBusca();
  }
  function reiniciarBusca() { paginaAtual = 1; executarBusca(); }
  chips?.addEventListener("click", e => {
    const botao = e.target.closest("[data-cat]");
    if (!botao) return;
    filtro.value = botao.dataset.cat;
    renderizarChips();
    reiniciarBusca();
  });
  formulario.addEventListener("submit", e => { e.preventDefault(); reiniciarBusca(); });
  filtro.addEventListener("change", () => {renderizarChips(); reiniciarBusca();});
  ordenar.addEventListener("change", reiniciarBusca);
  regiao.addEventListener("change", reiniciarBusca);
  limpar.addEventListener("click", () => {
    campo.value = ""; filtro.value = ""; regiao.value = ""; ordenar.value = "nome_asc";
    renderizarChips(); reiniciarBusca();
  });
  carregarEspecialidades();
}

/* ---------------------------------------------------------------------- */
/* PERFIL PÚBLICO DO PROFISSIONAL                                         */
/* ---------------------------------------------------------------------- */

async function configurarPerfilProfissionalPublico() {
  const container = document.getElementById("perfilProfissionalConteudo");
  if (!container) return;
  const id = Number(new URLSearchParams(location.search).get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    container.textContent = "Profissional não encontrado.";
    return;
  }
  try {
    const resposta = await fetch(`${API_BASE_URL}/profissionais/${id}`);
    if (!resposta.ok) throw new Error("Profissional não encontrado.");
    const p = await resposta.json();
    document.getElementById("perfilNome").textContent = p.nome;
    document.getElementById("perfilServico").textContent = p.especialidade;
    document.getElementById("perfilAvatar").textContent = iniciaisDoNome(p.nome);
    // Dados públicos recebidos da API (não utilizar dados privados da sessão).
    const descricao = String(p.descricao || p.biografia || "").trim();
    const biografia = String(p.biografia || "").trim();
    const experienciaTexto = String(p.experiencia || "").trim();
    const regiao = String(p.regiao || "").trim();
    document.getElementById("perfilDescricao").textContent = descricao || "Informações profissionais ainda não cadastradas.";
    const avaliacao = document.getElementById("perfilAvaliacao");
    if (avaliacao) avaliacao.textContent = "Ainda sem avaliações";
    const experiencia = document.getElementById("perfilExperiencia");
    if (experiencia) experiencia.textContent = experienciaTexto || "Não informada";
    const stats = document.getElementById("perfilStats");
    if (stats) stats.textContent = regiao ? `Região de atendimento: ${regiao}` : "Região de atendimento não informada.";
    const sobre = document.getElementById("secaoSobreMim");
    if (sobre) {
      sobre.hidden = !biografia;
      // Mantém a estrutura do HTML e insere o texto em um parágrafo próprio.
      let textoSobre = sobre.querySelector("[data-biografia-publica]");
      if (biografia && !textoSobre) {
        textoSobre = document.createElement("p");
        textoSobre.dataset.biografiaPublica = "";
        sobre.appendChild(textoSobre);
      }
      if (textoSobre) textoSobre.textContent = biografia;
    }
    const portfolio = document.getElementById("secaoPortfolio");
    if (portfolio) portfolio.hidden = true;
    const solicitar = document.getElementById("botaoSolicitarPerfil");
    if (solicitar) {
      solicitar.disabled = !p.disponivel;
      solicitar.title = p.disponivel ? "Solicitar serviço" : "Profissional indisponível";
      solicitar.addEventListener("click", async () => {
        if (solicitar.disabled) return;
        try { await escolherServicoSolicitacao(p.id, solicitar); }
        catch (erro) { alert(erro.message); }
      });
    }
    const avaliacoes = document.getElementById("gradeAvaliacoesPerfil");
    if (avaliacoes) avaliacoes.textContent = "Nenhuma avaliação registrada.";
  } catch (erro) {
    container.textContent = "Não foi possível carregar o profissional cadastrado.";
  }
}

/* ---------------------------------------------------------------------- */
/* SOLICITAÇÕES DO CLIENTE                                                */
/* ---------------------------------------------------------------------- */

function cartaoSolicitacao(item, profissional) {
  const nome = profissional?.nome || `Profissional #${item.profissional_id}`;
  return `<article class="cartao" style="padding:18px;margin:12px 0">
    <strong>Solicitação #${item.id}</strong><p>${escaparSolicitacao(nome)} · Serviço #${item.servico_id}</p>
    <p>Status: <strong>${escaparSolicitacao(item.status)}</strong></p>
    <a class="btn btn-secundario" href="solicitacao-detalhe.html?id=${item.id}">Ver detalhes</a>
  </article>`;
}

async function carregarSolicitacoes(container, abas, tipo) {
  const carregar = async () => {
    container.textContent = "Carregando solicitações...";
    try {
      const itens = await requisicaoAutenticada("/solicitacoes");
      const filtro = [...abas].find(a => a.classList.contains("ativa"))?.dataset.status;
      const grupos = tipo === "cliente" ? {
        andamento: ["Pendente", "Aceita"], concluida: ["Concluída"], cancelada: ["Cancelada", "Recusada"]
      } : { nova: ["Pendente"], aceita: ["Aceita"], andamento: ["Aceita"], historico: ["Concluída", "Cancelada", "Recusada"] };
      const selecionados = itens.filter(i => (grupos[filtro] || []).includes(i.status));
      container.innerHTML = selecionados.length ? selecionados.map(i => cartaoSolicitacao(i)).join("") : htmlEstadoVazio("inbox", "Nenhuma solicitação nesta categoria.");
    } catch (erro) { container.textContent = erro.message; }
  };
  abas.forEach(aba => aba.addEventListener("click", () => {
    abas.forEach(a => a.classList.remove("ativa")); aba.classList.add("ativa"); carregar();
  }));
  await carregar();
}

function configurarSolicitacoesCliente() {
  const container = document.getElementById("listaSolicitacoesCliente");
  if (container) carregarSolicitacoes(container, document.querySelectorAll("#abasSolicitacoesCliente .aba"), "cliente");
}

function configurarSolicitacoesProfissional() {
  const container = document.getElementById("listaSolicitacoesProfissional");
  if (container) carregarSolicitacoes(container, document.querySelectorAll("#abasSolicitacoesProfissional .aba"), "profissional");
}

async function configurarSolicitacaoDetalhe() {
  const container = document.getElementById("detalheSolicitacaoConteudo");
  if (!container) return;
  const id = Number(new URLSearchParams(location.search).get("id"));
  if (!Number.isInteger(id) || id <= 0) { container.textContent = "Solicitação inválida."; return; }
  let usuario = null;
  try { usuario = JSON.parse(sessionStorage.getItem("usuario") || "null"); } catch (_) {}
  async function carregar() {
    try {
      const item = await requisicaoAutenticada(`/solicitacoes/${id}`);
      const acoes = usuario?.tipo === "cliente" && item.status === "Pendente" ? ["Cancelada"] :
        usuario?.tipo === "profissional" && item.status === "Pendente" ? ["Aceita", "Recusada"] :
        usuario?.tipo === "profissional" && item.status === "Aceita" ? ["Concluída"] : [];
      container.innerHTML = `<h1>Solicitação #${item.id}</h1><p>Status: <strong>${escaparSolicitacao(item.status)}</strong></p><p>Serviço #${item.servico_id} · Profissional #${item.profissional_id}</p><p>Data: ${escaparSolicitacao(item.data)}</p><div id="acoesSolicitacao">${acoes.map(a => `<button type="button" class="btn btn-primario" data-novo-status="${a}" style="margin:6px">${a === "Cancelada" ? "Cancelar" : a === "Aceita" ? "Aceitar" : a === "Recusada" ? "Recusar" : "Concluir"}</button>`).join("")}</div><p id="erroAtualizacaoSolicitacao" role="alert"></p><a href="${usuario?.tipo === "profissional" ? "solicitacoes-profissional.html" : "solicitacoes-cliente.html"}">Voltar às solicitações</a>`;
      container.querySelectorAll("[data-novo-status]").forEach(botao => botao.addEventListener("click", async () => {
        botao.disabled = true;
        try {
          await requisicaoAutenticada(`/solicitacoes/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: botao.dataset.novoStatus }) });
          await carregar();
        } catch (erro) { container.querySelector("#erroAtualizacaoSolicitacao").textContent = erro.message; botao.disabled = false; }
      }));
    } catch (erro) { container.textContent = erro.message; }
  }
  await carregar();
}

/* ---------------------------------------------------------------------- */
/* CONTA DO CLIENTE                                                       */
/* ---------------------------------------------------------------------- */

async function configurarContaCliente() {
  const formulario = document.getElementById("formContaCliente");
  if (!formulario) return;
  const mensagem = document.getElementById("mensagemContaCliente");
  const token = sessionStorage.getItem("token");
  let usuario;
  try { usuario = JSON.parse(sessionStorage.getItem("usuario") || "null"); } catch (_) {}
  if (!token || !usuario?.id) {
    mostrarMensagem(mensagem, "Faça login para acessar sua conta.", "erro");
    formulario.querySelector('button[type="submit"]').disabled = true;
    return;
  }
  function preencher(dados) {
    document.getElementById("contaClienteNome").value = dados.nome;
    document.getElementById("contaClienteEmail").value = dados.email;
    document.getElementById("contaNomeExibido").textContent = dados.nome;
    document.getElementById("contaAvatar").textContent = iniciaisDoNome(dados.nome);
  }
  try {
    const r = await fetch(`${API_BASE_URL}/usuarios/${usuario.id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error("Não foi possível consultar sua conta.");
    usuario = await r.json();
    sessionStorage.setItem("usuario", JSON.stringify(usuario));
    preencher(usuario);
  } catch (erro) {
    mostrarMensagem(mensagem, "Erro ao carregar a conta. Verifique o login e a API.", "erro");
    return;
  }
  const excluir = document.getElementById("botaoExcluirConta");
  if (excluir) excluir.addEventListener("click", async function () {
    if (!window.confirm("Excluir sua conta permanentemente? Essa ação não pode ser desfeita.")) return;
    try {
      const r = await fetch(`${API_BASE_URL}/usuarios/${usuario.id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) {
        const dados = await r.json().catch(() => ({}));
        throw new Error(typeof dados.detail === "string" ? dados.detail : "Não foi possível excluir a conta.");
      }
      sessionStorage.removeItem("usuario");
      sessionStorage.removeItem("token");
      location.href = "index.html";
    } catch (erro) { mostrarMensagem(mensagem, erro.message, "erro"); }
  });
  const telefone = document.getElementById("contaClienteTelefone");
  if (telefone) { telefone.disabled = true; telefone.placeholder = "Telefone ainda não disponível no cadastro de clientes"; }
  formulario.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    const dados = {
      nome: document.getElementById("contaClienteNome").value.trim(),
      email: document.getElementById("contaClienteEmail").value.trim()
    };
    const senha = document.getElementById("contaClienteNovaSenha").value;
    if (senha) dados.senha = senha;
    try {
      const r = await fetch(`${API_BASE_URL}/usuarios/${usuario.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(dados)
      });
      const resultado = await r.json();
      if (!r.ok) throw new Error(typeof resultado.detail === "string" ? resultado.detail : "Dados inválidos.");
      usuario = resultado;
      sessionStorage.setItem("usuario", JSON.stringify(usuario));
      preencher(usuario);
      document.getElementById("contaClienteNovaSenha").value = "";
      mostrarMensagem(mensagem, "Alterações salvas no banco de dados!", "sucesso");
    } catch (erro) { mostrarMensagem(mensagem, erro.message, "erro"); }
  });
}

/* ---------------------------------------------------------------------- */
/* DASHBOARD DO PROFISSIONAL                                              */
/* ---------------------------------------------------------------------- */

async function configurarDashboardProfissional() {
  const saudacao = document.getElementById("saudacaoProfissional");
  if (!saudacao) return;
  const usuario = JSON.parse(sessionStorage.getItem("usuario") || "null");
  saudacao.textContent = usuario?.nome?.split(" ")[0] || "Profissional";
  const recentes = document.getElementById("listaSolicitacoesRecentes");
  const servicos = document.getElementById("listaMeusServicosResumo");
  try {
    const [solicitacoes, meusServicos] = await Promise.all([
      requisicaoAutenticada("/solicitacoes"), requisicaoAutenticada("/me/servicos")
    ]);
    const contagens = { resumoNovas: "Pendente", resumoAceitas: "Aceita", resumoAndamento: "Aceita", resumoConcluidas: "Concluída" };
    Object.entries(contagens).forEach(([id, status]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = solicitacoes.filter(s => s.status === status).length;
    });
    if (recentes) recentes.innerHTML = solicitacoes.length
      ? solicitacoes.slice(0, 5).map(s => `<div class="cartao" style="margin-bottom:10px;padding:14px">Solicitação #${s.id} — ${s.status} <a href="solicitacao-detalhe.html?id=${s.id}">Ver detalhes</a></div>`).join("")
      : htmlEstadoVazio("inbox", "Nenhuma solicitação recebida.");
    if (servicos) servicos.textContent = meusServicos.length ? meusServicos.map(s => s.nome).join(" • ") : "Nenhum serviço cadastrado.";
    document.querySelectorAll(".aviso-mock").forEach(el => el.remove());
  } catch (erro) {
    if (recentes) recentes.textContent = `Não foi possível carregar o painel: ${erro.message}`;
    if (servicos) servicos.textContent = "Não foi possível carregar os serviços.";
  }
}

/* ---------------------------------------------------------------------- */
/* GERENCIAMENTO DE SERVIÇOS DO PROFISSIONAL                              */
/* ---------------------------------------------------------------------- */

async function configurarServicosProfissional() {
  const listaAtuais = document.getElementById("listaServicosAtuais");
  if (!listaAtuais) return;
  const seletor = document.getElementById("seletorCategoriaServico");
  const disponiveis = document.getElementById("listaServicosDisponiveis");
  let atuais = [], catalogo = [];
  async function carregar() {
    [atuais, catalogo] = await Promise.all([
      requisicaoAutenticada("/me/servicos"), fetch(`${API_BASE_URL}/servicos`).then(r => { if (!r.ok) throw Error("Falha ao carregar serviços"); return r.json(); })
    ]);
    const categorias = await fetch(`${API_BASE_URL}/categorias`).then(r => { if (!r.ok) throw Error("Falha ao carregar categorias"); return r.json(); });
    seletor.innerHTML = '<option value="">Escolha uma categoria...</option>' + categorias.map(c => `<option value="${c.id}">${c.nome}</option>`).join("");
    renderizar();
  }
  function renderizar() {
    listaAtuais.innerHTML = atuais.length ? atuais.map(s => `<span class="chip-removivel">${s.nome} <button type="button" data-remover="${s.id}" aria-label="Remover ${s.nome}">✕</button></span>`).join("") : htmlEstadoVazio("handyman", "Você ainda não adicionou nenhum serviço.");
    listaAtuais.querySelectorAll("[data-remover]").forEach(b => b.addEventListener("click", async () => {
      try { await requisicaoAutenticada(`/me/servicos/${b.dataset.remover}`, {method:"DELETE"}); await carregar(); }
      catch(e) { alert(e.message); }
    }));
    const disponiveisCategoria = catalogo.filter(s => String(s.categoria_id) === seletor.value && !atuais.some(a => a.id === s.id));
    disponiveis.innerHTML = disponiveisCategoria.map(s => `<button type="button" class="servico-checkbox" data-adicionar="${s.id}">${s.nome}</button>`).join("");
    disponiveis.querySelectorAll("[data-adicionar]").forEach(b => b.addEventListener("click", async () => {
      try { await requisicaoAutenticada(`/me/servicos/${b.dataset.adicionar}`, {method:"POST"}); await carregar(); }
      catch(e) { alert(e.message); }
    }));
  }
  seletor.addEventListener("change", renderizar);
  try { await carregar(); } catch(e) { listaAtuais.textContent = `Erro ao carregar serviços: ${e.message}`; }
}

/* ---------------------------------------------------------------------- */
/* PERFIL PROFISSIONAL EDITÁVEL                                          */
/* ---------------------------------------------------------------------- */

async function configurarPerfilProfissionalEditar() {
  const formulario = document.getElementById("formPerfilProfissionalEditar");
  if (!formulario) return;
  const mensagem = document.getElementById("mensagemPerfilProfissionalEditar");
  configurarContadorCaracteres("editarBiografia", "contadorEditarBiografia");
  const campos = {nome:"editarNome", descricao:"editarDescricao", biografia:"editarBiografia", experiencia:"editarExperiencia", regiao:"editarRegiao"};
  try {
    const perfil = await requisicaoAutenticada("/me/profissional");
    Object.entries(campos).forEach(([campo,id]) => { document.getElementById(id).value = perfil[campo] || ""; });
    document.getElementById("editarBiografia").dispatchEvent(new Event("input"));
  } catch(e) { mostrarMensagem(mensagem, e.message, "erro"); }
  formulario.addEventListener("submit", async evento => {
    evento.preventDefault();
    const dados = Object.fromEntries(Object.entries(campos).map(([campo,id]) => [campo,document.getElementById(id).value.trim()]));
    try {
      await requisicaoAutenticada("/me/profissional", {method:"PUT", body:JSON.stringify(dados)});
      const usuario = JSON.parse(sessionStorage.getItem("usuario") || "null");
      if (usuario) { usuario.nome = dados.nome; sessionStorage.setItem("usuario", JSON.stringify(usuario)); }
      mostrarMensagem(mensagem, "Perfil salvo no banco de dados!", "sucesso");
    } catch(e) { mostrarMensagem(mensagem, e.message, "erro"); }
  });
}
