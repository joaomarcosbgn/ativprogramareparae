// ==========================================================================
// UTILITÁRIOS — REPARAÊ
// Funções pequenas e reaproveitáveis por qualquer página com formulário
// ou interação simples. Não depende de nenhuma outra página.
// ==========================================================================

/**
 * Exibe uma mensagem de feedback (sucesso ou erro) dentro de um elemento.
 * @param {HTMLElement} elemento - elemento onde o texto será exibido
 * @param {string} texto - mensagem a exibir
 * @param {"sucesso"|"erro"} tipo - estilo da mensagem
 */
function mostrarMensagem(elemento, texto, tipo) {
  if (!elemento) return;
  elemento.textContent = texto;
  elemento.classList.remove("sucesso", "erro");
  elemento.classList.add(tipo);
}

/**
 * Validação simples de formato de e-mail (checagem de UX, não substitui
 * a validação feita no backend).
 * @param {string} email
 * @returns {boolean}
 */
function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ---------------------------------------------------------------------- */
/* Chatbase — Verificação de Identidade do Usuário                        */
/* ---------------------------------------------------------------------- */
/*
 * A assinatura do JWT (com CHATBOT_IDENTITY_SECRET) tem que acontecer no
 * BACKEND — nunca no navegador. Esta função só faz a parte de cliente:
 * busca um token já assinado e identifica a sessão no widget.
 *
 * INTEGRAÇÃO PENDENTE NO BACKEND (ainda não existe, assim como
 * /recuperar-senha): um endpoint que, usando a sessão/cookie do usuário
 * já logado, devolve { "token": "<jwt assinado>" }. Exemplo em Node:
 *
 *   const jwt = require('jsonwebtoken');
 *   app.get('/chatbase-token', autenticar, (req, res) => {
 *     const token = jwt.sign(
 *       { user_id: req.usuario.id, email: req.usuario.email },
 *       process.env.CHATBOT_IDENTITY_SECRET,
 *       { expiresIn: '1h' }
 *     );
 *     res.json({ token });
 *   });
 *
 * Até esse endpoint existir, a chamada abaixo falha silenciosamente
 * (404) e o chat continua funcionando normalmente, só que sem
 * identificação — ninguém fica bloqueado por causa disso.
 */
async function identificarUsuarioNoChatbase() {
  if (typeof window.chatbase === "undefined") return;

  try {
    const resposta = await fetch(`${API_BASE_URL}/chatbase-token`, {
      method: "GET",
      credentials: "include",
    });
    if (!resposta.ok) return;

    const dados = await resposta.json().catch(function () { return {}; });
    if (!dados.token) return;

    window.chatbase("identify", { token: dados.token });
  } catch (erro) {
    // Endpoint ainda não existe no backend, ou usuário sem sessão válida.
    // Sem efeito colateral no restante da página.
  }
}

/* ---------------------------------------------------------------------- */
/* Helpers compartilhados — chat, pagamentos e biografia                  */
/* ---------------------------------------------------------------------- */

/** Escapa texto digitado por usuários antes de inseri-lo via innerHTML. */
function escaparHtml(texto) {
  return String(texto === null || texto === undefined ? "" : texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatarHora(iso) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** "Hoje", "Ontem" ou dd/mm/aaaa — usado nos separadores do chat. */
function formatarDataRelativa(iso) {
  const data = new Date(iso);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);
  if (data.toDateString() === hoje.toDateString()) return "Hoje";
  if (data.toDateString() === ontem.toDateString()) return "Ontem";
  return data.toLocaleDateString("pt-BR");
}

/**
 * Chamada GET/POST à API do Reparaê que NUNCA lança erro: devolve
 * { ok, status, dados }. status 0 = sem conexão/CORS.
 * Autenticação: ainda não definida no backend (o /login atual não devolve
 * token nem sessão). Quando for definida (cookie de sessão ou header
 * Authorization), ajuste SOMENTE aqui.
 */
async function chamarApi(caminho, opcoes) {
  try {
    const resposta = await fetch(`${API_BASE_URL}${caminho}`, Object.assign({ credentials: "include" }, opcoes || {}));
    if (!resposta.ok) return { ok: false, status: resposta.status, dados: null };
    const dados = await resposta.json().catch(function () { return null; });
    return { ok: true, status: resposta.status, dados: dados };
  } catch (erro) {
    return { ok: false, status: 0, dados: null };
  }
}

/** Contador "N/máx" para um textarea. */
function configurarContadorCaracteres(idTextarea, idContador) {
  const campo = document.getElementById(idTextarea);
  const contador = document.getElementById(idContador);
  if (!campo || !contador) return;
  const atualizar = function () { contador.textContent = `${campo.value.length}/${campo.maxLength}`; };
  campo.addEventListener("input", atualizar);
  atualizar();
}
