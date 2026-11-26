# Sprint 5 — PWA e Semgrep

Copie os arquivos mantendo as pastas. Não substitua o banco, .git ou credenciais. Teste localmente com Live Server e API, depois publique na Vercel. Em Chrome/Edge abra DevTools > Application > Manifest e Service Workers. Instale pelo menu do navegador; teste em celular e desktop. No modo Offline, recarregue e confira a página de aviso. Nenhum dado de conta ou resposta da API é armazenado pelo Service Worker. A instalação real e responsividade ainda precisam ser verificadas.

## Semgrep — evidências reais pendentes
No Windows, use WSL ou Docker (se disponível). No WSL, dentro do projeto, instale semgrep em ambiente virtual:

```bash
python3 -m venv ~/.venvs/reparae-semgrep
source ~/.venvs/reparae-semgrep/bin/activate
pip install semgrep
mkdir -p evidencias
semgrep scan --config p/owasp-top-ten --config p/security-audit --config p/secrets --metrics=off --json --output evidencias/semgrep-inicial.json API front
```
Registre versão (`semgrep --version`), data, commit e print do resumo. Revise cada achado, não publique relatórios com segredos. Após corrigir achados reais, repita o comando trocando o nome por `semgrep-final.json`. Para evidência anterior às alterações deste pacote, execute a primeira análise sobre uma cópia do ZIP original. Não confunda revisão manual com resultado do Semgrep.

## Revisão manual
- Cadastro: normalização de mensagens de validação em lista; causa específica do HTTP 422 ainda não reproduzida.
- Busca: código já consulta nome, especialidade e serviço; região é opcional. Conferir catálogo migrado e termo eletricista em produção.
- Ordenação: nome com lower() para ignorar diferenças de maiúsculas; ordem de acentos depende do banco.
- Sessão: JWT de 60 minutos preservado; tratamento de 401 no helper autenticado de app.js, sem ampliar validade nem desativar segurança. Outros fluxos ainda precisam de revisão.
- Semgrep indisponível no ambiente de preparação; nenhuma evidência de execução foi fabricada.
