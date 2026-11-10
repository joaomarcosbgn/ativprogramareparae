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
      botao.textContent = "Solicitado ✓";
      botao.disabled = true;
      // Integração futura: POST /solicitacoes { profissionalId, clienteId, servico }
    });
  });

  container.querySelectorAll(".favorito").forEach(function (botao) {
    botao.addEventListener("click", function () {
      botao.classList.toggle("ativo");
    });
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
  const resultados = document.getElementById("resultadosBusca");
  const parametros = new URLSearchParams(location.search);
  campo.value = parametros.get("q") || "";
  const categoriaURL = parametros.get("categoria") || "";
  const chips = document.getElementById("chipsCategorias");
  let especialidades = [];
  function renderizarChips() {
    if (!chips) return;
    chips.innerHTML = '<button type="button" class="chip' + (!filtro.value ? ' ativo' : '') + '" data-cat="">Todos</button>' +
      especialidades.map(nome => `<button type="button" class="chip${filtro.value === nome ? " ativo" : ""}" data-cat="${escaparHtml(nome)}">${escaparHtml(nome)}</button>`).join("");
  }
  if (chips) chips.addEventListener("click", e => {
    const botao = e.target.closest("[data-cat]");
    if (!botao) return;
    filtro.value = botao.dataset.cat;
    renderizarChips();
    executarBusca();
  });
  async function carregarEspecialidades() {
    try {
      const resposta = await fetch(`${API_BASE_URL}/profissionais?limit=100`);
      if (!resposta.ok) throw new Error("Falha ao carregar especialidades");
      const profissionais = await resposta.json();
      especialidades = [...new Set(profissionais.map(p => String(p.especialidade || "").trim()).filter(Boolean))].sort();
      filtro.replaceChildren();
      const todos = document.createElement("option"); todos.value = ""; todos.textContent = "Todas as especialidades"; filtro.append(todos);
      especialidades.forEach(nome => { const option = document.createElement("option"); option.value = nome; option.textContent = nome; filtro.append(option); });
      const categoriaAntiga = CATEGORIAS.find(c => String(c.id) === categoriaURL);
      const selecionada = categoriaAntiga?.nome || categoriaURL;
      if (especialidades.includes(selecionada)) filtro.value = selecionada;
      renderizarChips();
    } catch (_) {
      filtro.innerHTML = '<option value="">Todas as especialidades</option>';
      renderizarChips();
    }
    executarBusca();
  }
  let requisicao = 0;
  async function executarBusca() {
    const atual = ++requisicao;
    const params = new URLSearchParams({ q: campo.value.trim(), categoria: filtro.value, limit: "100" });
    resultados.textContent = "Buscando profissionais cadastrados...";
    try {
      const resposta = await fetch(`${API_BASE_URL}/profissionais?${params}`);
      if (!resposta.ok) throw new Error("Não foi possível consultar os profissionais.");
      const profissionais = await resposta.json();
      if (atual !== requisicao) return;
      resultados.innerHTML = profissionais.length ? profissionais.map(p => `
        <article class="cartao card-profissional">
          <div class="midia-corpo">
            <div class="card-profissional-topo">
              <span class="avatar">${escaparHtml(iniciaisDoNome(p.nome))}</span>
              <div class="card-profissional-nome"><strong>${escaparHtml(p.nome)}</strong>
                <span>${escaparHtml(p.especialidade)}</span></div>
            </div>
            <p class="descricao">Profissional cadastrado no Reparaê</p>
            <div class="card-profissional-acoes">
              <a class="btn btn-secundario" href="perfil-profissional.html?id=${encodeURIComponent(p.id)}">Ver perfil</a>
            </div>
          </div>
        </article>`).join("") : htmlEstadoVazio("search_off", "Nenhum profissional cadastrado encontrado.");
    } catch (erro) {
      if (atual === requisicao) resultados.textContent = "Não foi possível carregar profissionais. Verifique se a API está funcionando.";
    }
  }
  formulario.addEventListener("submit", e => { e.preventDefault(); executarBusca(); });
  filtro.addEventListener("change", () => { renderizarChips(); executarBusca(); });
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
    document.getElementById("perfilDescricao").textContent = "Profissional cadastrado no Reparaê.";
    const avaliacao = document.getElementById("perfilAvaliacao");
    if (avaliacao) avaliacao.textContent = "Ainda sem avaliações";
    const experiencia = document.getElementById("perfilExperiencia");
    if (experiencia) experiencia.textContent = "Não informada";
    const stats = document.getElementById("perfilStats");
    if (stats) stats.textContent = "Informações adicionais ainda não cadastradas.";
    const sobre = document.getElementById("secaoSobreMim");
    if (sobre) sobre.hidden = true;
    const portfolio = document.getElementById("secaoPortfolio");
    if (portfolio) portfolio.hidden = true;
    const solicitar = document.getElementById("botaoSolicitarPerfil");
    if (solicitar) { solicitar.disabled = true; solicitar.title = "Solicitações ainda não estão disponíveis"; }
    const avaliacoes = document.getElementById("gradeAvaliacoesPerfil");
    if (avaliacoes) avaliacoes.textContent = "Nenhuma avaliação registrada.";
  } catch (erro) {
    container.textContent = "Não foi possível carregar o profissional cadastrado.";
  }
}

/* ---------------------------------------------------------------------- */
/* SOLICITAÇÕES DO CLIENTE                                                */
/* ---------------------------------------------------------------------- */

