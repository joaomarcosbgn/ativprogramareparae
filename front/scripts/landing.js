// ==========================================================================
// LANDING.JS — REPARAÊ
// Comportamento específico da página inicial pública (index.html).
// Depende de config.js e utilitarios.js (devem ser carregados antes).
// ==========================================================================

document.addEventListener("DOMContentLoaded", function () {
  configurarMenuMobile();
  configurarSugestoesDeBusca();
  configurarBuscaHero();
  configurarLoginHero();
  renderizarAvaliacoes();
});

/* ---------------------------------------------------------------------- */
/* Menu mobile                                                            */
/* ---------------------------------------------------------------------- */

function configurarMenuMobile() {
  const botao = document.getElementById("botaoMenuMobile");
  const menu = document.getElementById("menuMobile");
  if (!botao || !menu) return;

  botao.addEventListener("click", function () {
    const aberto = menu.classList.toggle("aberto");
    botao.setAttribute("aria-expanded", aberto ? "true" : "false");
    botao.textContent = aberto ? "close" : "menu";
  });

  // fecha o menu ao clicar em qualquer link dentro dele
  menu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      menu.classList.remove("aberto");
      botao.setAttribute("aria-expanded", "false");
      botao.textContent = "menu";
    });
  });
}

/* ---------------------------------------------------------------------- */
/* Sugestões de busca (chips) preenchem o campo de busca do hero          */
/* ---------------------------------------------------------------------- */

function configurarSugestoesDeBusca() {
  const campoBusca = document.getElementById("campoBuscaHero");
  const chips = document.querySelectorAll(".chip[data-sugestao]");
  if (!campoBusca) return;

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      campoBusca.value = chip.dataset.sugestao;
      campoBusca.focus();
    });
  });
}

/* ---------------------------------------------------------------------- */
/* Busca do hero                                                          */
/* Ainda não existe uma página/endpoint de resultados de busca (fica      */
/* para uma fase futura). Por enquanto, direciona o visitante de forma    */
/* útil em vez de simular um resultado que não existe.                    */
/* ---------------------------------------------------------------------- */

function configurarBuscaHero() {
  const formulario = document.getElementById("formBuscaHero");
  if (!formulario) return;

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();
    const secaoCategorias = document.getElementById("categorias");
    if (secaoCategorias) {
      secaoCategorias.scrollIntoView({ behavior: "smooth" });
    }
  });
}

/* ---------------------------------------------------------------------- */
/* Login embutido no hero                                                 */
/* ---------------------------------------------------------------------- */

function configurarLoginHero() {
  const formulario = document.getElementById("formLoginHero");
  const mensagem = document.getElementById("mensagemLoginHero");
  if (!formulario) return;

  formulario.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    const email = document.getElementById("loginHeroEmail").value.trim();
    const senha = document.getElementById("loginHeroSenha").value;

    if (!validarEmail(email)) {
      mostrarMensagem(mensagem, "Informe um e-mail válido.", "erro");
      return;
    }

    const botaoEnviar = formulario.querySelector("button[type=submit]");
    botaoEnviar.disabled = true;
    mostrarMensagem(mensagem, "Entrando...", "sucesso");

    try {
      const resposta = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, senha: senha }),
      });

      const dados = await resposta.json().catch(function () {
        return {};
      });

      if (resposta.ok) {
        mostrarMensagem(mensagem, "Login realizado com sucesso!", "sucesso");
        formulario.reset();
      } else {
        mostrarMensagem(mensagem, dados.detail || "E-mail ou senha inválidos.", "erro");
      }
    } catch (erro) {
      mostrarMensagem(mensagem, "Não foi possível conectar com o servidor.", "erro");
      console.error(erro);
    } finally {
      botaoEnviar.disabled = false;
    }
  });
}

/* ---------------------------------------------------------------------- */
/* Avaliações                                                             */
/* Dados fictícios de protótipo acadêmico — estrutura pronta para ser     */
/* substituída por uma chamada à API (ex: fetch(`${API_BASE_URL}/avaliacoes`)) */
/* ---------------------------------------------------------------------- */

const AVALIACOES_PROTOTIPO = [
  {
    nome: "Marina C.",
    papel: "Cliente",
    servico: "Elétrica residencial",
    nota: 5,
    depoimento:
      "Encontrei um eletricista disponível no mesmo dia. O contato foi rápido e o serviço resolveu de verdade.",
  },
  {
    nome: "Diego A.",
    papel: "Profissional · Fotografia",
    servico: "Fotografia de eventos",
    nota: 5,
    depoimento:
      "Consegui organizar minha agenda de clientes de casamento pela plataforma sem depender só de indicação.",
  },
  {
    nome: "Renata S.",
    papel: "Cliente",
    servico: "Aula particular",
    nota: 4,
    depoimento:
      "Busquei um professor de inglês para o meu filho e em poucos minutos já tinha opções para comparar.",
  },
];

function renderizarAvaliacoes() {
  const container = document.getElementById("gradeAvaliacoes");
  if (!container) return;

  container.innerHTML = AVALIACOES_PROTOTIPO.map(function (item) {
    const estrelas = '<span class="icone">star</span>'.repeat(item.nota);
    const iniciais = item.nome
      .split(" ")
      .map(function (parte) {
        return parte[0];
      })
      .join("")
      .slice(0, 2);

    return `
      <article class="cartao avaliacao-card">
        <div class="badge-avaliacao">${estrelas}</div>
        <p class="depoimento">"${item.depoimento}"</p>
        <div class="avaliacao-autor">
          <span class="avaliacao-avatar">${iniciais}</span>
          <div class="info">
            <strong>${item.nome}</strong>
            <span>${item.papel} · ${item.servico}</span>
          </div>
        </div>
      </article>
    `;
  }).join("");
}
