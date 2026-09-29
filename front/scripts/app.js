// ==========================================================================
// APP.JS — REPARAÊ
// Comportamento das páginas internas logadas. Cada função só executa se
// os elementos da respectiva página existirem no HTML atual — por isso um
// único arquivo pode ser incluído em todas as páginas internas sem
// conflito. Depende de: config.js, utilitarios.js, dados.js, navegacao.js.
// ==========================================================================

document.addEventListener("DOMContentLoaded", function () {
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
}

/* ---------------------------------------------------------------------- */
/* HOME DO CLIENTE                                                        */
/* ---------------------------------------------------------------------- */

function configurarHomeCliente() {
  const saudacao = document.getElementById("saudacaoNome");
  if (!saudacao) return;

  saudacao.textContent = USUARIO_LOGADO_MOCK.nome;

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
    gradeCategorias.innerHTML = CATEGORIAS.map(function (cat) {
      return `
        <a class="categoria-card" data-categoria="${cat.id}" href="busca.html?categoria=${cat.id}">
          <span class="categoria-icone icone">${cat.icone}</span>
          <span class="nome">${cat.nome}</span>
        </a>
      `;
    }).join("");
  }

  const gradeRecomendados = document.getElementById("gradeProfissionaisRecomendados");
  if (gradeRecomendados) {
    gradeRecomendados.innerHTML = PROFISSIONAIS_MOCK.slice(0, 3).map(htmlCardProfissional).join("");
    configurarBotoesSolicitar(gradeRecomendados);
  }

  const listaHome = document.getElementById("listaSolicitacoesHome");
  if (listaHome) {
    const rotulosHome = { andamento: "Em andamento", concluida: "Concluída", cancelada: "Cancelada" };
    listaHome.innerHTML = SOLICITACOES_CLIENTE_MOCK.slice(0, 2).map(function (s) {
      return `
        <a class="cartao card-solicitacao" href="solicitacao-detalhe.html?id=${s.id}&tipo=cliente">
          <div>
            <h3>${s.servico}</h3>
            <p class="pessoa">com ${s.profissional}</p>
          </div>
          <div class="card-solicitacao-meta">
            <span class="data">${s.data}</span>
            <span class="status-badge status-${s.status}">${rotulosHome[s.status]}</span>
          </div>
        </a>
      `;
    }).join("");
  }

  renderizarAvaliacoesEm("gradeAvaliacoesApp");
}

/* ---------------------------------------------------------------------- */
/* BUSCA E RESULTADOS                                                     */
/* ---------------------------------------------------------------------- */

function configurarBusca() {
  const formulario = document.getElementById("formBuscaResultados");
  if (!formulario) return;

  const campoBusca = document.getElementById("campoBuscaResultados");
  const filtroCategoria = document.getElementById("filtroCategoria");
  const resultados = document.getElementById("resultadosBusca");

  filtroCategoria.innerHTML = '<option value="">Todas as categorias</option>' +
    CATEGORIAS.map(function (c) { return `<option value="${c.id}">${c.nome}</option>`; }).join("");

  const parametros = new URLSearchParams(window.location.search);
  if (parametros.get("q")) campoBusca.value = parametros.get("q");
  if (parametros.get("categoria")) filtroCategoria.value = parametros.get("categoria");

  // Chips visuais de categoria (o <select> continua como fonte do filtro)
  const chips = document.getElementById("chipsCategorias");
  function renderizarChips() {
    if (!chips) return;
    const ativa = filtroCategoria.value;
    chips.innerHTML =
      `<button type="button" class="chip${ativa === "" ? " ativo" : ""}" data-cat=""><span class="icone">apps</span>Todos</button>` +
      CATEGORIAS.map(function (c) {
        return `<button type="button" class="chip${ativa === c.id ? " ativo" : ""}" data-cat="${c.id}"><span class="icone">${c.icone}</span>${c.nome}</button>`;
      }).join("");
  }
  if (chips) {
    chips.addEventListener("click", function (evento) {
      const botao = evento.target.closest("[data-cat]");
      if (!botao) return;
      filtroCategoria.value = botao.dataset.cat;
      renderizarChips();
      executarBusca();
    });
  }
  renderizarChips();

  let temporizador = null;

  function executarBusca() {
    const termo = campoBusca.value.trim().toLowerCase();
    const categoria = filtroCategoria.value;

    // Skeleton curto: feedback visual de carregamento
    resultados.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
    clearTimeout(temporizador);
    temporizador = setTimeout(function () { exibirResultados(termo, categoria); }, 350);
  }

  function exibirResultados(termo, categoria) {

    const encontrados = PROFISSIONAIS_MOCK.filter(function (p) {
      const bateCategoria = !categoria || p.categoria === categoria;
      const bateTermo = !termo || (p.nome + " " + p.servico + " " + p.descricaoCurta).toLowerCase().includes(termo);
      return bateCategoria && bateTermo;
    });

    resultados.innerHTML = encontrados.length
      ? encontrados.map(htmlCardProfissional).join("")
      : htmlEstadoVazio("search_off", "Nenhum profissional encontrado para essa busca ainda.");

    configurarBotoesSolicitar(resultados);
  }

  formulario.addEventListener("submit", function (evento) { evento.preventDefault(); executarBusca(); });
  filtroCategoria.addEventListener("change", function () { renderizarChips(); executarBusca(); });

  executarBusca();
}

