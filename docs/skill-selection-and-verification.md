# Seleção de Habilidades e Verificação

Este documento define quais habilidades podem orientar o Fidelidade Guaro e
como validar mudanças antes de enviá-las ao GitHub.

## Regra de seleção

Cada tarefa deve ter:

- uma habilidade principal;
- no máximo duas habilidades de apoio;
- uma necessidade concreta para cada habilidade escolhida;
- compatibilidade com o design system, a marca e a stack existente;
- um critério claro para encerrar o trabalho.

Não combinar estilos concorrentes nem adotar uma nova biblioteca apenas porque
uma habilidade a recomenda.

## Núcleo do projeto

| Prioridade | Habilidade | Responsabilidade |
| --- | --- | --- |
| Primordial | Open Design (`od-design-refine`) | Auditar, escolher o maior ganho e executar patches pequenos e revisáveis. É uma referência local, não uma habilidade instalada. |
| Primordial | `brand` | Proteger identidade, paleta, logo, voz e tom Guaro. |
| Primordial | `design-system` | Manter tokens, componentes, estados e regras consistentes. |
| Primordial | `impeccable` | Revisar UX, acessibilidade, responsividade, clareza e acabamento. |
| Primordial | `ui-ux-pro-max` | Consultar padrões adequados para formulários, dashboards e fluxos operacionais. |
| Execução | `redesign-existing-projects` | Melhorar o projeto existente sem quebrar funções ou reescrever a arquitetura. |
| Apoio | `ui-styling` | Apoiar CSS, controles e acessibilidade, sem introduzir shadcn/Tailwind components desnecessários. |

## Habilidades condicionais

Usar somente quando a tarefa exigir.

| Habilidade | Quando usar |
| --- | --- |
| `design-taste-frontend` | Redesign visual relevante ou revisão contra aparência genérica. |
| `emil-design-eng` | Microinterações, feedback e acabamento fino de componentes. |
| `find-animation-opportunities` | Identificar, sem implementar, onde movimento pode ajudar. |
| `improve-animations` | Planejar melhorias amplas no sistema de movimento. |
| `review-animations` | Revisar animações já implementadas. |
| `animation-vocabulary` | Descobrir o nome técnico de um efeito descrito. |
| `apple-design` | Gestos, springs, sheets ou interações físicas específicas. |
| `high-end-visual-design` | Polimento visual seletivo sem comprometer a densidade operacional. |
| `design` | Produção de identidade, ícones, banners ou peças visuais. |
| `imagegen` | Criar ou editar imagens bitmap necessárias. |
| `brandkit` | Criar uma apresentação completa da identidade da marca. |
| `banner-design` | Criar banners e campanhas. |
| `slides` | Criar apresentações HTML. |
| `imagegen-frontend-web` | Gerar referências visuais para a futura página pública. |
| `imagegen-frontend-mobile` | Gerar conceitos de aplicativo mobile. |
| `image-to-code` | Implementar uma interface a partir de referência visual aprovada. |
| `prototype` | Comparar alternativas quando solicitado explicitamente. |
| `pick-ui-library` | Escolher uma biblioteca quando solicitado explicitamente. |
| `full-output-enforcement` | Entregas extensas que não podem ser abreviadas. |
| `stitch-design-taste` | Gerar uma especificação semântica derivada para Google Stitch, somente quando houver trabalho no Stitch. Nunca substitui `docs/brand-guidelines.md` ou `docs/design-system.md`. |

## Habilidades não aplicáveis agora

| Habilidade | Motivo |
| --- | --- |
| `gpt-taste` | AIDA, GSAP e composição editorial de marketing conflitam com o painel operacional. |
| `industrial-brutalist-ui` | Linguagem visual incompatível com a marca atual. |
| `minimalist-ui` | Paleta e direção editorial não correspondem à identidade Guaro. |
| `design-taste-frontend-v1` | Versão legada; usar a versão atual quando necessário. |

## Habilidades administrativas ou fora do objetivo

- `openai-docs`: documentação de produtos OpenAI.
- `plugin-creator`: criação de plugins Codex.
- `skill-creator`: criação ou atualização de habilidades.
- `skill-installer`: instalação de habilidades.

Essas habilidades não participam do design ou da implementação do painel.

## Trio de auditoria UI

Para auditorias completas do painel, usar as três habilidades com fronteiras
explícitas:

