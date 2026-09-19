#!/bin/sh
# Instalador do atalho na Área de Trabalho (sem sudo, por usuário).
# Mantém compatibilidade com o INSTALAR_DESKTOP.sh legado da raiz.
set -eu
cd "$(dirname -- "$0")/.."
BASE="$HOME/Sorteador_EcoLeitor"
mkdir -p "$BASE"
cp -r app "$BASE/"
cp launcher/Sorteador_EcoLeitor "$BASE/Sorteador_EcoLeitor"
chmod +x "$BASE/Sorteador_EcoLeitor"
mkdir -p "$BASE/data"
[ -f "$BASE/data/alunos.exemplo.csv" ] || cp data/alunos.exemplo.csv "$BASE/data/" 2>/dev/null || true
DESKTOP="$HOME/Desktop"
if [ -d "$HOME/Área de Trabalho" ]; then DESKTOP="$HOME/Área de Trabalho"; fi
mkdir -p "$DESKTOP"
cat > "$DESKTOP/Sorteador_EcoLeitor.desktop" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Sorteador EcoLeitor
Comment=Sorteio estratégico de amostra do EcoLeitor
Exec=$BASE/Sorteador_EcoLeitor
Terminal=false
Categories=Education;
EOF
chmod +x "$DESKTOP/Sorteador_EcoLeitor.desktop"
if command -v desktop-file-validate >/dev/null 2>&1; then
  desktop-file-validate "$DESKTOP/Sorteador_EcoLeitor.desktop" || true
fi
if command -v gio >/dev/null 2>&1; then
  gio set "$DESKTOP/Sorteador_EcoLeitor.desktop" metadata::trusted true 2>/dev/null || true
fi
echo "Instalado em $BASE"
echo "Atalho em $DESKTOP/Sorteador_EcoLeitor.desktop"
echo "Lista real: coloque seu CSV em $BASE/data/ (nunca no Git)."