/* ---------------------------------------------------------------------- */
/* PERFIL PÚBLICO DO PROFISSIONAL                                         */
/* ---------------------------------------------------------------------- */

function configurarPerfilProfissionalPublico() {
  const container = document.getElementById("perfilProfissionalConteudo");
  if (!container) return;

  const parametros = new URLSearchParams(window.location.search);
  const id = Number(parametros.get("id")) || PROFISSIONAIS_MOCK[0].id;
  const p = PROFISSIONAIS_MOCK.find(function (item) { return item.id === id; }) || PROFISSIONAIS_MOCK[0];

  const capa = document.getElementById("perfilCapa");
  if (capa) capa.dataset.categoria = p.categoria;
  const iconeCapa = document.getElementById("perfilIconeCapa");
  if (iconeCapa) iconeCapa.textContent = iconeDaCategoria(p.categoria);

  document.getElementById("perfilNome").textContent = p.nome;
  document.getElementById("perfilServico").textContent = p.servico + " · " + p.regiao;
  document.getElementById("perfilAvatar").textContent = iniciaisDoNome(p.nome);
  document.getElementById("perfilAvaliacao").innerHTML = `${renderizarEstrelas(p.nota)} ${p.nota.toFixed(1)} <span class="contagem">(${p.numAvaliacoes} avaliações)</span>`;
  document.getElementById("perfilExperiencia").textContent = p.experiencia;
  document.getElementById("perfilDescricao").textContent = p.descricao;

  const botaoSolicitar = document.getElementById("botaoSolicitarPerfil");
  botaoSolicitar.addEventListener("click", function () {
    botaoSolicitar.textContent = "Solicitação enviada ✓";
    botaoSolicitar.disabled = true;
  });

  const statsPerfil = document.getElementById("perfilStats");
  if (statsPerfil) {
    const anos = (p.experiencia.match(/\d+/) || ["—"])[0];
    statsPerfil.innerHTML = `
      <div><strong>${p.nota.toFixed(1)}</strong><span>Nota</span></div>
      <div><strong>${p.numAvaliacoes}</strong><span>Avaliações</span></div>
      <div><strong>${anos}</strong><span>Anos de experiência</span></div>
    `;
  }

  // Galeria de trabalhos (placeholders coloridos até haver fotos reais).
  // Para fotos reais, defina p.fotos = ["url1", "url2", ...] em dados.js.
  const secaoPortfolio = document.getElementById("secaoPortfolio");
  if (p.portfolio) {
    secaoPortfolio.hidden = false;
    const fotos = p.fotos || [];
    const iconeGaleria = iconeDaCategoria(p.categoria);
    document.getElementById("portfolioGrade").innerHTML = Array.from({ length: 6 })
      .map(function (_, i) {
        return fotos[i]
          ? `<div class="portfolio-item" data-categoria="${p.categoria}" style="background-image:url('${fotos[i]}');background-size:cover;background-position:center;"></div>`
          : `<div class="portfolio-item" data-categoria="${p.categoria}"><span class="icone">${iconeGaleria}</span></div>`;
      })
      .join("");
  }

  renderizarAvaliacoesEm("gradeAvaliacoesPerfil");
}

