let falhas = 0, ok = 0;
function check(cond, msg) { if (cond) ok++; else { falhas++; console.log("  FALHOU: " + msg); } }
function resumo(nome) { console.log((falhas ? "✗ " : "✓ ") + nome + " — " + ok + " verificações, " + falhas + " falha(s)"); if (falhas) process.exitCode = 1; }
module.exports = { check, resumo };
