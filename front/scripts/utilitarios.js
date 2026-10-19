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
