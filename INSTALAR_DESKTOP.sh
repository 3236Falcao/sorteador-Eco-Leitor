#!/bin/sh
set -eu
BASE="$HOME/Sorteador_EcoLeitor"
mkdir -p "$BASE"
cp -r app "$BASE/"
cp launcher/Sorteador_EcoLeitor "$BASE/Sorteador_EcoLeitor"
chmod +x "$BASE/Sorteador_EcoLeitor"
DESKTOP="$HOME/Desktop"
[ -d "$HOME/Área de Trabalho" ] && DESKTOP="$HOME/Área de Trabalho"
mkdir -p "$DESKTOP"
cat > "$DESKTOP/Sorteador_EcoLeitor.desktop" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Sorteador EcoLeitor
Comment=Sorteio estratégico de amostra do EcoLeitor
Exec=$BASE/Sorteador_EcoLeitor
Terminal=false
Categories=Education;Utility;
EOF
chmod +x "$DESKTOP/Sorteador_EcoLeitor.desktop"
echo "Instalado em $BASE"
