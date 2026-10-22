# Jogo da Vida - Magnólia
## Um tabuleiro digital desenvolvido com Hermes Agent, Codex e direção humana.

O projeto Magnólia é uma aplicação web com navegação por etapas, personagens personalizados e apresentação sequencial de conteúdo.

O desenvolvimento envolveu definição da experiência, implementação das interações, preparação de recursos visuais, testes e publicação. Este case apresenta os requisitos, as decisões técnicas e a evolução do produto até a versão entregue.

**12 casas · 10 perguntas · 54 commits · aproximadamente 66 horas de evolução registrada**

*O intervalo considera o primeiro commit e o commit da versão final do jogo e do Backstage, entre 19 e 22 de outubro de 2026. É tempo de calendário, não uma medição de horas de trabalho.*

**Ações:** Experimentar o jogo · Explorar o código

## O produto

A aplicação organiza o conteúdo em um tabuleiro com 12 casas e 10 perguntas. Cada etapa combina uma personagem, um bloco narrativo e controles de navegação.

O conteúdo aparece com efeito de escrita. Depois de um intervalo, a pergunta é apresentada sem ocultar o texto anterior. O usuário controla quando avançar, voltar, pausar ou reiniciar.

As respostas acontecem fora da aplicação. O sistema não recebe respostas, grava áudio nem calcula pontuação. A última casa encerra o percurso e disponibiliza o reinício.

A interface foi desenvolvida para uso em celular e computador, com controles visíveis e suporte à navegação por teclado.

## O desafio

Converter conteúdo e recursos visuais em uma experiência interativa com navegação previsível, leitura confortável e comportamento consistente entre dispositivos.

As alterações precisavam preservar os requisitos já aprovados, sem introduzir regressões no conteúdo, no posicionamento dos elementos ou nas transições.

- Deixar evidente como avançar e voltar, sem depender da descoberta de gestos.
- Coordenar histórias, perguntas e animações sem levar o jogador automaticamente para outra casa.
- Manter personagens e balões legíveis em diferentes tamanhos de tela.
- Atualizar textos e imagens sem alterar outras partes já aprovadas.
- Publicar versões que pudessem ser conferidas e relacionadas ao histórico do código.

## A jornada de desenvolvimento

### Do protótipo à navegação pelo tabuleiro

As primeiras iterações definiram a estrutura visual e a organização da narrativa. O foco foi ajustado para dar protagonismo ao tabuleiro e criar pausas nas casas, em vez de conduzir o visitante por uma sequência contínua.

As setas de navegação passaram a oferecer um caminho explícito de avanço e retorno. O encerramento ganhou uma ação própria para recomeçar.

### Da apresentação de conteúdo ao ritmo de leitura

Com a navegação definida, o trabalho se concentrou no comportamento de cada casa.

O texto passou a aparecer com efeito de escrita. A pergunta é apresentada depois de um intervalo, mas a mudança de casa continua manual. Uma revisão posterior manteve a história na tela durante a pergunta, para que o contexto não desaparecesse no momento da conversa.

Essas escolhas exigiram controle de temporizadores, cancelamento de ações antigas ao navegar e tratamento de pausa, aba oculta e preferência por movimento reduzido.

### Da edição colaborativa ao conteúdo estático

Durante a preparação, o projeto utilizou Google Sheets como fonte colaborativa de conteúdo.

Quando a revisão editorial terminou, a integração foi removida. Histórias e perguntas passaram a acompanhar os arquivos publicados, vinculadas à mesma versão do código.

A mudança trouxe uma troca clara: editar o conteúdo passou a exigir uma nova publicação, mas o jogo deixou de depender da planilha para carregar a narrativa aprovada.

### Do jogo publicado ao registro técnico

O Backstage foi criado como uma página independente para explicar o produto e o processo de desenvolvimento.

Sua identidade visual é sóbria e técnica, separada da linguagem ilustrada do jogo. Capturas reais mostram a experiência, enquanto a animação de fluxo explica como uma solicitação passa por revisão, implementação, testes e publicação.

## Como o trabalho aconteceu

A fase inicial de concepção ocorreu no Hermes Desktop. A continuidade do desenvolvimento foi conduzida pelo Telegram, usado para enviar materiais, solicitar mudanças e revisar o resultado.

No MacBook Air M1, o Hermes Agent executou operações sobre os arquivos e ferramentas locais, com apoio do Codex integrado ao ambiente. O fluxo recorrente foi:

**Solicitação → revisão de escopo e conteúdo → implementação → testes → publicação → conferência pública**

Cada alteração precisava definir tanto o que mudaria quanto o que deveria permanecer igual. Uma substituição de personagem, por exemplo, não autorizava modificar a história, a pergunta ou a posição das outras imagens.

