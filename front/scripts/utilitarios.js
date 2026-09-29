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
