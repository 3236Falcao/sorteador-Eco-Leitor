# Sorteador EcoLeitor

Sorteador estratégico de amostra para acompanhamento longitudinal de leitura e escrita.

## Objetivo
Selecionar até 2 alunos por nível em cada turma para coleta de evidências do EcoLeitor, sem transformar a coleta em ranking ou nota.

## Regras pedagógicas (não mudar sem registrar em `docs/DECISOES.md`)
- seleção separada por Turma + Nível;
- até 2 alunos por grupo;
- a seleção é uma amostra planejada;
- amostra planejada NÃO é evidência coletada (só conta com checklist marcado);
- sem ranking entre alunos; sem pontos de gamificação;
- ciclo semanal permite acompanhar os mesmos alunos ou renovar com rodízio.

## Uso rápido (Linux)
1. Abra `app/index.html` no navegador — ou rode `./launcher/Sorteador_EcoLeitor`.
2. Importe seu CSV local (`turma,nivel,nome`) ou clique em “Carregar exemplo fictício”.
3. Clique em “Sortear nova amostra (rodízio)” ou “Manter amostra da semana”.
4. Marque “evidência coletada” somente quando a coleta real acontecer.

Lista real fica só no seu computador (`data/` + navegador). Veja `docs/PRIVACIDADE.md`.

## Estrutura
- `app/index.html` — aplicação HTML offline (zero-dependência);
- `data/` — CSV real local (ignorado pelo Git) + `alunos.exemplo.csv` fictício;
- `launcher/` — lançador shell + `.desktop`;
- `scripts/` — `instalar-desktop.sh`, `gerar-deb.sh`, `testar.sh`;
- `docs/` — `ARQUITETURA.md`, `DECISOES.md`, `PRIVACIDADE.md`;
- `INSTALAR_DESKTOP.sh` — instalador legado mantido por compatibilidade.

## Status
v0.2 — amostra semanal com rodízio + checklist de evidência, 100% local.
