# Magnolia · Jogo da vida

Versão leve: tabuleiro narrativo em SVG com fotografias e personagens fornecidos pela família.

## Aplicação

Abra `docs/index.html` diretamente no navegador. Sem build, dependências JavaScript externas ou WebGL. Toque na personagem/casas, use um gesto independente ou setas fora do balão para navegar; cada paragem permanece até nova ação.

## Publicação

GitHub Pages: ramo `main`, pasta `/docs`. O repositório e o site são públicos. Não altera o site principal da conta.

## Progresso da história

A barra fixa no topo mostra o progresso apenas pelo preenchimento, sem texto nem percentagem visível. A descrição acessível é preservada para leitores de ecrã. Começa em 0%, chega a 100% na última casa e volta a zero ao recomeçar. Recalcula automaticamente quando a planilha adiciona, remove ou reordena milestones.

## Edição colaborativa

Edite os milestones no Google Sheets indicado em `CONTENT-EDITING.md`. O site consulta a aba pública a cada 60 segundos, mantém a última versão válida em falhas e cria/remove/reordena casas conforme as linhas válidas. `docs/milestones.json` é o snapshot de fallback da migração. Não é necessário um novo deploy para atualizar a planilha.

O timestamp no canto inferior direito identifica a versão da aplicação, não o horário da última edição da planilha.

## Skills

Skills do projeto preservadas em `.agents/skills/`; consulte `AGENTS.md`.
