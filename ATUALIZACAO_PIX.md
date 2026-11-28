# Atualização Pix e catálogo

A mensagem original de indisponibilidade é emitida quando MERCADOPAGO_ACCESS_TOKEN está ausente ou vazio no processo da API. Não foi possível acessar o painel privado do Render, validar as credenciais nem efetuar cobrança real. O código agora registra apenas a presença das configurações na inicialização e evita criar uma linha de cobrança quando falta o token. URL de webhook vazia usa o padrão. Respostas de erro do provedor não são registradas integralmente.

O catálogo local passou de 30 para 62 vínculos: 31 profissionais com dois serviços do próprio nicho. A migração única roda na inicialização também no PostgreSQL configurado pelo DATABASE_URL, sem copiar o SQLite ou substituir dados. Pode ser desativada com REPARAE_COMPLETAR_SERVICOS=0. Não cria serviços para especialidades sem categoria correspondente.

## Publicação
Copie os arquivos sobre o repositório existente, preservando .git. Faça commit/push dos arquivos de código, sem bancos ou segredos. No serviço reparae-api do Render confirme que o deploy corresponde ao commit novo e que as duas variáveis MERCADOPAGO_ACCESS_TOKEN e MERCADOPAGO_WEBHOOK_SECRET estão presentes. Logs esperados: Pix: token configurado; webhook configurado. Use credenciais de teste. Solicite um novo serviço no site publicado; cobranças antigas em estado criando e expiradas exigem reconciliação para evitar duplicidade. Não pague com dinheiro real. 

Testes: seis testes unitários do cliente Pix, compilação Python, integridade SQLite, chaves estrangeiras e repetição da migração. Teste HTTP completo bloqueado pela ausência de python-jose e indisponibilidade de instalação. Não foi executado Semgrep nem teste com provedor real. Não há implementação de reembolso.
