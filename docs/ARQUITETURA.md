# Arquitetura — Sorteador EcoLeitor v0.3

## Princípio
Aplicação 100% local, offline, sem backend. `app/index.html` + `localStorage` + SheetJS vendorizada (nenhum CDN em execução, nenhum servidor).

## Componentes
- `app/index.html`: UI + sorteio + import CSV + import XLSX + rodízio + checklist de evidência.
- `app/vendor/xlsx.full.min.js`: SheetJS CE 0.18.5 vendorizada (Apache-2.0) — leitura XLSX local.
- `app/xlsx-import.js`: parser XLSX puro (modos `padrao` e `blocos`), sem DOM; reutilizado pelos testes Node.
- `data/`: arquivos reais ficam aqui (ignorado pelo Git). Só `alunos.exemplo.csv` (fictício) é versionado.
- `launcher/`: abre o HTML no navegador padrão (xdg-open).
- `scripts/`: atalho Desktop, `.deb`, testes (`testar.sh`, `testar-clipboard.js`, `testar-xlsx.js`) e `baixar-xlsx-lib.sh`.
- `docs/`: decisões pedagógicas e técnicas.

## Fluxo
1. Professor importa **CSV** (`turma,nivel,nome`, via `readAsText` + guarda anti-binária) **ou XLSX** (via `readAsArrayBuffer` → SheetJS → `EcoXlsx.parseWorkbookXLSX`) → prévia (XLSX) → salvo em `localStorage (ecoleitor.alunos.v1)`.
2. Sorteio agrupa por `turma+nível`, ordena níveis pela ordem pedagógica e turmas alfabeticamente. Regra até-2 intacta.
3. Rodízio: conta sorteios das últimas 8 semanas (`ecoleitor.historico.v1`), prioriza menor contagem, desempata com Fisher-Yates.
4. Semana ISO (`2026-W38`) identifica o ciclo. “Manter amostra” reaproveita o sorteio da semana (acompanhamento longitudinal).
5. Checklist de evidência (`ecoleitor.evidencias.v1`, chave `SEMANA||TURMA||NIVEL||NOME`) registra coleta real. Amostra ≠ evidência.
6. Clipboard recebe só `gerarTextoAmostra()` validada (`ehTextoSeguroParaClipboard`) via `writeText`. Bytes do XLSX nunca chegam lá.

## Evolução futura prevista (sem quebrar privacidade)
- Exportar/importar JSON local de backup.
- Filtro por turma e impressão da lista semanal.
- Tudo continua local; nenhum dado sai do computador.
