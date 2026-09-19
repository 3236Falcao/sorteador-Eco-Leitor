#!/usr/bin/env node
// Teste anti-binário do clipboard — Sorteador EcoLeitor.
// Falha se o texto copiado puder conter XLSX/ZIP.
// Sem dependências (node puro). Não usa nomes reais: só fictícios.
"use strict";
const fs = require("fs");
const path = require("path");

const HTML = fs.readFileSync(path.join(__dirname, "..", "app", "index.html"), "utf-8");
const m = HTML.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error("FALHA: bloco <script> não encontrado"); process.exit(1); }
const JS = m[1];

let falhas = 0;
const ok = (s) => console.log("OK: " + s);
const erro = (s) => { console.error("FALHA: " + s); falhas++; };

// 1) Auditoria estática do caminho de clipboard/import
if (/navigator\.clipboard\s*\.\s*writeText\s*\(/.test(JS)) ok("usa clipboard.writeText (texto puro)");
else erro("não usa clipboard.writeText");

if (/navigator\.clipboard\s*\.\s*write\s*\(/.test(JS.replace(/writeText/g, ""))) erro("usa clipboard.write() genérico (aceita Blob) — proibido");
else ok("não usa clipboard.write() genérico");

if (/new\s+Blob\s*\(/.test(JS)) erro("usa new Blob() no fluxo da página — risco binário no clipboard");
else ok("sem new Blob() no fluxo da página");

// readAsArrayBuffer é legítimo SOMENTE no caminho XLSX→SheetJS (nunca parseCSV).
if (!/readAsText/.test(JS)) erro("CSV perdeu o readAsText");
else ok("CSV usa readAsText (texto puro)");
if (/readAsArrayBuffer/.test(JS)) {
  let MOD = "";
  try { MOD = fs.readFileSync(path.join(__dirname, "..", "app", "xlsx-import.js"), "utf-8"); } catch (e) { MOD = ""; }
  if (/parseWorkbookXLSX/.test(JS) && !/parseCSV\(\s*r\.result/.test(JS) && /xlsxLib\.read/i.test(MOD)) {
    ok("readAsArrayBuffer restrito ao caminho XLSX→SheetJS (nunca parseCSV)");
  } else erro("readAsArrayBuffer fora do caminho XLSX dedicado — risco binário");
} else ok("sem readAsArrayBuffer (só CSV)");

if (!/contemAssinaturaBinaria/.test(JS)) erro("sem guarda contemAssinaturaBinaria");
else ok("guarda anti-binária presente");
if (!/gerarTextoAmostra/.test(JS)) erro("sem gerarTextoAmostra() pura");
else ok("gerarTextoAmostra() presente");
if (!/ehTextoSeguroParaClipboard/.test(JS)) erro("sem ehTextoSeguroParaClipboard()");
else ok("validador de clipboard presente");

// 2) Executa as funções puras em sandbox (sem DOM)
const sandbox = {};
const loader = new Function("sandbox", `
  const window = {};
  function fakeEl(){ return { onclick:null, onchange:null, value:"", files:[], innerHTML:"", textContent:"", style:{}, select(){}, setAttribute(){}, appendChild(){}, removeChild(){} }; }
  const document = {
    getElementById: () => fakeEl(),
    createElement: () => fakeEl(),
    body: { appendChild(){}, removeChild(){} },
    execCommand: () => true,
    querySelectorAll: () => []
  };
  const localStorage = { getItem: () => null, setItem: () => {} };
  const navigator = {};
  const alert = () => {}, confirm = () => false;
  ${JS}
  sandbox.parseCSV = (typeof parseCSV !== "undefined") ? parseCSV : null;
  sandbox.gerarTextoAmostra = (typeof gerarTextoAmostra !== "undefined") ? gerarTextoAmostra : null;
  sandbox.ehTextoSeguro = (typeof ehTextoSeguroParaClipboard !== "undefined") ? ehTextoSeguroParaClipboard : null;
  sandbox.contemBin = (typeof contemAssinaturaBinaria !== "undefined") ? contemAssinaturaBinaria : null;
`);
try { loader(sandbox); } catch (e) { erro("falha ao carregar funções: " + e.message); console.error(e); process.exit(1); }
if (typeof sandbox.parseCSV !== "function") erro("parseCSV não extraída");
if (typeof sandbox.gerarTextoAmostra !== "function") erro("gerarTextoAmostra não extraída");
if (typeof sandbox.ehTextoSeguro !== "function") erro("ehTextoSeguroParaClipboard não extraída");
if (falhas) process.exit(1);

// 3) CSV válido fictício → parse OK
const CSV_OK = "turma,nivel,nome\nA,Alfabético,Ana Exemplo\nA,Alfabético,Beto Exemplo\nB,Pré-Silábico,Gabi Exemplo\n";
const alunos = sandbox.parseCSV(CSV_OK);
if (Array.isArray(alunos) && alunos.length === 3) ok("parseCSV aceita CSV válido (3 fictícios)");
else erro(`parseCSV CSV válido retornou ${JSON.stringify(alunos).slice(0, 120)}`);

// 4) XLSX lido como texto → parse deve recusar (0 alunos)
const XLSX_SIM = "PK\x03\x04\x14\x00\x00\x00[Content_Types].xml<Types/>" +
  "xl/workbook.xml<wb/>xl/worksheets/sheet1.xml<sheet/>" +
  "xl/sharedStrings.xml<sst><t>A, Alfabético, Ana</t></sst>docProps/app.xml";
if (sandbox.contemBin(XLSX_SIM.slice(0, 12000)) === true) ok("guarda detecta assinatura XLSX/ZIP");
else erro("guarda NÃO detectou XLSX simulado");
const alunosXlsx = sandbox.parseCSV(XLSX_SIM);
if (Array.isArray(alunosXlsx) && alunosXlsx.length === 0) ok("parseCSV recusa XLSX binário (0 alunos)");
else erro(`parseCSV aceitou binário: ${JSON.stringify(alunosXlsx).slice(0, 200)}`);

// 5) Texto da amostra: string pura, formato exigido, sem binário
const fixture = [
  { turma: "A", nivel: "Alfabético", elegiveis: 3, selecionados: ["Ana Exemplo", "Beto Exemplo"] },
  { turma: "B", nivel: "Alfabético", elegiveis: 2, selecionados: ["Karla Exemplo"] },
];
const t = sandbox.gerarTextoAmostra(fixture, "2026-W38", {});
if (typeof t !== "string") erro("gerarTextoAmostra não retornou string");
else {
  ok("resultado copiado é string");
  if (t.includes("AMOSTRA ECOLEITOR")) ok('contém "AMOSTRA ECOLEITOR"');
  else erro('não contém "AMOSTRA ECOLEITOR"');
  if (t.includes("Turma")) ok('contém "Turma"');
  else erro('não contém "Turma"');
  if (t.includes("Ana Exemplo") && t.includes("Beto Exemplo") && t.includes("Karla Exemplo")) ok("contém os nomes selecionados");
  else erro("não contém todos os nomes selecionados");
  const proibidos = ["PK", "xl/", "[Content_Types].xml", "sharedStrings.xml", "worksheets/"];
  const achados = proibidos.filter((p) => t.includes(p));
  if (!achados.length) ok("sem padrões XLSX/ZIP no texto");
  else erro("texto contém padrões binários: " + achados.join(", "));
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(t)) erro("texto contém controles binários");
  else ok("sem bytes de controle binários");
  if (sandbox.ehTextoSeguro(t) === true) ok("ehTextoSeguro aprova texto limpo");
  else erro("ehTextoSeguro rejeitou texto limpo");
}

// 6) Resultado contaminado deve ser BLOQUEADO
const fixtureSuja = [{ turma: "PK\x03\x04 xl/sharedStrings", nivel: "Alfabético", elegiveis: 1, selecionados: ["[Content_Types].xml"] }];
const tSujo = sandbox.gerarTextoAmostra(fixtureSuja, "2026-W38", {});
if (sandbox.ehTextoSeguro(tSujo) === false) ok("texto contaminado é bloqueado pelo validador");
else erro("validador APROVOU texto contaminado: " + JSON.stringify(tSujo).slice(0, 160));

console.log("---");
if (falhas) { console.error(falhas + " FALHA(S) clipboard"); process.exit(1); }
console.log("CLIPBOARD OK: somente texto UTF-8 legível");