/* ---------------------------------------------------------------------- */
/* SOLICITAÇÕES DO CLIENTE                                                */
/* ---------------------------------------------------------------------- */

function configurarSolicitacoesCliente() {
  const container = document.getElementById("listaSolicitacoesCliente");
  if (!container) return;

  const rotulos = { andamento: "Em andamento", concluida: "Concluídas", cancelada: "Canceladas" };
  const abas = document.querySelectorAll("#abasSolicitacoesCliente .aba");

  function renderizar(status) {
    const itens = SOLICITACOES_CLIENTE_MOCK.filter(function (s) { return s.status === status; });
    container.innerHTML = itens.length
      ? itens.map(function (s) {
          return `
            <a class="cartao card-solicitacao" href="solicitacao-detalhe.html?id=${s.id}&tipo=cliente">
              <div>
                <h3>${s.servico}</h3>
                <p class="pessoa">com ${s.profissional}</p>
                <p class="resumo">${s.resumo}</p>
              </div>
              <div class="card-solicitacao-meta">
                <span class="data">${s.data}</span>
                <span class="status-badge status-${s.status}">${rotulos[s.status]}</span>
              </div>
            </a>
          `;
        }).join("")
      : htmlEstadoVazio("inbox", `Você não tem solicitações ${rotulos[status].toLowerCase()}.`);
  }

  abas.forEach(function (aba) {
    aba.addEventListener("click", function () {
      abas.forEach(function (a) { a.classList.remove("ativa"); });
      aba.classList.add("ativa");
      renderizar(aba.dataset.status);
    });
  });

  renderizar("andamento");
}

/* ---------------------------------------------------------------------- */
/* SOLICITAÇÕES DO PROFISSIONAL                                           */
/* ---------------------------------------------------------------------- */

function configurarSolicitacoesProfissional() {
  const container = document.getElementById("listaSolicitacoesProfissional");
  if (!container) return;

  const rotulos = { nova: "Nova", aceita: "Aceita", andamento: "Em andamento", historico: "Histórico" };
  const abas = document.querySelectorAll("#abasSolicitacoesProfissional .aba");

  function renderizar(status) {
    const itens = SOLICITACOES_PROFISSIONAL_MOCK.filter(function (s) { return s.status === status; });
    container.innerHTML = itens.length
      ? itens.map(function (s) {
          return `
            <a class="cartao card-solicitacao" href="solicitacao-detalhe.html?id=${s.id}&tipo=profissional">
              <div>
                <h3>${s.servico}</h3>
                <p class="pessoa">para ${s.cliente}</p>
                <p class="resumo">${s.resumo}</p>
              </div>
              <div class="card-solicitacao-meta">
                <span class="data">${s.data}</span>
                <span class="status-badge status-${s.status}">${rotulos[s.status]}</span>
              </div>
            </a>
          `;
        }).join("")
      : htmlEstadoVazio("inbox", `Nenhuma solicitação em "${rotulos[status]}" no momento.`);
  }

  abas.forEach(function (aba) {
    aba.addEventListener("click", function () {
      abas.forEach(function (a) { a.classList.remove("ativa"); });
      aba.classList.add("ativa");
      renderizar(aba.dataset.status);
    });
  });

  renderizar("nova");
}

/* ---------------------------------------------------------------------- */
/* DETALHE DE SOLICITAÇÃO (cliente ou profissional)                       */
/* ---------------------------------------------------------------------- */

