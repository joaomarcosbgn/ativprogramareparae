// ==========================================================================
// DADOS — REPARAÊ
// Taxonomia de categorias/serviços (fonte única, usada no cadastro de
// profissional, na busca e na home) e dados de DEMONSTRAÇÃO (mock).
//
// IMPORTANTE: tudo neste arquivo marcado como "mock" é dado fictício de
// protótipo acadêmico, não dado real de produção. Cada bloco indica o
// endpoint que deveria substituí-lo quando a API correspondente existir.
// ==========================================================================

/* ---------------------------------------------------------------------- */
/* Taxonomia de categorias e serviços                                     */
/* ---------------------------------------------------------------------- */

const CATEGORIAS = [
  { id: "casa", nome: "Casa e manutenção", icone: "plumbing",
    servicos: ["Encanamento", "Elétrica residencial", "Pintura", "Montagem de móveis", "Limpeza residencial", "Jardinagem"] },
  { id: "automotivo", nome: "Automotivo", icone: "directions_car",
    servicos: ["Mecânica geral", "Elétrica automotiva", "Funilaria", "Pintura automotiva", "Estética automotiva"] },
  { id: "tecnologia", nome: "Tecnologia", icone: "computer",
    servicos: ["Manutenção de computador", "Instalação de software", "Suporte técnico", "Desenvolvimento de sites", "Redes e Wi-Fi"] },
  { id: "educacao", nome: "Educação", icone: "school",
    servicos: ["Aulas particulares", "Reforço escolar", "Idiomas", "Aulas de música", "Preparação para provas"] },
  { id: "foto", nome: "Fotografia e vídeo", icone: "photo_camera",
    servicos: ["Fotografia de eventos", "Fotografia de produtos", "Filmagem", "Edição de vídeo", "Ensaios fotográficos"] },
  { id: "design", nome: "Design e criação", icone: "palette",
    servicos: ["Design gráfico", "Identidade visual", "Design de interiores", "Ilustração", "Edição de imagem"] },
  { id: "beleza", nome: "Beleza e estética", icone: "content_cut",
    servicos: ["Cabeleireiro(a)", "Manicure e pedicure", "Maquiagem", "Barbeiro", "Estética facial"] },
  { id: "eventos", nome: "Eventos", icone: "celebration",
    servicos: ["Decoração de festas", "DJ", "Buffet", "Cerimonial", "Aluguel de equipamentos"] },
  { id: "pets", nome: "Pets", icone: "pets",
    servicos: ["Banho e tosa", "Passeador de cães", "Adestramento", "Pet sitter", "Veterinário a domicílio"] },
  { id: "transporte", nome: "Transporte e mudanças", icone: "local_shipping",
    servicos: ["Mudanças residenciais", "Frete e carreto", "Motorista particular", "Transporte de cargas"] },
  { id: "esporte", nome: "Esporte e bem-estar", icone: "fitness_center",
    servicos: ["Personal trainer", "Aulas de yoga", "Massagem terapêutica", "Nutrição esportiva"] },
  { id: "empresas", nome: "Serviços profissionais", icone: "business_center",
    servicos: ["Contabilidade", "Assessoria jurídica", "Consultoria de negócios", "Marketing digital", "Tradução"] },
];

/* ---------------------------------------------------------------------- */
/* MOCK — Profissionais                                                   */
/* Substituir por: GET /profissionais (ou /profissionais/:id)             */
/* ---------------------------------------------------------------------- */

