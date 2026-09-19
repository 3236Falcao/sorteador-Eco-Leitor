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
