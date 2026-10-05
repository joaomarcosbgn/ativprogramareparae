// ==========================================================================
// LOGIN.JS — REPARAÊ
// Depende de config.js e utilitarios.js (devem ser carregados antes).
// ==========================================================================

document.addEventListener("DOMContentLoaded", function () {
  configurarVisibilidadeSenha();
  configurarFormularioLogin();
  configurarFormularioEsqueciSenha();
});

function configurarVisibilidadeSenha() {
  const botao = document.getElementById("botaoVerSenha");
  const campoSenha = document.getElementById("senha");
  if (!botao || !campoSenha) return;

  botao.addEventListener("click", function () {
    const visivel = campoSenha.type === "text";
    campoSenha.type = visivel ? "password" : "text";
    botao.textContent = visivel ? "visibility" : "visibility_off";
    botao.setAttribute("aria-label", visivel ? "Mostrar senha" : "Ocultar senha");
  });
}

function configurarFormularioLogin() {
  const formulario = document.getElementById("formLogin");
  const mensagem = document.getElementById("mensagemLogin");
  if (!formulario) return;

  formulario.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const erroEmail = document.getElementById("erroEmail");
    const erroSenha = document.getElementById("erroSenha");

    erroEmail.textContent = "";
    erroSenha.textContent = "";
    let valido = true;

    if (!validarEmail(email)) {
      erroEmail.textContent = "Informe um e-mail válido.";
      valido = false;
    }
    if (senha.length < 6) {
      erroSenha.textContent = "A senha deve ter pelo menos 6 caracteres.";
      valido = false;
    }
    if (!valido) return;

    const botaoEntrar = document.getElementById("botaoEntrar");
    botaoEntrar.disabled = true;
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
    localStorage.setItem("usuarioLogado", JSON.stringify(dados));

    mostrarMensagem(mensagem, "Login realizado com sucesso! Redirecionando...", "sucesso");
        // A definição de qual página abrir (home do cliente ou dashboard do
        // profissional) depende do tipo de usuário retornado pela API.
        // Enquanto esse dado não estiver disponível na resposta, o destino
        // padrão é a home do cliente.
        setTimeout(function () {
          window.location.href = "home-cliente.html";
        }, 600);
      } else {
        mostrarMensagem(mensagem, dados.detail || "E-mail ou senha inválidos.", "erro");
      }
    } catch (erro) {
      mostrarMensagem(mensagem, "Não foi possível conectar com o servidor.", "erro");
      console.error(erro);
    } finally {
      botaoEntrar.disabled = false;
    }
  });
}

/* ---------------------------------------------------------------------- */
/* Esqueci minha senha                                                    */
/* O backend ainda não possui um endpoint de recuperação de senha, então  */
/* esta função só cobre a interface e deixa o ponto de integração         */
/* comentado, pronto para quando o endpoint existir.                      */
/* ---------------------------------------------------------------------- */

function configurarFormularioEsqueciSenha() {
  const formulario = document.getElementById("formEsqueciSenha");
  const mensagem = document.getElementById("mensagemEsqueciSenha");
  if (!formulario) return;

  formulario.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    const email = document.getElementById("emailRecuperacao").value.trim();
    if (!validarEmail(email)) {
      mostrarMensagem(mensagem, "Informe um e-mail válido.", "erro");
      return;
    }

    // Integração futura, quando o endpoint existir no backend:
    // await fetch(`${API_BASE_URL}/recuperar-senha`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ email: email }),
    // });

    mostrarMensagem(mensagem, "Se o e-mail estiver cadastrado, você receberá as instruções em breve.", "sucesso");
    formulario.reset();
  });
}
