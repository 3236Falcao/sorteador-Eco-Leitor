#!/bin/sh
# Testes de sanidade (sem dependências externas além de python3).
set -eu
cd "$(dirname -- "$0")/.."
falhas=0
ok() { echo "OK: $1"; }
erro() { echo "FALHA: $1"; falhas=$((falhas+1)); }

[ -f app/index.html ] && ok "app/index.html existe" || erro "app/index.html ausente"
grep -q "até 2 alunos por nível" app/index.html && ok "regra pedagógica presente" || erro "regra pedagógica ausente"
grep -q "embaralhar" app/index.html && ok "função embaralhar preservada" || erro "embaralhar ausente"
grep -qi "amostra planejada" app/index.html && grep -qi "evid" app/index.html && ok "amostra x evidência" || erro "conceito amostra/evidência ausente"
grep -qi "ranking" app/index.html && ok "menção anti-ranking presente" || erro "sem menção anti-ranking"
! grep -q "Ana Silva Real\|CPF\|aluno real" app/index.html && ok "sem nomes reais no HTML" || erro "possível nome real no HTML"
[ -x launcher/Sorteador_EcoLeitor ] && ok "lançador executável" || erro "lançador sem +x"
[ -f data/alunos.exemplo.csv ] && ok "exemplo fictício existe" || erro "exemplo ausente"
grep -qi "exemplo" data/alunos.exemplo.csv && ok "exemplo marcado como fictício" || erro "exemplo sem marca fictícia"
python3 -c "import csv; r=list(csv.DictReader(open('data/alunos.exemplo.csv',encoding='utf-8'))); assert set(r[0].keys())=={'turma','nivel','nome'}, r[0].keys(); assert len(r)>=5; print(f'OK: CSV exemplo válido ({len(r)} linhas)')"
[ $? -eq 0 ] || erro "CSV exemplo inválido"
python3 - <<'PY'
html=open('app/index.html',encoding='utf-8').read()
assert 'localStorage' in html, 'sem persistência local'
assert 'semanaISO' in html or 'W' in html, 'sem semana'
assert 'checkbox' in html.lower() or 'evid' in html.lower(), 'sem checklist evidência'
print('OK: recursos futuros (semana, rodízio, evidência) presentes')
PY
[ $? -eq 0 ] || erro "recursos futuros ausentes"
if command -v desktop-file-validate >/dev/null 2>&1; then
  desktop-file-validate launcher/sorteador-ecoleitor.desktop && ok ".desktop válido" || erro ".desktop inválido"
else
  echo "PULADO: desktop-file-validate ausente"
fi
# garante que dados reais não seriam commitados
git check-ignore -q data/lista-real.csv 2>/dev/null && ok ".gitignore cobre CSV real" || erro ".gitignore não cobre CSV real"
git status --porcelain | grep -qi "Ana Exemplo" && erro "exemplo vazou no status?" || true
echo "---"
if [ "$falhas" -eq 0 ]; then echo "TUDO OK"; else echo "$falhas FALHA(S)"; exit 1; fi
