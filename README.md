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
2. Importe sua lista local: **CSV** (`turma,nivel,nome`) na seção 1, **XLSX** na seção 1B — ou clique em “Carregar exemplo fictício”.
3. No XLSX, confira a prévia (alunos, turmas, níveis, 5 primeiras linhas) e confirme.
4. Clique em “Sortear nova amostra (rodízio)” ou “Manter amostra da semana”.
5. Marque “evidência coletada” somente quando a coleta real acontecer.

Lista real fica só no seu computador (arquivo + navegador, 100% offline). Veja `docs/PRIVACIDADE.md`.

## Formatos aceitos
- **CSV UTF-8** com cabeçalho `turma,nivel,nome` (aceita `;` ou `,`).
- **XLSX local** (SheetJS vendorizada em `app/vendor/`, sem internet, sem servidor):
  - **Padrão:** colunas `turma | nivel | nome` (aceita `TURMA`, `Nível`, `NOME` etc.);
  - **Blocos:** `Turma A | Nível | Turma B | Nível | …` (turma sai do cabeçalho do bloco — ex.: `lista geral.xlsx`);
  - primeira aba útil detectada automaticamente; prévia obrigatória antes de importar.
- O XLSX original nunca chega ao clipboard: só texto puro via `gerarTextoAmostra()` + `clipboard.writeText()`.

## Estrutura
- `app/index.html` — aplicação HTML offline;
- `app/vendor/xlsx.full.min.js` — SheetJS CE 0.18.5 vendorizada (leitura XLSX 100% local);
- `app/xlsx-import.js` — parser XLSX puro (padrão + blocos), sem DOM, testável em Node;
- `data/` — arquivos reais locais (ignorados pelo Git) + `alunos.exemplo.csv` fictício;
- `launcher/` — lançador shell + `.desktop`;
- `scripts/` — `instalar-desktop.sh`, `gerar-deb.sh`, `testar.sh`, `testar-clipboard.js`, `testar-xlsx.js`, `baixar-xlsx-lib.sh`;
- `docs/` — `ARQUITETURA.md`, `DECISOES.md`, `PRIVACIDADE.md`;
- `INSTALAR_DESKTOP.sh` — instalador legado mantido por compatibilidade.

## Status
v0.3 — importação CSV + XLSX local, amostra semanal com rodízio + checklist de evidência, 100% local.
