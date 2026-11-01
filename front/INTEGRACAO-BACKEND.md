# Integração com o backend — Chat, Pagamentos e Biografia

Estado em que o frontend foi entregue. Hoje a API só tem `POST /usuarios` e
`POST /login`. Tudo abaixo **ainda não existe no backend**; o frontend já
está preparado e, enquanto os endpoints não existirem, as telas de Chat e
Pagamentos entram em **modo demonstração** (aviso laranja fixo na tela,
dados fictícios, nada é enviado a ninguém).

Todas as chamadas passam por `chamarApi()` em `scripts/utilitarios.js`
(`credentials: "include"`, nunca lança erro). Quando o backend responder
conforme os contratos abaixo, o modo "api" liga sozinho.

## 0. Autenticação (pré-requisito de tudo)
O `/login` atual não devolve token nem cria sessão, então o backend não tem
como saber **quem** está pedindo `/conversas` ou `/pagamentos`. É preciso
definir: cookie de sessão (CORS com `Access-Control-Allow-Credentials: true`
e origem explícita, não `*`) **ou** JWT no header `Authorization` (ajustar
só `chamarApi`). Cada usuário só pode ver as próprias conversas/pagamentos.

## 1. Biografia ("Sobre mim")
- Banco: `profissionais.biografia` (texto, máx. 500 caracteres).
- `PATCH /profissionais/{id}` body `{ "biografia": "..." }` (chamado após
  `POST /usuarios`, usando o `id` devolvido; **o POST /usuarios continua
  com o mesmo payload de antes**).
- `GET /profissionais/{id}` deve devolver `biografia` (o perfil público já
  exibe a seção "Sobre mim" quando o campo existe).
- Edição: `PUT/PATCH /profissionais/{id}` com `biografia` (tela de editar perfil).
- Validar tamanho no servidor e tratar o texto como não confiável.

## 2. Chat
Tabelas sugeridas:
- `conversas(id, cliente_id, profissional_id, solicitacao_id NULL, criada_em)` — único por (cliente, profissional).
- `mensagens(id, conversa_id, remetente_id, texto, enviada_em, lida_em NULL)`.

Endpoints (datas em ISO 8601; mensagens em ordem crescente):
- `GET /conversas` → `[{ id, participante:{id,nome,foto|null,papel:"cliente"|"profissional",servico?}, ultima_mensagem:{texto,enviada_em,minha}, nao_lidas }]`
- `GET /conversas/{id}/mensagens` → `[{ id, texto, enviada_em, minha:boolean }]` (`minha` calculado pelo servidor)
- `POST /conversas/{id}/mensagens` body `{ texto }` (≤ 1000 chars) → `{ id, texto, enviada_em }`
- `POST /conversas/{id}/lida` → 204
- Ainda a criar: `POST /conversas` (iniciar conversa a partir do perfil/solicitação — hoje **não existe botão para iniciar conversa nova** no frontend).
- Tempo real: o frontend usa polling de 10 s na conversa aberta; WebSocket/SSE seria o ideal.

## 3. Pagamentos
Tabela sugerida: `pagamentos(id, solicitacao_id, cliente_id, profissional_id, valor NUMERIC(10,2), status, criado_em, pago_em NULL, metodo, id_gateway)`.
- `GET /pagamentos` → `[{ id, servico, contraparte:{nome}, valor, status:"pendente"|"pago"|"cancelado", data }]`.
  O servidor decide pelo usuário logado se é cliente ou profissional; `contraparte` é a outra pessoa.
- A tela é **somente consulta**. Não há botão "Pagar" porque não existe gateway
  (Pix/cartão: Mercado Pago, Stripe etc.). Cobrança, repasse ao profissional,
  estorno e webhooks são trabalho de backend.

## 4. Pendências já existentes (fora deste pedido)
- `categoria`, `serviços`, `área` e fotos/vídeos do cadastro de profissional também não são gravados (`POST /profissionais/{id}/midias` não existe).
- Botões "Solicitar" mostram "Solicitado ✓" sem chamar API (dados mock).
