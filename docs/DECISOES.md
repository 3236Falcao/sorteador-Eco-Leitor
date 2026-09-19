# Decisões — lógica pedagógica e técnica

## Pedagógicas (imutáveis sem registro explícito)
1. Até 2 alunos por nível dentro de cada turma. Não alterado na v0.2.
2. Seleção é amostra planejada, NÃO evidência coletada. Evidência só conta com checklist marcado.
3. Sem ranking entre alunos; sem pontos de gamificação a partir do EcoLeitor.
4. Ciclo semanal: permite acompanhar os mesmos alunos (“Manter amostra”) OU renovar com rodízio.
5. Rodízio evita repetir sempre os mesmos, mas não impede acompanhamento — os dois modos coexistem por decisão do professor.

## Técnicas
- v0.1 tinha turmas fixas `["A","B"]`. v0.2 detecta turmas dinamicamente (preserva A/B como caso particular). Decisão registrada: extensão, não quebra da regra.
- Níveis mantêm ordem pedagógica fixa; níveis desconhecidos vão para o fim em ordem alfabética.
- Zero-dependência mantida (funciona com `file://`); por isso CSV puro, sem XLSX nesta etapa.
- `localStorage` escolhido por simplicidade Linux/desplugado; backup via reimportação do CSV.
- Dados reais fora do Git via `.gitignore` + aviso em UI + pasta `data/` local.

## Bug clipboard v0.2 → fix v0.2.1 (2026-09-19)
- Sintoma: “Copiar resultado” entregava lixo binário (`PK`, `xl/sharedStrings.xml`, `xl/worksheets/sheet1.xml`, `[Content_Types].xml`, `docProps/app.xml`).
- Causa raiz: o import aceitava qualquer arquivo e fazia `FileReader.readAsText(xlsx)`. XLSX é ZIP (`PK\x03\x04`); lido como texto ele expõe os XMLs internos. O `parseCSV()` antigo não tinha guarda binária e transformava trechos do ZIP (que contêm vírgulas nos `sharedStrings`) em falsos “alunos”. Esses registros contaminavam `alunos` → `localStorage` → `sortear()` → `writeText()`. O clipboard em si usava `writeText` corretamente — o problema era dado contaminado a montante, não `Blob`/`write()`.
- Correção (sem mudar a regra até-2): (1) bloqueia `.xlsx/.xls/.ods/.zip` pelo nome + assinatura `PK`/`[Content_Types].xml`/`xl/`/`docProps/`/`\x00` no conteúdo, com mensagem “salve como CSV UTF-8”; (2) `parseCSV()` recusa binário e sanitiza campos (remove controles, limita tamanho, rejeita `<>{}[]\=`); (3) nova fronteira `gerarTextoAmostra()` pura (só strings) + `ehTextoSeguroParaClipboard()` que aborta a cópia se achar `PK`, `xl/`, `Content_Types`, `sharedStrings`, `worksheets`; (4) cópia via `writeText` com fallback `textarea+execCommand`, nunca `write()`/`Blob`/`ArrayBuffer`; (5) `readAsText` mantido, `readAsArrayBuffer` proibido no import.
- Pipeline garantido: arquivo → texto validado → objetos `{turma,nivel,nome}` → sorteio → texto puro → clipboard. XLSX original nunca chega ao clipboard.
- Testes: `scripts/testar-clipboard.js` (Node, sem deps) cobre CSV válido, XLSX simulado recusado, formato `AMOSTRA ECOLEITOR/Turma/nomes`, ausência de `PK`, `xl/`, `[Content_Types].xml`, `sharedStrings.xml`, `worksheets/`, e bloqueio de resultado contaminado; `scripts/testar.sh` passou a chamá-lo.

## Importação XLSX local v0.3 (2026-09-19)
- Motivação: a lista real (`lista geral.xlsx`) não podia ser usada sem quebrar a proteção anti-binário da v0.2.1.
- Biblioteca: **SheetJS CE 0.18.5** (`xlsx.full.min.js`, Apache-2.0), **vendorizada** em `app/vendor/` (SHA-256 `c9506197…5d8623c99`, origem `cdn.jsdelivr.net/npm/xlsx@0.18.5`, reprodutível via `scripts/baixar-xlsx-lib.sh`). Motivo: parser ZIP+XML completo e testado, build UMD que roda em `file://` sem bundler e offline; ExcelJS exigiria bundling e é maior; parser manual seria frágil. Em execução, zero rede: sem CDN, sem servidor, 100% local.
- Caminhos separados, sem mistura: CSV usa `readAsText→parseCSV`; XLSX usa `readAsArrayBuffer→XLSX.read(type:array)→EcoXlsx.parseWorkbookXLSX`. A guarda anti-binário da v0.2.1 foi mantida (assinatura ZIP, `PK`, `xl/`, `Content_Types`, `\x00`).
- Primeira aba útil: ordena abas por (tem cabeçalho válido?, nº de linhas) — capa sem cabeçalho perde para a aba de dados.
- Colunas (sem inventar): normaliza (minúsculas, sem acento, espaços) e aceita `turma|class|classe`, `nivel|level`, `nome|name|aluno|aluna|estudante`. Sem as 3 (ou sem bloco válido), erro claro com o formato esperado; nada é importado.
- Layout em blocos (caso real `lista geral.xlsx`: `Turma A|Nível|Turma B|Nível`): cada bloco vira pares (nome, nível) com turma extraída do cabeçalho (`Turma A`→`A`, preservando caixa para compor com bases CSV). Extensão de leitura; regra até-2 inalterada.
- Prévia obrigatória antes de confirmar: total, turmas, níveis e 5 primeiras linhas; confirmar/descartar explícitos.
- Pipeline pós-parsing idêntico: objetos → mesma sanitização → sorteio → `gerarTextoAmostra()` → `ehTextoSeguroParaClipboard()` → `writeText()`. XLSX original jamais chega ao clipboard.
- Regra pedagógica (até 2/turma+nível, sem ranking/pontos, evidência≠amostra, rodízio) intocada.
- Teste real: `lista geral.xlsx` usado só localmente (50 alunos, turmas A/B, 19 grupos, amostra 27, 0 violações, texto sem `PK/xl/XML`); arquivo e nomes jamais commitados.
