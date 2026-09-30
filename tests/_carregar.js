/* Carrega o motor do jogo no Node, sem navegador. */
const path = require("path");
module.exports = function carregar() {
  const mem = {};
  global.window = {};
  global.localStorage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } };
  for (const f of ["base-real.js", "engine.js"]) {
    const p = path.join(__dirname, "..", "js", f);
    delete require.cache[require.resolve(p)];
    require(p);
  }
  return window.VM;
};
