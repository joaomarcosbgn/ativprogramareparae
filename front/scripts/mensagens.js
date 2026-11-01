// ==========================================================================
// MENSAGENS.JS — REPARAÊ
// Chat entre cliente e profissional. A mesma lógica atende as duas
// interfaces; quem decide o perfil é <body data-tipo-usuario="...">.
// Depende de: config.js, utilitarios.js, dados.js, app.js (iniciaisDoNome).
//
// COMO FUNCIONA HOJE (leia antes de supor que o chat "funciona"):
//  - O backend do Reparaê ainda NÃO tem endpoints de chat. A página tenta
//    o servidor primeiro (contrato em INTEGRACAO-BACKEND.md). Se ele não
//    responder como esperado, entra em MODO DEMONSTRAÇÃO: conversas
//    fictícias (dados.js) e mensagens enviadas ficam só neste navegador.
//    Um aviso fixo na tela deixa isso explícito.
//  - Assim que os endpoints existirem, o modo "api" liga sozinho, sem
//    mudar o frontend.
// ==========================================================================

const INTERVALO_ATUALIZACAO_CHAT_MS = 10000;

const chat = {
  tipo: "cliente",
  modo: "carregando", // "carregando" | "api" | "demo"
  conversas: [],
  ativaId: null,
  temporizador: null,
};

document.addEventListener("DOMContentLoaded", function () {
  if (!document.getElementById("chat")) return;
  chat.tipo = document.body.dataset.tipoUsuario === "profissional" ? "profissional" : "cliente";
  iniciarChat();
});

async function iniciarChat() {
  const resultado = await chamarApi("/conversas");

  if (resultado.ok && Array.isArray(resultado.dados)) {
    chat.modo = "api";
    chat.conversas = resultado.dados.map(function (c) {
      return Object.assign({ nao_lidas: 0, mensagens: null }, c);
    });
  } else {
    chat.modo = "demo";
    const mock = chat.tipo === "profissional" ? CONVERSAS_PROFISSIONAL_MOCK : CONVERSAS_CLIENTE_MOCK;
    chat.conversas = JSON.parse(JSON.stringify(mock)).map(function (c) {
      c.ultima_mensagem = c.mensagens[c.mensagens.length - 1];
      return c;
    });
    const aviso = document.getElementById("avisoModoChat");
    aviso.hidden = false;
    aviso.innerHTML = '<span class="icone">science</span><span><strong>Modo demonstração.</strong><span class="aviso-detalhe"> O servidor ainda não oferece o chat (ou não respondeu). As conversas abaixo são fictícias e as mensagens que você enviar aqui <strong>não chegam a ninguém</strong>.</span><span class="aviso-curto"> Mensagens não são enviadas.</span></span>';
  }

  renderizarLista();

  const filtro = document.getElementById("filtroConversas");
  filtro.addEventListener("input", renderizarLista);
}

/* ---------------------------------------------------------------------- */
/* Lista de conversas                                                     */
/* ---------------------------------------------------------------------- */

