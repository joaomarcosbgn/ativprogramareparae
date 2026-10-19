// ==========================================================================
// CADASTRO.JS — REPARAÊ
// Depende de config.js, utilitarios.js e dados.js (devem ser carregados antes).
// ==========================================================================

const estadoProfissional = {
  nome: "", telefone: "", email: "", senha: "",
  categoriaId: null,
  servicos: [],
  regiao: "",
  midias: [], // { id, arquivo, url, tipo: "imagem" | "video", nome }
};

document.addEventListener("DOMContentLoaded", function () {
  configurarEscolhaDeTipo();
  configurarVisibilidadeSenhaGenerica();
  configurarFormularioCliente();
  configurarEtapaProfissional1();
  configurarEtapaProfissional2();
  configurarEtapaProfissional3();
  configurarEtapaProfissional4();
  configurarEtapaProfissionalMidia();
  configurarEtapaProfissional5();
});

/* ---------------------------------------------------------------------- */
/* Escolha do tipo de conta                                               */
/* ---------------------------------------------------------------------- */

function mostrarTela(idTela) {
  ["telaEscolha", "telaCliente", "telaProfissional"].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.hidden = id !== idTela;
  });
}

function configurarEscolhaDeTipo() {
  const btnCliente = document.getElementById("escolherCliente");
  const btnProfissional = document.getElementById("escolherProfissional");

  if (btnCliente) btnCliente.addEventListener("click", function () { mostrarTela("telaCliente"); });
  if (btnProfissional) btnProfissional.addEventListener("click", function () {
    mostrarTela("telaProfissional");
    irParaEtapa(1);
  });

  document.querySelectorAll("[data-voltar-escolha]").forEach(function (botao) {
    botao.addEventListener("click", function () { mostrarTela("telaEscolha"); });
  });
}

function configurarVisibilidadeSenhaGenerica() {
  document.querySelectorAll("[data-alternar-senha]").forEach(function (botao) {
    botao.addEventListener("click", function () {
      const campo = document.getElementById(botao.dataset.alternarSenha);
      const visivel = campo.type === "text";
      campo.type = visivel ? "password" : "text";
      botao.textContent = visivel ? "visibility" : "visibility_off";
    });
  });
}

/* ---------------------------------------------------------------------- */
/* Cadastro de cliente                                                    */
/* ---------------------------------------------------------------------- */

