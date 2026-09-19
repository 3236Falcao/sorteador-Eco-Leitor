# Privacidade — dados dos estudantes

- Nomes reais NUNCA entram no repositório público.
- Lista real vive em: arquivo CSV em `data/` (ignorado) + `localStorage` do navegador do professor.
- O que É versionado: código, exemplo fictício (` *_exemplo / Exemplo`), docs.
- O que NÃO é versionado: `data/*` (exceto `alunos.exemplo.csv`), `*.xlsx`, `*.ods`, `*.csv` (exceto exemplo), `*.db`, backups.
- Antes de cada `git add/commit`, rode `git status` e confira que nenhum nome real aparece.
- Se um nome real vazar por acidente: remova do histórico com `git filter-repo` ou recriação do commit + aviso, e troque o arquivo local.