function htmlAvatarChat(participante, classeExtra) {
  if (participante.foto) {
    const url = encodeURI(participante.foto).replace(/'/g, "%27");
    return `<span class="avatar avatar-chat com-foto ${classeExtra || ""}" style="background-image:url('${escaparHtml(url)}')" role="img" aria-label="${escaparHtml(participante.nome)}"></span>`;
  }
  return `<span class="avatar avatar-chat ${classeExtra || ""}">${escaparHtml(iniciaisDoNome(participante.nome))}</span>`;
}

function renderizarLista() {
  const lista = document.getElementById("listaConversas");
  const termo = document.getElementById("filtroConversas").value.trim().toLowerCase();

  const visiveis = chat.conversas.filter(function (c) {
    return c.participante.nome.toLowerCase().includes(termo);
  });

  if (visiveis.length === 0) {
    lista.innerHTML = `<div class="estado-vazio"><span class="icone">forum</span><p>${termo ? "Nenhuma conversa encontrada." : "Você ainda não tem conversas."}</p></div>`;
    return;
  }

  lista.innerHTML = visiveis.map(function (c) {
    const ultima = c.ultima_mensagem;
    const previa = ultima ? (ultima.minha ? "Você: " : "") + ultima.texto : "Sem mensagens";
    const quando = ultima ? formatarDataRelativa(ultima.enviada_em) === "Hoje" ? formatarHora(ultima.enviada_em) : formatarDataRelativa(ultima.enviada_em) : "";
    const ativa = c.id === chat.ativaId ? " ativa" : "";
    return `
      <button type="button" class="conversa-item${ativa}" data-conversa="${escaparHtml(c.id)}">
        ${htmlAvatarChat(c.participante)}
        <span class="conversa-corpo">
          <span class="conversa-linha">
            <strong>${escaparHtml(c.participante.nome)}</strong>
            <span class="conversa-hora">${escaparHtml(quando)}</span>
          </span>
          <span class="conversa-linha">
            <span class="conversa-previa">${escaparHtml(previa)}</span>
            ${c.nao_lidas > 0 ? `<span class="badge-nao-lida" aria-label="${c.nao_lidas} não lidas">${c.nao_lidas}</span>` : ""}
          </span>
        </span>
      </button>
    `;
  }).join("");

  lista.querySelectorAll("[data-conversa]").forEach(function (botao) {
    botao.addEventListener("click", function () { abrirConversa(botao.dataset.conversa); });
  });
}

/* ---------------------------------------------------------------------- */
/* Conversa aberta                                                        */
/* ---------------------------------------------------------------------- */

function conversaPorId(id) {
  return chat.conversas.find(function (c) { return String(c.id) === String(id); });
}

async function abrirConversa(id) {
  const conversa = conversaPorId(id);
  if (!conversa) return;

  chat.ativaId = conversa.id;
  clearInterval(chat.temporizador);

  if (chat.modo === "api") {
    const resultado = await chamarApi(`/conversas/${encodeURIComponent(conversa.id)}/mensagens`);
    conversa.mensagens = resultado.ok && Array.isArray(resultado.dados) ? resultado.dados : (conversa.mensagens || []);
    // Marca como lida (melhor esforço; endpoint descrito em INTEGRACAO-BACKEND.md)
    chamarApi(`/conversas/${encodeURIComponent(conversa.id)}/lida`, { method: "POST" });
    chat.temporizador = setInterval(atualizarMensagensAbertas, INTERVALO_ATUALIZACAO_CHAT_MS);
  }

  conversa.nao_lidas = 0;
  renderizarLista();
  renderizarConversa(conversa);

  document.getElementById("chat").dataset.visao = "conversa";
  document.body.classList.add("chat-aberto");
}

function fecharConversaNoMobile() {
  clearInterval(chat.temporizador);
  chat.ativaId = null;
  document.getElementById("chat").dataset.visao = "lista";
  document.body.classList.remove("chat-aberto");
  document.getElementById("chatConversa").innerHTML = htmlConversaVazia();
  renderizarLista();
}

function htmlConversaVazia() {
  return '<div class="chat-vazio"><span class="icone">chat</span><p>Selecione uma conversa para começar.</p></div>';
}

function renderizarConversa(conversa) {
  const p = conversa.participante;
  const papel = p.papel === "profissional" ? "Profissional" : "Cliente";
  const subtitulo = p.servico ? `${papel} · ${p.servico}` : papel;

  document.getElementById("chatConversa").innerHTML = `
    <header class="chat-cabecalho">
      <button type="button" class="chat-voltar" id="chatVoltar" aria-label="Voltar para as conversas"><span class="icone">arrow_back</span></button>
      ${htmlAvatarChat(p)}
      <div class="chat-cabecalho-texto">
        <strong>${escaparHtml(p.nome)}</strong>
        <span>${escaparHtml(subtitulo)}</span>
      </div>
    </header>
    <div class="chat-mensagens" id="chatMensagens" aria-live="polite"></div>
    <form class="chat-compositor" id="chatFormulario">
      <label for="chatTexto" class="rotulo-oculto">Mensagem</label>
      <textarea id="chatTexto" rows="1" maxlength="1000" placeholder="Digite uma mensagem"></textarea>
      <button type="submit" class="chat-enviar" id="chatEnviar" aria-label="Enviar mensagem" disabled><span class="icone">send</span></button>
    </form>
    <p class="chat-erro" id="chatErro" role="alert"></p>
  `;

  renderizarMensagens(conversa);

  const texto = document.getElementById("chatTexto");
  const botao = document.getElementById("chatEnviar");

  document.getElementById("chatVoltar").addEventListener("click", fecharConversaNoMobile);

  texto.addEventListener("input", function () {
    botao.disabled = texto.value.trim() === "";
    texto.style.height = "auto";
    texto.style.height = Math.min(texto.scrollHeight, 120) + "px";
  });

  // Enter envia; Shift+Enter quebra linha
  texto.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter" && !evento.shiftKey) {
      evento.preventDefault();
      if (!botao.disabled) document.getElementById("chatFormulario").requestSubmit();
    }
  });

  document.getElementById("chatFormulario").addEventListener("submit", function (evento) {
    evento.preventDefault();
    enviarMensagem(conversa);
  });
}

