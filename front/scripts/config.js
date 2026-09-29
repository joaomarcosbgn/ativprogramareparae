// ==========================================================================
// CONFIGURAÇÃO GLOBAL DA API — REPARAÊ
// Único lugar onde a URL base do backend é definida. Todas as páginas que
// falam com a API (login, cadastro, busca, etc.) devem usar API_BASE_URL
// em vez de escrever o endereço direto no fetch.
// ==========================================================================

const API_BASE_URL =
  (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost")
    ? "http://127.0.0.1:8000"
    : "https://ativprogramareparae.onrender.com";
