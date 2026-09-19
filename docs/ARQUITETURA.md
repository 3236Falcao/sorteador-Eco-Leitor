# Arquitetura — Sorteador EcoLeitor v0.2

## Princípio
Aplicação 100% local, offline, sem backend. Um único `app/index.html` (sem dependências) + `localStorage` do navegador.

## Componentes
- `app/index.html`: UI + lógica de sorteio + import CSV + rodízio + checklist de evidência.
- `data/`: CSV real fica aqui (ignorado pelo Git). Só `alunos.exemplo.csv` (fictício) é versionado.
- `launcher/`: abre o HTML no navegador padrão (xdg-open).
- `scripts/`: instala atalho na Área de Trabalho e gera `.deb`.
- `docs/`: decisões pedagógicas e técnicas.

## Fluxo
1. Professor importa CSV local (`turma,nivel,nome`) → salvo em `localStorage (ecoleitor.alunos.v1)`.
2. Sorteio agrupa por `turma+nível`, ordena níveis pela ordem pedagógica e turmas alfabeticamente.
3. Rodízio: conta sorteios das últimas 8 semanas (`ecoleitor.historico.v1`), prioriza menor contagem, desempata com Fisher-Yates.
4. Semana ISO (`2026-W38`) identifica o ciclo. “Manter amostra” reaproveita o sorteio da semana (acompanhamento longitudinal).
5. Checklist de evidência (`ecoleitor.evidencias.v1`, chave `SEMANA||TURMA||NIVEL||NOME`) registra coleta real. Amostra ≠ evidência.

## Evolução futura prevista (sem quebrar privacidade)
- Importação XLSX/ODS (hoje só CSV para manter zero-dependência).
- Exportar/importar JSON local de backup.
- Filtro por turma e impressão da lista semanal.
- Tudo continua local; nenhum dado sai do computador.