const PROFISSIONAIS_MOCK = [
  { id: 1, nome: "Carlos Mendes", categoria: "casa", servico: "Encanamento", regiao: "Zona Sul, Fortaleza",
    nota: 4.8, numAvaliacoes: 132, experiencia: "9 anos de experiência",
    descricaoCurta: "Encanador residencial e comercial, atendimento rápido.",
    descricao: "Atendo reparos de vazamento, instalação hidráulica e manutenção preventiva para residências e pequenos comércios. Orçamento sem compromisso.",
    biografia: "Sou encanador há 9 anos e atendo casas e pequenos comércios na Zona Sul. Trabalho com reparo de vazamentos, instalações hidráulicas e manutenção preventiva. Gosto de explicar o problema ao cliente antes de começar e de entregar o serviço limpo e com garantia.",
    portfolio: true },
  { id: 2, nome: "Bia Fotografias", categoria: "foto", servico: "Fotografia de eventos", regiao: "Centro, Fortaleza",
    nota: 5.0, numAvaliacoes: 87, experiencia: "6 anos de experiência",
    descricaoCurta: "Fotografia de casamentos, aniversários e ensaios.",
    descricao: "Cobertura fotográfica completa de eventos, com entrega digital editada. Pacotes flexíveis conforme a duração do evento.",
    biografia: "Fotografo eventos há 6 anos, principalmente aniversários, casamentos e ensaios. Meu foco é registrar momentos espontâneos, com entrega digital editada em até 10 dias. Atendo Fortaleza e região metropolitana.",
    portfolio: true },
  { id: 3, nome: "Prof. Renato Lima", categoria: "educacao", servico: "Aulas particulares", regiao: "Aldeota, Fortaleza",
    nota: 4.9, numAvaliacoes: 54, experiencia: "12 anos de experiência",
    descricaoCurta: "Aulas de matemática e física para ensino médio.",
    descricao: "Aulas particulares presenciais ou online, com material próprio e foco em preparação para vestibular e ENEM.",
    biografia: "Sou professor de matemática e física há 12 anos, com experiência em preparação para ENEM e vestibulares. Dou aulas presenciais ou online, com material próprio e acompanhamento do progresso do aluno.",
    portfolio: true },
  { id: 4, nome: "Ana Designer", categoria: "design", servico: "Identidade visual", regiao: "Meireles, Fortaleza",
    nota: 4.7, numAvaliacoes: 41, experiencia: "5 anos de experiência",
    descricaoCurta: "Identidade visual completa para pequenos negócios.",
    descricao: "Desenvolvo logotipo, paleta de cores e manual de marca para empreendedores que estão começando ou repaginando o negócio.",
    biografia: "Designer com 5 anos de experiência em identidade visual para pequenos negócios. Crio logotipo, paleta de cores e manual de marca, sempre alinhando o resultado ao público e ao orçamento do cliente.",
    portfolio: true },
  { id: 5, nome: "Oficina do Zé", categoria: "automotivo", servico: "Mecânica geral", regiao: "Messejana, Fortaleza",
    nota: 4.6, numAvaliacoes: 98, experiencia: "15 anos de experiência",
    descricaoCurta: "Revisão, freios e suspensão para todos os modelos.",
    descricao: "Oficina especializada em manutenção preventiva e corretiva, com diagnóstico eletrônico e peças com garantia.",
    biografia: "Mecânico há 15 anos, à frente de uma oficina familiar em Messejana. Faço revisão, freios, suspensão e diagnóstico eletrônico, com peças de garantia e orçamento explicado antes da execução.",
    portfolio: true },
  { id: 6, nome: "TechSuporte Fortaleza", categoria: "tecnologia", servico: "Suporte técnico", regiao: "Atendimento em toda Fortaleza",
    nota: 4.5, numAvaliacoes: 63, experiencia: "7 anos de experiência",
    descricaoCurta: "Formatação, remoção de vírus e manutenção de PCs.",
    descricao: "Suporte técnico a domicílio para computadores e notebooks, com atendimento no mesmo dia na maioria dos casos.",
    biografia: "Técnico de informática há 7 anos. Faço formatação, remoção de vírus, upgrade de peças e manutenção de notebooks e desktops, com atendimento a domicílio em toda Fortaleza.",
    portfolio: true },
];

/* ---------------------------------------------------------------------- */
/* MOCK — Solicitações do cliente                                         */
/* Substituir por: GET /clientes/:id/solicitacoes                         */
/* ---------------------------------------------------------------------- */

const SOLICITACOES_CLIENTE_MOCK = [
  { id: 101, servico: "Encanamento", profissional: "Carlos Mendes", status: "andamento", data: "18/09/2026",
    resumo: "Vazamento na pia da cozinha, aguardando confirmação de horário." },
  { id: 102, servico: "Fotografia de eventos", profissional: "Bia Fotografias", status: "concluida", data: "02/09/2026",
    resumo: "Cobertura de aniversário de 15 anos — fotos entregues." },
  { id: 103, servico: "Suporte técnico", profissional: "TechSuporte Fortaleza", status: "cancelada", data: "28/08/2026",
    resumo: "Cliente remarcou e optou por outro profissional." },
];

