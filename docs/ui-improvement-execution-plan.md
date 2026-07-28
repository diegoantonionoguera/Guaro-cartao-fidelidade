# Plano de Melhorias UI e Verificação

Data da auditoria: 28 de julho de 2026.

## Objetivo

Evoluir o painel interno sem trocar sua identidade, sua stack ou sua arquitetura.
O trabalho deve aumentar a velocidade operacional, reduzir custo visual e manter
telefone e e-mail de clientes restritos aos fluxos que realmente precisam deles.

## Habilidades usadas

- `ui-ux-pro-max`: habilidade principal para classificar risco e prioridade.
- `ui-styling`: apoio para HTML, Tailwind CSS, acessibilidade e estados.
- `stitch-design-taste`: apoio documental para tornar as decisões semânticas e
  reutilizáveis, sem criar uma segunda fonte de verdade.

## Decisões de compatibilidade

As sugestões genéricas de Inter, verde como CTA, azul escuro técnico, GSAP e
microanimações permanentes foram rejeitadas. Elas conflitam com a paleta Guaro,
com Poppins/Bebas Neue e com o caráter operacional do painel.

Continuam obrigatórios:

- Vermelho Guaro, Laranja Guaro e Amarelo Premium como acentos funcionais.
- Poppins para operação e Bebas Neue somente em títulos curtos.
- HTML, JavaScript, Tailwind CSS e CSS local, sem React, Radix ou shadcn/ui.
- Uma habilidade principal e até duas de apoio por tarefa.

## Baseline verificado

| Gate | Resultado |
| --- | --- |
| Sintaxe (`npm run lint`) | Aprovado |
| Segurança | 9 testes aprovados |
| Movimento | 5 testes aprovados |
| Interface | 7 testes aprovados |
| Playwright visual | 5 cenários aprovados |
| Build | Aprovado |
| CSS de produção | 78,20 kB; 15,11 kB gzip |
| JavaScript de produção | 173,30 kB; 40,30 kB gzip |
| Dependências de produção | 0 vulnerabilidades |
| Ferramentas de desenvolvimento | 10 vulnerabilidades transitivas no `@lhci/cli`: 7 altas, 1 moderada e 2 baixas |
| Lighthouse | Bloqueado pelo executor local; detalhes abaixo |

Ativos mais pesados observados:

- `login-dark.jpg`: 455.035 bytes.
- `guaro-logo.png`: 91.446 bytes.
- `login-light.jpg`: 34.366 bytes.

## Prioridades

| ID | Prioridade | Melhoria | Critério de aceite |
| --- | --- | --- | --- |
| UI-01 | P0 | Estabilizar o Lighthouse local e semanal. | Duas execuções completas, relatório salvo e nenhum request pendente impedindo o carregamento. |
| UI-02 | P1 | Consolidar tokens e contraste claro/escuro. | WCAG AA, foco visível e estados equivalentes nos dois temas; sem cor funcional nova fora dos tokens. |
| UI-03 | P1 | Otimizar fundo, logo e efeitos de vidro. | Fundo escuro em WebP/AVIF com fallback, dimensões reservadas, sem regressão visual e redução mensurável do payload. |
| UI-04 | P1 | Reforçar semântica e navegação por teclado. | Skip link, landmarks, hierarquia de títulos, nomes acessíveis e fluxo completo por teclado. |
| UI-05 | P2 | Padronizar componentes operacionais repetidos. | Botões, campos, badges, tabelas e modais usam variantes documentadas sem instalar nova biblioteca. |
| UI-06 | P2 | Completar estados assíncronos e de dados. | Carregando, vazio, erro, sucesso, bloqueado e nova tentativa são visíveis e anunciados. |
| UI-07 | P2 | Melhorar tabelas e densidade em telas estreitas. | Nenhum overflow da página; dados críticos continuam legíveis em 360px e paisagem. |
| UI-08 | P3 | Gerar contrato semântico para Stitch quando necessário. | Arquivo derivado aponta para as fontes oficiais e não redefine marca, tokens ou componentes. |

## Plano de execução

### Etapa 0: tornar a medição confiável

Arquivos previstos:

- `scripts/run-lighthouse.mjs`
- `scripts/start-quality-server.mjs`
- `lighthouserc.cjs`
- `package.json`

Ações:

1. Executar o CLI local do Lighthouse diretamente pelo Node.
2. Respeitar `CHROME_PATH` e manter o Chromium do Playwright como fallback.
3. Criar um modo de auditoria determinístico que interrompa a sincronização
   automática e não dependa do Google Sheets.
4. Fixar uma versão LTS de Node para CI e verificação semanal.
5. Remover ou substituir o `@lhci/cli` se não houver atualização sem quebra,
   evitando `npm audit fix --force`.
6. Salvar JSON e HTML em `artifacts/lighthouse`.

