<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Fidelidade Guaro

Painel interno de clientes, pontos e recompensas do Guaro El Buen Venezolano. A aplicação usa HTML, Tailwind CSS e JavaScript com uma API Express protegida e persistência em Google Sheets.

## Configuração

1. Crie uma planilha com as abas `clientes`, `usuarios`, `transacoes`, `resgates`, `sms_logs`, `email_logs`, `auditoria`, `pontos_ledger`, `configuracao` e `cupons`.
2. Crie uma conta de serviço no Google Cloud, habilite a Google Sheets API e compartilhe a planilha com o e-mail dessa conta como editor.
3. Copie `.env.example` para `.env` e preencha as credenciais. Não publique o arquivo `.env`.
4. Execute `npm install` e depois `npm run dev`.
5. Execute `npm run setup:sheets` para criar/atualizar as abas e seus cabeçalhos.

Em desenvolvimento, o servidor aceita conexões somente de `127.0.0.1`. Em produção, use `NODE_ENV=production`; o host passa a `0.0.0.0` para funcionar em plataformas como Render.

As decisões de identidade e componentes estão documentadas em:

- `docs/brand-guidelines.md`
- `docs/design-system.md`

A primeira linha de cada aba deve conter os nomes dos campos. A API cria o cabeçalho automaticamente ao fazer a primeira inclusão em uma aba vazia.

## Envio dos códigos por e-mail

1. Crie uma conta no Resend e adicione um domínio ou subdomínio da empresa.
2. Adicione no DNS os registros SPF e DKIM informados pelo Resend e aguarde a verificação.
3. Crie uma API key com permissão apenas de envio.
4. No Render, adicione `RESEND_API_KEY`, `EMAIL_FROM`, `REDEMPTION_CODE_SECRET` e, opcionalmente, `EMAIL_REPLY_TO`. O segredo de resgate deve ter pelo menos 32 caracteres e não pode reutilizar a senha administrativa.
5. Use em `EMAIL_FROM` um endereço do domínio verificado, por exemplo `Guaro El Buen Venezolano <fidelidade@seudominio.com>`.

A chave da API existe somente no backend. Os códigos possuem seis dígitos, expiram em um minuto, permitem no máximo cinco tentativas e não são enviados ao navegador nem armazenados em texto aberto.

## Segurança

- Autenticação validada somente no servidor.
- Cookie de sessão `HttpOnly` e `SameSite=Strict`.
- Token CSRF obrigatório em todas as operações autenticadas de escrita.
- Sessões revalidadas contra a planilha e revogadas quando o usuário é alterado ou excluído.
- Bloqueio temporário após cinco tentativas inválidas.
- Limites de envio de códigos e de lançamentos por operador.
- Rotas de dados protegidas e credenciais da planilha mantidas fora do frontend.
- HTML dinâmico sanitizado antes de ser inserido na interface.
- Livro-razão `pontos_ledger` para rastrear créditos, débitos e divergências.
- Cabeçalhos CSP, anti-frame e anti-MIME sniffing.

Antes de publicar, execute:

```bash
npm run lint
npm run build
npm run test:security
npm audit
```

## Diagnóstico de inicialização no Render

Em produção, o servidor valida no boot:

- `ADMIN_USER`
- `ADMIN_PASSWORD` com pelo menos 12 caracteres
- `GOOGLE_SHEETS_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `REDEMPTION_CODE_SECRET` com pelo menos 32 caracteres e diferente da senha

`EMAIL_REPLY_TO` é opcional. Se alguma configuração estiver inválida, o log do Render exibirá `[BOOT_FATAL]` com o nome da variável ou a regra que falhou. O diagnóstico mostra somente presença e comprimento, nunca o conteúdo dos segredos.

O backend serializa as operações de pontos e mantém um livro-razão, o que protege uma instância única do serviço. O Google Sheets ainda não oferece transações distribuídas: mantenha apenas uma instância do Render. Para escalar horizontalmente ou operar em alto volume, migre o saldo para PostgreSQL e use a planilha somente como relatório.
