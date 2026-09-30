/* node tests/rodar.js — roda todos os testes */
const { execFileSync } = require("child_process");
const fs = require("fs"), path = require("path");
let falhou = false;
for (const f of fs.readdirSync(__dirname).filter(f => f.endsWith(".test.js")).sort()) {
  try { process.stdout.write(execFileSync(process.execPath, [path.join(__dirname, f)], { encoding: "utf8" })); }
  catch (e) { falhou = true; process.stdout.write((e.stdout || "") + (e.stderr || "")); }
}
process.exit(falhou ? 1 : 0);