| Ordem | Habilidade | Papel no projeto | Limite |
| --- | --- | --- | --- |
| Principal | `ui-ux-pro-max` | Priorizar acessibilidade, interação, desempenho, responsividade, formulários e feedback. | Recomendações de cor, fonte ou estilo que contrariem a marca são descartadas. |
| Apoio | `ui-styling` | Traduzir as prioridades para HTML semântico, Tailwind CSS, CSS local, estados e testes de teclado. | Não instalar React, Radix ou shadcn/ui no projeto atual. |
| Apoio | `stitch-design-taste` | Estruturar uma descrição semântica e reutilizável da atmosfera, dos componentes e dos anti-padrões. | O documento de Stitch é derivado; a fonte oficial continua sendo a documentação Guaro. |

O plano resultante desta combinação está em
`docs/ui-improvement-execution-plan.md`.

## Estrutura de verificação

### 1. Classificação

- Definir se a tarefa é correção, melhoria visual, novo fluxo, conteúdo,
  acessibilidade, movimento ou infraestrutura.
- Registrar o problema observado e o resultado esperado.
- Selecionar uma habilidade principal e até duas de apoio.

### 2. Compatibilidade

- Preserva a identidade definida em `docs/brand-guidelines.md`.
- Reutiliza tokens e componentes de `docs/design-system.md`.
- Combina com a stack atual: HTML, JavaScript, Tailwind CSS e CSS local.
- Não cria uma segunda linguagem visual.
- Não adiciona dependência sem necessidade funcional comprovada.

### 3. Segurança do patch

- Identificar arquivos, comportamento afetado e risco.
- Ler alterações pendentes antes de editar.
- Não misturar refatoração não relacionada.
- Para risco alto, dividir em etapas menores e validar entre elas.

### 4. Verificação funcional

- Fluxo principal funciona do início ao fim.
- Estados carregando, vazio, sucesso, erro e bloqueado estão cobertos.
- Botões desabilitam durante ações assíncronas quando necessário.
- Erros orientam o funcionário sobre como corrigir o problema.
- Permissões de atendente e gerente continuam separadas.

### 5. Verificação visual

- Conferir 360, 500, 768, 1024 e 1440 px.
- Sem overflow horizontal, sobreposição ou texto cortado.
- Uma ação principal dominante por região.
- Controles têm pelo menos 44 px em telas de toque.
- Poppins no conteúdo operacional e Bebas Neue somente em títulos curtos.
- Gradiente reservado à marca ou a uma ação realmente prioritária.

### 6. Acessibilidade

- Fluxo completo por teclado.
- Foco visível e ordem de foco coerente.
- Modais prendem e devolvem o foco.
- Abas usam `tablist`, `tab`, `tabpanel` e `aria-selected`.
- Labels estão associados aos campos.
- Cor nunca é o único indicador de estado.
- `prefers-reduced-motion` é respeitado.

### 7. Regressão

Executar:

```powershell
npm.cmd run lint
npm.cmd run test:security
npm.cmd run test:motion
npm.cmd run test:ui
npm.cmd run build
git diff --check
```

Para executar todos os gates automatizados em sequência:

```powershell
npm.cmd run verify:quality
```

Revisar visualmente os fluxos alterados no servidor temporário e comparar
capturas antes/depois quando a mudança afetar layout ou movimento.

### 8. Critério de conclusão

Uma tarefa só está pronta quando:

- o objetivo observável foi atingido;
- não existem problemas críticos de marca, UX ou acessibilidade;
- não há regressão funcional conhecida;
- lint, testes e build passam;
- o diff contém apenas mudanças necessárias;
- não há habilidade adicional capaz de melhorar o resultado sem ampliar o
  escopo.

## Combinações recomendadas

| Tipo de tarefa | Principal | Apoio |
| --- | --- | --- |
| Correção responsiva | `impeccable` | `ui-ux-pro-max`, `ui-styling` |
| Novo componente | `design-system` | `impeccable`, `ui-styling` |
| Redesign de tela existente | `redesign-existing-projects` | `brand`, `design-taste-frontend` |
| Revisão de acessibilidade | `impeccable` | `ui-ux-pro-max` |
| Animação existente | `review-animations` | `emil-design-eng` |
| Planejamento de movimento | `improve-animations` | `brand`, `design-system` |
| Página pública futura | `design-taste-frontend` | `brand`, `imagegen-frontend-web` |
| Material de divulgação | `banner-design` | `brand`, `imagegen` |