function configurarFormularioCliente() {
  const formulario = document.getElementById("formCadastroCliente");
  if (!formulario) return;

  formulario.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    document.querySelectorAll("#telaCliente .erro-campo").forEach(function (el) { el.textContent = ""; });

    const nome = document.getElementById("clienteNome").value.trim();
    const email = document.getElementById("clienteEmail").value.trim();
    const telefone = document.getElementById("clienteTelefone").value.trim();
    const senha = document.getElementById("clienteSenha").value;
    const confirmarSenha = document.getElementById("clienteConfirmarSenha").value;
    const termos = document.getElementById("clienteTermos").checked;

    let valido = true;
    if (nome.length < 2) { definirErro("clienteNome", "Informe seu nome."); valido = false; }
    if (!validarEmail(email)) { definirErro("clienteEmail", "Informe um e-mail válido."); valido = false; }
    if (telefone.length < 8) { definirErro("clienteTelefone", "Informe um telefone válido."); valido = false; }
    if (senha.length < 8) { definirErro("clienteSenha", "A senha deve ter pelo menos 8 caracteres."); valido = false; }
    if (senha !== confirmarSenha) { definirErro("clienteConfirmarSenha", "As senhas não coincidem."); valido = false; }
    if (!termos) { definirErro("clienteTermos", "É preciso aceitar os termos para continuar."); valido = false; }
    if (!valido) return;

    const mensagem = document.getElementById("mensagemCadastroCliente");
    const botao = document.getElementById("botaoCriarContaCliente");
    botao.disabled = true;
    mostrarMensagem(mensagem, "Criando conta...", "sucesso");

    try {
      const resposta = await fetch(`${API_BASE_URL}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome, email: email, telefone: telefone, senha: senha, tipo: "cliente" }),
      });
      const dados = await resposta.json().catch(function () { return {}; });

      if (resposta.ok) {
        mostrarMensagem(mensagem, "Conta criada com sucesso! Redirecionando para o login...", "sucesso");
        formulario.reset();
        setTimeout(function () { window.location.href = "login.html"; }, 900);
      } else {
        mostrarMensagem(mensagem, dados.detail || "Não foi possível criar a conta.", "erro");
      }
    } catch (erro) {
      mostrarMensagem(mensagem, "Não foi possível conectar com o servidor.", "erro");
      console.error(erro);
    } finally {
      botao.disabled = false;
    }
  });
}

function definirErro(idCampo, texto) {
  const el = document.querySelector(`[data-erro-de="${idCampo}"]`);
  if (el) el.textContent = texto;
}

/* ---------------------------------------------------------------------- */
/* Fluxo em etapas do profissional                                        */
/* ---------------------------------------------------------------------- */

function irParaEtapa(numero) {
  document.querySelectorAll("[data-etapa-conteudo]").forEach(function (secao) {
    secao.hidden = Number(secao.dataset.etapaConteudo) !== numero;
  });
  document.querySelectorAll(".stepper-item").forEach(function (item) {
    const etapaItem = Number(item.dataset.etapa);
    item.classList.toggle("ativa", etapaItem === numero);
    item.classList.toggle("concluida", etapaItem < numero);
  });

  document.querySelectorAll("[data-voltar-etapa]").forEach(function (botao) {
    botao.onclick = function () { irParaEtapa(Number(botao.dataset.voltarEtapa)); };
  });
}

function configurarEtapaProfissional1() {
  const formulario = document.getElementById("formEtapa1");
  if (!formulario) return;

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();
    document.querySelectorAll("#telaProfissional [data-etapa-conteudo='1'] .erro-campo").forEach(function (el) { el.textContent = ""; });

    const nome = document.getElementById("profNome").value.trim();
    const telefone = document.getElementById("profTelefone").value.trim();
    const email = document.getElementById("profEmail").value.trim();
    const senha = document.getElementById("profSenha").value;

    let valido = true;
    if (nome.length < 2) { definirErro("profNome", "Informe seu nome."); valido = false; }
    if (telefone.length < 8) { definirErro("profTelefone", "Informe um telefone válido."); valido = false; }
    if (!validarEmail(email)) { definirErro("profEmail", "Informe um e-mail válido."); valido = false; }
    if (senha.length < 8) { definirErro("profSenha", "A senha deve ter pelo menos 8 caracteres."); valido = false; }
    if (!valido) return;

    Object.assign(estadoProfissional, { nome: nome, telefone: telefone, email: email, senha: senha });
    irParaEtapa(2);
  });
}

function configurarEtapaProfissional2() {
  const grade = document.getElementById("gradeCategorias");
  const botaoContinuar = document.getElementById("btnContinuarEtapa2");
  if (!grade) return;

  grade.innerHTML = CATEGORIAS.map(function (cat) {
    return `
      <button type="button" class="categoria-selecionavel" data-categoria="${cat.id}">
        <span class="icone">${cat.icone}</span>
        <span>${cat.nome}</span>
      </button>
    `;
  }).join("");

  grade.querySelectorAll(".categoria-selecionavel").forEach(function (botao) {
    botao.addEventListener("click", function () {
      grade.querySelectorAll(".categoria-selecionavel").forEach(function (b) { b.classList.remove("selecionada"); });
      botao.classList.add("selecionada");
      estadoProfissional.categoriaId = botao.dataset.categoria;
      estadoProfissional.servicos = []; // troca de categoria reinicia os serviços escolhidos
      botaoContinuar.disabled = false;
    });
  });

  botaoContinuar.addEventListener("click", function () {
    renderizarServicosDaCategoria();
    irParaEtapa(3);
  });
}

function renderizarServicosDaCategoria() {
  const categoria = CATEGORIAS.find(function (c) { return c.id === estadoProfissional.categoriaId; });
  const lista = document.getElementById("listaServicos");
  if (!categoria || !lista) return;

  lista.innerHTML = categoria.servicos.map(function (servico) {
    return `<button type="button" class="servico-checkbox" data-servico="${servico}">${servico}</button>`;
  }).join("");

  lista.querySelectorAll(".servico-checkbox").forEach(function (botao) {
    botao.addEventListener("click", function () {
      alternarServicoSelecionado(botao.dataset.servico);
      atualizarUiServicos();
    });
  });

  atualizarUiServicos();
}

function alternarServicoSelecionado(servico) {
  const indice = estadoProfissional.servicos.indexOf(servico);
  if (indice === -1) {
    estadoProfissional.servicos.push(servico);
  } else {
    estadoProfissional.servicos.splice(indice, 1);
  }
}

function atualizarUiServicos() {
  document.querySelectorAll("#listaServicos .servico-checkbox").forEach(function (botao) {
    botao.classList.toggle("selecionado", estadoProfissional.servicos.includes(botao.dataset.servico));
  });

  const resumo = document.getElementById("resumoServicos");
  resumo.innerHTML = estadoProfissional.servicos.map(function (servico) {
    return `<span class="chip-removivel">${servico} <button type="button" data-remover="${servico}">✕</button></span>`;
  }).join("") || '<span style="color: var(--texto-secundario); font-size: var(--texto-sm);">Nenhum serviço selecionado ainda.</span>';

  resumo.querySelectorAll("[data-remover]").forEach(function (botao) {
    botao.addEventListener("click", function () {
      alternarServicoSelecionado(botao.dataset.remover);
      atualizarUiServicos();
    });
  });
}

function configurarEtapaProfissional3() {
  const botaoContinuar = document.getElementById("btnContinuarEtapa3");
  if (!botaoContinuar) return;

  botaoContinuar.addEventListener("click", function () {
    const erro = document.getElementById("erroServicos");
    if (estadoProfissional.servicos.length === 0) {
      erro.textContent = "Selecione pelo menos um serviço.";
      return;
    }
    erro.textContent = "";
    irParaEtapa(4);
  });
}

function configurarEtapaProfissional4() {
  const formulario = document.getElementById("formEtapa4");
  if (!formulario) return;

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();
    const regiao = document.getElementById("profRegiao").value.trim();
    if (regiao.length < 3) {
      definirErro("profRegiao", "Informe pelo menos uma região.");
      return;
    }
    definirErro("profRegiao", "");
    estadoProfissional.regiao = regiao;
    irParaEtapa(5);
  });
}

/* ---------------------------------------------------------------------- */
/* Etapa 5 — Fotos e vídeos do trabalho                                   */
/* ---------------------------------------------------------------------- */

const TIPOS_MIDIA_ACEITOS = ["image/", "video/"];
const TAMANHO_MAXIMO_MIDIA = 100 * 1024 * 1024; // 100 MB, checagem só de UX
let proximoIdMidia = 1;

function configurarEtapaProfissionalMidia() {
  const zona = document.getElementById("zonaUpload");
  const input = document.getElementById("inputMidias");
  const botaoContinuar = document.getElementById("btnContinuarEtapa5");
  const botaoPular = document.getElementById("btnPularEtapa5");
  if (!zona || !input) return;

  input.addEventListener("change", function () {
    adicionarMidias(input.files);
    input.value = ""; // permite escolher o mesmo arquivo de novo depois de remover
  });

  // Também é possível ativar pelo teclado (a zona é um <label> focável)
  zona.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      input.click();
    }
  });

  ["dragenter", "dragover"].forEach(function (evt) {
    zona.addEventListener(evt, function (evento) {
      evento.preventDefault();
      zona.classList.add("arrastando");
    });
  });
  ["dragleave", "drop"].forEach(function (evt) {
    zona.addEventListener(evt, function (evento) {
      evento.preventDefault();
      zona.classList.remove("arrastando");
    });
  });
  zona.addEventListener("drop", function (evento) {
    if (evento.dataTransfer && evento.dataTransfer.files) {
      adicionarMidias(evento.dataTransfer.files);
    }
  });

  function irParaRevisao() {
    renderizarRevisao();
    irParaEtapa(6);
  }

  botaoContinuar.addEventListener("click", irParaRevisao);
  botaoPular.addEventListener("click", irParaRevisao);
}

function adicionarMidias(arquivos) {
  const erro = document.getElementById("erroMidias");
  erro.textContent = "";

  Array.from(arquivos).forEach(function (arquivo) {
    const tipoAceito = TIPOS_MIDIA_ACEITOS.some(function (prefixo) { return arquivo.type.startsWith(prefixo); });
    if (!tipoAceito) {
      erro.textContent = "Só é possível enviar fotos ou vídeos.";
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_MIDIA) {
      erro.textContent = `"${arquivo.name}" é maior que 100 MB.`;
      return;
    }

    estadoProfissional.midias.push({
      id: proximoIdMidia++,
      arquivo: arquivo,
      url: URL.createObjectURL(arquivo),
      tipo: arquivo.type.startsWith("video/") ? "video" : "imagem",
      nome: arquivo.name,
    });
  });

  renderizarGradeMidias();
}

function removerMidia(id) {
  const indice = estadoProfissional.midias.findIndex(function (m) { return m.id === id; });
  if (indice === -1) return;
  URL.revokeObjectURL(estadoProfissional.midias[indice].url);
  estadoProfissional.midias.splice(indice, 1);
  renderizarGradeMidias();
}

function renderizarGradeMidias() {
  const grade = document.getElementById("gradeMidias");
  if (!grade) return;

  grade.innerHTML = estadoProfissional.midias.map(function (midia) {
    const miolo = midia.tipo === "video"
      ? `<video src="${midia.url}" muted></video><span class="selo-midia"><span class="icone">videocam</span>Vídeo</span>`
      : `<img src="${midia.url}" alt="${midia.nome}">`;
    return `
      <div class="midia-item">
        ${miolo}
        <button type="button" class="remover-midia" data-remover-midia="${midia.id}" aria-label="Remover ${midia.nome}">
          <span class="icone">close</span>
        </button>
      </div>
    `;
  }).join("");

  grade.querySelectorAll("[data-remover-midia]").forEach(function (botao) {
    botao.addEventListener("click", function () {
      removerMidia(Number(botao.dataset.removerMidia));
    });
  });
}

/*
 * Envio ao backend — ainda não existe um endpoint de upload na API do
 * Reparaê (ex: POST /profissionais/:id/midias, multipart/form-data).
 * Por enquanto os arquivos ficam só no navegador, como pré-visualização.
 * Quando o endpoint existir, chame esta função logo após criar a conta
 * (ela já está encaixada em configurarEtapaProfissional5, abaixo) — ela
 * falha em silêncio se o endpoint ainda não responder.
 */
async function enviarMidiasParaServidor(idUsuario) {
  if (estadoProfissional.midias.length === 0) return;

  try {
    const formulario = new FormData();
    estadoProfissional.midias.forEach(function (midia) {
      formulario.append("arquivos", midia.arquivo, midia.nome);
    });

    await fetch(`${API_BASE_URL}/profissionais/${idUsuario}/midias`, {
      method: "POST",
      body: formulario,
    });
  } catch (erro) {
    // Endpoint ainda não existe no backend — sem efeito colateral no cadastro.
  }
}

function renderizarRevisao() {
  const categoria = CATEGORIAS.find(function (c) { return c.id === estadoProfissional.categoriaId; });
  const container = document.getElementById("listaRevisao");
  if (!container) return;

  const itens = [
    ["Nome", estadoProfissional.nome],
    ["Telefone", estadoProfissional.telefone],
    ["E-mail", estadoProfissional.email],
    ["Categoria", categoria ? categoria.nome : "—"],
    ["Serviços", estadoProfissional.servicos.join(", ")],
    ["Área de atendimento", estadoProfissional.regiao],
    ["Fotos e vídeos", estadoProfissional.midias.length > 0
      ? `${estadoProfissional.midias.length} arquivo${estadoProfissional.midias.length > 1 ? "s" : ""}`
      : "Nenhum arquivo adicionado"],
  ];

  container.innerHTML = itens.map(function (item) {
    return `<div class="revisao-item"><span class="rotulo">${item[0]}</span><strong>${item[1]}</strong></div>`;
  }).join("");
}

function configurarEtapaProfissional5() {
  const botao = document.getElementById("botaoConcluirCadastro");
  if (!botao) return;

  botao.addEventListener("click", async function () {
    const mensagem = document.getElementById("mensagemCadastroProfissional");
    botao.disabled = true;
    mostrarMensagem(mensagem, "Enviando cadastro...", "sucesso");

    try {
      // A API atual só cria a conta básica (nome, e-mail, senha, tipo).
      // Categoria, serviços e área de atendimento ainda não têm endpoint
      // próprio — ficam guardados aqui e prontos para serem enviados
      // assim que existir algo como POST /profissionais/:id/servicos.
      const resposta = await fetch(`${API_BASE_URL}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: estadoProfissional.nome,
          email: estadoProfissional.email,
          telefone: estadoProfissional.telefone,
          senha: estadoProfissional.senha,
          tipo: "profissional",
        }),
      });
      const dados = await resposta.json().catch(function () { return {}; });

      if (resposta.ok) {
        await enviarMidiasParaServidor(dados.id);
        irParaEtapa(7);
      } else {
        mostrarMensagem(mensagem, dados.detail || "Não foi possível concluir o cadastro.", "erro");
      }
    } catch (erro) {
      mostrarMensagem(mensagem, "Não foi possível conectar com o servidor.", "erro");
      console.error(erro);
    } finally {
      botao.disabled = false;
    }
  });
}
