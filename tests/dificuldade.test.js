/* A dificuldade fortalece a IA, não o time do usuário. */
const VM = require("./_carregar")();
const { check, resumo } = require("./_check");
VM.newWorld(window.VALDB, 7);
VM.setUserTeam("LOUD"); VM.S.manager = { nick: "teste", attrs: {} };
const ia = VM.T("SEN"), eu = VM.T("LOUD"), mapa = VM.S.mapas[0];
const eff = {};
for (const d of ["facil", "normal", "dificil", "pesadelo"]) {
  VM.setDif(d);
  eff[d] = { ia: VM.teamEff(ia, mapa, VM.autoComp(ia, mapa)), eu: VM.teamEff(eu, mapa, VM.autoComp(eu, mapa)) };
}
check(eff.facil.ia < eff.normal.ia && eff.normal.ia < eff.dificil.ia && eff.dificil.ia < eff.pesadelo.ia, "IA não fica mais forte com a dificuldade");
check(Math.abs(eff.facil.eu - eff.pesadelo.eu) < 0.001, "time do usuário mudou com a dificuldade");
check(VM.DIF.pesadelo.salary > VM.DIF.normal.salary && VM.DIF.pesadelo.money < 1, "pesadelo deveria apertar o dinheiro");
resumo("dificuldade");
