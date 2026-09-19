#!/bin/sh
# Gera pacote .deb instalável (requer dpkg-deb; fakeroot opcional).
set -eu
cd "$(dirname -- "$0")/.."
VERSAO="${1:-0.2.0}"
PKG="sorteador-ecoleitor"
BUILD="build/${PKG}_${VERSAO}_all"
rm -rf "$BUILD"
mkdir -p "$BUILD/opt/sorteador-ecoleitor" "$BUILD/usr/bin" "$BUILD/usr/share/applications" "$BUILD/DEBIAN"
cp -r app "$BUILD/opt/sorteador-ecoleitor/"
cp data/alunos.exemplo.csv "$BUILD/opt/sorteador-ecoleitor/app/alunos.exemplo.csv" 2>/dev/null || cp data/alunos.exemplo.csv "$BUILD/opt/sorteador-ecoleitor/" || true
cp launcher/Sorteador_EcoLeitor "$BUILD/opt/sorteador-ecoleitor/Sorteador_EcoLeitor"
chmod +x "$BUILD/opt/sorteador-ecoleitor/Sorteador_EcoLeitor"
cat > "$BUILD/usr/bin/sorteador-ecoleitor" <<'EOF'
#!/bin/sh
exec /opt/sorteador-ecoleitor/Sorteador_EcoLeitor "$@"
EOF
chmod +x "$BUILD/usr/bin/sorteador-ecoleitor"
cat > "$BUILD/usr/share/applications/sorteador-ecoleitor.desktop" <<'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=Sorteador EcoLeitor
Comment=Sorteio estratégico de amostra do EcoLeitor
Exec=/usr/bin/sorteador-ecoleitor
Terminal=false
Categories=Education;
Keywords=sorteio;leitura;ecoleitor;
EOF
cat > "$BUILD/DEBIAN/control" <<EOF
Package: $PKG
Version: $VERSAO
Section: education
Priority: optional
Architecture: all
Maintainer: Sorteador EcoLeitor <local>
Description: Sorteio estratégico de amostra do EcoLeitor
 Amostra de até 2 alunos por nível/turma, 100% local e offline.
 Lista real de alunos permanece no computador do professor.
EOF
mkdir -p dist
if command -v fakeroot >/dev/null 2>&1; then
  fakeroot dpkg-deb --build "$BUILD" "dist/${PKG}_${VERSAO}_all.deb"
else
  dpkg-deb --build "$BUILD" "dist/${PKG}_${VERSAO}_all.deb"
fi
echo "Pacote gerado: dist/${PKG}_${VERSAO}_all.deb"
dpkg-deb -c "dist/${PKG}_${VERSAO}_all.deb" | head -n 30
