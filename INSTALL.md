# Instalação local no Linux

## Opção A — abrir direto (mais simples)
1. Extraia/clone o projeto.
2. Clique duplo em `app/index.html` — ou rode:
   `./launcher/Sorteador_EcoLeitor`

## Opção B — atalho na Área de Trabalho (por usuário, sem sudo)
```
./scripts/instalar-desktop.sh
# (legado equivalente: ./INSTALAR_DESKTOP.sh)
```
- Copia para `~/Sorteador_EcoLeitor` e cria `~/Desktop/Sorteador_EcoLeitor.desktop`.
- Para confiar no atalho: clique com botão direito → “Permitir executar” (GNOME/Nemo marcam como confiável após `gio set ... trusted` automático quando disponível).

## Opção C — pacote .deb (recomendado p/ distribuir sem dados)
```
./scripts/gerar-deb.sh 0.2.0
sudo dpkg -i dist/sorteador-ecoleitor_0.2.0_all.deb
sorteador-ecoleitor
```
- Instala em `/opt/sorteador-ecoleitor`, binário em `/usr/bin/sorteador-ecoleitor` e atalho em `/usr/share/applications`.

## Lista de alunos (privacidade)
- Guarde seus arquivos reais fora do Git (`data/` é ignorado) ou só no navegador.
- **CSV:** cabeçalho `turma,nivel,nome`, UTF-8.
- **XLSX:** processado 100% localmente (SheetJS em `app/vendor/`, sem rede, sem servidor, sem CDN em execução). Colunas `turma|nivel|nome` ou blocos `Turma A|Nível|Turma B|Nível`; prévia antes de confirmar.
- Nunca commite nomes reais nem a `lista geral.xlsx`. Só `data/alunos.exemplo.csv` (fictício) vai para o Git.