/* ---------------------------------------------------------------------- */
/* MOCK — Solicitações recebidas pelo profissional                        */
/* Substituir por: GET /profissionais/:id/solicitacoes                    */
/* ---------------------------------------------------------------------- */

const SOLICITACOES_PROFISSIONAL_MOCK = [
  { id: 201, servico: "Encanamento", cliente: "Marina Costa", status: "nova", data: "22/09/2026",
    resumo: "Vazamento embaixo da pia, precisa de visita ainda essa semana." },
  { id: 202, servico: "Elétrica residencial", cliente: "João Pedro", status: "aceita", data: "20/09/2026",
    resumo: "Troca de disjuntor e revisão do quadro de força." },
  { id: 203, servico: "Encanamento", cliente: "Fernanda Alves", status: "andamento", data: "17/09/2026",
    resumo: "Instalação de chuveiro elétrico novo." },
  { id: 204, servico: "Encanamento", cliente: "Ricardo Sousa", status: "historico", data: "05/09/2026",
    resumo: "Reparo de torneira — serviço concluído." },
];

/* ---------------------------------------------------------------------- */
/* MOCK — Serviços que o profissional (logado, exemplo) já oferece        */
/* Substituir por: GET /profissionais/:id/servicos                        */
/* ---------------------------------------------------------------------- */

const SERVICOS_PROFISSIONAL_MOCK = ["Encanamento", "Limpeza residencial"];

/* ---------------------------------------------------------------------- */
/* MOCK — Avaliações usadas na home do cliente e no perfil profissional   */
/* Substituir por: GET /profissionais/:id/avaliacoes                      */
/* ---------------------------------------------------------------------- */

const AVALIACOES_MOCK = [
  { nome: "Marina C.", papel: "Cliente", servico: "Elétrica residencial", nota: 5,
    depoimento: "Encontrei um eletricista disponível no mesmo dia. Resolveu tudo rapidinho." },
  { nome: "Diego A.", papel: "Profissional · Fotografia", servico: "Fotografia de eventos", nota: 5,
    depoimento: "Consigo organizar minha agenda de clientes sem depender só de indicação." },
  { nome: "Renata S.", papel: "Cliente", servico: "Aula particular", nota: 4,
    depoimento: "Busquei um professor de inglês para o meu filho e em minutos já tinha opções." },
];

/* ---------------------------------------------------------------------- */
/* MOCK — Conversas (chat). Formato idêntico ao contrato esperado da API, */
/* com as mensagens embutidas só para o modo demonstração.                */
/* Substituir por: GET /conversas e GET /conversas/:id/mensagens          */
/* ---------------------------------------------------------------------- */

const CONVERSAS_CLIENTE_MOCK = [
  { id: 1, participante: { id: 1, nome: "Carlos Mendes", foto: null, papel: "profissional", servico: "Encanamento" }, nao_lidas: 1,
    mensagens: [
      { id: 1, minha: true,  enviada_em: "2026-09-17T18:02:00", texto: "Olá, Carlos! Tenho um vazamento na pia da cozinha. Consegue vir essa semana?" },
      { id: 2, minha: false, enviada_em: "2026-09-17T18:20:00", texto: "Oi, Marina! Consigo sim. Pode me mandar uma foto do local?" },
      { id: 3, minha: true,  enviada_em: "2026-09-18T09:10:00", texto: "Claro, mando agora. Quinta de manhã seria bom?" },
      { id: 4, minha: false, enviada_em: "2026-09-18T09:32:00", texto: "Quinta às 9h está ótimo. Confirmo na véspera." },
    ] },
  { id: 2, participante: { id: 2, nome: "Bia Fotografias", foto: null, papel: "profissional", servico: "Fotografia de eventos" }, nao_lidas: 0,
    mensagens: [
      { id: 1, minha: false, enviada_em: "2026-09-02T20:15:00", texto: "Oi! As fotos do aniversário já estão na galeria. Qualquer ajuste é só falar." },
      { id: 2, minha: true,  enviada_em: "2026-09-02T21:00:00", texto: "Ficaram lindas, obrigada!" },
    ] },
  { id: 3, participante: { id: 6, nome: "TechSuporte Fortaleza", foto: null, papel: "profissional", servico: "Suporte técnico" }, nao_lidas: 0,
    mensagens: [
      { id: 1, minha: true,  enviada_em: "2026-08-28T10:00:00", texto: "Preciso remarcar a visita, tudo bem?" },
    ] },
];

