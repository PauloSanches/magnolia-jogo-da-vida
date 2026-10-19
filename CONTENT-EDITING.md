# Edição colaborativa dos milestones

## Fonte principal

Os títulos, textos, fotografias e a ordem das casas são mantidos na aba `magnolia-milestones` do Google Sheets. O utilizador autorizou a leitura pública dessa aba e a publicação automática das alterações feitas pelos editores convidados. A edição continua gerida nas permissões do Google Sheets; este site só lê a publicação pública.

- Planilha de edição: https://docs.google.com/spreadsheets/d/1HA4SoBZb5bCwvVQ3FrSPOOMVKVTxd1UeQjZli5s-W5o/edit
- Aba publicada: `gid=703861516`.
- CSV: https://docs.google.com/spreadsheets/d/e/2PACX-1vRACf3na_mfW8ZZ5-b5z8v2OAG8R1Wshaxl-Rjyc1T3FtEx804RHCcxAb9Fk6ebj3wjh9Sv-SvBEWcc/pub?gid=703861516&single=true&output=csv

Não usar o antigo `gid=0`: a importação criou uma nova aba.

## Rascunho atualmente aprovado

A instrução «manter o texto como está no rascunho da planilha. atualizar pagina» autoriza o bloco das linhas 19–30: 12 histórias e 11 cards seguintes. A abertura não tem pergunta. Títulos vazios, espaços, quebras de linha e grafia são preservados literalmente, sem criar títulos ou perguntas.

A planilha não foi alterada. Enquanto mantiver o formato atual de cinco colunas, `docs/content.js` configura um adaptador somente de leitura: seleciona a partir da linha 19, exige exatamente 12 linhas não vazias com `id`/`ordem` vazios, interpreta `foto` como o texto do card e mantém as fotografias anteriores separadamente. O bloco antigo acima fica excluído. Alterar texto/título/card nesse bloco continua atualizando automaticamente. Não inserir/remover/reordenar linhas nesse formato provisório: a associação é posicional e uma contagem diferente é recusada, mantendo a última versão válida.

A casa que reúne Daniele e Dedey conserva o ID visual `casa-08` e a personagem com duas crianças. A casa da mãe e do irmão usa `casa-11`. Amor permanece `casa-12`; netos e profissão recebem os IDs novos `casa-netos` e `casa-profissao`. Não renumerar IDs ao mudar a ordem.

## Formato canônico para futura edição estruturada

Para acrescentar/remover/reordenar casas com segurança, substituir o conteúdo da mesma aba pelo CSV canônico de **seis** colunas abaixo; o leitor o reconhece automaticamente. Não adicionar apenas um cabeçalho ao bloco misto antigo/rascunho. Essa migração não foi executada na planilha nesta publicação.

## Colunas

- `id`: manter cada identificador único e estável. Os IDs existentes (`casa-01` a `casa-13`) continuam associados às personagens originais. Para novas casas, usar um ID novo como `casa14` ou `casa-15` (letras, números, hífen ou sublinhado; começar por letra ou número).
- `ordem`: inteiro positivo e único. Alterar para reorganizar a sequência sem renomear os IDs.
- `titulo`: título opcional, até 180 caracteres; vazio significa não mostrar título.
- `texto`: narrativa obrigatória, até 10.000 caracteres. Pode conter vírgulas, aspas e quebras de linha. HTML é mostrado como texto, nunca executado.
- `foto`: URL HTTPS pública da imagem, ou vazio para não mostrar foto. Usar o endereço da imagem, não uma imagem colada dentro da célula nem uma página de partilha que exige login. Os links atuais do próprio site podem continuar a ser usados.

A casa dos irmãos usa provisoriamente a imagem enviada pelo utilizador. Para substituí-la, alterar somente a célula `foto` da linha `casa-03`.

- `pergunta`: texto do card seguinte, até 2.000 caracteres. Vazio significa não criar card. O texto é literal, não HTML.

Manter exatamente os seis cabeçalhos `id,ordem,titulo,texto,foto,pergunta`. Adicionar, remover ou reordenar linhas válidas reconstrói o tabuleiro automaticamente, entre 1 e 100 casas. Casas novas usam a personagem adulta e um cenário do estilo existente. Linhas incompletas, IDs ou ordens duplicados suspendem a aplicação da nova versão até à correção; uma planilha totalmente vazia é recusada.

## Atualizações e proteção contra falhas

- O site consulta o CSV ao abrir, a cada 60 segundos enquanto estiver visível e ao voltar à aba.
- Cada consulta usa `cache: no-store` e um parâmetro único. A republicação pelo Google pode introduzir atraso adicional; não é uma ligação instantânea em tempo real.
- A atualização mantém a casa atual pelo ID e a etapa história/pergunta. Se houver uma animação em curso, a nova versão só é aplicada quando a personagem parar.
- Uma alteração inválida, falha de rede ou foto nova inacessível não apaga a versão em uso. A última versão validada fica guardada localmente quando o navegador permite armazenamento.
- O conteúdo embutido em `docs/content.js` e `docs/milestones.json` é apenas a fotografia da migração para arranque/fallback, não uma segunda fonte de edição. Alterar a planilha para o conteúdo corrente.
- Nenhuma credencial Google é incluída no site. A fonte pública é consultada diretamente, sem servidor privado nem dependência deste computador estar ligado.

## Código, estilos e cache

O script `python3 scripts/stamp_release.py` gera o timestamp UTC da aplicação e URLs versionados para os scripts e estilos locais. O hook versionado `.githooks/pre-commit` executa-o automaticamente no fluxo de publicação deste checkout. Em novos clones, ativar com `git config core.hooksPath .githooks`.

O hook recusa alterações não preparadas em `docs/`; rever e preparar os ficheiros antes de fazer commit. Verificar o resultado com `python3 scripts/stamp_release.py --check`.

O cache útil das imagens e fontes pode continuar ativo; ficheiros locais alterados recebem URLs versionados. A leitura de novos conteúdos da planilha não depende de novo commit, build ou de limpar o cache do navegador. Uma aba antiga que ainda não recebeu a integração precisa ser recarregada uma vez.

## Verificação

- `node --test qa/sheet-data.test.cjs qa/draft-data.test.cjs qa/sheet-sync.test.cjs`: parsers, seleção explícita do rascunho e sincronização.
- `node qa/questions-browser.cjs`: cópia literal, cards obrigatórios, ausência de formulário/skip e três larguras.
- `node qa/browser.cjs --restart-ground` e `--end-controls`: reinício em três fases e coordenadas fixas dos controles.
- `node qa/sheets-browser.cjs`: leitura da fonte real e alterações simuladas no navegador, incluindo título/texto/foto, conteúdo inválido, falha de rede e preservação da casa atual.
- `node qa/browser.cjs --motion --full`: todas as casas do snapshot em três larguras, teclado, toque, fotos e giro.
- `python3 qa/test_release_stamp.py`: timestamp de publicação e versão visível.

Distinguir testes simulados de alterações reais à planilha. Para comprovar toda a propagação de edição Google até à página aberta, um editor autorizado deve fazer uma pequena alteração, confirmar o resultado no site e repor o valor final. Não afirmar esse teste realizado apenas porque a leitura pública e as simulações passaram.
