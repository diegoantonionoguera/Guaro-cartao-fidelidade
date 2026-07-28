# Fidelidade Guaro Design System

## Princípios

1. Atendimento primeiro: busca, pontos e resgate são as ações dominantes.
2. Estado sempre visível: carregamento, sucesso, erro e bloqueio não são silenciosos.
3. Risco separado: exclusão, estorno e configuração ficam longe das ações rotineiras.
4. Denso, não apertado: informação operacional é compacta com controles confortáveis.
5. Marca com função: vermelho, laranja e amarelo orientam hierarquia, não decoram tudo.

## Tokens

Os tokens vivem em `src/index.css` e seguem três níveis:

- Primitivos: cores oficiais e medidas base.
- Semânticos: fundo, superfície, texto, borda, foco, sucesso, alerta e perigo.
- Componentes: botão, campo, painel, badge, modal e navegação.

## Componentes

- Botões: primário, secundário, perigo e ícone. Durante requisições, desabilitar e apresentar carregamento.
- Campos: label visível, ajuda opcional, erro junto ao campo e altura mínima de 44px.
- Modais: consequência clara, foco controlado e confirmação explícita para ações destrutivas.
- Dados: valores em `pt-BR`, pontos com `pts` e status comunicado por texto, forma e cor.

## Breakpoints

- 375px: celular compacto
- 768px: tablet
- 1024px: notebook
- 1440px: desktop

## Checklist

- Contraste WCAG AA.
- Navegação integral por teclado.
- Foco visível.
- Nenhum controle depende apenas de hover.
- Sem scroll horizontal não intencional.
- `prefers-reduced-motion` respeitado.
- Estados vazio, carregando, erro e sucesso revisados.