const CONVERSAS_PROFISSIONAL_MOCK = [
  { id: 11, participante: { id: 21, nome: "Marina Costa", foto: null, papel: "cliente", servico: "Encanamento" }, nao_lidas: 2,
    mensagens: [
      { id: 1, minha: false, enviada_em: "2026-09-22T08:40:00", texto: "Bom dia! O vazamento aumentou, dá para vir ainda hoje?" },
      { id: 2, minha: false, enviada_em: "2026-09-22T08:41:00", texto: "Posso te enviar fotos se ajudar." },
    ] },
  { id: 12, participante: { id: 22, nome: "João Pedro", foto: null, papel: "cliente", servico: "Elétrica residencial" }, nao_lidas: 0,
    mensagens: [
      { id: 1, minha: true,  enviada_em: "2026-09-20T15:05:00", texto: "Aceitei seu pedido, João. Posso passar amanhã às 14h?" },
      { id: 2, minha: false, enviada_em: "2026-09-20T15:30:00", texto: "Perfeito, estarei em casa." },
    ] },
  { id: 13, participante: { id: 23, nome: "Fernanda Alves", foto: null, papel: "cliente", servico: "Encanamento" }, nao_lidas: 0,
    mensagens: [
      { id: 1, minha: false, enviada_em: "2026-09-17T11:00:00", texto: "O chuveiro novo já chegou, pode instalar quando quiser." },
      { id: 2, minha: true,  enviada_em: "2026-09-17T11:12:00", texto: "Combinado! Passo aí hoje à tarde." },
    ] },
];

/* ---------------------------------------------------------------------- */
/* MOCK — Pagamentos. Mesmo formato do contrato esperado da API.          */
/* status: "pendente" | "pago" | "cancelado"                              */
/* Substituir por: GET /pagamentos (perfil definido pela sessão)          */
/* ---------------------------------------------------------------------- */

const PAGAMENTOS_CLIENTE_MOCK = [
  { id: 1, servico: "Encanamento", contraparte: { nome: "Carlos Mendes" }, valor: 180.00, status: "pendente", data: "2026-09-18T10:00:00" },
  { id: 2, servico: "Fotografia de eventos", contraparte: { nome: "Bia Fotografias" }, valor: 650.00, status: "pago", data: "2026-09-05T16:30:00" },
  { id: 3, servico: "Suporte técnico", contraparte: { nome: "TechSuporte Fortaleza" }, valor: 90.00, status: "cancelado", data: "2026-08-28T09:00:00" },
  { id: 4, servico: "Mecânica geral", contraparte: { nome: "Oficina do Zé" }, valor: 420.00, status: "pago", data: "2026-08-12T14:20:00" },
];

const PAGAMENTOS_PROFISSIONAL_MOCK = [
  { id: 11, servico: "Encanamento", contraparte: { nome: "Fernanda Alves" }, valor: 250.00, status: "pendente", data: "2026-09-17T17:00:00" },
  { id: 12, servico: "Elétrica residencial", contraparte: { nome: "João Pedro" }, valor: 300.00, status: "pendente", data: "2026-09-20T15:00:00" },
  { id: 13, servico: "Encanamento", contraparte: { nome: "Ricardo Sousa" }, valor: 120.00, status: "pago", data: "2026-09-06T11:15:00" },
  { id: 14, servico: "Encanamento", contraparte: { nome: "Luciana Prado" }, valor: 340.00, status: "pago", data: "2026-08-21T10:40:00" },
  { id: 15, servico: "Limpeza residencial", contraparte: { nome: "Paulo Henrique" }, valor: 160.00, status: "cancelado", data: "2026-08-10T09:00:00" },
];

/* Usuário logado de exemplo (protótipo) — substituir por sessão real */
const USUARIO_LOGADO_MOCK = { nome: "Marina", tipo: "cliente" };
