#!/usr/bin/env node
// Testes da importação XLSX local — Sorteador EcoLeitor.
// Cobre: válido 3 alunos, multi-turmas, multi-níveis, coluna ausente,
// vazio, falso-xlsx, layout em blocos, variações de cabeçalho e anti-binário.
// Workbooks gerados em memória (nada commitado). Só nomes fictícios.
"use strict";
const path = require("path");
const XLSX = require(path.join(__dirname, "..", "app", "vendor", "xlsx.full.min.js"));
const Eco = require(path.join(__dirname, "..", "app", "xlsx-import.js"));

let falhas = 0;
const ok = (s) => console.log("OK: " + s);
const erro = (s) => { console.error("FALHA: " + s); falhas++; };
const buf = (wb) => XLSX.write(wb, { type: "array", bookType: "xlsx" });
const mk = (rows, aba) => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), aba || "Sheet1");
  return buf(wb);
};
const PROIBIDOS = ["PK", "xl/", "[Content_Types].xml", "sharedStrings.xml", "worksheets/"];

// 1) XLSX válido com 3 alunos (padrão)
let r = Eco.parseWorkbookXLSX(mk([
  ["turma", "nivel", "nome"],
  ["A", "Alfabético", "Ana Exemplo"],
  ["B", "Pré-Silábico", "Beto Exemplo"],
  ["A", "Alfabético", "Catarina Exemplo"],
]), XLSX);
if (!r.erro && r.total === 3 && r.modo === "padrao") ok("XLSX válido com 3 alunos");
else erro("válido 3 alunos: " + (r.erro || JSON.stringify(r).slice(0, 160)));

// 2) múltiplas turmas
r = Eco.parseWorkbookXLSX(mk([
  ["turma", "nivel", "nome"],
  ["A", "Alfabético", "Ana Exemplo"],
  ["B", "Alfabético", "Beto Exemplo"],
  ["C", "Alfabético", "Catarina Exemplo"],
]), XLSX);
if (!r.erro && r.turmas.length === 3) ok("múltiplas turmas detectadas (3)");
else erro("multi-turmas: " + (r.erro || r.turmas));

// 3) múltiplos níveis
r = Eco.parseWorkbookXLSX(mk([
  ["turma", "nivel", "nome"],
  ["A", "Pré-Silábico", "Ana Exemplo"],
  ["A", "Silábico c/ valor", "Beto Exemplo"],
  ["A", "Silábico-Alfabético", "Catarina Exemplo"],
  ["A", "Alfabético", "Diego Exemplo"],
]), XLSX);
if (!r.erro && r.niveis.length === 4) ok("múltiplos níveis detectados (4)");
else erro("multi-níveis: " + (r.erro || r.niveis));

// 4) coluna ausente -> mensagem clara
r = Eco.parseWorkbookXLSX(mk([[ "turma", "nivel" ], ["A", "Alfabético"]]), XLSX);
if (r.erro && /ausente.*nome/i.test(r.erro)) ok("coluna ausente explicada: " + r.erro.slice(0, 60) + "…");
else erro("coluna ausente sem mensagem clara: " + JSON.stringify(r).slice(0, 160));

// 5) XLSX vazio
r = Eco.parseWorkbookXLSX(mk([]), XLSX);
if (r.erro && /vazio/i.test(r.erro)) ok("XLSX vazio rejeitado com mensagem");
else erro("vazio sem mensagem: " + JSON.stringify(r).slice(0, 160));

// 6) arquivo não-XLSX com extensão .xlsx (texto puro)
r = Eco.parseWorkbookXLSX(new TextEncoder().encode("turma,nivel,nome\nA,Alfabético,Ana"), XLSX);
if (r.erro && /assinatura/i.test(r.erro)) ok("falso-xlsx (texto) rejeitado pela assinatura");
else erro("falso-xlsx aceito: " + JSON.stringify(r).slice(0, 160));

// 7) layout em blocos (Turma A|Nível|Turma B|Nível) — igual à lista geral
r = Eco.parseWorkbookXLSX(mk([
  ["LISTA DE ALUNOS"],
  ["Turma A", "Nível", "Turma B", "Nível"],
  ["Ana Exemplo", "Alfabético", "Beto Exemplo", "Pré-Silábico"],
  ["Catarina Exemplo", "Silábico c/ valor", null, null],
]), XLSX);
if (!r.erro && r.modo === "blocos" && r.total === 3 &&
    r.alunos.some((a) => a.turma === "A" && a.nome === "Ana Exemplo") &&
    r.alunos.some((a) => a.turma === "B" && a.nome === "Beto Exemplo")) {
  ok("blocos Turma A/B mapeados (turma do cabeçalho)");
} else erro("blocos: " + (r.erro || JSON.stringify(r).slice(0, 200)));

// 8) variações de capitalização/espaços
r = Eco.parseWorkbookXLSX(mk([
  ["  TURMA ", " Nível ", "NOME"],
  ["A", "Alfabético", "Ana Exemplo"],
]), XLSX);
if (!r.erro && r.total === 1) ok("variações de cabeçalho aceitas");
else erro("variações: " + (r.erro || "0 alunos"));

// 9) anti-binário: nada de PK/xl/XML chega aos objetos nem ao texto
const wbEvil = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbEvil, XLSX.utils.aoa_to_sheet([
  ["turma", "nivel", "nome"],
  ["A", "Alfabético", "Ana Exemplo"],
]), "S");
const rEvil = Eco.parseWorkbookXLSX(buf(wbEvil), XLSX);
const blob = JSON.stringify(rEvil.alunos || []);
const vazou = PROIBIDOS.filter((p) => blob.includes(p));
if (!rEvil.erro && !vazou.length) ok("objetos XLSX limpos (sem PK/xl/XML interno)");
else erro("vazamento nos objetos: " + vazou.join(", "));

// 10) primeira aba útil: capa vazia + dados na 2ª aba
const wb2 = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb2, XLSX.utils.aoa_to_sheet([["Capa"], ["texto"]]), "Capa");
XLSX.utils.book_append_sheet(wb2, XLSX.utils.aoa_to_sheet([
  ["turma", "nivel", "nome"], ["A", "Alfabético", "Ana Exemplo"],
]), "Dados");
r = Eco.parseWorkbookXLSX(buf(wb2), XLSX);
if (!r.erro && r.aba === "Dados" && r.total === 1) ok("primeira aba útil selecionada (Dados)");
else erro("aba útil: " + (r.erro || r.aba));

// 11) biblioteca ausente -> erro claro, sem exceção
r = Eco.parseWorkbookXLSX(new Uint8Array([0x50, 0x4b, 3, 4]), null);
if (r.erro && /biblioteca/i.test(r.erro)) ok("lib ausente explicada (CSV segue funcionando)");
else erro("lib ausente: " + JSON.stringify(r).slice(0, 120));

console.log("---");
if (falhas) { console.error(falhas + " FALHA(S) xlsx"); process.exit(1); }
console.log("XLSX OK: parser local, validado e sem binário");
