#!/bin/sh
# Baixa (uma vez) a SheetJS CE para app/vendor/ — execução do app é 100% offline.
# Versão pinada + conferência SHA-256. Rode: ./scripts/baixar-xlsx-lib.sh
set -eu
cd "$(dirname -- "$0")/.."
VERSAO="0.18.5"
URL="https://cdn.jsdelivr.net/npm/xlsx@${VERSAO}/dist/xlsx.full.min.js"
ESPERADO="c9506197caf809a075b6dee1da0d36fb19da7158ffe8a88e7b0c96c5d8623c99"
mkdir -p app/vendor
DEST="app/vendor/xlsx.full.min.js"
if [ -f "$DEST" ]; then
  echo "Já existe: $DEST — removendo para baixar de novo..."
  rm -f "$DEST"
fi
curl -sSL --max-time 120 -o "$DEST" "$URL"
OBTIDO="$(sha256sum "$DEST" | cut -d' ' -f1)"
echo "SHA-256: $OBTIDO"
if [ "$OBTIDO" != "$ESPERADO" ]; then
  echo "AVISO: hash difere do registrado ($ESPERADO). Confira a versão antes de commitar." >&2
  exit 1
fi
echo "OK: SheetJS $VERSAO em $DEST ($(wc -c < "$DEST") bytes). Licença Apache-2.0 (SheetJS CE)."
node -e "const X=require('./app/vendor/xlsx.full.min.js'); console.log('OK: lib carrega, versão '+X.version)"
