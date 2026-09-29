/* =====================================================================
   VCT MANAGER — partida: veto, preparação, mapa 2D ao vivo, relatório
   ===================================================================== */
(function () {
"use strict";
var VM = window.VM, ART = window.ART, G = window.GUI;
var esc = G.esc, ACT = G.ACT;
var M = null;
var SPEED = { normal:4200, rapido:1600, turbo:350 };

function S() { return VM.S; }
function TA() { return VM.T(M.A); }
function TB() { return VM.T(M.B); }
function U(side) { return side === M.user; }
function teamOf(who) { return who === "A" ? TA() : TB(); }
function sidesOf(map) { return VM.SITES[map] || ["A", "B"]; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }

/* ---------------------------------------------------------------------
   Início / veto
   --------------------------------------------------------------------- */
function start(m) {
  var u = S().userTeam;
  M = { m:m, A:m.a, B:m.b, bo:m.bo, user:m.a === u ? "A" : "B", etapa:"veto", pool:S().mapas.slice(), steps:VM.vetoSteps(m.bo),
    si:0, maps:[], bans:[], log:[], sidePending:null, comps:[], oppComps:[], styles:[], prepIdx:0, mapIdx:0, sim:null,
    results:[], wa:0, wb:0, speed:"normal", paused:false, feed:[], odds:VM.preMatchOdds(m.a, m.b, 60) };
  vetoAuto();
}
function vetoAuto() {
  var A = TA(), B = TB();
  while (M.si < M.steps.length || M.sidePending) {
    if (M.sidePending) {
      var sp = M.sidePending;
      if (sp.chooser === M.user) return;
      var side = VM.aiSideChoice(teamOf(sp.chooser), sp.entry.map);
      sp.entry.side = side; M.log.push(teamOf(sp.chooser).tag + " começa no " + (side === "atk" ? "ataque" : "defesa") + " em " + sp.entry.map);
      M.sidePending = null; continue;
    }
    var st = M.steps[M.si];
    if (st.act === "decider") {
      var dm = M.pool[0], chooser = M.bo === 5 ? "B" : "A";
      var e = { map:dm, pickedBy:"-", sideChooser:chooser, side:null };
      M.maps.push(e); M.pool = []; M.log.push("Decider: " + dm); M.si++;
      M.sidePending = { chooser:chooser, entry:e }; continue;
    }
    if (st.who === M.user) return;
    applyVeto(st, VM.aiVetoChoice(teamOf(st.who), teamOf(st.who === "A" ? "B" : "A"), M.pool, st.act));
  }
  if (M.si >= M.steps.length && !M.sidePending && M.etapa === "veto") prep();
}
function applyVeto(st, map) {
  M.pool.splice(M.pool.indexOf(map), 1);
  var who = teamOf(st.who);
  if (st.act === "ban") { M.bans.push({ map:map, by:st.who }); M.log.push(who.tag + " bane " + map); }
  else {
    var e = { map:map, pickedBy:st.who, sideChooser:st.who === "A" ? "B" : "A", side:null };
    M.maps.push(e); M.log.push(who.tag + " escolhe " + map);
    M.sidePending = { chooser:e.sideChooser, entry:e };
  }
  M.si++;
}
function prep() {
  var u = G.me(), opp = teamOf(M.user === "A" ? "B" : "A");
  VM.ensureTactics(u);
  M.comps = M.maps.map(function (e) { return VM.autoComp(u, e.map); });
  M.oppComps = M.maps.map(function (e) { return VM.autoComp(opp, e.map); });
  M.styles = M.maps.map(function () { return "padrao"; });
  M.etapa = "prep"; M.prepIdx = 0;
}

function head() {
  var A = TA(), B = TB();
  var o = M.user === "A" ? M.odds : 1 - M.odds;
  return '<div class="mhead"><div class="mt">' + G.crest(M.A, "lg") + "<div><strong>" + esc(A.nome) + "</strong><small>força " + G.avgOvr(A) + "</small></div></div>" +
    '<div class="mscore"><b>' + M.wa + "</b><i>Bo" + M.bo + "</i><b>" + M.wb + "</b></div>" +
    '<div class="mt r"><div><strong>' + esc(B.nome) + "</strong><small>força " + G.avgOvr(B) + "</small></div>" + G.crest(M.B, "lg") + "</div></div>" +
    '<p class="muted center">' + esc(M.m.evNome) + (M.m.nome ? " · " + esc(M.m.nome) : "") + " · chance estimada por mapa do seu time: <strong>" + G.pct(o) + "</strong></p>";
}

function viewVeto() {
  var u = G.me(), opp = teamOf(M.user === "A" ? "B" : "A");
  var st = M.steps[M.si];
  var myTurn = st && st.who === M.user && !M.sidePending;
  var prompt;
  if (M.sidePending && M.sidePending.chooser === M.user) {
    var mp = M.sidePending.entry.map;
    prompt = '<div class="card hot"><h3>Escolha o lado inicial em ' + esc(mp) + '</h3><p class="muted">Chance base do ataque neste mapa: ' + G.pct(VM.MAP_ATK[mp]) + '</p><div class="row">' +
      '<button class="btn atk" data-a="mLado" data-v="atk">Começar no ataque</button><button class="btn def" data-a="mLado" data-v="def">Começar na defesa</button></div></div>';
  } else if (myTurn) {
    prompt = '<div class="card hot"><h3>' + (st.act === "ban" ? "Sua vez: BANIR um mapa" : "Sua vez: ESCOLHER um mapa") + '</h3><p class="muted">Clique num mapa disponível. O número é o domínio de cada time.</p><button class="btn sm ghost" data-a="mVetoAuto">Deixar o analista decidir</button></div>';
  } else prompt = '<div class="card"><p class="muted">Aguardando…</p></div>';
  var all = S().mapas.map(function (m) {
    var ban = M.bans.filter(function (b) { return b.map === m; })[0];
    var pk = M.maps.filter(function (e) { return e.map === m; })[0];
    var avail = M.pool.indexOf(m) >= 0;
    var mine = Math.round(u.mapProf[m]), theirs = Math.round(opp.mapProf[m]), d = mine - theirs;
    var cls = ban ? "ban" : pk ? "pick" : "";
    var tagline = ban ? teamOf(ban.by).tag + " baniu" : pk ? (pk.pickedBy === "-" ? "DECIDER" : teamOf(pk.pickedBy).tag + " escolheu") + (pk.side ? " · " + teamOf(pk.sideChooser).tag + " " + (pk.side === "atk" ? "ATQ" : "DEF") : "") : "";
    var inner = '<span class="vm-name">' + m + '</span><span class="vm-dom"><em>Você ' + mine + "</em><em>Eles " + theirs + '</em><b class="' + (d >= 0 ? "pos" : "neg") + '">' + (d >= 0 ? "+" : "") + d + "</b></span>" +
      (tagline ? '<span class="vm-tag">' + esc(tagline) + "</span>" : "") + (ban ? '<span class="vm-x">✕</span>' : "");
    if (myTurn && avail) return '<button class="vmap ' + st.act + '-h" data-a="mVeto" data-v="' + m + '" style="background:' + ART.mapCard(m) + '">' + inner + "</button>";
    return '<div class="vmap ' + cls + (avail ? "" : " off") + '" style="background:' + ART.mapCard(m) + '">' + inner + "</div>";
  }).join("");
  var order = M.steps.map(function (x, i) {
    var who = x.who === "-" ? "—" : teamOf(x.who).tag;
    return '<li class="' + (i < M.si ? "done" : i === M.si ? "now" : "") + '"><span>' + esc(who) + "</span>" + ({ ban:"ban", pick:"pick", decider:"decider" }[x.act]) + "</li>";
  }).join("");
  return head() + scrimBox() + prompt + '<div class="vgrid">' + all + "</div>" +
    '<div class="grid2"><div class="card"><h3>Ordem do veto</h3><ol class="vorder">' + order + '</ol></div><div class="card"><h3>Registro</h3><ul class="vlog">' + M.log.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + "</ul></div></div>";
}

/* ---------------------------------------------------------------------
   Preparação por mapa
   --------------------------------------------------------------------- */
function metaMark(a) { var m = VM.metaBonus(a); return m > 0 ? "  ▲".repeat(m) : m < 0 ? "  ▼".repeat(-m) : ""; }
function scrimBox() {
  var opp = M.user === "A" ? M.B : M.A, r = VM.scrimReport(opp);
  if (!r) return '<div class="card scrimbox off"><b>Sem relatório de scrim.</b> <span class="muted">Faça um scrim contra a ' + esc(VM.T(opp).tag) + " no Início antes da partida pra ver as tendências deles.</span></div>";
  var P2 = VM.ATK_PLANOS, D2 = VM.DEF_SETUPS;
  return '<div class="card scrimbox"><h3>Relatório do scrim · ' + esc(VM.T(opp).tag) + '</h3><div class="scrg"><div><small>No ataque preferem</small>' + r.planos.map(function (x) { return "<b>" + esc(P2[x.k].split(" (")[0]) + "</b> " + x.pct + "%"; }).join(" · ") +
    '</div><div><small>Sites</small>' + r.sites.map(function (x) { return "<b>" + x.k + "</b> " + x.pct + "%"; }).join(" · ") + '</div><div><small>Na defesa</small>' + r.def.map(function (x) { return "<b>" + esc(D2[x.k].split(" (")[0]) + "</b> " + x.pct + "%"; }).join(" · ") +
    '</div><div><small>Mapas fortes / fracos</small><b>' + r.fortes.join(", ") + "</b> / " + r.fracos.join(", ") + "</div></div></div>";
}
function viewPrep() {
  var u = G.me(), five = VM.activeFive(u), i = M.prepIdx, e = M.maps[i];
  var tac = u.taticas[e.map], sites = sidesOf(e.map);
  var an = VM.compAnalysis(u, M.comps[i]);
  var tabs = '<div class="seg">' + M.maps.map(function (x, k) {
    return '<button data-a="mPrep" data-v="' + k + '" class="' + (k === i ? "on" : "") + '">Mapa ' + (k + 1) + " · " + esc(x.map) + "</button>";
  }).join("") + "</div>";
  var sideTxt = e.side ? teamOf(e.sideChooser).tag + " escolheu começar no " + (e.side === "atk" ? "ataque" : "defesa") : "";
  var agents = '<div class="agents">' + five.map(function (p) {
    var cur = M.comps[i][p.id], pool = p.agents.slice(), others = VM.AGENTS.filter(function (a) { return pool.indexOf(a) < 0; });
    return '<label class="ag">' + G.face(p, "sm") + '<span><strong>' + esc(p.nick) + "</strong>" + G.roleTag(p.role) + '</span><select data-c="mAgente" data-map="' + i + '" data-p="' + p.id + '">' +
      (pool.length ? '<optgroup label="Pool do jogador">' + pool.map(function (a) { return '<option value="' + a + '" ' + (a === cur ? "selected" : "") + ">" + a + metaMark(a) + "</option>"; }).join("") + "</optgroup>" : "") +
      '<optgroup label="Outros agentes">' + others.map(function (a) { return '<option value="' + a + '" ' + (a === cur ? "selected" : "") + ">" + a + metaMark(a) + "</option>"; }).join("") + "</optgroup></select></label>";
  }).join("") + "</div>";
  var notes = '<div class="comp-foot"><div class="rolecount">' + ["C", "I", "S", "D"].map(function (r) { return '<span class="r-' + r + '">' + VM.ROLE_NAME[r] + " " + an.cnt[r] + "</span>"; }).join("") + "</div>" +
    (an.notes.length ? '<div class="notes">' + an.notes.map(function (n) { return '<span class="chip warn">' + esc(n) + "</span>"; }).join("") + "</div>" : '<div class="notes"><span class="chip ok">composição equilibrada</span></div>') +
    '<button class="btn sm ghost" data-a="mAutoComp" data-v="' + i + '">Composição automática</button></div>';
  function chips(label, key, cur, opts) {
    return '<div class="cgroup"><label>' + label + '</label><div class="cchips">' + opts.map(function (o) {
      return '<button class="cchip ' + (cur === o[0] ? "on" : "") + '" data-a="mPrepTac" data-k="' + key + '" data-v="' + o[0] + '">' + o[1] + "</button>"; }).join("") + "</div></div>";
  }
  var tacHtml = '<div class="card"><h3>Plano em ' + esc(e.map) + '</h3>' +
    chips("Ataque", "atk.plano", tac.atk.plano, Object.keys(VM.ATK_PLANOS).map(function (k) { return [k, VM.ATK_PLANOS[k].split(" (")[0]]; })) +
    chips("Site alvo", "atk.site", tac.atk.site, [["variar", "Variar"]].concat(sites.map(function (x) { return [x, x]; }))) +
    chips("Defesa", "def.setup", tac.def.setup, Object.keys(VM.DEF_SETUPS).map(function (k) { return [k, VM.DEF_SETUPS[k].split(" (")[0]]; })) +
    chips("Site (stack)", "def.site", tac.def.site, sites.map(function (x) { return [x, x]; })) +
    chips("Estilo no ataque", "estilo.atk", tac.estilo ? tac.estilo.atk : "padrao", [["padrao", "Equilibrado"], ["agressivo", "Agressivo"], ["defensivo", "Cauteloso"]]) +
    chips("Estilo na defesa", "estilo.def", tac.estilo ? tac.estilo.def : "padrao", [["padrao", "Equilibrado"], ["agressivo", "Agressivo"], ["defensivo", "Cauteloso"]]) +
    '<p class="muted">Isso atualiza a tática salva do mapa. Durante a partida você pode mudar round a round.</p></div>';
  var dup = M.comps.some(function (c) { var seen = {}, d = false; Object.keys(c).forEach(function (k) { if (seen[c[k]]) d = true; seen[c[k]] = 1; }); return d; });
  return head() + scrimBox() + tabs + '<div class="grid2 wide"><div class="card"><div class="head"><h3>Composição · ' + esc(e.map) + '</h3><span class="chip">' + esc(sideTxt) + "</span></div>" + agents + notes + "</div>" + tacHtml + "</div>" +
    (dup ? '<div class="banner bad">Agente repetido em algum mapa — cada agente só pode ser usado por um jogador.</div>' : "") +
    '<div class="row end"><button class="btn primary big" data-a="mComecar" ' + (dup ? "disabled" : "") + ">Começar a partida</button></div>";
}

/* ---------------------------------------------------------------------
   Ao vivo
   --------------------------------------------------------------------- */
function beginMap() {
  var e = M.maps[M.mapIdx], A = TA(), B = TB(), i = M.mapIdx, u = G.me();
  var opts = { atkFirst:VM.atkFirstFrom(e), userSide:M.user };
  var myTac = clone(u.taticas[e.map] || VM.defaultTactic(e.map));
  if (M.user === "A") { opts.compA = M.comps[i]; opts.styleA = M.styles[i]; opts.compB = M.oppComps[i]; opts.tacA = myTac; }
  else { opts.compB = M.comps[i]; opts.styleB = M.styles[i]; opts.compA = M.oppComps[i]; opts.tacB = myTac; }
  M.sim = VM.newMapSim(A, B, e.map, opts);
  M.feed = []; M.paused = false; M.cur = null; M.etapa = "live";
  M.dstats = clone(M.sim.stats);
  M.five = { A:VM.activeFive(A), B:VM.activeFive(B) };
}
function myTac() { return M.user === "A" ? M.sim.tacA : M.sim.tacB; }
function nextSideA() {
  var s = M.sim, fa = s.atkFirst === "A", r = s.round;
  if (r < 12) return fa ? "atk" : "def";
  if (r < 24) return fa ? "def" : "atk";
  return ((r - 24) % 2 === 0) ? (fa ? "def" : "atk") : (fa ? "atk" : "def");
}
function mySideNext() { var a = nextSideA(); return M.user === "A" ? a : (a === "atk" ? "def" : "atk"); }

function pcard(p, who) {
  var st = M.dstats[p.id] || { k:0, d:0, a:0 };
  var comp = who === "A" ? M.sim.compA : M.sim.compB;
  return '<div class="lpc" id="pc-' + p.id + '">' + G.face(p, "sm") + '<span class="lpn"><strong>' + esc(p.nick) + "</strong><small>" + esc(comp[p.id] || "") + '</small></span><span class="lpk" id="ks-' + p.id + '">' + st.k + "/" + st.d + "/" + st.a + "</span></div>";
}
function roundDots() {
  return M.sim.rounds.map(function (r) {
    return '<i class="' + (r.w === "A" ? "a" : "b") + (r.upset ? " up" : "") + (r.n === 12 ? " half" : "") + '" title="R' + r.n + '"></i>';
  }).join("");
}
function controlsHtml() {
  var s = M.sim, u = M.user;
  var call = u === "A" ? s.callA : s.callB, to = u === "A" ? s.toA : s.toB;
  var style = myTac().estilo ? myTac().estilo[mySideNext()] : (u === "A" ? s.styleA : s.styleB);
  var side = mySideNext(), tac = myTac(), sites = sidesOf(s.map);
  function chips(key, cur, opts) {
    return opts.map(function (o) { return '<button class="cchip ' + (cur === o[0] ? "on" : "") + '" data-a="mLiveTac" data-k="' + key + '" data-v="' + o[0] + '">' + o[1] + "</button>"; }).join("");
  }
  var tacRow = side === "atk"
    ? '<div class="crow"><span class="lbl">Próx. ataque</span><div class="cchips">' + chips("atk.plano", tac.atk.plano, Object.keys(VM.ATK_PLANOS).map(function (k) { return [k, VM.ATK_PLANOS[k].split(" (")[0]]; })) + '</div><div class="cchips">' + chips("atk.site", tac.atk.site, [["variar", "Variar"]].concat(sites.map(function (x) { return [x, x]; }))) + "</div></div>"
    : '<div class="crow"><span class="lbl">Próx. defesa</span><div class="cchips">' + chips("def.setup", tac.def.setup, Object.keys(VM.DEF_SETUPS).map(function (k) { return [k, VM.DEF_SETUPS[k].split(" (")[0]]; })) + '</div><div class="cchips">' + chips("def.site", tac.def.site, sites.map(function (x) { return [x, x]; })) + "</div></div>";
  return '<div class="crow"><span class="lbl">Compra</span>' + G.seg("mCall", call, [["auto", "Auto"], ["full", "Full"], ["force", "Force"], ["eco", "Eco"]], "sm") +
    '<span class="lbl">Estilo</span>' + G.seg("mStyle", style, [["padrao", "Padrão"], ["agressivo", "Agressivo"], ["defensivo", "Defensivo"]], "sm") + "</div>" + tacRow +
    '<div class="crow"><button class="btn sm" data-a="mTimeout" ' + (to > 0 ? "" : "disabled") + ">Pausa tática (" + to + ")</button>" +
    G.seg("mVel", M.paused ? "pausa" : M.speed, [["pausa", M.paused ? "▶ Continuar" : "❚❚ Pausar"], ["normal", "Normal"], ["rapido", "Rápido"], ["turbo", "Turbo"]], "sm") +
    '<button class="btn sm ghost" data-a="mSkipRound">Pular round</button><button class="btn sm ghost" data-a="mSkipMap">Pular mapa</button></div>';
}
function viewLive() {
  var s = M.sim, A = TA(), B = TB();
  var shownA = M.cur ? M.cur.pre.sa : s.sa, shownB = M.cur ? M.cur.pre.sb : s.sb;
  var sideA = s.done ? null : (M.cur ? M.cur.r.sideA : nextSideA());
  function teamCol(who, t) {
    var sd = sideA ? (who === "A" ? sideA : (sideA === "atk" ? "def" : "atk")) : null;
    return '<div class="lteam ' + who.toLowerCase() + '"><div class="lth">' + G.crest(t.id, "sm") + "<strong>" + esc(t.tag) + '</strong><span class="sidechip ' + (sd || "") + '" id="sd-' + who + '">' + (sd ? (sd === "atk" ? "ATAQUE" : "DEFESA") : "") + '</span></div>' +
      '<div class="ltc"><span id="cr-' + who + '">$' + (who === "A" ? s.credA : s.credB) + '</span><span id="by-' + who + '"></span><span>Pausas <b id="to-' + who + '">' + (who === "A" ? s.toA : s.toB) + "</b></span></div>" +
      M.five[who].map(function (p) { return pcard(p, who); }).join("") + "</div>";
  }
  var body = s.done ? mapDoneBox() : '<div class="card controls" id="mctl">' + controlsHtml() + "</div>";
  return '<div class="bcast"><div class="bc-t a">' + G.crest(M.A, "md") + "<strong>" + esc(A.tag) + '</strong><b id="sb-sa">' + shownA + '</b></div>' +
    '<div class="bc-c"><span class="bc-map">' + esc(s.map) + " · MAPA " + (M.mapIdx + 1) + " · SÉRIE " + M.wa + "–" + M.wb + '</span><span class="bc-time" id="sb-time">1:40</span><span class="bc-rnd" id="sb-rnd">ROUND ' + Math.min(s.round + (M.cur ? 0 : 1), 99) + '</span><span class="bc-alive"><em id="al-A">5</em> vs <em id="al-B">5</em></span></div>' +
    '<div class="bc-t b"><b id="sb-sb">' + shownB + "</b><strong>" + esc(B.tag) + "</strong>" + G.crest(M.B, "md") + "</div></div>" +
    '<div class="dots" id="sb-dots">' + roundDots() + "</div>" +
    '<div class="livegrid">' + teamCol("A", A) + '<div class="lmap">' + ART.mapSVG(s.map, sidesOf(s.map)) + '<div class="rbanner" id="rbanner"></div><div class="killfeed" id="killfeed"></div><button class="camb" data-a="mCam">' + (M.cam === "livre" ? "Câmera: mapa todo" : "Câmera: seguir a ação") + '</button></div>' + teamCol("B", B) + "</div>" +
    body + '<div class="card"><h3>Rounds</h3><ul class="feed" id="mfeed">' + feedHtml() + "</ul></div>";
}
function feedHtml() {
  return (M.feed || []).slice(0, 14).map(function (f) { return '<li class="f-' + f.k + (f.up ? " up" : "") + '">' + esc(f.t) + "</li>"; }).join("");
}

/* ---- trajetórias ---- */
function jit(seed, i, d) { var x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453; return ((x - Math.floor(x)) * 2 - 1) * d; }
function kfAlong(kf, pts, t0, t1, off) {
  for (var i = 0; i <= 10; i++) { var p = ART.along(pts, i / 10); kf.push([t0 + (t1 - t0) * i / 10, { x:p.x + off.x, y:p.y + off.y }]); }
}
function kfTo(kf, pt, t, off) { kf.push([t, { x:pt.x + off.x, y:pt.y + off.y }]); }
function last(kf) { return kf[kf.length - 1][1]; }
function posAt(kf, t) {
  if (t <= kf[0][0]) return kf[0][1];
  for (var i = 1; i < kf.length; i++) {
    if (t <= kf[i][0]) { var a = kf[i - 1], b = kf[i], f = (t - a[0]) / Math.max(1e-6, b[0] - a[0]); return { x:a[1].x + (b[1].x - a[1].x) * f, y:a[1].y + (b[1].y - a[1].y) * f }; }
  }
  return kf[kf.length - 1][1];
}
function buildPlan(r) {
  var s = M.sim, sites = sidesOf(s.map), L = ART.layout(s.map, sites);
  var atkWho = r.sideA === "atk" ? "A" : "B", defWho = atkWho === "A" ? "B" : "A";
  var site = r.atk.site, other = sites.filter(function (x) { return x !== site; })[0] || site;
  var fake = r.atk.fakeSite || other;
  var T = r.atk.plano === "rush" ? 0.34 : r.atk.ritmo === "rapido" ? 0.42 : r.atk.ritmo === "lento" ? 0.6 : 0.5;
  var kf = {}, seed = r.n * 7 + (s.map.length);
  var S0 = 0.07;
  M.five[atkWho].forEach(function (p, i) {
    var off = { x:jit(seed, i, 22), y:jit(seed + 1, i, 18) }, k = [[0, { x:L.atk.x + off.x, y:L.atk.y + off.y }]];
    var pl = r.atk.plano;
    if (pl === "exec" || pl === "rush") kfAlong(k, L.routes[site], S0, T, off);
    else if (pl === "split") kfAlong(k, i < 3 ? L.routes[site] : L.routes[site + "_mid"], S0, T, off);
    else if (pl === "lurk") { if (i < 4) kfAlong(k, L.routes[site], S0, T, off); else kfAlong(k, L.routes[other].slice(0, 3), S0, T - 0.05, off); }
    else if (pl === "fake") {
      if (i < 2) { kfAlong(k, L.routes[fake].slice(0, 3), S0, 0.3, off); kfTo(k, last(k), 0.42, { x:0, y:0 }); kfAlong(k, [last(k), L.mid, L.sites[site]], 0.42, 0.66, off); }
      else { kfTo(k, last(k), 0.2, { x:0, y:0 }); kfAlong(k, L.routes[site + "_mid"], 0.2, T + 0.08, off); }
    } else {
      if (i < 2) kfAlong(k, L.routes[site], S0, T, off);
      else if (i === 2) kfAlong(k, L.routes[site + "_mid"], S0, T, off);
      else { kfAlong(k, L.routes[other].slice(0, 3), S0, 0.34, off); kfTo(k, last(k), 0.44, { x:0, y:0 }); kfAlong(k, [last(k), L.mid, L.sites[site]], 0.44, 0.7, off); }
    }
    var lp = last(k); kfTo(k, { x:L.sites[site].x + jit(seed + 3, i, 50), y:L.sites[site].y + jit(seed + 4, i, 38) }, Math.min(0.95, k[k.length - 1][0] + 0.08), { x:0, y:0 });
    if (pl === "lurk" && i === 4) { k.pop(); kfTo(k, lp, 0.6, { x:0, y:0 }); kfTo(k, L.sites[site], 0.85, off); }
    kf[p.id] = k;
  });
  /* defesa */
  var d = r.def, posts = [];
  if (d.setup === "stack") { posts = L.defPos[d.site].concat([{ x:L.sites[d.site].x, y:L.sites[d.site].y + 45 }, L.midPos[0]]); }
  else if (d.setup === "agressivo") { sites.forEach(function (sk) { posts.push(L.routes[sk][2]); }); posts.push(L.mid, L.midPos[1], L.defPos[sites[0]][0]); }
  else if (d.setup === "retake") { sites.forEach(function (sk) { posts.push({ x:(L.def.x + L.sites[sk].x) / 2, y:L.sites[sk].y - 90 }); }); posts.push(L.def, L.midPos[0], L.midPos[1]); }
  else { sites.forEach(function (sk) { posts.push(L.defPos[sk][0]); }); sites.forEach(function (sk) { posts.push(L.defPos[sk][1]); }); posts.push(L.midPos[0]); }
  var rot = d.rotacao === "rapida" ? 0.42 : d.rotacao === "lenta" ? 0.62 : 0.52;
  var siteP = L.sites[site];
  M.five[defWho].forEach(function (p, i) {
    var off = { x:jit(seed + 9, i, 16), y:jit(seed + 10, i, 12) }, post = posts[i % posts.length];
    var k = [[0, { x:L.def.x + off.x, y:L.def.y + off.y }]];
    kfTo(k, post, 0.2, off);
    var near = Math.hypot(post.x - siteP.x, post.y - siteP.y) < 140;
    kfTo(k, post, near ? 0.6 : rot, off);
    kfTo(k, { x:siteP.x + jit(seed + 11, i, 60), y:siteP.y - 30 + jit(seed + 12, i, 40) }, near ? 0.85 : rot + 0.2, { x:0, y:0 });
    kf[p.id] = k;
  });
  /* utilitárias (smoke, flash, molotov, armadilha) de acordo com os agentes */
  var util = [], compA = s.compA, compB = s.compB;
  function rolesOf(who) { var comp = who === "A" ? compA : compB, o = {}; M.five[who].forEach(function (p) { var r = VM.AGENT_ROLE[comp[p.id]]; if (r) (o[r] = o[r] || []).push(p); }); return o; }
  var ra = rolesOf(atkWho), rd = rolesOf(defWho), S2 = L.sites[site], main = L.routes[site][2];
  function near(pt, d) { return { x:pt.x + jit(seed + util.length, 3, d), y:pt.y + jit(seed + util.length, 5, d) }; }
  if (rd.S) { rd.S.forEach(function (p, i) { var q = L.defPos[sites[i % sites.length]][2]; util.push({ t0:0.14, t1:0.99, tp:"trap", x:q.x, y:q.y + 30, who:defWho }); }); }
  if (rd.C && r.buyA !== "eco") util.push({ t0:0.16, t1:0.36, tp:"smoke", x:main.x, y:main.y - 30, who:defWho });
  if (ra.C) {
    util.push({ t0:T - 0.07, t1:T + 0.2, tp:"smoke", x:S2.x - 70, y:S2.y - 40, who:atkWho });
    util.push({ t0:T - 0.06, t1:T + 0.2, tp:"smoke", x:S2.x + 70, y:S2.y - 50, who:atkWho });
    if (ra.C.length > 1 || sites.length > 2) util.push({ t0:T - 0.06, t1:T + 0.18, tp:"smoke", x:S2.x, y:S2.y - 95, who:atkWho });
  }
  if (ra.I) { util.push({ t0:T - 0.03, t1:T + 0.01, tp:"flash", x:S2.x + jit(seed, 7, 30), y:S2.y - 10, who:atkWho }); util.push({ t0:T - 0.12, t1:T - 0.04, tp:"recon", x:S2.x, y:S2.y, who:atkWho }); }
  if (ra.D) util.push({ t0:T - 0.01, t1:T + 0.03, tp:"flash", x:main.x, y:main.y - 50, who:atkWho });
  if (r.ev.plant) {
    var pt = r.ev.plant.t;
    util.push({ t0:pt + 0.08, t1:pt + 0.24, tp:"molly", x:S2.x + 16, y:S2.y + 8, who:defWho });
    if (ra.C || ra.S) util.push({ t0:pt + 0.12, t1:pt + 0.3, tp:"smoke", x:S2.x, y:S2.y - 70, who:atkWho });
  } else if (rd.I) util.push({ t0:0.55, t1:0.6, tp:"flash", x:main.x, y:main.y - 20, who:defWho });
  return { kf:kf, atkWho:atkWho, defWho:defWho, site:site, L:L, util:util };
}

/* ---- loop ---- */
function el(id) { return document.getElementById(id); }
function svgEl(tag, attrs) { var n = document.createElementNS("http://www.w3.org/2000/svg", tag); for (var k in attrs) n.setAttribute(k, attrs[k]); return n; }
function buildDots() {
  var g = el("dots"); if (!g) return;
  g.innerHTML = "";
  ["A", "B"].forEach(function (who) {
    M.five[who].forEach(function (p) {
      var comp = who === "A" ? M.sim.compA : M.sim.compB;
      var role = VM.AGENT_ROLE[comp[p.id]] || p.role;
      var gg = svgEl("g", { id:"d-" + p.id, "class":"pdot " + who.toLowerCase() + (who === M.user ? " me" : "") });
      var cone = svgEl("path", { d:"M0 0 L70 -30 A76 76 0 0 1 70 30 Z", "class":"cone", id:"c-" + p.id }); gg.appendChild(cone);
      gg.appendChild(svgEl("circle", { r:17, "class":"ring r-" + role }));
      gg.appendChild(svgEl("circle", { r:13, "class":"core" }));
      var tx = svgEl("text", { y:4.5, "text-anchor":"middle", "class":"ag" }); tx.textContent = (comp[p.id] || p.nick).slice(0, 2).toUpperCase(); gg.appendChild(tx);
      var nm = svgEl("text", { y:-22, "text-anchor":"middle", "class":"pnick" }); nm.textContent = p.nick; gg.appendChild(nm);
      g.appendChild(gg);
    });
  });
  if (M.cur && !M.cur.ended) { M.cur.drawn = 0; M.cur.plantShown = false; M.cur.dead = {}; M.cur.burst = {}; M.cur.alive = { A:5, B:5 }; M.dstats = clone(M.cur.preStats); clearMarks(); }
  else if (M.cur) { M.five.A.concat(M.five.B).forEach(function (p) { var n = el("d-" + p.id); if (n) n.style.display = "none"; }); }
  else placeIdle();
}
function placeIdle() {
  var s = M.sim, sites = sidesOf(s.map), L = ART.layout(s.map, sites), a = nextSideA();
  ["A", "B"].forEach(function (who) {
    var atk = (who === "A") === (a === "atk"), base = atk ? L.atk : L.def;
    M.five[who].forEach(function (p, i) { var n = el("d-" + p.id); if (n) { n.setAttribute("transform", "translate(" + (base.x + (i - 2) * 26) + "," + (base.y + (atk ? -8 : 8)) + ")"); n.classList.remove("dead"); } });
  });
}
function clearMarks() { ["marks", "spike", "util", "fx"].forEach(function (id) { var m = el(id); if (m) m.innerHTML = ""; }); if (M.cur) { M.cur.utilOn = {}; M.cur.plantShown = false; } }
function sfx(n) { if (window.SFX && !(M && M.speed === "turbo")) window.SFX.play(n); }
function killfeed(k) {
  var kf = el("killfeed"); if (!kf) return;
  var kp = VM.P(k.k), vp = VM.P(k.v), compK = k.kt === "A" ? M.sim.compA : M.sim.compB, compV = k.kt === "A" ? M.sim.compB : M.sim.compA;
  var li = document.createElement("div"); li.className = "kfi " + k.kt.toLowerCase();
  li.innerHTML = "<b>" + esc(kp.nick) + '</b><i class="kag">' + esc((compK[kp.id] || "").slice(0, 2).toUpperCase()) + '</i><span class="kgun">' + (k.hs ? "◎" : "✕") + '</span><i class="kag v">' + esc((compV[vp.id] || "").slice(0, 2).toUpperCase()) + "</i><b class=\"v\">" + esc(vp.nick) + "</b>";
  kf.insertBefore(li, kf.firstChild);
  while (kf.children.length > 5) kf.removeChild(kf.lastChild);
  setTimeout(function () { li.classList.add("out"); }, Math.max(900, M.cur ? M.cur.D * 0.5 : 2000));
}
var VB = { x:0, y:0, w:1000, h:640 };
function camera(t, c) {
  var svg = el("map2d"); if (!svg) return;
  var tgt = { x:0, y:0, w:1000, h:640 };
  if (M.cam !== "livre" && t > 0.02) {
    var pts = [];
    ["A", "B"].forEach(function (w) { M.five[w].forEach(function (p) { if (!c.dead[p.id]) pts.push(posAt(c.plan.kf[p.id], t)); }); });
    var nk = c.r.ev.kills.filter(function (k) { return Math.abs(k.t - t) < 0.08; });
    if (nk.length || (t > 0.4 && pts.length)) {
      var foc = nk.length ? posAt(c.plan.kf[nk[0].v], nk[0].t) : c.plan.L.sites[c.plan.site];
      var zw = 1000 / 1.45, zh = 640 / 1.45;
      tgt = { x:Math.max(0, Math.min(1000 - zw, foc.x - zw / 2)), y:Math.max(0, Math.min(640 - zh, foc.y - zh / 2)), w:zw, h:zh };
    }
  }
  var f = M.speed === "turbo" ? 1 : 0.06;
  VB.x += (tgt.x - VB.x) * f; VB.y += (tgt.y - VB.y) * f; VB.w += (tgt.w - VB.w) * f; VB.h += (tgt.h - VB.h) * f;
  svg.setAttribute("viewBox", VB.x.toFixed(1) + " " + VB.y.toFixed(1) + " " + VB.w.toFixed(1) + " " + VB.h.toFixed(1));
}
function drawUtil(t, c) {
  var g = el("util"); if (!g) return;
  c.utilOn = c.utilOn || {};
  c.plan.util.forEach(function (u, i) {
    var on = t >= u.t0 && t <= u.t1, id = "u" + i;
    if (on && !c.utilOn[i]) {
      c.utilOn[i] = true;
      var n = svgEl("g", { id:id, transform:"translate(" + u.x.toFixed(0) + "," + u.y.toFixed(0) + ")", "class":"ut " + u.tp + " " + u.who.toLowerCase() });
      if (u.tp === "smoke") { n.appendChild(svgEl("circle", { r:40 })); n.appendChild(svgEl("circle", { r:28, "class":"in" })); sfx("smoke"); }
      else if (u.tp === "flash") { n.appendChild(svgEl("circle", { r:10 })); sfx("flash"); }
      else if (u.tp === "molly") { n.appendChild(svgEl("circle", { r:30 })); n.appendChild(svgEl("circle", { r:18, "class":"in" })); sfx("molly"); }
      else if (u.tp === "trap") { n.appendChild(svgEl("path", { d:"M-7 0 L0 -7 L7 0 L0 7Z" })); }
      else if (u.tp === "recon") { n.appendChild(svgEl("circle", { r:12 })); }
      g.appendChild(n);
    } else if (!on && c.utilOn[i] && t > u.t1) {
      c.utilOn[i] = false; var o = el(id); if (o) o.remove();
    }
  });
}
function spikeRing(t, c) {
  var ev = c.r.ev, sp = el("spike"); if (!sp || !ev.plant) return;
  var pt = ev.plant.t, sP = c.plan.L.sites[ev.site], R = 22, C = 2 * Math.PI * R;
  var g = el("spk"); 
  if (t >= pt - 0.05 && !g) {
    g = svgEl("g", { id:"spk", transform:"translate(" + (sP.x + 10) + "," + (sP.y + 6) + ")", "class":"spk" });
    g.appendChild(svgEl("circle", { r:R, "class":"trk" }));
    g.appendChild(svgEl("circle", { r:R, "class":"prog", id:"spkp", transform:"rotate(-90)", "stroke-dasharray":"0 " + C }));
    g.appendChild(svgEl("circle", { r:12, "class":"body" }));
    g.appendChild(svgEl("path", { d:"M0 -7 L6 5 L-6 5 Z" }));
    sp.appendChild(g); sfx("plant");
  }
  if (!g) return;
  var pr = el("spkp"), frac, cls;
  if (t < pt) { frac = (t - (pt - 0.05)) / 0.05; cls = "prog planting"; }
  else if (ev.defuse && t > 0.88) { frac = Math.min(1, (t - 0.88) / 0.1); cls = "prog defusing"; }
  else { frac = 1 - (t - pt) / (1 - pt); cls = "prog ticking"; g.classList.add("live"); }
  pr.setAttribute("class", cls);
  pr.setAttribute("stroke-dasharray", (C * Math.max(0, Math.min(1, frac))).toFixed(1) + " " + C.toFixed(1));
  if (!c.plantShown && t >= pt) { c.plantShown = true; var pl = el("plant-" + ev.site); if (pl) pl.classList.add("planted"); }
}
function faceAngle(p, who, t, c) {
  var kf = c.plan.kf[p.id], a = posAt(kf, t), b = posAt(kf, Math.max(0, t - 0.015));
  var enemy = who === "A" ? "B" : "A", best = null, bd = 330;
  M.five[enemy].forEach(function (e) { if (c.dead[e.id]) return; var q = posAt(c.plan.kf[e.id], t), d = Math.hypot(q.x - a.x, q.y - a.y); if (d < bd) { bd = d; best = q; } });
  var ang;
  if (best) ang = Math.atan2(best.y - a.y, best.x - a.x);
  else if (Math.hypot(a.x - b.x, a.y - b.y) > 0.4) ang = Math.atan2(a.y - b.y, a.x - b.x);
  else { var S2 = c.plan.L.sites[c.plan.site]; ang = who === c.plan.defWho ? Math.atan2(c.plan.L.atk.y - a.y, c.plan.L.atk.x - a.x) : Math.atan2(S2.y - a.y, S2.x - a.x); }
  c.ang = c.ang || {};
  var prev = c.ang[p.id]; if (prev != null) { var d2 = Math.atan2(Math.sin(ang - prev), Math.cos(ang - prev)); ang = prev + d2 * 0.25; }
  c.ang[p.id] = ang;
  return ang * 180 / Math.PI;
}

function startRound(now) {
  var s = M.sim, opp = M.user === "A" ? "B" : "A";
  var oppStreakAgainst = opp === "A" ? s.streakB : s.streakA;
  if (oppStreakAgainst >= 3 && (opp === "A" ? s.toA : s.toB) > 0 && Math.random() < 0.6) {
    VM.useTimeout(s, opp); M.feed.unshift({ t:teamOf(opp).tag + " pede pausa tática.", k:"to" });
  }
  var pre = { sa:s.sa, sb:s.sb };
  M.dstats = clone(s.stats);
  var preStats = clone(s.stats);
  var r = VM.stepRound(s);
  if (M.user === "A") s.callA = "auto"; else s.callB = "auto";
  var plan = buildPlan(r);
  M.cur = { r:r, pre:pre, preStats:preStats, t0:now, D:SPEED[M.speed], plan:plan, dead:{}, drawn:0, plantShown:false, ended:false, alive:{ A:5, B:5 }, utilOn:{} };
  clearMarks();
  var kfd = el("killfeed"); if (kfd) kfd.innerHTML = "";
  var rb = el("rbanner"); if (rb) { rb.className = "rbanner"; rb.innerHTML = ""; }
  setTxt("sb-rnd", r.n > 24 ? "PRORROGAÇÃO · R" + r.n : "ROUND " + r.n);
  setTxt("al-A", "5"); setTxt("al-B", "5");
  ["A", "B"].forEach(function (who) {
    var sd = who === "A" ? r.sideA : (r.sideA === "atk" ? "def" : "atk"), n = el("sd-" + who);
    if (n) { n.className = "sidechip " + sd; n.textContent = sd === "atk" ? "ATAQUE" : "DEFESA"; }
    setTxt("by-" + who, VM.BUY_NAME[who === "A" ? r.buyA : r.buyB]);
    setTxt("to-" + who, who === "A" ? s.toA : s.toB);
    M.five[who].forEach(function (p) { var c = el("pc-" + p.id); if (c) c.classList.remove("dead"); var d = el("d-" + p.id); if (d) { d.classList.remove("dead"); d.style.display = ""; } });
  });
  var ctl = el("mctl"); if (ctl) ctl.innerHTML = controlsHtml();
}
function setTxt(id, v) { var n = el(id); if (n) n.textContent = v; }
function fmtClock(sec) { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ":" + ("0" + (sec % 60)).slice(-2); }

function draw(t) {
  var c = M.cur, ev = c.r.ev, plan = c.plan;
  if (!el("d-" + M.five.A[0].id)) buildDots();
  ["A", "B"].forEach(function (who) {
    M.five[who].forEach(function (p) {
      if (c.dead[p.id]) return;
      var n = el("d-" + p.id); if (!n) return;
      var q = posAt(plan.kf[p.id], t);
      n.setAttribute("transform", "translate(" + q.x.toFixed(1) + "," + q.y.toFixed(1) + ")");
      var cn = el("c-" + p.id); if (cn) cn.setAttribute("transform", "rotate(" + faceAngle(p, who, t, c).toFixed(1) + ")");
    });
  });
  drawUtil(t, c);
  /* rajadas antes de cada abate */
  var fx = el("fx");
  ev.kills.forEach(function (k, i) {
    if (c.dead[k.v] || c.dead[k.k]) return;
    if (t >= k.t - 0.035 && t < k.t && !(c.burst && c.burst[i])) {
      c.burst = c.burst || {}; c.burst[i] = true;
      var vp0 = posAt(plan.kf[k.v], t), kp0 = posAt(plan.kf[k.k], t);
      if (fx && Math.hypot(kp0.x - vp0.x, kp0.y - vp0.y) < 320) {
        for (var j = 0; j < 3; j++) fx.appendChild(svgEl("line", { x1:kp0.x, y1:kp0.y, x2:vp0.x + jit(i, j, 14), y2:vp0.y + jit(i + 3, j, 14), "class":"tracer " + k.kt.toLowerCase(), style:"animation-delay:" + (j * 60) + "ms" }));
        fx.appendChild(svgEl("circle", { cx:kp0.x, cy:kp0.y, r:6, "class":"muzzle" }));
        sfx("shot");
      }
    }
  });
  var marks = el("marks");
  while (c.drawn < ev.kills.length && ev.kills[c.drawn].t <= t) {
    var k = ev.kills[c.drawn++];
    var vp = posAt(plan.kf[k.v], k.t), kp = c.dead[k.k] ? vp : posAt(plan.kf[k.k], k.t);
    c.dead[k.v] = true;
    var vwho = k.kt === "A" ? "B" : "A";
    c.alive[vwho]--;
    if (marks) {
      if (Math.hypot(kp.x - vp.x, kp.y - vp.y) < 300) marks.appendChild(svgEl("line", { x1:kp.x, y1:kp.y, x2:vp.x, y2:vp.y, "class":"shot " + k.kt.toLowerCase() }));
      marks.appendChild(svgEl("circle", { cx:vp.x, cy:vp.y, r:10, "class":"hit" }));
      var x = svgEl("g", { transform:"translate(" + vp.x + "," + vp.y + ")", "class":"kx " + vwho.toLowerCase() });
      x.appendChild(svgEl("path", { d:"M-9 -9 L9 9 M9 -9 L-9 9" }));
      marks.appendChild(x);
    }
    k.hs = ((c.r.n * 13 + c.drawn * 7) % 10) < 4;
    killfeed(k); sfx(k.hs ? "hs" : "kill");
    var dn = el("d-" + k.v); if (dn) dn.classList.add("dead");
    var pc = el("pc-" + k.v); if (pc) pc.classList.add("dead");
    ["k", "v"].forEach(function (f) {
      var pid = k[f], ds = M.dstats[pid]; if (!ds) return;
      if (f === "k") ds.k++; else ds.d++;
      setTxt("ks-" + pid, ds.k + "/" + ds.d + "/" + ds.a);
    });
    setTxt("al-A", c.alive.A); setTxt("al-B", c.alive.B);
  }
  spikeRing(t, c);
  camera(t, c);
  var clock;
  if (ev.plant && t >= ev.plant.t) clock = "💣 " + fmtClock(45 * (1 - (t - ev.plant.t) / (1 - ev.plant.t)));
  else clock = fmtClock(100 * (1 - Math.min(1, t / 0.97)));
  setTxt("sb-time", t < 0.06 ? "COMPRA" : clock);
}
function endRound(now) {
  var c = M.cur, s = M.sim, r = c.r;
  c.ended = true;
  M.dstats = clone(s.stats);
  M.five.A.concat(M.five.B).forEach(function (p) { var ds = M.dstats[p.id]; if (ds) setTxt("ks-" + p.id, ds.k + "/" + ds.d + "/" + ds.a); });
  setTxt("sb-sa", s.sa); setTxt("sb-sb", s.sb);
  setTxt("cr-A", "$" + s.credA); setTxt("cr-B", "$" + s.credB);
  M.feed.unshift({ t:"R" + r.n + " · " + r.txt, k:r.w === M.user ? "w" : "l", up:r.upset });
  var f = el("mfeed"); if (f) f.innerHTML = feedHtml();
  var d = el("sb-dots"); if (d) d.innerHTML = roundDots();
  var ev = r.ev;
  if (ev.plant && !ev.defuse && r.tipo === "spike") { var fx = el("fx"), sP = c.plan.L.sites[ev.site]; if (fx) fx.appendChild(svgEl("circle", { cx:sP.x + 10, cy:sP.y + 6, r:20, "class":"boom" })); sfx("boom"); }
  else if (ev.defuse) sfx("defuse");
  sfx(r.w === M.user ? "win" : "lose");
  var rb = el("rbanner");
  if (rb) { rb.className = "rbanner show " + r.w.toLowerCase(); rb.innerHTML = "<b>" + esc(teamOf(r.w).tag) + " VENCE O ROUND</b><small>" + esc(r.txt) + "</small>"; }
  var pr = document.querySelectorAll(".planted"); for (var i = 0; i < pr.length; i++) pr[i].classList.remove("planted");
  c.endAt = now + Math.max(160, c.D * 0.3);
}
function frame(now) {
  M && (M.raf = null);
  if (!M || M.etapa !== "live" || M.sim.done && !M.cur) return;
  if (M.paused) return;
  if (!M.cur) startRound(now);
  var c = M.cur, t = (now - c.t0) / c.D;
  if (!c.ended) { draw(Math.min(1, t)); if (t >= 1) endRound(now); }
  else if (now >= c.endAt) {
    M.cur = null;
    if (M.sim.done) { onMapDone(); G.render(); return; }
    var ctl = el("mctl"); if (ctl) ctl.innerHTML = controlsHtml();
  }
  M.raf = requestAnimationFrame(frame);
}
function kick() { if (M && !M.raf && M.etapa === "live" && !M.paused && !M.sim.done) M.raf = requestAnimationFrame(frame); }
function stopLoop() { if (M && M.raf) { cancelAnimationFrame(M.raf); M.raf = null; } }

function finishCurrentRoundInstant() {
  if (!M.cur) return;
  if (!M.cur.ended) { draw(1); endRound(performance.now()); }
  M.cur = null;
}
function onMapDone() {
  stopLoop();
  var s = M.sim;
  var sum = VM.mapSummary(s);
  sum.compNotes = VM.compAnalysis(G.me(), M.comps[M.mapIdx]).notes;
  M.results.push(sum);
  if (s.winner === "A") M.wa++; else M.wb++;
}
function seriesOver() { var need = Math.ceil(M.bo / 2); return M.wa >= need || M.wb >= need; }
function mapDoneBox() {
  var s = M.sim, won = s.winner === M.user, over = seriesOver();
  var ids = Object.keys(s.stats).sort(function (a, b) { return (s.stats[b].dmg + s.stats[b].k * 50) - (s.stats[a].dmg + s.stats[a].k * 50); });
  var mvp = VM.P(ids[0]);
  var my = M.user === "A" ? s.sa + "–" + s.sb : s.sb + "–" + s.sa;
  return '<div class="card mapdone ' + (won ? "won" : "lost") + '"><div class="k">Fim do mapa · ' + esc(s.map) + "</div><h2>" + (won ? "VITÓRIA" : "DERROTA") + " " + my + "</h2>" +
    '<div class="mvp">' + G.face(mvp, "lg") + "<div><small>MVP do mapa</small><strong>" + esc(mvp.nick) + "</strong><span>" + s.stats[mvp.id].k + "/" + s.stats[mvp.id].d + "/" + s.stats[mvp.id].a + "</span></div></div>" +
    '<div class="row">' + (over ? '<button class="btn primary" data-a="mFinal">Ver relatório da série</button>' : '<button class="btn primary" data-a="mProxMapa">Próximo mapa: ' + esc(M.maps[M.mapIdx + 1].map) + "</button>") + "</div></div>";
}

/* ---------------------------------------------------------------------
   Relatório
   --------------------------------------------------------------------- */
function finalizeSeries() {
  var res = VM.seriesResult(M.A, M.B, M.bo, M.results, M.wa, M.wb, M.log);
  G.playDay(res);
  M.final = res; M.etapa = "relatorio";
  G.persist();
}
function viewRelatorio() {
  var res = M.final, u = M.user, uid = S().userTeam, won = res.winner === uid;
  var lines = [], oddsU = u === "A" ? M.odds : 1 - M.odds;
  lines.push("Antes do jogo, a chance estimada por mapa era " + G.pct(oddsU) + (oddsU >= 0.58 ? " — vocês eram favoritos." : oddsU <= 0.42 ? " — vocês eram azarões." : " — jogo equilibrado."));
  res.maps.forEach(function (m) {
    var rs = m.rounds, pistols = [0, 12].filter(function (k) { return rs[k]; }).map(function (k) { return rs[k].w === u; });
    var upFor = rs.filter(function (r) { return r.upset && r.w === u; }).length, upAg = rs.filter(function (r) { return r.upset && r.w !== u; }).length;
    var best = 0, cur = 0, bestO = 0, curO = 0;
    rs.forEach(function (r) { if (r.w === u) { cur++; curO = 0; } else { curO++; cur = 0; } best = Math.max(best, cur); bestO = Math.max(bestO, curO); });
    var sc = u === "A" ? m.sa + "–" + m.sb : m.sb + "–" + m.sa;
    var parts = ["pistols " + pistols.filter(Boolean).length + " de " + pistols.length];
    if (upFor) parts.push(upFor + " round(s) ganho(s) com compra pior");
    if (upAg) parts.push(upAg + " perdido(s) com compra melhor");
    parts.push("maior sequência sua " + best + ", deles " + bestO);
    if (m.compNotes && m.compNotes.length) parts.push("composição: " + m.compNotes.join(", "));
    lines.push("<strong>" + esc(m.map) + " " + sc + (m.winner === u ? " (vitória)" : " (derrota)") + "</strong> — " + esc(parts.join(" · ")) + ".");
  });
  var agg = {};
  res.maps.forEach(function (m) { Object.keys(m.stats).forEach(function (pid) {
    var x = m.stats[pid], a = agg[pid] = agg[pid] || { k:0, d:0, a:0, dmg:0, r:0 };
    a.k += x.k; a.d += x.d; a.a += x.a; a.dmg += x.dmg; a.r += m.sa + m.sb; }); });
  function acs(id) { return (agg[id].dmg + agg[id].k * 50) / Math.max(1, agg[id].r); }
  var ids = Object.keys(agg).sort(function (a, b) { return acs(b) - acs(a); });
  var mvp = VM.P(ids[0]), myIds = VM.activeFive(G.me()).map(function (p) { return p.id; });
  var table = '<table class="stat"><thead><tr><th>Jogador</th><th>Time</th><th class="num">K</th><th class="num">D</th><th class="num">A</th><th class="num">ACS</th></tr></thead><tbody>' +
    ids.map(function (pid) { var p = VM.P(pid), a = agg[pid];
      return '<tr class="' + (myIds.indexOf(pid) >= 0 ? "you" : "") + '"><td><span class="plink">' + G.face(p, "xs") + "<strong>" + esc(p.nick) + "</strong></span></td><td>" + G.teamChip(p.teamId) + '</td><td class="num">' + a.k + '</td><td class="num">' + a.d + '</td><td class="num">' + a.a + '</td><td class="num">' + Math.round(acs(pid)) + "</td></tr>"; }).join("") + "</tbody></table>";
  return head() + '<div class="card mapdone ' + (won ? "won" : "lost") + '"><div class="k">Fim de série</div><h2>' + (won ? "VITÓRIA" : "DERROTA") + " POR " + Math.max(res.wa, res.wb) + "–" + Math.min(res.wa, res.wb) + "</h2>" +
    '<div class="mvp">' + G.face(mvp, "lg") + "<div><small>MVP da série</small><strong>" + esc(mvp.nick) + "</strong><span>" + agg[ids[0]].k + "/" + agg[ids[0]].d + "/" + agg[ids[0]].a + " · " + esc(VM.T(mvp.teamId).tag) + "</span></div></div></div>" +
    '<div class="grid2"><div class="card"><h3>Por que deu nisso</h3><ul class="why">' + lines.map(function (l) { return "<li>" + l + "</li>"; }).join("") + "</ul></div>" +
    '<div class="card"><h3>Estatísticas da série</h3>' + table + "</div></div>" +
    '<div class="row end"><button class="btn primary big" data-a="mSair">Voltar ao clube</button></div>';
}

/* ---------------------------------------------------------------------
   Ações
   --------------------------------------------------------------------- */
function rr() { G.render(); }
ACT.mVeto = function (v) { applyVeto(M.steps[M.si], v); vetoAuto(); rr(); };
ACT.mVetoAuto = function () {
  var st = M.steps[M.si]; applyVeto(st, VM.aiVetoChoice(G.me(), teamOf(M.user === "A" ? "B" : "A"), M.pool, st.act)); vetoAuto(); rr();
};
ACT.mLado = function (v) {
  M.sidePending.entry.side = v; M.log.push(G.me().tag + " começa no " + (v === "atk" ? "ataque" : "defesa") + " em " + M.sidePending.entry.map);
  M.sidePending = null; vetoAuto(); rr();
};
ACT.mPrep = function (v) { M.prepIdx = +v; rr(); };
ACT.mAgente = function (v, e) { M.comps[+e.getAttribute("data-map")][e.getAttribute("data-p")] = v; rr(); };
ACT.mAutoComp = function (v) { M.comps[+v] = VM.autoComp(G.me(), M.maps[+v].map); rr(); };
ACT.mPrepTac = function (v, e) {
  var k = e.getAttribute("data-k");
  if (k === "style") M.styles[M.prepIdx] = v;
  else { var p = k.split("."); G.me().taticas[M.maps[M.prepIdx].map][p[0]][p[1]] = v; G.persist(); }
  rr();
};
ACT.mComecar = function () { M.mapIdx = 0; beginMap(); G.UI.scrollTop = 0; rr(); };
ACT.mCall = function (v) { if (M.user === "A") M.sim.callA = v; else M.sim.callB = v; var c = el("mctl"); if (c) c.innerHTML = controlsHtml(); };
ACT.mStyle = function (v) { var tc = myTac(); if (tc.estilo) tc.estilo[mySideNext()] = v; else if (M.user === "A") M.sim.styleA = v; else M.sim.styleB = v; var c = el("mctl"); if (c) c.innerHTML = controlsHtml(); };
ACT.mLiveTac = function (v, e) { var p = e.getAttribute("data-k").split("."); myTac()[p[0]][p[1]] = v; var c = el("mctl"); if (c) c.innerHTML = controlsHtml(); };
ACT.mTimeout = function () {
  if (VM.useTimeout(M.sim, M.user)) { M.feed.unshift({ t:"Você pediu pausa tática: o time volta focado e a sequência deles é quebrada.", k:"to" }); var f = el("mfeed"); if (f) f.innerHTML = feedHtml(); }
  var c = el("mctl"); if (c) c.innerHTML = controlsHtml();
};
ACT.mVel = function (v) {
  var now = performance.now();
  if (v === "pausa") {
    if (!M.paused) { M.paused = true; M.pausedAt = now; stopLoop(); }
    else { M.paused = false; if (M.cur) { var dt = now - M.pausedAt; M.cur.t0 += dt; if (M.cur.endAt) M.cur.endAt += dt; } kick(); }
  } else {
    if (M.cur && !M.cur.ended) { var t = (now - M.cur.t0) / M.cur.D; M.cur.D = SPEED[v]; M.cur.t0 = now - t * M.cur.D; }
    M.speed = v;
    if (M.paused) { M.paused = false; if (M.cur) { var dt2 = now - M.pausedAt; M.cur.t0 += dt2; if (M.cur.endAt) M.cur.endAt += dt2; } }
    kick();
  }
  var c = el("mctl"); if (c) c.innerHTML = controlsHtml();
};
ACT.mCam = function (v, e) { M.cam = M.cam === "livre" ? "auto" : "livre"; e.textContent = M.cam === "livre" ? "Câmera: mapa todo" : "Câmera: seguir a ação"; if (M.cam === "livre") { VB = { x:0, y:0, w:1000, h:640 }; var sv = el("map2d"); if (sv) sv.setAttribute("viewBox", "0 0 1000 640"); } };
ACT.mSkipRound = function () {
  if (M.cur) { finishCurrentRoundInstant(); }
  else { startRound(performance.now()); finishCurrentRoundInstant(); }
  if (M.sim.done) { onMapDone(); rr(); return; }
  placeIdle(); clearMarks();
  var c = el("mctl"); if (c) c.innerHTML = controlsHtml();
  if (!M.paused) { stopLoop(); kick(); }
};
ACT.mSkipMap = function () {
  stopLoop();
  if (M.cur && !M.cur.ended) { M.feed.unshift({ t:"R" + M.cur.r.n + " · " + M.cur.r.txt, k:M.cur.r.w === M.user ? "w" : "l", up:M.cur.r.upset }); }
  M.cur = null;
  var s = M.sim, opp = M.user === "A" ? "B" : "A";
  while (!s.done) {
    var st = opp === "A" ? s.streakB : s.streakA;
    if (st >= 3 && (opp === "A" ? s.toA : s.toB) > 0 && Math.random() < 0.6) VM.useTimeout(s, opp);
    var r = VM.stepRound(s);
    if (M.user === "A") s.callA = "auto"; else s.callB = "auto";
    M.feed.unshift({ t:"R" + r.n + " · " + r.txt, k:r.w === M.user ? "w" : "l", up:r.upset });
  }
  M.dstats = clone(s.stats);
  onMapDone(); rr();
};
ACT.mProxMapa = function () { M.mapIdx++; beginMap(); G.UI.scrollTop = 0; rr(); };
ACT.mFinal = function () { finalizeSeries(); G.UI.scrollTop = 0; rr(); };
ACT.mSair = function () { M = null; G.UI.view = "inicio"; G.UI.scrollTop = 0; rr(); };

window.MATCH = {
  start:start,
  locked:function () { return !!M; },
  view:function () {
    if (M.etapa === "veto") return viewVeto();
    if (M.etapa === "prep") return viewPrep();
    if (M.etapa === "live") return viewLive();
    return viewRelatorio();
  },
  after:function () {
    if (!M || M.etapa !== "live") return;
    buildDots();
    if (M.cur && !M.cur.ended) draw((performance.now() - M.cur.t0) / M.cur.D);
    kick();
  },
  reset:function () { stopLoop(); M = null; },
  _state:function () { return M; }
};
})();