Testes:

- `npm run lint`
- `npm run test:lighthouse`
- `npm audit --omit=dev --audit-level=high`
- confirmar dois relatórios e ausência de requests `/api/state` pendentes;
- provocar falha de threshold e confirmar exit code diferente de zero.

### Etapa 1: contrato visual e tokens

Arquivos previstos:

- `docs/design-system.md`
- `src/index.css`
- `src/ui/*.js`

Ações:

1. Documentar atmosfera operacional: densidade 7/10, variação 4/10 e movimento
   4/10.
2. Mapear primitivos para tokens semânticos de superfície, texto, borda, foco,
   sucesso, alerta e perigo.
3. Substituir cores funcionais repetidas nos componentes por tokens.
4. Verificar contraste separadamente nos temas claro e escuro.

Testes:

- teste unitário dos tokens obrigatórios;
- Lighthouse `color-contrast` igual a 1;
- Playwright nos dois temas em 375, 768, 1024 e 1440px;
- revisão visual de foco, hover, active, disabled e erro.

### Etapa 2: acessibilidade e ergonomia

Arquivos previstos:

- `index.html`
- `src/ui/navbar.js`
- `src/ui/clientList.js`
- `src/ui/managerPanel.js`
- `src/ui/modals.js`

Ações:

1. Adicionar skip link para o conteúdo principal.
2. Corrigir níveis de títulos sem alterar o tamanho visual.
3. Auditar nomes acessíveis, descrições e regiões `aria-live`.
4. Confirmar alvos mínimos de 44px e espaçamento mínimo de 8px.
5. Preservar o foco ao abrir e fechar modais e trocar abas.

Testes:

- percurso somente com teclado;
- Playwright para Tab, Shift+Tab, Enter, Espaço e Escape;
- teste de foco devolvido ao acionador;
- Lighthouse de acessibilidade maior ou igual a 0,95.

### Etapa 3: desempenho visual

Arquivos previstos:

- `src/assets/backgrounds/*`
- `src/assets/brand/*`
- `src/index.css`
- `src/ui/login.js`

Ações:

1. Gerar WebP/AVIF dos fundos e preservar JPEG como fallback.
2. Declarar dimensões ou `aspect-ratio` para imagens críticas.
3. Carregar somente o fundo necessário ao tema inicial.
4. Reduzir `backdrop-filter` em mobile e dispositivos de menor capacidade.
5. Manter animações em `transform` e `opacity`.

Orçamentos:

- CSS menor ou igual a 85 kB não comprimido.
- JavaScript menor ou igual a 180 kB não comprimido.
- Fundo escuro menor que 200 kB.
- CLS menor que 0,1.
- Lighthouse performance maior ou igual a 0,85 em ambiente estável.

Testes:

- build com verificação automática de tamanho;
- Lighthouse em duas execuções;
- Playwright com tema claro/escuro e movimento reduzido;
- inspeção em 6x CPU throttle para hover, modal e scroll.

### Etapa 4: componentes e estados

Ações:

1. Extrair classes de botão, campo, badge, painel e tabela somente quando houver
   repetição real.
2. Manter HTML nativo e contratos ARIA em vez de adicionar shadcn/ui.
3. Adicionar skeleton com dimensões estáveis para esperas acima de 300ms.
4. Padronizar erro junto ao campo, retry e bloqueio durante mutações.
5. Adaptar tabelas densas para resumo móvel ou região de scroll claramente
   delimitada.

Testes:

- testes DOM de cada variante e estado;
- testes de requisição lenta, erro 4xx/5xx e tentativa repetida;
- snapshot visual de vazio, carregando, erro e sucesso;
- teste de privacidade garantindo ausência de telefone/e-mail nos cartões.

### Etapa 5: fechamento

Executar:

```powershell
npm.cmd run verify:quality
npm.cmd run test:visual
npm.cmd run test:lighthouse
npm.cmd audit --audit-level=high
```

Uma etapa só pode ser marcada como concluída quando seus testes passam, seus
artefatos ficam registrados e o diff não inclui mudanças fora do escopo.

## Estado do Lighthouse

O primeiro problema, `spawn EINVAL` ao iniciar `npx.cmd` no Windows, foi
corrigido durante esta auditoria com execução direta do CLI local. A coleta
passou a iniciar, mas ainda fica instável porque a aplicação autenticada mantém
requisições periódicas para `/api/state`; Chrome 150 também falha ao remover o
perfil temporário com `EPERM` no Node 26.

Por isso UI-01 permanece P0 e o gate completo não deve ser considerado aprovado
até usar fixture determinística e Node LTS. As vulnerabilidades registradas pelo
`npm audit` estão na cadeia de desenvolvimento do `@lhci/cli`; as dependências
de produção foram verificadas separadamente e retornaram zero vulnerabilidades.