function configurarSolicitacaoDetalhe() {
  const container = document.getElementById("detalheSolicitacaoConteudo");
  if (!container) return;

  const parametros = new URLSearchParams(window.location.search);
  const id = Number(parametros.get("id"));
  const tipo = parametros.get("tipo") === "profissional" ? "profissional" : "cliente";

  if (typeof renderizarNavegacao === "function") {
    renderizarNavegacao(tipo, "solicitacoes");
  }

  const lista = tipo === "profissional" ? SOLICITACOES_PROFISSIONAL_MOCK : SOLICITACOES_CLIENTE_MOCK;
  const item = lista.find(function (s) { return s.id === id; }) || lista[0];
  const rotulosCliente = { andamento: "Em andamento", concluida: "Concluída", cancelada: "Cancelada" };
  const rotulosProfissional = { nova: "Nova", aceita: "Aceita", andamento: "Em andamento", historico: "Histórico" };
  const rotulo = tipo === "profissional" ? rotulosProfissional[item.status] : rotulosCliente[item.status];
  const pessoa = tipo === "profissional" ? item.cliente : item.profissional;
  const voltarHref = tipo === "profissional" ? "solicitacoes-profissional.html" : "solicitacoes-cliente.html";

  container.innerHTML = `
    <a href="${voltarHref}" class="btn-texto"><span class="icone">arrow_back</span> Voltar</a>
    <div class="cartao" style="margin-top: var(--espaco-4);">
      <div class="card-solicitacao-meta" style="text-align:left; margin-bottom: var(--espaco-3);">
        <span class="status-badge status-${item.status}">${rotulo}</span>
      </div>
      <h1 style="font-size: var(--texto-xl); margin-bottom: var(--espaco-1);">${item.servico}</h1>
      <p class="pessoa">${tipo === "profissional" ? "Cliente" : "Profissional"}: ${pessoa}</p>
      <p style="margin-top: var(--espaco-1); font-size: var(--texto-sm); color: var(--texto-secundario);">Data: ${item.data}</p>
      <p style="margin-top: var(--espaco-3);">${item.resumo}</p>

      <div class="acoes-etapa" id="acoesSolicitacaoDetalhe" style="margin-top: var(--espaco-5);"></div>
      <p id="mensagemSolicitacaoDetalhe" class="mensagem-formulario" role="status"></p>
    </div>
  `;

  const acoes = document.getElementById("acoesSolicitacaoDetalhe");
  const mensagem = document.getElementById("mensagemSolicitacaoDetalhe");

  function acao(texto, classe) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "btn " + classe;
    botao.textContent = texto;
    botao.addEventListener("click", function () {
      mostrarMensagem(mensagem, "Ação registrada nesta demonstração — será conectada à API futuramente.", "sucesso");
      acoes.querySelectorAll("button").forEach(function (b) { b.disabled = true; });
    });
    acoes.appendChild(botao);
  }

  if (tipo === "cliente" && item.status === "andamento") acao("Cancelar solicitação", "btn-secundario");
  if (tipo === "cliente" && item.status === "concluida") acao("Avaliar profissional", "btn-primario");
  if (tipo === "profissional" && item.status === "nova") { acao("Recusar", "btn-secundario"); acao("Aceitar", "btn-primario"); }
  if (tipo === "profissional" && (item.status === "aceita" || item.status === "andamento")) acao("Marcar como concluída", "btn-primario");
}

/* ---------------------------------------------------------------------- */
/* CONTA DO CLIENTE                                                       */
/* ---------------------------------------------------------------------- */

function configurarContaCliente() {
  const formulario = document.getElementById("formContaCliente");
  if (!formulario) return;

  document.getElementById("contaClienteNome").value = USUARIO_LOGADO_MOCK.nome;

  const avatarConta = document.getElementById("contaAvatar");
  if (avatarConta) avatarConta.textContent = iniciaisDoNome(USUARIO_LOGADO_MOCK.nome);
  const nomeConta = document.getElementById("contaNomeExibido");
  if (nomeConta) nomeConta.textContent = USUARIO_LOGADO_MOCK.nome;

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();
    const mensagem = document.getElementById("mensagemContaCliente");
    // Integração futura: PUT /usuarios/:id
    mostrarMensagem(mensagem, "Alterações salvas nesta demonstração.", "sucesso");
  });
}

