// ==========================================================================
// NAVEGACAO.JS — REPARAÊ
// Renderiza a barra de navegação do topo (desktop) e a navegação inferior
// (mobile) das páginas internas logadas, a partir de dois placeholders
// que cada página deve declarar no HTML:
//   <div id="navTopo"></div>
//   <div id="navInferior"></div>
// Depende de: nenhum outro script.
// ==========================================================================

const LINKS_NAV_CLIENTE = [
  { href: "home-cliente.html", label: "Início", icone: "home", chave: "inicio" },
  { href: "busca.html", label: "Buscar", icone: "search", chave: "buscar" },
  { href: "solicitacoes-cliente.html", label: "Solicitações", icone: "assignment", chave: "solicitacoes" },
  { href: "conta-cliente.html", label: "Perfil", icone: "person", chave: "perfil" },
];

const LINKS_NAV_PROFISSIONAL = [
  { href: "dashboard-profissional.html", label: "Início", icone: "home", chave: "inicio" },
  { href: "solicitacoes-profissional.html", label: "Solicitações", icone: "assignment", chave: "solicitacoes" },
  { href: "servicos-profissional.html", label: "Serviços", icone: "handyman", chave: "servicos" },
  { href: "perfil-profissional-editar.html", label: "Perfil", icone: "person", chave: "perfil" },
];

/**
 * @param {"cliente"|"profissional"} tipoUsuario
 * @param {string} paginaAtiva - chave da página atual (ex: "inicio")
 */
function renderizarNavegacao(tipoUsuario, paginaAtiva) {
  const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));

  if (!usuarioLogado) {
    window.location.href = "login.html";
    return;
  }
    if (usuarioLogado.tipo !== tipoUsuario) {
    if (usuarioLogado.tipo === "profissional") {
      window.location.href = "dashboard-profissional.html";
    } else {
      window.location.href = "home-cliente.html";
    }
    return;
  }

  const links = tipoUsuario === "profissional" ? LINKS_NAV_PROFISSIONAL : LINKS_NAV_CLIENTE;
  const topo = document.getElementById("navTopo");
  const inferior = document.getElementById("navInferior");

  if (topo) {
    topo.innerHTML = `
      <div class="container topo-app-conteudo">
        <a href="${links[0].href}" class="marca">Repara<span>ê</span></a>
        <nav class="topo-app-links">
          ${links.map(function (link) {
            const ativo = link.chave === paginaAtiva ? " ativo" : "";
            return `<a href="${link.href}" class="topo-app-link${ativo}"><span class="icone">${link.icone}</span>${link.label}</a>`;
          }).join("")}
        </nav>
        <a href="#" class="btn btn-secundario topo-app-sair" id="botaoSair"><span class="icone">logout</span>Sair</a>
      </div>
    `;
  }

    if (inferior) {
    inferior.innerHTML = links.map(function (link) {
      const ativo = link.chave === paginaAtiva ? " ativo" : "";
      return `
        <a href="${link.href}" class="nav-inferior-item${ativo}">
          <span class="icone">${link.icone}</span>
          <span>${link.label}</span>
        </a>
      `;
    }).join("");
  }

  configurarLogout();
}
function configurarLogout() {
  const botaoSair = document.getElementById("botaoSair");

  if (!botaoSair) return;

  botaoSair.addEventListener("click", function (evento) {
    evento.preventDefault();

    localStorage.removeItem("usuarioLogado");

    window.location.href = "index.html";
  });
}
