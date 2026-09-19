/* Sorteador EcoLeitor — importação XLSX local (v0.3).
 * Módulo puro (sem DOM): usado pelo app/index.html E pelos testes Node.
 * Pipeline: XLSX --(SheetJS, ArrayBuffer)--> linhas --> {turma,nivel,nome}
 * --> sanitização --> sorteio --> gerarTextoAmostra() --> clipboard.writeText().
 * O arquivo/bytes originais NUNCA chegam ao clipboard.
 * Funciona em <script> clássico (file://) e em Node (module.exports).
 */
(function (raiz) {
"use strict";

var TURMA_VARIANTES = ["turma", "class", "classe"];
var NIVEL_VARIANTES = ["nivel", "level"];
var NOME_VARIANTES = ["nome", "name", "aluno", "aluna", "estudante"];

function normalizarCabecalho(s) {
  return String(s == null ? "" : s)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/\s+/g, " ").trim();
}

function sanitizarCampo(s) {
  return String(s == null ? "" : s)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\s+/g, " ").trim().slice(0, 120);
}

var ASSINATURAS = ["PK\x03\x04", "PK\x05\x06", "PK\x07\x08",
  "[Content_Types].xml", "xl/sharedStrings", "xl/worksheets",
  "xl/workbook", "xl/_rels", "docProps/", "_rels/.rels"];

function contemBinario(s) {
  if (typeof s !== "string" || !s) return false;
  if (s.indexOf("\x00") !== -1) return true;
  for (var i = 0; i < ASSINATURAS.length; i++) {
    if (s.indexOf(ASSINATURAS[i]) !== -1) return true;
  }
  return false;
}

function ehLinhaVazia(linha) {
  if (!linha) return true;
  for (var i = 0; i < linha.length; i++) {
    var v = linha[i];
    if (v !== null && v !== undefined && String(v).trim() !== "") return false;
  }
  return true;
}

function pontuarCabecalho(linha) {
  // Quantas células batem com turma/nivel/nome ou padrão "Turma X"?
  var pontos = 0;
  for (var i = 0; i < linha.length; i++) {
    var n = normalizarCabecalho(linha[i]);
    if (!n) continue;
    if (TURMA_VARIANTES.indexOf(n) !== -1 ||
        NIVEL_VARIANTES.indexOf(n) !== -1 ||
        NOME_VARIANTES.indexOf(n) !== -1) { pontos++; continue; }
    if (/^turma\s+.+/.test(n)) pontos++;
  }
  return pontos;
}

function mapaPadrao(header) {
  var mapa = { turma: -1, nivel: -1, nome: -1 };
  for (var i = 0; i < header.length; i++) {
    var n = normalizarCabecalho(header[i]);
    if (TURMA_VARIANTES.indexOf(n) !== -1 && mapa.turma === -1) mapa.turma = i;
    else if (NIVEL_VARIANTES.indexOf(n) !== -1 && mapa.nivel === -1) mapa.nivel = i;
    else if (NOME_VARIANTES.indexOf(n) !== -1 && mapa.nome === -1) mapa.nome = i;
  }
  return mapa;
}

function turmaDoBloco(rotulo) {
  // "Turma A" -> "A" (preserva a caixa original para compor com bases CSV "A"/"B").
  var bruto = String(rotulo == null ? "" : rotulo).replace(/\s+/g, " ").trim();
  var base = /^turma\s+/i.test(bruto)
    ? bruto.replace(/^\s*turma\s+/i, "").trim() || bruto
    : bruto;
  return sanitizarCampo(base).slice(0, 40);
}

function detectarBlocos(header) {
  // Layout em blocos lado a lado: ["Turma A","Nível","Turma B","Nível",...]
  // Cada bloco = {turma, nomeCol, nivelCol}. Exige ao menos 1 bloco completo.
  var blocos = [];
  for (var i = 0; i < header.length; i++) {
    var n = normalizarCabecalho(header[i]);
    var m = n.match(/^turma\s+(.+)$/);
    if (!m) continue;
    // próxima coluna não-vazia deve ser nível
    var j = i + 1;
    while (j < header.length && !normalizarCabecalho(header[j])) j++;
    if (j < header.length && NIVEL_VARIANTES.indexOf(normalizarCabecalho(header[j])) !== -1) {
      blocos.push({ turma: turmaDoBloco(header[i]), nomeCol: i, nivelCol: j });
      i = j;
    }
  }
  return blocos;
}

function registroValido(turma, nivel, nome) {
  turma = sanitizarCampo(turma);
  nivel = sanitizarCampo(nivel);
  nome = sanitizarCampo(nome);
  if (!turma || !nivel || !nome) return null;
  if (turma.length > 40 || nivel.length > 60 || nome.length > 120) return null;
  var junto = turma + " " + nivel + " " + nome;
  if (contemBinario(junto)) return null;
  if (/[<>{}[\]\\=]/.test(junto)) return null; // XML/caminho — não é dado de aluno
  return { turma: turma, nivel: nivel, nome: nome };
}

function resumir(alunos) {
  var turmas = [], niveis = [];
  alunos.forEach(function (a) {
    if (turmas.indexOf(a.turma) === -1) turmas.push(a.turma);
    if (niveis.indexOf(a.nivel) === -1) niveis.push(a.nivel);
  });
  turmas.sort(function (a, b) { return String(a).localeCompare(String(b), "pt-BR"); });
  return { turmas: turmas, niveis: niveis };
}

