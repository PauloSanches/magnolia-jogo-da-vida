# Magnolia · Jogo da vida

Versão leve: tabuleiro narrativo em SVG com fotografias e personagens fornecidos pela família.

## Aplicação

Abra `docs/index.html` diretamente no navegador. Sem build, dependências JavaScript externas ou WebGL. Toque na personagem/casas, use um gesto independente ou setas fora do balão para navegar; cada paragem permanece até nova ação.

## Publicação

GitHub Pages: ramo `main`, pasta `/docs`. O repositório e o site são públicos. Não altera o site principal da conta.

## Música de fundo

O ficheiro MP3 enviado pelo utilizador (aproximadamente 15 segundos) toca em repetição, sem reiniciar nas mudanças de casa. A página tenta iniciar o som quando permitido pelo navegador; caso seja bloqueado, o botão «Ativar som» inicia a reprodução após um toque. O mesmo botão permite desligar o som, e essa escolha fica guardada neste navegador. Erros de reprodução permitem tentar novamente sem bloquear a história.

## Navegação

As setas fixas na parte inferior permitem voltar e avançar. A história aparece primeiro; quando há pergunta na fonte, o próximo avanço mostra um card obrigatório, sem campo de resposta nem opção de pular. A conversa acontece em voz alta; o site não grava nem verifica respostas. Todos os comandos de avanço, inclusive cliques em casas distantes, respeitam a sequência. As setas ficam desativadas nos limites e durante as transições. Toque, rato e teclado são suportados. Os atalhos e a personagem clicável continuam disponíveis. Depois do card final, os comandos de avanço param: só o botão «Recomeçar», apresentado no final, reinicia a história.

## Progresso da história

A barra fixa no topo mostra o progresso apenas pelo preenchimento, sem texto nem percentagem visível. A descrição acessível é preservada para leitores de ecrã. O preenchimento acompanha suavemente a animação de navegação, respeitando a preferência por movimento reduzido. Começa em 0%, chega a 100% depois do último card e volta a zero ao recomeçar. Recalcula automaticamente quando a planilha adiciona, remove ou reordena milestones no formato canônico.

## Edição colaborativa

Edite os milestones no Google Sheets indicado em `CONTENT-EDITING.md`. O site consulta a aba pública a cada 60 segundos, mantém a última versão válida em falhas e lê o rascunho explicitamente autorizado. O formato canônico de seis colunas permite criar/remover/reordenar casas; as restrições do bloco provisório estão documentadas em `CONTENT-EDITING.md`. `docs/milestones.json` é o snapshot de fallback da migração. Não é necessário um novo deploy para atualizar a planilha.

O timestamp no canto inferior direito identifica a versão da aplicação, não o horário da última edição da planilha.

## Skills

Skills do projeto preservadas em `.agents/skills/`; consulte `AGENTS.md`.
