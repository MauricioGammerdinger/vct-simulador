/* Duas temporadas inteiras sem navegador, conferindo formatos e invariantes. */
const VM = require("./_carregar")();
const { check, resumo } = require("./_check");
VM.newWorld(window.VALDB, 11);
VM.setUserTeam("LOUD"); VM.S.manager = { nick: "teste", attrs: {} };
const inicio = VM.S.temporada, t0 = Date.now();
let dias = 0, kickoffs = 0, playins = 0;
function conferirFase() {
  VM.S.eventos.forEach(ev => {
    if (ev.tipo === "KICKOFF" && ev.stages[0] && ev.stages[0].nodes && ev.stages[0].nodes.UF) {
      kickoffs++;
      const top = [1, 2, 3].map(n => Object.keys(ev.colocacao).find(id => ev.colocacao[id] === n));
      check(top.every(Boolean) && new Set(top).size === 3, "Kickoff " + ev.nome + " sem 1º/2º/3º distintos");
      check(Object.keys(ev.colocacao).length === 12, "Kickoff " + ev.nome + " sem colocação pra todos");
    }
    if (ev.tipo === "PLAYINS") {
      playins++;
      const s2 = VM.S.stage2[ev.liga];
      check(s2.playin.length === 4 && new Set(s2.playin).size === 4, "Play-Ins " + ev.liga + " sem 4 classificados distintos");
      check(s2.playin.every(id => s2.top4.indexOf(id) < 0), "classificado dos Play-Ins já estava no top 4");
    }
  });
}
while (VM.S.temporada < inicio + 2 && dias < 20000) {
  dias++;
  if (VM.S.demitido) VM.acceptOffer(0);
  if (VM.phaseOver()) { conferirFase(); VM.nextPhase(); continue; }
  VM.playDay();
}
const S = VM.S;
check(S.temporada === inicio + 2, "não chegou ao fim de duas temporadas");
check(kickoffs >= 8, "Kickoffs de 12 times conferidos: " + kickoffs);
check(playins >= 8, "Play-Ins conferidos: " + playins);
const champs = S.historico.filter(h => /^Champions/.test(h.evento));
check(champs.length === 2, "esperava 2 Champions no histórico, veio " + champs.length);
Object.values(S.teams).forEach(t => {
  check(t.roster.length >= 5 && t.roster.length <= 8, t.tag + " com elenco de " + t.roster.length);
  check(Number.isFinite(t.cash), t.tag + " com caixa inválido");
  t.roster.forEach(id => check(VM.P(id) && !VM.P(id).aposentado && VM.P(id).teamId === t.id, "jogador inconsistente em " + t.tag));
});
const tam = JSON.stringify(S).length;
check(tam < 3e6, "save grande demais: " + tam);
resumo("duas temporadas (" + dias + " dias, " + ((Date.now() - t0) / 1000).toFixed(1) + "s, save " + (tam / 1e6).toFixed(2) + " MB)");