A verificação também continuava depois da publicação: o conteúdo servido pelo site era comparado à revisão esperada, seguido de testes da experiência pública.

## Arquitetura e ferramentas

### Aplicação estática no navegador

O jogo utiliza **HTML, CSS, JavaScript e SVG**. O navegador executa a navegação, as animações e a apresentação das histórias. Conteúdo, imagens e fontes acompanham os arquivos do projeto.

A versão final não exige um servidor de aplicação nem um banco de dados para jogar. O GitHub Pages hospeda o site, que não depende de manter o computador de desenvolvimento ligado.

### Criação e desenvolvimento

- **ChatGPT:** utilizado pelo criador do projeto para gerar os personagens ilustrados a partir de fotografias. As imagens foram depois preparadas e integradas com o Hermes Agent.
- **Hermes Agent e Codex:** leitura e edição de código, preparação de arquivos, execução de testes e apoio à implementação.
- **Telegram:** canal de solicitações, envio de materiais e aprovações durante a evolução do projeto.
- **Git e GitHub:** histórico das alterações e publicação pelo GitHub Pages.
- **Hairline:** biblioteca utilizada na animação explicativa do Backstage.

### Skills como procedimentos de trabalho

As skills orientaram tarefas recorrentes. Entre as principais estiveram `impeccable`, para design e revisão visual; `test-driven-development`, para testes; `systematic-debugging`, para investigação de falhas; `requesting-code-review`, para revisões independentes; e `github`, para versionamento e publicação.

A skill `narrative-board-maintenance` foi criada e ampliada durante o projeto. Ela registra cuidados específicos do tabuleiro, como preservar associações entre casas e personagens, manter o conteúdo aprovado e verificar o comportamento das transições.

## Decisões de engenharia que fizeram diferença

### Preservar o contexto durante a pergunta

Trocar a história pela pergunta retirava uma referência importante da tela. A solução manteve a narrativa abaixo da personagem e apresentou a pergunta ao lado, com limites de espaço para evitar sobreposição com os controles.

### Animar sem deslocar a interface

A escrita progressiva precisava manter o balão estável. O espaço do texto completo passou a ser reservado antes da animação, enquanto o conteúdo integral continuava disponível para leitores de tela.

### Evitar um recomeço acidental

A chegada à última casa não poderia deslocar as setas e colocar o botão de reinício sob o próximo toque do jogador. O reinício ganhou uma posição separada, preservando a localização dos controles de navegação.

### Transformar correções em verificações

As correções passaram a ser acompanhadas por testes de conteúdo, navegação, imagens e layout. O objetivo era detectar regressões nas próximas alterações, em vez de depender apenas de uma nova inspeção manual.

## Resultado

A entrega reúne:

- Um jogo publicado com 12 casas e 10 perguntas, personagens personalizados e encerramento próprio.
- Navegação manual, pausa, retorno e reinício explícito.
- Histórias preservadas na tela durante as perguntas.
- Conteúdo final estático, sem dependência da planilha.
- Testes automatizados e verificações de navegador em diferentes tamanhos de tela.
- Um Backstage independente, com arquitetura, processo e evidências visuais.

O histórico reúne **54 commits em aproximadamente 66 horas de calendário**, do primeiro registro à versão final considerada neste case.

Esses números documentam a evolução do projeto. Não medem produtividade por hora nem demonstram uma economia em comparação com outro método de desenvolvimento.

## Aprendizados

**Definir o comportamento foi tão importante quanto implementar o código.** Pedidos como manter a história visível ou mover apenas o balão precisaram se tornar regras explícitas e verificáveis.

**A arquitetura mudou conforme a necessidade editorial.** A planilha apoiou a fase de edição; depois da aprovação, o conteúdo estático passou a atender melhor ao modo de publicação escolhido.

**O uso de agentes não eliminou revisão e testes.** A direção humana permaneceu responsável pelo conteúdo e pelas escolhas de experiência. Os agentes apoiaram a execução e a verificação.

**Publicar não encerrou a validação.** A conferência da versão pública fez parte da entrega, incluindo a confirmação dos arquivos e do comportamento no navegador.

## Impacto

A entrega resultou em uma aplicação web publicada, com conteúdo versionado, testes executáveis e um processo definido de atualização.

O projeto também produziu documentação e procedimentos reutilizáveis para orientar a manutenção. Novas alterações podem ser relacionadas a requisitos, verificadas antes da publicação e conferidas no ambiente público.

O alcance demonstrado por este case é a entrega técnica e sua capacidade de manutenção. Não foram medidos ganhos de audiência, satisfação, receita ou produtividade.

**Ações:** Experimentar o jogo · Consultar o repositório
