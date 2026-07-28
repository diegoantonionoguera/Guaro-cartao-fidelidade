<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# El Buen Venezolano Guaro

Aplicação em HTML, CSS e JavaScript com uma API Express protegida e persistência em Google Sheets.

## Configuração

1. Crie uma planilha com as abas `clientes`, `usuarios`, `transacoes`, `resgates`, `sms_logs`, `auditoria` e `configuracao`.
2. Crie uma conta de serviço no Google Cloud, habilite a Google Sheets API e compartilhe a planilha com o e-mail dessa conta como editor.
3. Copie `.env.example` para `.env` e preencha as credenciais. Não publique o arquivo `.env`.
4. Execute `npm install` e depois `npm run dev`.

A primeira linha de cada aba deve conter os nomes dos campos. A API cria o cabeçalho automaticamente ao fazer a primeira inclusão em uma aba vazia.

## Segurança

- Autenticação validada somente no servidor.
- Cookie de sessão `HttpOnly` e `SameSite=Strict`.
- Bloqueio temporário após cinco tentativas inválidas.
- Rotas de dados protegidas e credenciais da planilha mantidas fora do frontend.
- Cabeçalhos CSP, anti-frame e anti-MIME sniffing.

O Google Sheets funciona bem para uma operação pequena, mas não oferece as garantias transacionais de um banco SQL. Para alto volume ou múltiplas gravações simultâneas, use PostgreSQL.
