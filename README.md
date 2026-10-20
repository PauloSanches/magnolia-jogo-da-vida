# Magnolia · Jogo da vida

Versão leve: tabuleiro narrativo em SVG com fotografias e personagens fornecidos pela família.

## Aplicação

Abra `docs/index.html` diretamente no navegador. Sem build, dependências JavaScript externas ou WebGL. Toque na personagem/casas, use um gesto independente ou setas fora do balão para navegar; cada paragem permanece até nova ação.

## Publicação

GitHub Pages: ramo `main`, pasta `/docs`. O repositório e o site são públicos. Não altera o site principal da conta.

## Áudio

Removido a pedido do utilizador. Não há reprodutor, botão de som ou carregamento do MP3. O arquivo original permanece preservado, sem uso na página.

## Navegação

As setas fixas na parte inferior permitem voltar e avançar. A história aparece primeiro; quando há pergunta na fonte, o próximo avanço mostra um card obrigatório, sem campo de resposta nem opção de pular. A conversa acontece em voz alta; o site não grava nem verifica respostas. Todos os comandos de avanço, inclusive cliques em casas distantes, respeitam a sequência. As setas ficam desativadas nos limites e durante as transições. Toque, rato e teclado são suportados. Os atalhos e a personagem clicável continuam disponíveis. Depois do card final, os comandos de avanço param: só o botão «Recomeçar», apresentado no final, reinicia a história.

## Progresso da história

A barra fixa no topo mostra o progresso apenas pelo preenchimento, sem texto nem percentagem visível. A descrição acessível é preservada para leitores de ecrã. O preenchimento acompanha suavemente a animação de navegação, respeitando a preferência por movimento reduzido. Começa em 0%, chega a 100% depois do último card e volta a zero ao recomeçar. A versão final contém 12 histórias e 10 cards de perguntas. A última casa encerra o jogo com a reflexão em destaque, sem pergunta, e apresenta o botão Recomeçar.

## Conteúdo final

As correções de português aprovadas estão incorporadas em `docs/content.js`, com cópias idênticas dos registros em `docs/milestones.json` e `qa/fixtures/approved-questions.json`. A pergunta da casa 6 é «Qual era meu nome de casada?». O site não depende do Google Sheets: não há consultas, sincronização nem leitura do cache antigo.

Alterações futuras exigem uma nova publicação. Consulte `CONTENT-EDITING.md` e `EDITORIAL-WORKFLOW.md`. O timestamp no canto inferior direito identifica a versão publicada.

## Skills

Skills do projeto preservadas em `.agents/skills/`; consulte `AGENTS.md`.