function configurarSolicitacoesCliente() {
  const container = document.getElementById("listaSolicitacoesCliente");
  if (!container) return;
  const abas = document.querySelectorAll("#abasSolicitacoesCliente .aba");
  const renderizar = () => { container.innerHTML = htmlEstadoVazio("inbox", "Ainda não há solicitações disponíveis. Esta função aguarda integração com a API."); };
  abas.forEach(aba => aba.addEventListener("click", () => {
    abas.forEach(a => a.classList.remove("ativa"));
    aba.classList.add("ativa");
    renderizar();
  }));
  renderizar();
}

/* ---------------------------------------------------------------------- */
/* SOLICITAÇÕES DO PROFISSIONAL                                           */
/* ---------------------------------------------------------------------- */
function configurarSolicitacoesProfissional() {
  const container = document.getElementById("listaSolicitacoesProfissional");
  if (!container) return;
  const abas = document.querySelectorAll("#abasSolicitacoesProfissional .aba");
  const renderizar = () => { container.innerHTML = htmlEstadoVazio("inbox", "Ainda não há solicitações disponíveis. Esta função aguarda integração com a API."); };
  abas.forEach(aba => aba.addEventListener("click", () => {
    abas.forEach(a => a.classList.remove("ativa"));
    aba.classList.add("ativa");
    renderizar();
  }));
  renderizar();
}

/* ---------------------------------------------------------------------- */
/* DETALHE DE SOLICITAÇÃO                                                 */
/* ---------------------------------------------------------------------- */
function configurarSolicitacaoDetalhe() {
  const container = document.getElementById("detalheSolicitacaoConteudo");
  if (!container) return;
  container.innerHTML = htmlEstadoVazio("inbox", "Detalhes indisponíveis: a API de solicitações ainda não está implementada.");
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

function configurarDashboardProfissional() {
  const saudacao = document.getElementById("saudacaoProfissional");
  if (!saudacao) return;
  let usuario = null;
  try { usuario = JSON.parse(sessionStorage.getItem("usuario") || "null"); } catch (_) {}
  saudacao.textContent = usuario?.nome?.split(" ")[0] || "Profissional";
  ["resumoNovas", "resumoAceitas", "resumoAndamento", "resumoConcluidas"].forEach(id => {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = "—";
  });
  const listaRecentes = document.getElementById("listaSolicitacoesRecentes");
  if (listaRecentes) listaRecentes.innerHTML = htmlEstadoVazio("inbox", "Solicitações ainda não integradas à API.");
  const listaServicos = document.getElementById("listaMeusServicosResumo");
  if (listaServicos) listaServicos.innerHTML = htmlEstadoVazio("handyman", "Serviços do profissional ainda não integrados à API.");
}

/* ---------------------------------------------------------------------- */
/* GERENCIAMENTO DE SERVIÇOS DO PROFISSIONAL                              */
/* ---------------------------------------------------------------------- */

function configurarServicosProfissional() {
  const listaAtuais = document.getElementById("listaServicosAtuais");
  if (!listaAtuais) return;

  let servicosAtuais = []; // Não exibir serviços fictícios como se fossem do usuário.

  function renderizarAtuais() {
    listaAtuais.innerHTML = servicosAtuais.length
      ? servicosAtuais.map(function (s) {
          return `<span class="chip-removivel">${s} <button type="button" data-remover-servico="${s}">✕</button></span>`;
        }).join("")
      : htmlEstadoVazio("handyman", "Você ainda não adicionou nenhum serviço.");

    listaAtuais.querySelectorAll("[data-remover-servico]").forEach(function (botao) {
      botao.addEventListener("click", function () {
        alert("A remoção de serviços do profissional ainda não está disponível na API.");
      });
    });
  }
  renderizarAtuais();

  const seletorCategoria = document.getElementById("seletorCategoriaServico");
  const listaDisponiveis = document.getElementById("listaServicosDisponiveis");

  seletorCategoria.innerHTML = '<option value="">Escolha uma categoria...</option>' +
    CATEGORIAS.map(function (c) { return `<option value="${c.id}">${c.nome}</option>`; }).join("");

  seletorCategoria.addEventListener("change", function () {
    const categoria = CATEGORIAS.find(function (c) { return c.id === seletorCategoria.value; });
    if (!categoria) { listaDisponiveis.innerHTML = ""; return; }

    listaDisponiveis.innerHTML = categoria.servicos.map(function (servico) {
      const jaAdicionado = servicosAtuais.includes(servico);
      return `<button type="button" class="servico-checkbox${jaAdicionado ? " selecionado" : ""}" data-servico-disponivel="${servico}" ${jaAdicionado ? "disabled" : ""}>${servico}</button>`;
    }).join("");

    listaDisponiveis.querySelectorAll("[data-servico-disponivel]").forEach(function (botao) {
      botao.addEventListener("click", function () {
        alert("A vinculação de serviços ao profissional ainda não está disponível na API.");
      });
    });
  });
}

/* ---------------------------------------------------------------------- */
/* PERFIL PROFISSIONAL EDITÁVEL                                          */
/* ---------------------------------------------------------------------- */

function configurarPerfilProfissionalEditar() {
  const formulario = document.getElementById("formPerfilProfissionalEditar");
  if (!formulario) return;

  let usuario = null;
  try { usuario = JSON.parse(sessionStorage.getItem("usuario") || "null"); } catch (_) {}
  document.getElementById("editarNome").value = usuario?.nome || "";
  configurarContadorCaracteres("editarBiografia", "contadorEditarBiografia");

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();
    const mensagem = document.getElementById("mensagemPerfilProfissionalEditar");
    // Integração futura: PUT /profissionais/:id (inclui "biografia")
    mostrarMensagem(mensagem, "Alteração não salva: a API de edição do perfil profissional ainda não está disponível.", "erro");
  });
}