function renderizarMensagens(conversa) {
  const area = document.getElementById("chatMensagens");
  if (!area) return;

  const mensagens = conversa.mensagens || [];
  if (mensagens.length === 0) {
    area.innerHTML = '<p class="chat-sem-mensagens">Nenhuma mensagem ainda. Diga olá!</p>';
    return;
  }

  let ultimaData = "";
  area.innerHTML = mensagens.map(function (m) {
    const dia = new Date(m.enviada_em).toDateString();
    let separador = "";
    if (dia !== ultimaData) {
      ultimaData = dia;
      separador = `<div class="chat-data"><span>${escaparHtml(formatarDataRelativa(m.enviada_em))}</span></div>`;
    }
    const classe = m.minha ? "enviada" : "recebida";
    const rotuloDemo = m.demo ? " · simulada" : "";
    return `${separador}
      <div class="balao ${classe}">
        <p>${escaparHtml(m.texto)}</p>
        <span class="balao-meta">${escaparHtml(formatarHora(m.enviada_em))}${rotuloDemo}</span>
      </div>`;
  }).join("");

  area.scrollTop = area.scrollHeight;
}

/* ---------------------------------------------------------------------- */
/* Envio                                                                  */
/* ---------------------------------------------------------------------- */

async function enviarMensagem(conversa) {
  const campo = document.getElementById("chatTexto");
  const botao = document.getElementById("chatEnviar");
  const erro = document.getElementById("chatErro");
  const texto = campo.value.trim();
  if (!texto) return;

  erro.textContent = "";
  botao.disabled = true;
  let nova;

  if (chat.modo === "api") {
    const resultado = await chamarApi(`/conversas/${encodeURIComponent(conversa.id)}/mensagens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: texto }),
    });
    if (!resultado.ok) {
      // Não finge que enviou: mantém o texto para tentar de novo.
      erro.textContent = "Não foi possível enviar a mensagem. Tente novamente.";
      botao.disabled = false;
      return;
    }
    nova = Object.assign({ id: Date.now(), texto: texto, enviada_em: new Date().toISOString() }, resultado.dados || {}, { minha: true });
  } else {
    nova = { id: Date.now(), texto: texto, enviada_em: new Date().toISOString(), minha: true, demo: true };
  }

  conversa.mensagens = (conversa.mensagens || []).concat([nova]);
  conversa.ultima_mensagem = nova;

  campo.value = "";
  campo.style.height = "auto";
  renderizarMensagens(conversa);
  renderizarLista();
  campo.focus();
}

async function atualizarMensagensAbertas() {
  const conversa = conversaPorId(chat.ativaId);
  if (!conversa || chat.modo !== "api") return;
  const resultado = await chamarApi(`/conversas/${encodeURIComponent(conversa.id)}/mensagens`);
  if (resultado.ok && Array.isArray(resultado.dados) && resultado.dados.length !== (conversa.mensagens || []).length) {
    conversa.mensagens = resultado.dados;
    conversa.ultima_mensagem = resultado.dados[resultado.dados.length - 1];
    renderizarMensagens(conversa);
    renderizarLista();
  }
}
