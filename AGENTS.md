# Instruções do projeto

## Validação editorial obrigatória

Siga `EDITORIAL-WORKFLOW.md` antes de alterar textos, títulos, comentários ou metadados do site. Mostre a proposta completa no chat e aguarde aprovação explícita da versão. Pedidos de correção não autorizam publicação automática. Enquanto a proposta estiver em revisão, não altere `docs/`, `TEXTOS.md` nem publique o rascunho. Registe o feedback no projeto, nunca em memória global com dados biográficos.

## Skills disponíveis

Este projeto utiliza skills de `PauloSanches/skills-bp`, instaladas localmente em `.agents/skills/`.

| Skill | Quando consultar |
| --- | --- |
| `.agents/skills/find-skills/SKILL.md` | Descobrir novas capacidades reutilizáveis |
| `.agents/skills/agent-browser/SKILL.md` | Automatizar ou testar a interface de um website |
| `.agents/skills/mcp-builder/SKILL.md` | Implementar ou avaliar servidores MCP |
| `.agents/skills/python-performance-optimization/SKILL.md` | Investigar desempenho de Python |

Antes de uma tarefa, leia somente as skills instaladas e relevantes; carregue recursos associados conforme necessário. Remova desta tabela as skills que não instalou.

Use as ferramentas equivalentes disponíveis no ambiente. Exemplos específicos de um harness não substituem as permissões e instruções deste projeto. Não instale dependências globalmente, execute scripts ou publique alterações externas sem autorização para esse âmbito.

## Comandos e convenções do projeto

A aplicação estática fica em `docs/`: HTML, CSS, JavaScript e assets locais, sem build. A publicação Pages usa apenas `docs/` no ramo `main`. Preserve o site principal do utilizador e a visibilidade atual deste repositório. Nunca inventar resultados de testes nem guardar segredos neste ficheiro.

A revisão de `skills-bp` está fixada em `.agents/skills-bp.lock.json`; os hashes e licenças upstream estão em `.agents/sources.lock.json` e `.agents/THIRD_PARTY.md`. Carregue explicitamente o `SKILL.md` relevante: a localização comum não garante descoberta automática pelo harness.

## Versão de publicação

Cada publicação deve passar pelo hook `.githooks/pre-commit`, que gera um timestamp ISO UTC fixo em `docs/version.json` e no canto inferior direito do HTML. Ativar o hook em cada clone com `git config core.hooksPath .githooks`. Rever e preparar as alterações antes do commit; o hook recusa ficheiros do site com alterações não preparadas. Não usar a hora de visita do navegador como versão. Validar com `python3 scripts/stamp_release.py --check` e confirmar a mesma versão no site publicado. Se outro fluxo de build for introduzido, executar o gerador nesse fluxo antes da publicação.
