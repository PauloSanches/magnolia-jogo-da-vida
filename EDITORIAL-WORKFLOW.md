# Validação editorial da Magnolia

## Estado final autorizado

O utilizador aprovou as correções de português, a pergunta «Qual era meu nome de casada?» e a publicação sem dependência da planilha. A edição final é estática; `docs/content.js` é o conteúdo carregado pelo site, espelhado em `docs/milestones.json`, `TEXTOS.md` e `editorial/approved-copy.json`. O áudio permanece removido. A autorização anterior de sincronização abaixo é histórica e não deve ser reativada sem novo pedido.

## Histórico: fonte colaborativa e publicação automática

O utilizador autorizou a aba Google Sheets em `CONTENT-EDITING.md` como fonte principal dos milestones, com publicação automática das alterações dos seus editores. Essa autorização inclui títulos, textos, fotos, ordem e novas linhas válidas. Ela substitui a aprovação por chat para essas edições; mudanças propostas no chat fora dessa fonte continuam sujeitas ao fluxo abaixo. Permissões e dados de outras abas não estão abrangidos.

`docs/milestones.json`, os dados embutidos de arranque, `TEXTOS.md` e `editorial/approved-copy.json` são snapshots de fallback/histórico. Não os editar como uma segunda fonte concorrente. Ao atualizar o snapshot, ler a fonte publicada e preservar os IDs e os textos exatamente.

## Regra principal para propostas no chat

Os textos são aprovados no chat antes de entrarem no site. Um pedido de nova redação ou uma correção factual autoriza preparar uma proposta, não publicá-la. Este fluxo aplica-se a títulos, narrativas, comentários, metadados e textos de acessibilidade.

## Estados

`rascunho` → `em revisão` → `aprovado` → `publicado`

Qualquer alteração ao texto após aprovação devolve os trechos modificados à revisão, salvo autorização explícita do utilizador para essa alteração exata.

## 1. Preparar

- Ler a versão remota atual e as correções recentes da família.
- Usar a skill `copy-editing` para rever clareza, voz e coerência; adaptar os critérios comerciais à homenagem, sem inventar acontecimentos ou sentimentos.
- Manter o rascunho fora de `docs/` e não substituir `TEXTOS.md`, que representa o texto publicado.
- Identificar a versão da proposta e o âmbito das mudanças.

## 2. Mostrar no chat

- Para uma revisão global, mostrar todos os títulos e textos completos de todas as casas, na ordem do tabuleiro. Incluir comentários se existirem.
- Para uma correção pontual, mostrar os trechos completos afetados e qualquer ligação que precise de ajuste.
- Dizer claramente que é uma proposta e que o site ainda não foi alterado.
- Pedir aprovação ou correções. Comentários, silêncio ou uma nova correção não são aprovação para publicar.

## 3. Rever

- Aplicar o feedback apenas ao rascunho e mostrar a nova versão dos trechos afetados.
- Não acrescentar anedotas, dificuldades ou conquistas que não foram fornecidas.
- Em caso de ambiguidade factual, perguntar antes de transformar a hipótese em texto definitivo.

## 4. Aprovar e aplicar

- Exigir aprovação explícita e inequívoca da proposta apresentada; por exemplo, “aprovado, pode atualizar”. Não exigir uma frase exata.
- Antes da escrita, comparar o ramo remoto com a base do rascunho para preservar trabalho de outras sessões.
- Aplicar somente a versão aprovada e sincronizar a abertura HTML e `TEXTOS.md`.
- Não modificar interação, imagens ou estilo visual sem necessidade para o texto aprovado.

## 5. Verificar e publicar

- Conferir texto aplicado contra o aprovado, nomes, idades, datas e restrições editoriais.
- Verificar sintaxe e leitura dos balões; testar rolagem e navegação quando o tamanho dos textos mudar.
- Publicar somente no repositório do projeto, preservando o site principal da conta.
- Ler de volta o commit e os ficheiros remotos. Confirmar o build e o conteúdo servido pelo Pages antes de anunciar publicação.
- Informar brevemente o que foi publicado e o URL.

## Direção em revisão

- Tom leve, divertido e positivo, inspirado no Jogo da Vida; usar ritmo natural, sem rimas forçadas nem poesia solene.
- Título inicial solicitado: “Jogo da Vida versão Magnólia”.
- Retirar referências a Agnaldo trabalhar fora e a Olívia ficar em casa. Não confundir essa retirada editorial com uma alteração dos factos fornecidos.
- Não reintroduzir pobreza, “ingrata”, perda do bebê, imposição materna, ciúmes ou separações no texto celebrativo.
- A proposta `13-casas-v5`, incluindo a revisão da casa 2 com Porto da Rua, Tatuamunha e Porto de Pedras e a foto de Alagoas, foi aprovada pelo pedido “atualize o site”. O texto autorizado está em `editorial/approved-copy.json`. Novas revisões continuam a exigir aprovação.
