/* Modo Draft: cartas, mundo de 16 times e campeonato completo. */
const VM = require("./_carregar")();
const { check, resumo } = require("./_check");
const cartas = VM.draftCards(window.VALDB, window.LENDAS);
check(cartas.length > 250, "poucas cartas: " + cartas.length);
check(new Set(cartas.map(c => c.id)).size === cartas.length, "carta repetida");
check(cartas.every(c => c.aim >= 35 && c.aim <= 97 && c.ovr > 50), "atributo fora do limite");
// draft serpentina simples: cada time pega o melhor disponível de um nick ainda não usado
const times = Array.from({ length: 16 }, (_, i) => ({ id: "D" + i, tag: "D" + i, nome: "Time " + i, humano: i < 3, cartas: [] }));
const usados = new Set();
for (let r = 0; r < 6; r++) {
  const ordem = r % 2 ? times.slice().reverse() : times;
  ordem.forEach(t => { const c = cartas.find(c => !usados.has(c.nick)); usados.add(c.nick); t.cartas.push(c); });
}
check(times.every(t => t.cartas.length === 6), "time sem 6 cartas");
VM.draftWorld(window.VALDB, { seed: 42, mapas: window.VALDB.mapas, times });
const plano = { D0: { pref: window.VALDB.mapas.slice(), tat: {} } };
window.VALDB.mapas.forEach(m => plano.D0.tat[m] = { estilo: { atk: "agressivo", def: "padrao" }, atk: { plano: "exec", site: "A", ritmo: "rapido", eco: "rush", compra: { pistol: "igual", full: "igual", force: "igual", eco: "rush" } }, def: { setup: "stack", site: "A", rotacao: "media" } });
let dias = 0, series = 0, maior = 0;
while (!VM.S.eventos[0].done && dias < 30) {
  const out = VM.draftDay(plano); dias++; series += out.length;
  out.forEach(x => { maior = Math.max(maior, JSON.stringify(x.replay).length); check(x.replay.length === x.res.maps.length, "replay sem todos os mapas"); });
}
const ev = VM.S.eventos[0];
check(ev.done, "campeonato não terminou em " + dias + " rodadas");
check(series === 16 + 4 + 1 + 4 + 2 + 2 + 2 + 1 + 1 + 1 + 1 ? true : series >= 30, "número de séries estranho: " + series);
const campeao = Object.keys(ev.colocacao).find(id => ev.colocacao[id] === 1);
check(!!campeao, "sem campeão");
check(maior < 200000, "replay de uma série grande demais: " + maior);
resumo("modo draft (" + cartas.length + " cartas, " + dias + " rodadas, " + series + " séries, campeão " + campeao + ", maior replay " + Math.round(maior / 1024) + " KB)");
// quem acompanha reconstrói a mesma tabela só com os resultados
(function () {
  const VM2 = VM;
  const dias2 = [];
  VM2.draftWorld(window.VALDB, { seed: 7, mapas: window.VALDB.mapas, times });
  while (!VM2.S.eventos[0].done && dias2.length < 30) dias2.push(VM2.draftDay({}).map(x => ({ res: x.res })));
  const ref = JSON.stringify(VM2.S.eventos[0].colocacao);
  const ids1 = Object.keys(VM2.S.players).slice(0, 5).join();
  VM2.draftWorld(window.VALDB, { seed: 7, mapas: window.VALDB.mapas, times });
  check(Object.keys(VM2.S.players).slice(0, 5).join() === ids1, "ids de jogadores diferentes entre host e espectador");
  dias2.forEach(d => VM2.draftApply(d));
  check(JSON.stringify(VM2.S.eventos[0].colocacao) === ref, "tabela reconstruída diferente da original");
  resumo("reconstrução da tabela no espectador");
})();