/* ---------------------------------------------------------------------- */
/* DASHBOARD DO PROFISSIONAL                                              */
/* ---------------------------------------------------------------------- */

function configurarDashboardProfissional() {
  const saudacao = document.getElementById("saudacaoProfissional");
  if (!saudacao) return;

  saudacao.textContent = PROFISSIONAIS_MOCK[0].nome.split(" ")[0];

  const contagens = { nova: 0, aceita: 0, andamento: 0, historico: 0 };
  SOLICITACOES_PROFISSIONAL_MOCK.forEach(function (s) { contagens[s.status]++; });

  document.getElementById("resumoNovas").textContent = contagens.nova;
  document.getElementById("resumoAceitas").textContent = contagens.aceita;
  document.getElementById("resumoAndamento").textContent = contagens.andamento;
  document.getElementById("resumoConcluidas").textContent = contagens.historico;

  const rotulosProfissional = { nova: "Nova", aceita: "Aceita", andamento: "Em andamento", historico: "Concluída" };
  const listaRecentes = document.getElementById("listaSolicitacoesRecentes");
  listaRecentes.innerHTML = SOLICITACOES_PROFISSIONAL_MOCK.slice(0, 3).map(function (s) {
    return `
      <a class="cartao card-solicitacao" href="solicitacao-detalhe.html?id=${s.id}&tipo=profissional">
        <div>
          <h3>${s.servico}</h3>
          <p class="pessoa">para ${s.cliente}</p>
        </div>
        <div class="card-solicitacao-meta">
          <span class="data">${s.data}</span>
          <span class="status-badge status-${s.status}">${rotulosProfissional[s.status] || s.status}</span>
        </div>
      </a>
    `;
  }).join("");

  const listaServicos = document.getElementById("listaMeusServicosResumo");
  listaServicos.innerHTML = SERVICOS_PROFISSIONAL_MOCK.map(function (s) {
    return `<span class="chip">${s}</span>`;
  }).join("");
}

/* ---------------------------------------------------------------------- */
/* GERENCIAMENTO DE SERVIÇOS DO PROFISSIONAL                              */
/* ---------------------------------------------------------------------- */

function configurarServicosProfissional() {
  const listaAtuais = document.getElementById("listaServicosAtuais");
  if (!listaAtuais) return;

  let servicosAtuais = SERVICOS_PROFISSIONAL_MOCK.slice();

  function renderizarAtuais() {
    listaAtuais.innerHTML = servicosAtuais.length
      ? servicosAtuais.map(function (s) {
          return `<span class="chip-removivel">${s} <button type="button" data-remover-servico="${s}">✕</button></span>`;
        }).join("")
      : htmlEstadoVazio("handyman", "Você ainda não adicionou nenhum serviço.");

    listaAtuais.querySelectorAll("[data-remover-servico]").forEach(function (botao) {
      botao.addEventListener("click", function () {
        servicosAtuais = servicosAtuais.filter(function (s) { return s !== botao.dataset.removerServico; });
        renderizarAtuais();
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
        servicosAtuais.push(botao.dataset.servicoDisponivel);
        renderizarAtuais();
        seletorCategoria.dispatchEvent(new Event("change"));
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

  const p = PROFISSIONAIS_MOCK[0];
  document.getElementById("editarNome").value = p.nome;
  document.getElementById("editarDescricao").value = p.descricao;
  document.getElementById("editarExperiencia").value = p.experiencia;
  document.getElementById("editarRegiao").value = p.regiao;

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();
    const mensagem = document.getElementById("mensagemPerfilProfissionalEditar");
    // Integração futura: PUT /profissionais/:id
    mostrarMensagem(mensagem, "Perfil atualizado nesta demonstração.", "sucesso");
  });
}
