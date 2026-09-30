/* Economia por jogador, drops e ultimates: invariantes em 150 mapas simulados. */
const VM = require("./_carregar")();
const { check, resumo } = require("./_check");
VM.newWorld(window.VALDB, 3);
const ids = Object.keys(VM.S.teams);
let ults = 0, mapas = 0;
for (let i = 0; i < 150; i++) {
  const A = VM.T(ids[i % ids.length]), B = VM.T(ids[(i * 7 + 3) % ids.length]);
  if (A.id === B.id) continue;
  const s = VM.newMapSim(A, B, VM.S.mapas[i % VM.S.mapas.length], { atkFirst: i % 2 ? "A" : "B" });
  VM.finishMap(s); mapas++;
  check(s.sa >= 13 || s.sb >= 13, "mapa terminou sem 13 rounds");
  check(Math.abs(s.sa - s.sb) >= 2 || Math.max(s.sa, s.sb) === 13, "placar inválido " + s.sa + "-" + s.sb);
  s.rounds.forEach(r => {
    ults += r.ultsA.length + r.ultsB.length;
    check(r.ultsA.length <= 3 && r.ultsB.length <= 3, "mais de 3 ults no round");
    Object.values(r.pe).forEach(e => {
      check(e.cr >= 0 && e.cr <= 9000, "créditos fora do limite: " + e.cr);
      check(e.ult >= 0 && e.ult <= e.max, "pontos de ult fora do limite");
      check(!!e.arma, "jogador sem arma");
    });
    if (r.n === 1 || r.n === 13) check(r.buyA === "pistol" && r.buyB === "pistol", "round " + r.n + " não foi pistol");
  });
}
check(ults / mapas > 5 && ults / mapas < 60, "média de ults por mapa estranha: " + (ults / mapas).toFixed(1));
resumo("economia e ultimates (" + mapas + " mapas)");