function parseWorkbookXLSX(arrayBuffer, xlsxLib) {
  if (!xlsxLib || typeof xlsxLib.read !== "function") {
    return { erro: "Biblioteca XLSX local não carregada (app/vendor/xlsx.full.min.js ausente). O CSV continua funcionando." };
  }
  var bytes;
  try {
    bytes = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer);
  } catch (e) {
    return { erro: "Arquivo ilegível: esperado um XLSX binário (ArrayBuffer)." };
  }
  // Guarda: precisa ter assinatura ZIP; texto puro aqui indica arquivo errado.
  if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4B) {
    return { erro: "O arquivo não parece ser um XLSX válido (assinatura ZIP ausente). Se é CSV, use a importação CSV." };
  }
  var wb;
  try {
    wb = xlsxLib.read(bytes, { type: "array" });
  } catch (e) {
    return { erro: "Não foi possível ler o XLSX (arquivo corrompido ou formato desconhecido)." };
  }
  if (!wb || !wb.SheetNames || !wb.SheetNames.length) {
    return { erro: "XLSX sem planilhas." };
  }
  // Abas candidatas: ordena por (tem cabeçalho válido?, nº de linhas úteis).
  // Assim uma "Capa" sem cabeçalho perde para "Dados" mesmo com empate de linhas.
  function cabecalhoDe(linhas) {
    var vistos = 0;
    for (var i = 0; i < linhas.length && vistos < 10; i++) {
      if (ehLinhaVazia(linhas[i])) continue;
      vistos++;
      if (pontuarCabecalho(linhas[i]) >= 2) return i;
    }
    return -1;
  }
  var candidatas = [];
  wb.SheetNames.forEach(function (nome) {
    var linhas;
    try {
      linhas = xlsxLib.utils.sheet_to_json(wb.Sheets[nome], { header: 1, defval: null, blankrows: false });
    } catch (e) { linhas = []; }
    var uteis = linhas.filter(function (l) { return !ehLinhaVazia(l); }).length;
    if (uteis > 0) candidatas.push({ nome: nome, linhas: linhas, uteis: uteis, idx: cabecalhoDe(linhas) });
  });
  if (!candidatas.length) {
    return { erro: "XLSX vazio: nenhuma aba contém dados." };
  }
  candidatas.sort(function (a, b) {
    var ha = a.idx !== -1 ? 1 : 0, hb = b.idx !== -1 ? 1 : 0;
    if (ha !== hb) return hb - ha;
    return b.uteis - a.uteis;
  });
  var tentada = candidatas[0];
  var linhas = tentada.linhas;
  var idxHeader = tentada.idx;
  if (idxHeader === -1) {
    return { erro: "Colunas não encontradas na aba “" + tentada.nome + "”. Esperado cabeçalho com turma, nivel e nome (ou blocos “Turma A | Nível | Turma B | Nível”)." };
  }
  var melhor = tentada.nome;
  var header = linhas[idxHeader];
  var alunos = [], ignoradas = 0;
  var mapa = mapaPadrao(header);
  var modo;
  if (mapa.turma !== -1 && mapa.nivel !== -1 && mapa.nome !== -1) {
    modo = "padrao";
    for (var r = idxHeader + 1; r < linhas.length; r++) {
      if (ehLinhaVazia(linhas[r])) continue;
      var reg = registroValido(linhas[r][mapa.turma], linhas[r][mapa.nivel], linhas[r][mapa.nome]);
      if (reg) alunos.push(reg); else ignoradas++;
    }
    if (!alunos.length) {
      return { erro: "Nenhuma linha válida abaixo do cabeçalho (turma,nivel,nome). Confira se os dados estão preenchidos." };
    }
  } else {
    var blocos = detectarBlocos(header);
    if (!blocos.length) {
      var faltam = [];
      if (mapa.turma === -1) faltam.push("turma");
      if (mapa.nivel === -1) faltam.push("nivel");
      if (mapa.nome === -1) faltam.push("nome");
      return { erro: "Coluna(s) ausente(s): " + faltam.join(", ") + ". Esperado cabeçalho com turma, nivel e nome (ou blocos “Turma A | Nível | …”)." };
    }
    modo = "blocos";
    for (var b = 0; b < blocos.length; b++) {
      for (var rr = idxHeader + 1; rr < linhas.length; rr++) {
        if (ehLinhaVazia(linhas[rr])) continue;
        var nome = linhas[rr][blocos[b].nomeCol];
        var nivel = linhas[rr][blocos[b].nivelCol];
        if (nome === null || nome === undefined || String(nome).trim() === "") continue;
        var regB = registroValido(blocos[b].turma, nivel, nome);
        if (regB) alunos.push(regB); else ignoradas++;
      }
    }
    if (!alunos.length) {
      return { erro: "Blocos de turma localizados, mas sem linhas válidas (nome + nível)." };
    }
  }
  var res = resumir(alunos);
  return {
    alunos: alunos, turmas: res.turmas, niveis: res.niveis,
    total: alunos.length, ignoradas: ignoradas,
    aba: melhor, modo: modo, headerLinha: idxHeader + 1,
    preview: alunos.slice(0, 5)
  };
}

var API = {
  normalizarCabecalho: normalizarCabecalho,
  sanitizarCampo: sanitizarCampo,
  contemBinario: contemBinario,
  mapaPadrao: mapaPadrao,
  detectarBlocos: detectarBlocos,
  registroValido: registroValido,
  parseWorkbookXLSX: parseWorkbookXLSX
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = API;
} else {
  raiz.EcoXlsx = API;
}
})(typeof self !== "undefined" ? self : this);
