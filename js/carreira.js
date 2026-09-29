/* =====================================================================
   VCT MANAGER — Diretoria, conversas, renovação negociada, academia,
   hall da fama, meta do patch e demissão.
   ===================================================================== */
(function () {
"use strict";
var VM = window.VM, ART = window.ART, G = window.GUI, ACT = G.ACT, VIEWS = G.VIEWS, UI = G.UI;
var esc = G.esc, money = G.money;
function S() { return VM.S; }
function me() { return G.me(); }
function sec(t) { return '<h3 class="sec2"><i>»</i> ' + t + "</h3>"; }
function confColor(c) { return c >= 70 ? "var(--win)" : c >= 40 ? "var(--warn)" : "var(--loss)"; }
function confTxt(c) { return c >= 80 ? "Muito satisfeito" : c >= 60 ? "Satisfeito" : c >= 40 ? "Neutro" : c >= 25 ? "Preocupado" : "Insatisfeito"; }

/* ---------------------------------------------------------------------
   DIRETORIA
   --------------------------------------------------------------------- */
function gauge(c) {
  var R = 70, C = Math.PI * R, f = Math.max(0, Math.min(1, c / 100));
  return '<svg viewBox="0 0 180 110" class="gauge" role="img" aria-label="Confiança ' + c + '%"><path d="M20 95 A70 70 0 0 1 160 95" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="14" stroke-linecap="round"/>' +
    '<path d="M20 95 A70 70 0 0 1 160 95" fill="none" stroke="' + confColor(c) + '" stroke-width="14" stroke-linecap="round" stroke-dasharray="' + (C * f).toFixed(1) + " " + C.toFixed(1) + '"/>' +
    '<text x="90" y="86" text-anchor="middle" class="gv">' + c + '%</text></svg>';
}
VIEWS.diretoria = function () {
  var s = S(), t = me(), b = s.board || { conf:60, hist:[] };
  var evs = s.eventos.filter(function (ev) { return G.stageHasTeam ? ev.stages.some(function (st) { return G.stageHasTeam(st, t.id); }) : false; });
  var exp = evs.map(function (ev) {
    var n = Object.keys(ev.colocacao).length || (ev.participantes || []).length || 12;
    var fake = { colocacao:{}, tipo:ev.tipo }; for (var i = 0; i < n; i++) fake.colocacao["x" + i] = 1;
    return "<li><b>" + esc(ev.nome) + "</b> — terminar até o <b>" + VM.expectedPos(t, fake) + "º</b></li>";
  }).join("");
  var hist = (b.hist || []).slice(0, 14).map(function (h) {
    return '<div class="bh ' + (h.d > 0 ? "up" : h.d < 0 ? "down" : "") + '"><span>' + (h.d > 0 ? "+" : "") + h.d + "</span><p>" + esc(h.motivo) + "</p><em>" + h.conf + "%</em></div>";
  }).join("");
  var props = (s.propostas || []).map(function (o, i) {
    var x = VM.T(o.team);
    return '<div class="prop">' + G.crest(x.id, "lg") + "<div><strong>" + esc(x.nome) + "</strong><small>" + esc(s.ligasNome[x.liga]) + " · " + ART.stars(x.nivel) + "</small><small>Salário oferecido: " + money(o.sal) + "/ano · Objetivo: " + esc(VM.objetivoPara(x).toLowerCase()) + '</small></div><div class="row"><button class="btn primary sm" data-a="propAceitar" data-v="' + i + '">Aceitar</button><button class="btn ghost sm" data-a="propRecusar" data-v="' + i + '">Recusar</button></div></div>';
  }).join("");
  return '<div class="dgrid"><div><div class="dhead">' + gauge(b.conf) + "<div><small>Confiança do Conselho</small><strong style=\"color:" + confColor(b.conf) + '">' + confTxt(b.conf) + "</strong><p class=\"muted\">Abaixo de 15% no fim de uma fase, você é demitido. Vitórias, boas colocações e contas no azul aumentam a confiança.</p></div></div>" +
    sec("Objetivo da temporada") + '<p class="objtxt">' + esc(s.manager ? s.manager.objetivo : VM.objetivoPara(t)) + "</p>" +
    sec("Expectativa nas competições atuais") + (exp ? '<ul class="explist">' + exp + "</ul>" : '<p class="muted">Nenhuma competição sua em andamento.</p>') +
    sec("Propostas de outros clubes") + (props || '<p class="muted">Nenhuma proposta no momento. Clubes procuram managers com a confiança da diretoria alta.</p>') + "</div>" +
    "<div>" + sec("Avaliações recentes") + (hist || '<p class="empty">SEM AVALIAÇÕES AINDA</p>') + "</div></div>";
};
ACT.propAceitar = function (v) { var r = VM.acceptOffer(+v); G.persist(); G.toast(r.msg, r.ok); G.go("inicio"); };
ACT.propRecusar = function (v) { var r = VM.rejectOffer(+v); G.persist(); G.toast(r.msg, r.ok); };

function demitido() {
  var s = S(), props = (s.propostas || []).map(function (o, i) {
    var x = VM.T(o.team);
    return '<div class="prop">' + G.crest(x.id, "lg") + "<div><strong>" + esc(x.nome) + "</strong><small>" + esc(s.ligasNome[x.liga]) + " · " + ART.stars(x.nivel) + '</small></div><button class="btn primary sm" data-a="propAceitar" data-v="' + i + '">Assinar</button></div>';
  }).join("");
  return '<div class="fired"><h1>Você foi demitido</h1><p>O Conselho da ' + esc(me().nome) + " decidiu trocar o comando. Alguns clubes menores ainda querem você:</p>" + (props || '<p class="muted">Nenhum clube fez proposta.</p>') +
    '<div class="row center"><button class="btn danger" data-a="novoJogo">' + (UI.confirmNovo ? "Clique de novo pra recomeçar" : "Recomeçar carreira") + "</button></div></div>";
}

/* ---------------------------------------------------------------------
   CONVERSAS E CONTRATO (dentro do perfil)
   --------------------------------------------------------------------- */
function conversa(p) {
  var mine = p.teamId === S().userTeam;
  if (!mine) return '<p class="muted">Você só conversa com jogadores do seu elenco.</p>';
  var five = VM.activeFive(me()).map(function (x) { return x.id; }), tit = five.indexOf(p.id) >= 0, hoje = p.conversa === VM.talkKey();
  var status = [];
  if (p.pedidoSaida) status.push('<span class="chip bad">pediu pra sair</span>');
  if (p.promessa) status.push('<span class="chip warn">promessa de titularidade pendente</span>');
  if (!tit && !p.pedidoSaida && p.morale < 55) status.push('<span class="chip warn">insatisfeito no banco</span>');
  if (!status.length) status.push('<span class="chip ok">tranquilo</span>');
  var opts = [["elogiar", "Elogiar", "Sobe a moral se ele estiver jogando bem."], ["cobrar", "Cobrar", "Melhora a forma de quem está mal, mas irrita quem está bem."], ["motivar", "Motivar pro jogo", "Pequeno ganho de forma e moral."]];
  if (!tit) opts.push(["prometer", "Prometer titularidade", "Moral sobe muito agora; se não cumprir até a próxima fase, ele pede pra sair."]);
  if (p.pedidoSaida) opts.push(["acalmar", "Convencer a ficar", "Chance de ele desistir de sair (Motivação ajuda)."]);
  return '<div class="talk"><div class="talkst">' + status.join(" ") + '<span class="muted">Moral ' + Math.round(p.morale) + " · Forma " + (p.form > 0 ? "+" : "") + p.form.toFixed(1) + "</span></div>" +
    (hoje ? '<p class="muted">Vocês já conversaram hoje. Volte amanhã.</p>' : "") +
    '<div class="talkopts">' + opts.map(function (o) { return '<button class="topt" data-a="falar" data-v="' + o[0] + '" data-p="' + p.id + '" ' + (hoje ? "disabled" : "") + "><strong>" + o[1] + "</strong><small>" + o[2] + "</small></button>"; }).join("") + "</div>" +
    (UI.talkMsg && UI.talkMsg.pid === p.id ? '<p class="talkres">' + esc(UI.talkMsg.msg) + "</p>" : "") + "</div>";
}
ACT.falar = function (v, el) { var pid = el.getAttribute("data-p"), r = VM.talk(pid, v); UI.talkMsg = { pid:pid, msg:r.msg }; G.persist(); G.render(); };

function contrato(p) {
  var ask = VM.contractAsk(p), val = VM.valueFor(p);
  var n = UI.neg && UI.neg.pid === p.id ? UI.neg : (UI.neg = { pid:p.id, sal:ask, anos:2, multa:Math.round(val * 2 / 1000) * 1000, msg:null });
  return '<div class="neg"><dl class="kv"><dt>Salário atual</dt><dd>' + money(p.salary) + "/ano</dd><dt>Contrato</dt><dd>" + p.contract + " temporada(s)</dd><dt>Multa atual</dt><dd>" + (p.multa ? money(p.multa) : "não definida") + "</dd><dt>Valor de mercado</dt><dd>" + money(val) + "</dd></dl>" +
    '<h4 class="sec">Renovação</h4>' +
    '<label class="nf"><span>Salário oferecido <b id="negSalV">' + money(n.sal) + '/ano</b></span><input type="range" min="' + Math.round(ask * 0.7) + '" max="' + Math.round(ask * 1.5) + '" step="1000" value="' + n.sal + '" data-neg="sal"></label>' +
    '<div class="nf"><span>Duração</span><div class="cchips">' + [1, 2, 3].map(function (a) { return '<button class="cchip ' + (n.anos === a ? "on" : "") + '" data-a="negAnos" data-v="' + a + '">' + a + " temporada" + (a > 1 ? "s" : "") + "</button>"; }).join("") + "</div></div>" +
    '<label class="nf"><span>Multa rescisória <b id="negMulV">' + money(n.multa) + '</b></span><input type="range" min="' + Math.round(val * 0.8) + '" max="' + Math.round(val * 4) + '" step="5000" value="' + n.multa + '" data-neg="multa"><small class="muted">Multa baixa deixa ele mais feliz, mas times ricos podem pagar e levar o jogador.</small></label>' +
    '<div class="row"><button class="btn primary" data-a="negEnviar" data-v="' + p.id + '">Enviar proposta</button><button class="btn ghost" data-a="liberar" data-v="' + p.id + '">Liberar</button>' + (VM.marketOpen() ? '<button class="btn ghost" data-a="vender" data-v="' + p.id + '">Procurar comprador</button>' : "") + "</div>" +
    (n.msg ? '<p class="talkres">' + esc(n.msg) + "</p>" : "") +
    (UI.venda && UI.venda[p.id] ? '<div class="banner">' + (UI.venda[p.id] === "nada" ? "Nenhum time tem interesse agora." : "Proposta da " + G.teamName(UI.venda[p.id].team) + ": <strong>" + money(UI.venda[p.id].valor) + '</strong> <button class="btn sm primary" data-a="aceitarVenda" data-v="' + p.id + '">Aceitar</button> <button class="btn sm ghost" data-a="recusarVenda" data-v="' + p.id + '">Recusar</button>') + "</div>" : "") + "</div>";
}
ACT.negAnos = function (v) { UI.neg.anos = +v; G.render(); };
ACT.negEnviar = function (v) { var n = UI.neg, r = VM.negotiate(v, n.sal, n.anos, n.multa); n.msg = r.msg; if (r.ask) n.sal = Math.min(n.sal, r.ask); G.persist(); G.render(); };
document.getElementById("app").addEventListener("input", function (e) {
  var el = e.target, k = el.getAttribute("data-neg"); if (!k || !UI.neg) return;
  UI.neg[k] = +el.value;
  var lab = document.getElementById(k === "sal" ? "negSalV" : "negMulV"); if (lab) lab.textContent = money(+el.value) + (k === "sal" ? "/ano" : "");
});

/* ---------------------------------------------------------------------
   ACADEMIA
   --------------------------------------------------------------------- */
VIEWS.academia = function () {
  var s = S(), lv = s.academiaNivel || 1, list = (s.academia || []).map(VM.P).filter(Boolean);
  list.sort(function (a, b) { return (b.pot || 0) - (a.pot || 0); });
  var cards = list.map(function (p) {
    return '<div class="ycard">' + G.face(p, "lg round") + "<strong>" + esc(p.nick) + "</strong><small>" + esc(p.nat) + " · " + p.age + " anos</small>" + G.roleTag(p.role) +
      '<div class="ypot"><span>Atual</span>' + ART.stars(VM.playerStars(p)) + "<span>Potencial</span>" + ART.stars(VM.potStars(p)) + "</div>" +
      '<div class="ybar"><i style="width:' + Math.round((VM.ovr(p) - 40) / ((p.pot || 80) - 40) * 100) + '%"></i></div><small>' + VM.ovr(p) + " de " + (p.pot || "?") + ' de potencial</small><div class="row center"><button class="btn sm primary" data-a="yPromover" data-v="' + p.id + '">Subir pro elenco</button><button class="btn sm ghost" data-a="perfil" data-v="' + p.id + '">Ver</button><button class="btn sm ghost" data-a="yDispensar" data-v="' + p.id + '">Dispensar</button></div></div>';
  }).join("");
  return '<div class="ahead"><div><small>Academia</small><strong>' + ["", "Peneira local", "Centro de formação", "Academia de elite"][lv] + "</strong>" + ART.stars(lv * 5 / 3) + '<p class="muted">Nível ' + lv + "/3. Novos jovens chegam a cada temporada (máximo de 8). Eles evoluem a cada fase — mais rápido com academia melhor e Desenvolvimento alto no manager.</p></div>" +
    (lv < 3 ? '<button class="btn primary" data-a="yUpgrade">Melhorar academia · ' + money(VM.academyCost()) + "</button>" : '<span class="chip ok">nível máximo</span>') + "</div>" +
    (cards ? '<div class="ygrid">' + cards + "</div>" : '<p class="empty">NENHUM JOVEM NA ACADEMIA — A PRÓXIMA SAFRA CHEGA NA PRÉ-TEMPORADA</p>');
};
ACT.yPromover = function (v) { var r = VM.promoteYouth(v); G.persist(); G.toast(r.msg, r.ok); };
ACT.yDispensar = function (v) { var r = VM.releaseYouth(v); G.persist(); G.toast(r.msg, r.ok); };
ACT.yUpgrade = function () { var r = VM.upgradeAcademy(); G.persist(); G.toast(r.msg, r.ok); };

/* ---------------------------------------------------------------------
   HALL DA FAMA
   --------------------------------------------------------------------- */
VIEWS.hof = function () {
  var s = S(), h = s.hof || { temporadas:[], lendas:[] };
  var tl = (s.conquistas || []).length;
  var temps = h.temporadas.map(function (x) {
    return '<div class="hofs"><div class="hy">' + x.temp + "</div><div>" + (x.champ ? "<small>Campeão mundial</small>" + G.teamChip(x.champ, true) : "") +
      (x.mvp ? '<small>MVP da temporada</small><button class="plink" data-a="perfil" data-v="' + x.mvp.pid + '">' + G.face(VM.P(x.mvp.pid) || { nick:x.mvp.nick }, "xs") + "<strong>" + esc(x.mvp.nick) + "</strong></button> <span class=\"muted\">ACS " + x.mvp.acs + "</span>" : "") + "</div>" +
      "<div>" + (x.user ? "<small>Seu time</small>" + G.teamChip(x.user.team, true) + (x.user.conquistas.length ? '<div class="troph">' + x.user.conquistas.map(function (c) { return "<span>🏆 " + esc(c.replace(/^\d+ — /, "")) + "</span>"; }).join("") + "</div>" : '<span class="muted"> sem títulos</span>') : "") + "</div></div>";
  }).join("");
  var lendas = h.lendas.slice(0, 30).map(function (l) {
    return "<tr><td><b>" + esc(l.nick) + "</b></td><td>" + G.roleTag(l.role) + "</td><td>" + esc(l.nat) + '</td><td class="num">' + l.ovr + "</td><td>" + esc(l.time) + '</td><td class="num">' + l.temp + " (" + l.idade + " anos)</td></tr>";
  }).join("");
  var campeoes = {}; (s.historico || []).forEach(function (x) { campeoes[x.campeao] = (campeoes[x.campeao] || 0) + 1; });
  var rank = Object.keys(campeoes).sort(function (a, b) { return campeoes[b] - campeoes[a]; }).slice(0, 10).map(function (id, i) { return '<div class="rk' + (id === s.userTeam ? " me" : "") + '"><span class="rn">#' + (i + 1) + "</span>" + G.crest(id, "xs") + "<b>" + esc(VM.T(id).nome) + "</b><em>" + campeoes[id] + " título(s)</em></div>"; }).join("");
  return '<div class="hofgrid"><div>' + sec("Sua carreira") + '<div class="kpis"><div><small>Temporadas</small><b>' + (h.temporadas.length + 1) + "</b></div><div><small>Títulos</small><b>" + tl + "</b></div><div><small>Clube atual</small><b>" + esc(me().tag) + "</b></div><div><small>Ranking</small><b>" + ((s.elo || {})[s.userTeam] || "—") + "</b></div></div>" +
    sec("Temporadas") + (temps || '<p class="empty">A PRIMEIRA TEMPORADA AINDA ESTÁ EM ANDAMENTO</p>') + "</div><div>" +
    sec("Maiores campeões") + (rank || '<p class="empty">NENHUM TÍTULO DECIDIDO</p>') +
    sec("Lendas aposentadas") + (lendas ? '<div class="tblwrap"><table class="lb"><thead><tr><th>Jogador</th><th>Função</th><th>Nação</th><th class="num">Geral</th><th>Último time</th><th class="num">Aposentou</th></tr></thead><tbody>' + lendas + "</tbody></table></div>" : '<p class="empty">NINGUÉM SE APOSENTOU AINDA</p>') + "</div></div>";
};

/* ---------------------------------------------------------------------
   META DO PATCH (aba em Estratégias)
   --------------------------------------------------------------------- */
function metaView() {
  var s = S(), m = s.meta || {}, p = s.patch || { v:"12.00", buff:[], nerf:[] };
  var tiers = { 2:[], 1:[], 0:[], "-1":[], "-2":[] };
  VM.AGENTS.forEach(function (a) { tiers[m[a] || 0].push(a); });
  var names = { 2:"Meta (S)", 1:"Forte (A)", 0:"Normal (B)", "-1":"Fraco (C)", "-2":"Fora do meta (D)" };
  return '<div class="metah"><strong>Patch ' + esc(p.v) + "</strong>" + (p.buff.length ? '<span class="chip ok">buffs: ' + esc(p.buff.join(", ")) + '</span><span class="chip bad">nerfs: ' + esc(p.nerf.join(", ")) + "</span>" : '<span class="muted">Primeiro patch da carreira — tudo equilibrado.</span>') + "</div>" +
    '<p class="muted">Agentes em alta dão força extra pra quem joga com eles; os em baixa tiram. A IA não escolhe pelo meta — use isso a seu favor na preparação.</p>' +
    [2, 1, 0, -1, -2].map(function (k) {
      return '<div class="tier t' + String(k).replace("-", "m") + '"><b>' + names[k] + '</b><div>' + (tiers[k].length ? tiers[k].map(function (a) { return '<span class="agc r-' + VM.AGENT_ROLE[a] + '">' + esc(a) + "</span>"; }).join("") : '<span class="muted">—</span>') + "</div></div>";
    }).join("");
}

window.CARREIRA = { conversa:conversa, contrato:contrato, demitido:demitido, metaView:metaView, gauge:gauge, confColor:confColor };
})();
