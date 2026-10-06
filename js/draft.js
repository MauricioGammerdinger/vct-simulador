/* =====================================================================
   VCT MANAGER — Modo Draft
   Draft em serpentina com cartas de jogadores (2021–2026) e campeonato no
   formato Champions (4 grupos GSL + playoffs em dupla eliminação).
   Online: sala com código; quem cria a sala é o anfitrião e roda a
   simulação. Os outros mandam pick, titulares e plano pela presença da
   sala. O estado fica num documento compartilhado. Bots completam 16.
   Sem conexão (GitHub, arquivo local): mesma coisa, só você contra bots.
   ===================================================================== */
(function () {
"use strict";
var VM = window.VM, ART = window.ART, G = window.GUI, ACT = G.ACT, esc = G.esc;
var N_TIMES = 16, N_PICKS = 6, TOTAL = N_TIMES * N_PICKS;
var ROLE_NAME = VM.ROLE_NAME;
var BOT_NOMES = [["RPS", "Raposa Gaming"], ["ORC", "Orca Club"], ["LNX", "Lince Esports"], ["TBR", "Tubarão Team"], ["FAL", "Falcão Five"], ["COB", "Cobra Squad"],
  ["URS", "Ursa Major"], ["JAG", "Jaguar Ops"], ["ESC", "Escorpião GG"], ["COR", "Corvo Clan"], ["PAN", "Pantera X"], ["LOB", "Lobo Guará"], ["TUC", "Tucano Pro"],
  ["ARR", "Arraia Blue"], ["BIS", "Bisão Force"], ["GAV", "Gavião Real"], ["MAR", "Marlim Club"], ["TIG", "Tigre Dente"]];

/* ---------------------------------------------------------------------
   Estado local
   --------------------------------------------------------------------- */
var D = {
  ativo:false, tela:"menu", online:false, est:null, code:null, carreira:null,
  me:lerMe(), filtro:{ role:"todas", ano:"todos", q:"" }, sel:null, fila:[],
  plan:null, tacMap:null, aba:"draft", salas:[], replays:{}, worldKey:null, worldDia:0, msg:null, writing:false, pending:null
};
var NET = { db:null, room:null, user:null, sala:null, peers:[], unsubDoc:null, unsubSalas:null, unsubPeers:null, pronto:false, tentou:false, hostSemPeer:0 };

function lerMe() {
  var o = null; try { o = JSON.parse(localStorage.getItem("vct_draft_me") || "null"); } catch (e) {}
  if (!o) o = { id:"u" + Math.random().toString(36).slice(2, 10), nick:"", tag:"", nome:"", hue:Math.floor(Math.random() * 360) };
  return o;
}
function salvarMe() { try { localStorage.setItem("vct_draft_me", JSON.stringify(D.me)); } catch (e) {} }
function meuId() { return D.me.id; }
function cores(hue) { return { c1:"hsl(" + hue + ",70%,44%)", c2:"#FFFFFF", hue:hue, shape:hue % 4 }; }

var CARTAS = null, CMAP = {};
function cartas() {
  if (!CARTAS) { CARTAS = VM.draftCards(window.VALDB, window.LENDAS || []); CARTAS.forEach(function (c) { CMAP[c.id] = c; }); }
  return CARTAS;
}

/* ---------------------------------------------------------------------
   Rede: db (estado da sala), room (presença) e user (id)
   --------------------------------------------------------------------- */
function netInit() {
  if (NET.tentou) return; NET.tentou = true;
  if (!window.claude || typeof window.claude.use !== "function") { NET.pronto = true; return; }
  Promise.all([window.claude.use("db"), window.claude.use("room"), window.claude.use("user")]).then(function (r) {
    NET.db = r[0]; NET.room = r[1]; NET.user = r[2];
    var fim = function () { NET.pronto = true; if (NET.db && NET.room) assinarSalas(); G.render(); };
    if (NET.user && NET.user.id) NET.user.id().then(function (id) { if (id) { D.me.id = id; salvarMe(); } fim(); }, fim); else fim();
  }, function () { NET.pronto = true; G.render(); });
}
function online() { return !!(NET.db && NET.room); }
function assinarSalas() {
  if (NET.unsubSalas) return;
  try {
    NET.unsubSalas = NET.db.collection("salas").where("fase", "==", "lobby").limit(20).onSnapshot(function (q) {
      var agora = Date.now();
      D.salas = q.docs.map(function (d) { return d.data(); }).filter(function (x) { return x && agora - (x.atualizado || 0) < 3 * 3600e3; })
        .sort(function (a, b) { return (b.criado || 0) - (a.criado || 0); });
      if (D.tela === "menu") G.render();
    }, function () {});
  } catch (e) {}
}
function entrarNaSala(code) {
  D.code = code; D.tela = "sala"; D.aba = "draft"; D.est = null; D.worldKey = null; D.plan = null; D.fila = [];
  if (!D.online) return Promise.resolve();
  if (NET.unsubDoc) NET.unsubDoc();
  NET.unsubDoc = NET.db.doc("salas/" + code).onSnapshot(function (snap) {
    if (!snap.exists) { if (!D.est) { D.msg = "Sala " + code + " não encontrada."; } G.render(); return; }
    var e = snap.data();
    if (D.est && souHost() && D.est.atualizado > (e.atualizado || 0)) return; /* eco antigo da minha própria escrita */
    D.est = e; aoMudarEstado(); G.render();
  }, function () { D.msg = "Perdemos a conexão com a sala."; G.render(); });
  return NET.room.join("draft-" + code).then(function (sala) {
    NET.sala = sala;
    NET.unsubPeers = sala.onPeers(function (ch) { NET.peers = ch.peers.slice(); if (D.est && D.est.fase === "lobby") G.render(); else atualizarProntos(); });
    publicarPresenca();
  }, function () { D.msg = "Não deu pra entrar na sala em tempo real. Tente de novo."; G.render(); });
}
function sairDaSala() {
  if (NET.unsubDoc) { NET.unsubDoc(); NET.unsubDoc = null; }
  if (NET.unsubPeers) { NET.unsubPeers(); NET.unsubPeers = null; }
  if (NET.sala) { NET.sala.leave(); NET.sala = null; }
  NET.peers = []; D.est = null; D.code = null; D.tela = "menu"; D.worldKey = null;
}
function presencaBase() {
  return { sala:D.code, id:meuId(), nick:(D.me.nick || "Jogador").slice(0, 16), tag:tagLimpa(D.me.tag), nome:(D.me.nome || "").slice(0, 22), hue:D.me.hue };
}
var presT = null;
function publicarPresenca() {
  if (!NET.sala) return;
  clearTimeout(presT);
  presT = setTimeout(function () {
    var p = presencaBase();
    p.fq = D.fila.slice(0, 4);
    var e = D.est;
    if (e && e.fase === "draft" && D.conf && minhaVez(e)) p.pk = { k:e.picks.length, c:D.conf };
    else p.pk = null;
    p.pl = D.plan && e && e.fase === "torneio" ? planoCompacto(D.plan) : null;
    NET.sala.presence(p).catch(function () {});
  }, 120);
}
function pessoas() {
  /* humanos presentes na sala, um por id (o último a mudar vale) */
  var out = {}, lista = online() ? NET.peers : [];
  lista.forEach(function (p) { var x = p.presence || {}; if (x.sala === D.code && x.id) out[x.id] = { id:x.id, nick:String(x.nick || "Jogador").slice(0, 16), tag:tagLimpa(x.tag), nome:String(x.nome || "").slice(0, 22), hue:+x.hue || 0, pres:x, peer:p }; });
  if (!out[meuId()]) out[meuId()] = { id:meuId(), nick:D.me.nick || "Você", tag:tagLimpa(D.me.tag), nome:D.me.nome, hue:D.me.hue, pres:presencaBase() };
  return out;
}
function presDe(id) {
  if (id === meuId()) {
    var p = presencaBase(); p.fq = D.fila.slice(0, 4);
    var e = D.est; if (e && e.fase === "draft" && D.conf && minhaVez(e)) p.pk = { k:e.picks.length, c:D.conf };
    p.pl = D.plan ? planoCompacto(D.plan) : null; return p;
  }
  var ps = pessoas(); return ps[id] ? ps[id].pres : null;
}
function hash(str) { var h = 2166136261; str = String(str); for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function tagLimpa(t) { return String(t || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4); }

/* escrita do estado: uma por vez, sempre a mais nova */
function commit(e) {
  e.atualizado = Date.now();
  D.est = e; aoMudarEstado();
  if (!D.online) { salvarSolo(); G.render(); return; }
  if (D.writing) { D.pending = e; G.render(); return; }
  D.writing = true;
  var doc = NET.db.doc("salas/" + e.code);
  var go = function (x) {
    doc.set(JSON.parse(JSON.stringify(x))).then(function () {
      D.writing = false;
      if (D.pending) { var nx = D.pending; D.pending = null; D.writing = true; go(nx); }
    }, function (err) {
      D.writing = false; D.msg = err && err.code === "invalid_argument" ? "Sem permissão pra salvar a sala (peça acesso de colaborador)." : "Falha ao salvar a sala; tentando de novo.";
      if (err && err.code !== "invalid_argument") setTimeout(function () { commit(D.est); }, 1500);
      G.render();
    });
  };
  go(e);
  G.render();
}
function salvarSolo() { try { localStorage.setItem("vct_draft_solo", JSON.stringify(D.est)); } catch (e) {} }
function lerSolo() { try { return JSON.parse(localStorage.getItem("vct_draft_solo") || "null"); } catch (e) { return null; } }

/* ---------------------------------------------------------------------
   Regras do draft
   --------------------------------------------------------------------- */
function souHost() { return !!(D.est && D.est.host === meuId()); }
function timeDoPick(e, k) {
  var r = Math.floor(k / N_TIMES), pos = k % N_TIMES;
  return e.ordem[r % 2 === 0 ? pos : N_TIMES - 1 - pos];
}
function meuTimeIdx(e) { for (var i = 0; i < e.times.length; i++) if (e.times[i].dono === meuId()) return i; return -1; }
function minhaVez(e) { return e && e.fase === "draft" && e.picks.length < TOTAL && timeDoPick(e, e.picks.length) === meuTimeIdx(e); }
function picksDo(e, idx) { var out = []; e.picks.forEach(function (c, k) { if (timeDoPick(e, k) === idx) out.push(c); }); return out; }
function nicksUsados(e) { var u = {}; e.picks.forEach(function (c) { var x = CMAP[c]; if (x) u[x.nick.toLowerCase()] = 1; }); return u; }
function disponivel(e, cid) { var c = CMAP[cid]; return !!c && e.picks.indexOf(cid) < 0 && !nicksUsados(e)[c.nick.toLowerCase()]; }
function faltaFuncao(lista) {
  var cnt = { D:0, I:0, C:0, S:0, F:0 }; lista.forEach(function (cid) { var c = CMAP[cid]; if (c) cnt[c.role]++; });
  var falta = ["C", "I", "S", "D"].filter(function (r) { return !cnt[r]; });
  return { cnt:cnt, falta:falta };
}
function escolhaBot(e, idx, fila) {
  cartas();
  var mine = picksDo(e, idx), usados = nicksUsados(e), k = e.picks.length;
  if (fila) for (var i = 0; i < fila.length; i++) if (disponivel(e, fila[i])) return fila[i];
  var ff = faltaFuncao(mine), restante = N_PICKS - mine.length;
  var livres = CARTAS.filter(function (c) { return e.picks.indexOf(c.id) < 0 && !usados[c.nick.toLowerCase()]; });
  var pool = livres;
  if (ff.falta.length && ff.falta.length >= restante - 1) pool = livres.filter(function (c) { return ff.falta.indexOf(c.role) >= 0; });
  else if (ff.cnt.D >= 2) pool = livres.filter(function (c) { return c.role !== "D"; });
  if (!pool.length) pool = livres;
  var top = pool.slice(0, 4), r = hash(e.seed + ":" + k) % 100;
  return (r < 50 ? top[0] : r < 78 ? top[1] || top[0] : r < 93 ? top[2] || top[0] : top[3] || top[0]).id;
}

/* ---------------------------------------------------------------------
   Criar / entrar
   --------------------------------------------------------------------- */
function codigoNovo() { var L = "ABCDEFGHJKLMNPQRSTUVWXYZ", s = ""; for (var i = 0; i < 4; i++) s += L[Math.floor(Math.random() * L.length)]; return s; }
function validarMe() {
  if (!(D.me.nick || "").trim()) return "Escolha um apelido.";
  if (tagLimpa(D.me.tag).length < 2) return "A tag do time precisa de 2 a 4 letras.";
  if (!(D.me.nome || "").trim()) return "Dê um nome pro seu time.";
  return null;
}
function criarSala(solo) {
  var err = validarMe(); if (err) { D.msg = err; G.render(); return; }
  salvarMe();
  D.online = !solo && online();
  var code = D.online ? codigoNovo() : "SOLO";
  var e = { v:1, code:code, nome:(D.me.nome || "Sala") + " · " + (D.me.nick || ""), host:meuId(), fase:"lobby", criado:Date.now(), atualizado:Date.now(),
    cfg:{ timer:D.cfgTimer || 30, prep:D.cfgPrep || 90 }, times:[], ordem:[], picks:[], prazo:0, seed:Math.floor(Math.random() * 1e9), mapas:window.VALDB.mapas.slice(),
    dia:0, resultados:[], campeao:null };
  entrarNaSala(code).then(function () { commit(e); });
  if (!D.online) { D.est = e; }
  G.render();
}
function comecarDraft() {
  var e = clone(D.est), ps = pessoas(), humanos = Object.keys(ps).map(function (id) { return ps[id]; }).slice(0, N_TIMES);
  var usados = {}, times = [];
  humanos.forEach(function (h) {
    var tag = h.tag || "T" + (times.length + 1); while (usados[tag]) tag = tag.slice(0, 3) + (times.length + 1);
    usados[tag] = 1;
    times.push({ id:"D" + (times.length + 1), tag:tag, nome:h.nome || h.nick, hue:h.hue, dono:h.id, nick:h.nick });
  });
  var bots = BOT_NOMES.filter(function (b) { return !usados[b[0]]; });
  for (var i = 0; times.length < N_TIMES; i++) { var b = bots[i]; times.push({ id:"D" + (times.length + 1), tag:b[0], nome:b[1], hue:(i * 47 + 13) % 360, dono:null, nick:"Bot" }); }
  var ordem = times.map(function (t, i) { return i; });
  for (var j = ordem.length - 1; j > 0; j--) { var r = Math.floor(Math.random() * (j + 1)); var t = ordem[j]; ordem[j] = ordem[r]; ordem[r] = t; }
  e.times = times; e.ordem = ordem; e.picks = []; e.fase = "draft"; e.prazo = Date.now() + prazoPara(e, 0);
  commit(e);
}
function prazoPara(e, k) { var idx = timeDoPick(e, k); return e.times[idx] && e.times[idx].dono ? e.cfg.timer * 1000 : 900; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }

/* ---------------------------------------------------------------------
   Anfitrião: avança o draft e as rodadas
   --------------------------------------------------------------------- */
var tick = null;
function ligarTick() { if (!tick) tick = setInterval(hostTick, 400); }
function hostTick() {
  atualizarRelogios();
  var e = D.est; if (!D.ativo || !e) return;
  if (D.online && !souHost()) { talvezAssumir(e); return; }
  if (!souHost() || D.writing || D.pending) return;
  var agora = Date.now();
  if (e.fase === "draft") {
    var k = e.picks.length;
    if (k >= TOTAL) { iniciarTorneio(); return; }
    var idx = timeDoPick(e, k), t = e.times[idx], pick = null;
    if (t.dono) {
      var p = presDe(t.dono);
      if (p && p.pk && p.pk.k === k && disponivel(e, p.pk.c)) pick = p.pk.c;
      else if (p && p.fq && p.fq.length && agora - (e.ultimoPick || 0) > 600) { for (var i = 0; i < p.fq.length; i++) if (disponivel(e, p.fq[i])) { pick = p.fq[i]; break; } }
      if (!pick && (agora >= e.prazo || (!p && agora - (e.ultimoPick || 0) > 4000))) pick = escolhaBot(e, idx, null);
    } else if (agora >= e.prazo) pick = escolhaBot(e, idx, null);
    if (pick) {
      var n = clone(e); n.picks.push(pick); n.ultimoPick = agora;
      if (n.picks.length < TOTAL) n.prazo = agora + prazoPara(n, n.picks.length);
      commit(n);
    }
  } else if (e.fase === "torneio") {
    garantirMundo(e);
    var ev = VM.S.eventos[0];
    if (ev.done) { var f = clone(e); f.fase = "fim"; f.campeao = campeaoDe(ev); commit(f); return; }
    var hoje = VM.todayMatchesD(), precisa = [];
    hoje.forEach(function (m) { [m.a, m.b].forEach(function (id) { var t = timePorId(e, id); if (t && t.dono) precisa.push(t); }); });
    var todos = precisa.every(function (t) { var p = presDe(t.dono); return p && p.pl && p.pl.r === e.dia && p.pl.ok; });
    if (agora >= e.prazo || (precisa.length && todos) || (!precisa.length && agora >= (e.prazoBots || 0))) jogarRodada(e, hoje);
  }
}
function talvezAssumir(e) {
  /* se o anfitrião sumiu da sala por 15 s, o humano de menor id que está aqui assume */
  if (!online() || e.fase === "fim" || e.fase === "lobby") return;
  var ps = pessoas(), hostAqui = !!ps[e.host] && e.host !== meuId();
  if (hostAqui) { NET.hostSemPeer = 0; return; }
  if (!NET.hostSemPeer) { NET.hostSemPeer = Date.now(); return; }
  if (Date.now() - NET.hostSemPeer < 15000) return;
  var donos = e.times.filter(function (t) { return t.dono && ps[t.dono]; }).map(function (t) { return t.dono; }).sort();
  if (donos[0] === meuId()) { var n = clone(e); n.host = meuId(); NET.hostSemPeer = 0; D.worldKey = null; commit(n); }
}
function timePorId(e, id) { return e.times.filter(function (t) { return t.id === id; })[0] || null; }
function campeaoDe(ev) { return Object.keys(ev.colocacao).filter(function (id) { return ev.colocacao[id] === 1; })[0] || null; }
function cfgMundo(e) {
  cartas();
  return { seed:e.seed, mapas:e.mapas, times:e.times.map(function (t, i) {
    return { id:t.id, tag:t.tag, nome:t.nome, humano:!!t.dono, cor:cores(t.hue), cartas:picksDo(e, i).map(function (cid) { return CMAP[cid]; }) };
  }) };
}
function garantirMundo(e) {
  var key = e.code + ":" + e.seed + ":" + e.picks.join(",").length;
  if (D.worldKey !== key) {
    e.times.forEach(function (t) { ART.setCustom(t.tag, cores(t.hue)); });
    VM.draftWorld(window.VALDB, cfgMundo(e));
    D.worldKey = key; D.worldDia = 0;
  }
  while (D.worldDia < (e.resultados || []).length) { VM.draftApply(e.resultados[D.worldDia].map(function (x) { return { res:x.res }; })); D.worldDia++; }
}
function iniciarTorneio() {
  var n = clone(D.est); n.fase = "torneio"; n.dia = 0; n.resultados = []; n.prazo = Date.now() + n.cfg.prep * 1000; n.prazoBots = Date.now() + 2500;
  D.worldKey = null; commit(n);
}
function jogarRodada(e, hoje) {
  var plano = {};
  hoje.forEach(function (m) {
    [m.a, m.b].forEach(function (id) {
      var t = timePorId(e, id); if (!t || !t.dono) return;
      var p = presDe(t.dono), pl = p && p.pl ? planoExpandido(p.pl, id) : null;
      if (pl) {
        plano[id] = { pref:pl.pref, tat:pl.tat };
        var team = VM.T(id);
        if (pl.tit && pl.tit.length === 5) { var pids = team.roster.filter(function (pid) { return pl.tit.indexOf(VM.P(pid).carta) >= 0; }); if (pids.length === 5) team.lineup = pids; }
      }
    });
  });
  var out = VM.draftDay(plano), n = clone(e), dia = e.dia, escritas = [];
  var linha = out.map(function (x, i) {
    var humano = [x.res.a, x.res.b].some(function (id) { var t = timePorId(e, id); return t && t.dono; });
    var rid = humano ? "d" + dia + "_" + i : null;
    if (rid) {
      var rp = { a:x.res.a, b:x.res.b, bo:x.m.bo, maps:x.replay };
      D.replays[rid] = rp;
      if (D.online) escritas.push([rid, rp]);
    }
    return { res:x.res, rid:rid, bo:x.m.bo };
  });
  D.worldDia = dia + 1;
  n.resultados.push(linha); n.dia = dia + 1; n.prazo = Date.now() + n.cfg.prep * 1000; n.prazoBots = Date.now() + 4000;
  var ev = VM.S.eventos[0];
  if (ev.done) { n.fase = "fim"; n.campeao = campeaoDe(ev); }
  escritas.forEach(function (w) { NET.db.doc("salas/" + e.code + "/replays/" + w[0]).set(JSON.parse(JSON.stringify(w[1]))).catch(function () {}); });
  commit(n);
}

/* ---------------------------------------------------------------------
   Plano de cada rodada (titulares, preferência de mapas, táticas)
   --------------------------------------------------------------------- */
var PLANOS = ["padrao", "exec", "split", "rush", "fake", "lurk"], SETUPS = ["padrao", "stack", "agressivo", "retake"], ESTILOS = ["padrao", "agressivo", "defensivo"];
function planoNovo(e) {
  var idx = meuTimeIdx(e), meus = picksDo(e, idx);
  var tit = meus.slice().sort(function (a, b) { return CMAP[b].ovr - CMAP[a].ovr; }).slice(0, 5);
  var team = VM.T(e.times[idx].id);
  var pref = e.mapas.slice().sort(function (a, b) { return (team.mapProf[b] || 0) - (team.mapProf[a] || 0); });
  var tat = {}; e.mapas.forEach(function (m) { var s = VM.SITES[m] || ["A", "B"]; tat[m] = ["padrao", "variar", "padrao", s[0], "padrao", "padrao"]; });
  return { r:e.dia, pref:pref, tat:tat, tit:tit, ok:false };
}
function planoCompacto(pl) {
  var mi = D.est.mapas, tat = {};
  Object.keys(pl.tat).forEach(function (m) { var k = mi.indexOf(m); if (k >= 0) tat[k] = pl.tat[m]; });
  return { r:pl.r, pref:pl.pref.map(function (m) { return mi.indexOf(m); }), tat:tat, tit:pl.tit, ok:pl.ok ? 1 : 0 };
}
function planoExpandido(pc, teamId) {
  var mi = D.est.mapas;
  if (pc.r !== D.est.dia) return null;
  var pref = (pc.pref || []).map(function (k) { return mi[k]; }).filter(Boolean), tat = {};
  Object.keys(pc.tat || {}).forEach(function (k) {
    var m = mi[+k], a = pc.tat[k]; if (!m || !a) return;
    var t = VM.defaultTactic(m), sites = VM.SITES[m] || ["A", "B"];
    if (PLANOS.indexOf(a[0]) >= 0) t.atk.plano = a[0];
    if (a[1] === "variar" || sites.indexOf(a[1]) >= 0) t.atk.site = a[1];
    if (SETUPS.indexOf(a[2]) >= 0) t.def.setup = a[2];
    if (sites.indexOf(a[3]) >= 0) t.def.site = a[3];
    if (ESTILOS.indexOf(a[4]) >= 0) t.estilo.atk = a[4];
    if (ESTILOS.indexOf(a[5]) >= 0) t.estilo.def = a[5];
    tat[m] = t;
  });
  return { pref:pref.length === mi.length ? pref : null, tat:tat, tit:(pc.tit || []).slice(0, 5) };
}
function aoMudarEstado() {
  var e = D.est; if (!e) return;
  if (e.fase === "torneio" || e.fase === "fim") {
    garantirMundo(e);
    if (meuTimeIdx(e) >= 0 && (!D.plan || D.plan.r !== e.dia)) { var velho = D.plan; D.plan = planoNovo(e); if (velho) { D.plan.tat = velho.tat; D.plan.tit = velho.tit; D.plan.pref = velho.pref; } publicarPresenca(); }
  }
  if (e.fase === "draft" && D.sel && !disponivel(e, D.sel)) D.sel = null;
  if (e.fase === "draft" && D.conf && (!disponivel(e, D.conf) || !minhaVez(e))) D.conf = null;
  D.fila = D.fila.filter(function (c) { return disponivel(e, c); });
  if (e.fase === "draft") publicarPresenca();
}
function atualizarProntos() { var n = document.getElementById("drprontos"); if (n && D.est) n.innerHTML = prontosHtml(D.est); }

/* ---------------------------------------------------------------------
   Telas
   --------------------------------------------------------------------- */
function relogio(e) { var s = Math.max(0, Math.ceil(((e && e.prazo) || 0) - Date.now()) / 1000); return Math.floor(s / 60) + ":" + ("0" + Math.floor(s % 60)).slice(-2); }
function atualizarRelogios() { var ns = document.querySelectorAll(".drcd"); for (var i = 0; i < ns.length; i++) ns[i].textContent = relogio(D.est); }
function crestTag(tag, hue, cls) { return '<span class="cw ' + (cls || "sm") + '">' + ART.crest(tag, null, cores(hue)) + "</span>"; }
function roleTag(r) { return '<span class="role r-' + r + '">' + r + "</span>"; }

function viewMenu() {
  netInit();
  var me = D.me, solo = lerSolo();
  var salas = D.salas.filter(function (s) { return s.code !== "SOLO"; });
  var conectado = online();
  return '<div class="drwrap"><div class="drtop"><button class="btn ghost sm" data-a="drSair">← Menu</button><h1>Modo Draft</h1><span class="muted">Monte um time com jogadores de 2021 a 2026 e dispute um Champions de 16 times.</span></div>' +
    (D.msg ? '<div class="card drmsg">' + esc(D.msg) + "</div>" : "") +
    '<div class="drgrid2"><div class="card"><h3>Seu time</h3>' +
    '<label class="mf"><span>Seu apelido</span><input data-dr="nick" value="' + esc(me.nick) + '" maxlength="16" placeholder="popssg"></label>' +
    '<div class="row2"><label class="mf"><span>Nome do time</span><input data-dr="nome" value="' + esc(me.nome) + '" maxlength="22" placeholder="Pops Esports"></label>' +
    '<label class="mf"><span>Tag</span><input data-dr="tag" value="' + esc(me.tag) + '" maxlength="4" placeholder="POPS" style="text-transform:uppercase"></label></div>' +
    '<label class="mf"><span>Cor</span><input type="range" min="0" max="359" value="' + me.hue + '" data-dr="hue" class="huer"></label>' +
    '<div class="drprev" id="drprev">' + crestTag(tagLimpa(me.tag) || "NEW", me.hue, "xl") + "<strong>" + esc(me.nome || "Seu time") + "</strong></div></div>" +
    '<div class="card"><h3>Jogar</h3>' +
    '<div class="row2"><label class="mf"><span>Tempo por pick</span><select data-dr="timer">' + [[15, "15 s"], [30, "30 s"], [45, "45 s"], [60, "60 s"]].map(function (o) { return '<option value="' + o[0] + '" ' + ((D.cfgTimer || 30) === o[0] ? "selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label>" +
    '<label class="mf"><span>Tempo de preparação</span><select data-dr="prep">' + [[45, "45 s"], [90, "90 s"], [150, "2 min 30"], [300, "5 min"]].map(function (o) { return '<option value="' + o[0] + '" ' + ((D.cfgPrep || 90) === o[0] ? "selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label></div>" +
    (conectado ? '<button class="btn primary big wide" data-a="drCriar">Criar sala online</button><p class="muted small">Mande o código pros amigos. Quem não entrar vira bot quando você começar o draft.</p>' +
      '<div class="row2"><input data-dr="codigo" maxlength="4" placeholder="CÓDIGO" style="text-transform:uppercase" value="' + esc(D.codigoDig || "") + '"><button class="btn" data-a="drEntrar">Entrar</button></div>'
      : '<p class="muted small">' + (NET.pronto ? "Online só funciona na versão publicada do jogo, com os amigos convidados como colaboradores. Aqui você joga contra 15 bots." : "Conectando…") + "</p>") +
    '<button class="btn ' + (conectado ? "" : "primary big") + ' wide" data-a="drSolo">Jogar sozinho contra bots</button>' +
    (solo && solo.fase !== "lobby" ? '<button class="btn ghost wide" data-a="drRetomar">Retomar draft solo (' + esc(solo.fase === "fim" ? "terminado" : solo.fase === "draft" ? "pick " + solo.picks.length + "/" + TOTAL : "rodada " + (solo.dia + 1)) + ")</button>" : "") +
    "</div></div>" +
    (conectado ? '<div class="card"><h3>Salas abertas</h3>' + (salas.length ? salas.map(function (s) {
      return '<div class="drsala"><b>' + esc(s.code) + "</b><span>" + esc(s.nome || "") + '</span><small class="muted">' + Math.round((Date.now() - s.criado) / 60000) + ' min</small><button class="btn sm" data-a="drEntrarCod" data-v="' + esc(s.code) + '">Entrar</button></div>';
    }).join("") : '<p class="muted">Nenhuma sala esperando jogadores agora.</p>') + "</div>" : "") +
    '<div class="card drcomo"><h3>Como funciona</h3><ol><li>Ordem sorteada. Cada time pega um jogador por vez e a ordem inverte a cada rodada (serpentina). São 6 picks: 5 titulares e 1 reserva.</li><li>Cada carta é um jogador numa temporada (ex.: TenZ 2021, aspas 2022). Só uma versão de cada jogador por draft.</li><li>Antes de cada rodada do campeonato você escolhe titulares, a ordem dos mapas pro veto e a tática de cada mapa.</li><li>Todos os jogos da rodada rodam juntos. Dá pra assistir o seu no mapa 2D.</li><li>Formato Champions: 4 grupos GSL (Bo3) e playoffs de 8 em dupla eliminação, final Bo5.</li></ol><p class="muted small">Atributos das cartas são estimativas do jogo a partir do auge de cada um, não números oficiais.</p></div></div>';
}

function viewLobby(e) {
  var ps = pessoas(), lista = Object.keys(ps).map(function (id) { return ps[id]; });
  var host = souHost();
  return '<div class="drwrap"><div class="drtop"><button class="btn ghost sm" data-a="drVoltarMenu">← Sair da sala</button><h1>Sala <span class="drcode">' + esc(e.code) + '</span></h1><span class="muted">' + (D.online ? "Passe o código pros amigos. Eles entram pelo Modo Draft → Entrar." : "Draft solo") + "</span></div>" +
    (D.msg ? '<div class="card drmsg">' + esc(D.msg) + "</div>" : "") +
    '<div class="card"><h3>Na sala (' + lista.length + "/" + N_TIMES + ')</h3><div class="drppl">' + lista.map(function (p) {
      return '<div class="drp">' + crestTag(p.tag || "?", p.hue, "md") + "<div><strong>" + esc(p.nome || "—") + "</strong><small>" + esc(p.nick) + (p.id === e.host ? " · anfitrião" : "") + (p.id === meuId() ? " · você" : "") + "</small></div></div>";
    }).join("") + '</div><p class="muted small">' + (N_TIMES - lista.length) + " vaga(s) vão pra bots. Tempo por pick: " + e.cfg.timer + " s · preparação: " + e.cfg.prep + " s.</p>" +
    (host ? '<button class="btn primary big" data-a="drComecar">Começar draft</button>' : '<p class="muted">Esperando o anfitrião começar…</p>') + "</div></div>";
}

function cartaHtml(c, e, opts) {
  opts = opts || {};
  var livre = !e || disponivel(e, c.id), sel = D.sel === c.id, fila = D.fila.indexOf(c.id);
  var at = [["MIR", c.aim], ["UTI", c.util], ["LEI", c.sense], ["CLU", c.clutch], ["COM", c.comms]];
  return '<button class="dcard r' + c.role + (livre ? "" : " off") + (sel ? " sel" : "") + (opts.mini ? " mini" : "") + '" data-a="drCarta" data-v="' + esc(c.id) + '"' + (livre || opts.mini ? "" : " disabled") + ">" +
    '<span class="dov">' + c.ovr + "</span>" + ART.face(c.nick, c.time, "md") +
    '<span class="dnm"><strong>' + esc(c.nick) + "</strong><small>" + c.ano + " · " + esc(c.time) + "</small></span>" + roleTag(c.role) +
    (opts.mini ? "" : '<span class="dat">' + at.map(function (x) { return "<i><em>" + x[0] + "</em>" + x[1] + "</i>"; }).join("") + '</span><span class="dag">' + esc((c.agents || []).slice(0, 3).join(" · ")) + "</span>") +
    (fila >= 0 ? '<span class="dfila">fila ' + (fila + 1) + "</span>" : "") + "</button>";
}

function viewDraft(e) {
  cartas();
  var k = e.picks.length, idx = k < TOTAL ? timeDoPick(e, k) : -1, cur = e.times[idx], meu = meuTimeIdx(e), vez = minhaVez(e);
  var f = D.filtro, q = (f.q || "").toLowerCase(), usados = nicksUsados(e);
  var lista = CARTAS.filter(function (c) {
    if (f.role !== "todas" && c.role !== f.role) return false;
    if (f.ano !== "todos" && String(c.ano) !== f.ano) return false;
    if (q && c.nick.toLowerCase().indexOf(q) < 0 && c.time.toLowerCase().indexOf(q) < 0) return false;
    if (D.soLivres !== false && (e.picks.indexOf(c.id) >= 0 || usados[c.nick.toLowerCase()])) return false;
    return true;
  }).slice(0, 120);
  var anos = ["todos", "2021", "2022", "2023", "2024", "2025", "2026"];
  var banner = cur ? '<div class="drbanner ' + (vez ? "minha" : "") + '">' + crestTag(cur.tag, cur.hue, "lg") +
    "<div><small>Pick " + (k + 1) + " de " + TOTAL + " · rodada " + (Math.floor(k / N_TIMES) + 1) + "</small><strong>" + (vez ? "SUA VEZ!" : esc(cur.nome)) + "</strong><span>" + (cur.dono ? esc(cur.nick) : "bot") + '</span></div><b class="drcd">' + relogio(e) + "</b></div>" : "";
  var sel = D.sel ? CMAP[D.sel] : null;
  var acao = sel ? '<div class="drsel">' + cartaHtml(sel, e, { mini:true }) + (vez ? (D.conf === sel.id ? '<span class="chip ok">Enviado, confirmando…</span>' : '<button class="btn primary big" data-a="drEscolher">Escolher ' + esc(sel.nick) + "</button>") : "") +
    (D.fila.indexOf(sel.id) < 0 ? '<button class="btn" data-a="drFila">+ Fila</button>' : '<button class="btn ghost" data-a="drFilaTirar">Tirar da fila</button>') + "</div>" : '<p class="muted small">Clique numa carta pra ver e escolher. A fila escolhe sozinha na sua vez se o jogador ainda estiver livre.</p>';
  var ordemHtml = '<div class="drordem">' + e.ordem.map(function (ti, pos) {
    var t = e.times[ti], ps = picksDo(e, ti);
    return '<div class="dro ' + (ti === idx ? "agora" : "") + (ti === meu ? " eu" : "") + '"><span class="drn">' + (pos + 1) + "</span>" + crestTag(t.tag, t.hue, "xs") + "<b>" + esc(t.tag) + '</b><span class="drpk">' +
      ps.map(function (cid) { var c = CMAP[cid]; return '<i class="r' + c.role + '" title="' + esc(c.nick + " " + c.ano) + '">' + esc(c.nick.slice(0, 7)) + "</i>"; }).join("") + "</span></div>";
  }).join("") + "</div>";
  var meusPicks = meu >= 0 ? picksDo(e, meu) : [];
  var ff = faltaFuncao(meusPicks);
  var meuHtml = meu >= 0 ? '<div class="card"><h3>Seu time · ' + esc(e.times[meu].tag) + "</h3>" + (meusPicks.length ? meusPicks.map(function (cid) { return cartaHtml(CMAP[cid], null, { mini:true }); }).join("") : '<p class="muted">Nenhum jogador ainda.</p>') +
    '<p class="muted small">' + ["D", "I", "C", "S", "F"].map(function (r) { return ROLE_NAME[r] + " " + ff.cnt[r]; }).join(" · ") + (ff.falta.length ? '<br><span class="warnt">Falta: ' + ff.falta.map(function (r) { return ROLE_NAME[r]; }).join(", ") + "</span>" : "") + "</p></div>" : "";
  return '<div class="drwrap"><div class="drtop"><button class="btn ghost sm" data-a="drVoltarMenu">← Sair</button><h1>Draft · sala ' + esc(e.code) + "</h1></div>" + banner +
    (D.msg ? '<div class="card drmsg">' + esc(D.msg) + "</div>" : "") +
    '<div class="drboard"><div class="card drl"><h3>Ordem</h3>' + ordemHtml + "</div>" +
    '<div class="card drc"><div class="drfil">' + ["todas", "D", "I", "C", "S", "F"].map(function (r) { return '<button class="cchip ' + (f.role === r ? "on" : "") + '" data-a="drRole" data-v="' + r + '">' + (r === "todas" ? "Todas" : ROLE_NAME[r]) + "</button>"; }).join("") +
    '</div><div class="drfil">' + anos.map(function (a) { return '<button class="cchip ' + (f.ano === a ? "on" : "") + '" data-a="drAno" data-v="' + a + '">' + (a === "todos" ? "Todos os anos" : a) + "</button>"; }).join("") +
    '<input data-dr="q" id="drq" value="' + esc(f.q) + '" placeholder="Buscar jogador ou time"></div>' + acao +
    '<div class="dcards">' + lista.map(function (c) { return cartaHtml(c, e); }).join("") + "</div></div>" +
    '<div class="drr">' + meuHtml + "</div></div></div>";
}

function prontosHtml(e) {
  if (!VM.S || !VM.S.eventos || !VM.S.eventos[0]) return "";
  var hoje = VM.todayMatchesD(), ids = [];
  hoje.forEach(function (m) { [m.a, m.b].forEach(function (id) { var t = timePorId(e, id); if (t && t.dono) ids.push(t); }); });
  if (!ids.length) return '<span class="muted small">Só bots jogam esta rodada.</span>';
  return ids.map(function (t) { var p = presDe(t.dono), ok = p && p.pl && p.pl.r === e.dia && p.pl.ok; return '<span class="chip ' + (ok ? "ok" : "") + '">' + esc(t.tag) + (ok ? " ✓" : " …") + "</span>"; }).join(" ");
}
function viewTorneio(e) {
  garantirMundo(e);
  var ev = VM.S.eventos[0], meu = meuTimeIdx(e), meuT = meu >= 0 ? e.times[meu] : null;
  var hoje = e.fase === "fim" ? [] : VM.todayMatchesD();
  var minha = meuT ? hoje.filter(function (m) { return m.a === meuT.id || m.b === meuT.id; })[0] : null;
  var abas = '<div class="ttabs">' + [["rodada", e.fase === "fim" ? "Final" : "Rodada " + (e.dia + 1)], ["tabela", "Tabela"], ["resultados", "Resultados"], ["times", "Times"]].map(function (x) {
    return '<button data-a="drAba" data-v="' + x[0] + '" class="' + ((D.aba === x[0] || (x[0] === "rodada" && ["tabela", "resultados", "times"].indexOf(D.aba) < 0)) ? "on" : "") + '">' + x[1] + "</button>"; }).join("") + "</div>";
  var corpo;
  if (D.aba === "tabela") corpo = ev.stages.map(function (st) { return '<div class="card"><h3>' + esc(st.label || "") + "</h3>" + G.stageHtml(st, true) + "</div>"; }).reverse().join("");
  else if (D.aba === "resultados") corpo = resultadosHtml(e, null);
  else if (D.aba === "times") corpo = '<div class="drtimes">' + e.times.map(function (t, i) {
    var team = VM.T(t.id);
    return '<div class="card drtm">' + '<div class="head">' + crestTag(t.tag, t.hue, "md") + "<strong>" + esc(t.nome) + '</strong><span class="chip">' + (t.dono ? esc(t.nick) : "bot") + '</span><span class="muted">força ' + Math.round(VM.draftForca(t.id)) + "</span></div>" +
      picksDo(e, i).map(function (cid) { return cartaHtml(CMAP[cid], null, { mini:true }); }).join("") + (team && ev.colocacao[t.id] ? '<p class="muted small">Colocação: ' + ev.colocacao[t.id] + "º</p>" : "") + "</div>";
  }).join("") + "</div>";
  else corpo = e.fase === "fim" ? fimHtml(e, ev) : rodadaHtml(e, minha, meuT);
  return '<div class="drwrap"><div class="drtop"><button class="btn ghost sm" data-a="drVoltarMenu">← Sair</button><h1>Champions do Draft</h1><span class="muted">' + esc(ev.stages[ev.si].label || "") + "</span>" +
    (e.fase !== "fim" ? '<span class="drclock">Próxima rodada em <b class="drcd">' + relogio(e) + "</b></span>" + (souHost() ? '<button class="btn sm" data-a="drAvancar">Jogar agora</button>' : "") : "") + "</div>" +
    (D.msg ? '<div class="card drmsg">' + esc(D.msg) + "</div>" : "") + abas + corpo + "</div>";
}
function resultadosHtml(e, soDia) {
  var dias = (e.resultados || []).map(function (l, d) { return { l:l, d:d }; });
  if (soDia != null) dias = dias.filter(function (x) { return x.d === soDia; });
  if (!dias.length) return '<p class="muted">Nenhum jogo ainda.</p>';
  var meuT = meuTimeIdx(e) >= 0 ? e.times[meuTimeIdx(e)].id : null;
  return dias.slice().reverse().map(function (x) {
    return '<div class="card"><h3>Rodada ' + (x.d + 1) + "</h3>" + x.l.map(function (r) {
      var a = timePorId(e, r.res.a), b = timePorId(e, r.res.b), meuJogo = r.res.a === meuT || r.res.b === meuT;
      return '<div class="drres ' + (meuJogo ? "eu" : "") + '">' + crestTag(a.tag, a.hue, "xs") + "<b class=\"" + (r.res.winner === a.id ? "w" : "") + '">' + esc(a.tag) + '</b><span class="sc">' + r.res.wa + "–" + r.res.wb + '</span><b class="' + (r.res.winner === b.id ? "w" : "") + '">' + esc(b.tag) + "</b>" + crestTag(b.tag, b.hue, "xs") +
        '<small class="muted">' + r.res.maps.map(function (m) { return esc(m.map) + " " + m.sa + "–" + m.sb; }).join(" · ") + "</small>" +
        (r.rid ? '<button class="btn sm" data-a="drAssistir" data-v="' + esc(r.rid) + '">Assistir</button>' : "") + "</div>";
    }).join("") + "</div>";
  }).join("");
}
function rodadaHtml(e, minha, meuT) {
  var ultimos = (e.resultados || []).length ? resultadosHtml(e, e.resultados.length - 1) : "";
  if (!meuT) return '<div class="card"><p>Você está assistindo esta sala.</p><div id="drprontos">' + prontosHtml(e) + "</div></div>" + ultimos;
  if (!minha) return '<div class="card"><h3>Sem jogo seu nesta rodada</h3><p class="muted">' + (VM.S.eventos[0].colocacao[meuT.id] ? "Seu time terminou em " + VM.S.eventos[0].colocacao[meuT.id] + "º. Dá pra acompanhar os outros jogos." : "Esperando os outros jogos.") + '</p><div id="drprontos">' + prontosHtml(e) + "</div></div>" + ultimos;
  var oppId = minha.a === meuT.id ? minha.b : minha.a, opp = timePorId(e, oppId), oppTeam = VM.T(oppId), myTeam = VM.T(meuT.id), pl = D.plan;
  var oi = e.times.indexOf(opp);
  var head = '<div class="card drvs">' + crestTag(meuT.tag, meuT.hue, "lg") + "<div><strong>" + esc(meuT.nome) + "</strong><small>força " + Math.round(VM.draftForca(meuT.id)) + '</small></div><b>vs</b><div class="r"><strong>' + esc(opp.nome) + "</strong><small>" + (opp.dono ? esc(opp.nick) : "bot") + " · força " + Math.round(VM.draftForca(oppId)) + "</small></div>" + crestTag(opp.tag, opp.hue, "lg") +
    '<span class="chip">Bo' + minha.bo + " · " + esc(minha.nome || "") + '</span></div><div class="drcartas">' + picksDo(e, oi).map(function (cid) { return cartaHtml(CMAP[cid], null, { mini:true }); }).join("") + "</div>";
  var meus = picksDo(e, meuTimeIdx(e));
  var tit = '<div class="card"><h3>Titulares (5 de 6)</h3><div class="drtit">' + meus.map(function (cid) {
    var on = pl.tit.indexOf(cid) >= 0; return '<label class="drti ' + (on ? "on" : "") + '"><input type="checkbox" data-dr="tit" value="' + esc(cid) + '" ' + (on ? "checked" : "") + ">" + cartaHtml(CMAP[cid], null, { mini:true }) + "</label>";
  }).join("") + "</div></div>";
  var mapas = '<div class="card"><h3>Mapas pro veto</h3><p class="muted small">De cima pra baixo: o primeiro você escolhe, o último você bane. Números = domínio do seu time / do rival.</p><ol class="drmapas">' + pl.pref.map(function (m, i) {
    return '<li><b>' + esc(m) + '</b><span class="muted">' + (myTeam.mapProf[m] || 0) + " / " + (oppTeam.mapProf[m] || 0) + '</span><button class="btn sm ghost" data-a="drMapa" data-v="' + i + ':-1"' + (i ? "" : " disabled") + '>↑</button><button class="btn sm ghost" data-a="drMapa" data-v="' + i + ':1"' + (i < pl.pref.length - 1 ? "" : " disabled") + ">↓</button></li>";
  }).join("") + "</ol></div>";
  var tm = D.tacMap && pl.tat[D.tacMap] ? D.tacMap : pl.pref[0], a = pl.tat[tm], sites = VM.SITES[tm] || ["A", "B"];
  function chips(pos, opts) { return '<div class="cchips">' + opts.map(function (o) { return '<button class="cchip ' + (a[pos] === o[0] ? "on" : "") + '" data-a="drTat" data-v="' + pos + ":" + o[0] + '">' + esc(o[1]) + "</button>"; }).join("") + "</div>"; }
  var tat = '<div class="card"><h3>Tática por mapa</h3><div class="mtabs">' + pl.pref.map(function (m) { return '<button data-a="drTacMap" data-v="' + esc(m) + '" class="' + (m === tm ? "on" : "") + '">' + esc(m.toUpperCase()) + "</button>"; }).join("") + "</div>" +
    '<div class="cgroup"><label>Ataque</label>' + chips(0, PLANOS.map(function (k) { return [k, VM.ATK_PLANOS[k].split(" (")[0]]; })) + chips(1, [["variar", "Variar"]].concat(sites.map(function (s) { return [s, "Site " + s]; }))) + "</div>" +
    '<div class="cgroup"><label>Defesa</label>' + chips(2, SETUPS.map(function (k) { return [k, VM.DEF_SETUPS[k].split(" (")[0]]; })) + chips(3, sites.map(function (s) { return [s, "Site " + s]; })) + "</div>" +
    '<div class="cgroup"><label>Estilo no ataque / na defesa</label>' + chips(4, [["padrao", "Padrão"], ["agressivo", "Agressivo"], ["defensivo", "Defensivo"]]) + chips(5, [["padrao", "Padrão"], ["agressivo", "Agressivo"], ["defensivo", "Defensivo"]]) + "</div>" +
    (VM.MAP_TRAITS[tm] ? '<p class="tip mapt"><b>Estrutura:</b> ' + esc(VM.MAP_TRAITS[tm].txt) + "</p>" : "") + "</div>";
  var pronto = '<div class="card drpronto"><button class="btn ' + (pl.ok ? "" : "primary") + ' big" data-a="drPronto">' + (pl.ok ? "Pronto ✓ (clique pra editar)" : "Estou pronto") + '</button><div id="drprontos">' + prontosHtml(e) + '</div><p class="muted small">A rodada começa quando todos estiverem prontos ou o tempo acabar. Se o tempo acabar, vale o que estiver marcado.</p></div>';
  return head + pronto + '<div class="drgrid2">' + tit + mapas + "</div>" + tat + ultimos;
}
function fimHtml(e, ev) {
  var ord = Object.keys(ev.colocacao).sort(function (a, b) { return ev.colocacao[a] - ev.colocacao[b]; });
  var c = timePorId(e, e.campeao || ord[0]);
  return '<div class="card drfim">' + (c ? '<div class="drtrofeu">' + ART.trophy() + "</div><h2>" + crestTag(c.tag, c.hue, "lg") + " " + esc(c.nome) + "</h2><p>" + (c.dono ? "Campeão: " + esc(c.nick) : "Um bot levou o título.") + "</p>" : "") +
    '<table><thead><tr><th>#</th><th>Time</th><th>Dono</th></tr></thead><tbody>' + ord.map(function (id) { var t = timePorId(e, id); return '<tr class="' + (t.dono === meuId() ? "you" : "") + '"><td class="num">' + ev.colocacao[id] + "º</td><td>" + crestTag(t.tag, t.hue, "xs") + " " + esc(t.nome) + "</td><td>" + (t.dono ? esc(t.nick) : "bot") + "</td></tr>"; }).join("") + "</tbody></table>" +
    '<div class="row"><button class="btn primary" data-a="drVoltarMenu">Voltar ao Modo Draft</button></div></div>' + resultadosHtml(e, null);
}

function view() {
  if (window.MATCH && window.MATCH.locked()) return '<div class="drwrap drreplay">' + window.MATCH.view() + "</div>";
  if (D.tela === "menu" || !D.code) return viewMenu();
  var e = D.est;
  if (!e) return '<div class="drwrap"><div class="drtop"><button class="btn ghost sm" data-a="drVoltarMenu">← Voltar</button><h1>Sala ' + esc(D.code) + "</h1></div><p class=\"muted\">" + (D.msg ? esc(D.msg) : "Carregando a sala…") + "</p></div>";
  if (e.fase === "lobby") return viewLobby(e);
  if (e.fase === "draft") return viewDraft(e);
  return viewTorneio(e);
}
function after() {
  ligarTick();
  if (window.MATCH && window.MATCH.locked() && window.MATCH.after) window.MATCH.after();
}

/* ---------------------------------------------------------------------
   Ações
   --------------------------------------------------------------------- */
function abrir() {
  D.ativo = true; D.tela = "menu"; D.msg = null;
  if (!D.carreira) D.carreira = VM.getState();
  netInit(); G.render();
}
ACT.drSair = function () {
  if (D.code) sairDaSala();
  D.ativo = false; if (window.MATCH && window.MATCH.reset) window.MATCH.reset();
  VM.setState(D.carreira); D.carreira = null;
  if (window.INTRO && window.INTRO.reset) window.INTRO.reset();
  G.render();
};
ACT.drCriar = function () { D.msg = null; criarSala(false); };
ACT.drSolo = function () { D.msg = null; criarSala(true); };
ACT.drRetomar = function () { var s = lerSolo(); if (!s) return; D.online = false; D.code = s.code; D.tela = "sala"; D.est = s; D.worldKey = null; D.plan = null; aoMudarEstado(); G.render(); };
function entrarCodigo(code) {
  code = tagLimpa(code); var err = validarMe(); if (err) { D.msg = err; G.render(); return; }
  if (code.length !== 4) { D.msg = "O código tem 4 letras."; G.render(); return; }
  salvarMe(); D.msg = null; D.online = true; entrarNaSala(code); G.render();
}
ACT.drEntrar = function () { entrarCodigo(D.codigoDig || ""); };
ACT.drEntrarCod = function (v) { entrarCodigo(v); };
ACT.drVoltarMenu = function () { if (window.MATCH && window.MATCH.reset) window.MATCH.reset(); sairDaSala(); D.msg = null; G.render(); };
ACT.drComecar = function () { if (souHost()) comecarDraft(); };
ACT.drRole = function (v) { D.filtro.role = v; G.render(); };
ACT.drAno = function (v) { D.filtro.ano = v; G.render(); };
ACT.drCarta = function (v) { D.sel = D.sel === v ? null : v; publicarPresenca(); G.render(); };
ACT.drEscolher = function () {
  var e = D.est; if (!minhaVez(e) || !D.sel || !disponivel(e, D.sel)) return;
  if (souHost()) { var n = clone(e); n.picks.push(D.sel); n.ultimoPick = Date.now(); if (n.picks.length < TOTAL) n.prazo = Date.now() + prazoPara(n, n.picks.length); D.sel = null; commit(n); }
  else { D.conf = D.sel; publicarPresenca(); D.msg = null; G.render(); }
};
ACT.drFila = function () { if (D.sel && D.fila.indexOf(D.sel) < 0 && D.fila.length < 4) D.fila.push(D.sel); publicarPresenca(); G.render(); };
ACT.drFilaTirar = function () { D.fila = D.fila.filter(function (c) { return c !== D.sel; }); publicarPresenca(); G.render(); };
ACT.drAba = function (v) { D.aba = v; G.render(); };
ACT.drAvancar = function () { var e = D.est; if (!souHost() || e.fase !== "torneio") return; garantirMundo(e); jogarRodada(e, VM.todayMatchesD()); };
ACT.drMapa = function (v) { var p = v.split(":"), i = +p[0], d = +p[1], l = D.plan.pref, j = i + d; if (j < 0 || j >= l.length) return; var t = l[i]; l[i] = l[j]; l[j] = t; D.plan.ok = false; publicarPresenca(); G.render(); };
ACT.drTacMap = function (v) { D.tacMap = v; G.render(); };
ACT.drTat = function (v) { var p = v.split(":"), tm = D.tacMap && D.plan.tat[D.tacMap] ? D.tacMap : D.plan.pref[0]; D.plan.tat[tm][+p[0]] = p[1]; D.plan.ok = false; publicarPresenca(); G.render(); };
ACT.drPronto = function () {
  if (!D.plan.ok && D.plan.tit.length !== 5) { D.msg = "Escolha exatamente 5 titulares."; G.render(); return; }
  D.msg = null; D.plan.ok = !D.plan.ok; publicarPresenca(); G.render();
};
ACT.drAssistir = function (rid) {
  var abre = function (rp) {
    if (!rp) { D.msg = "Esse replay não está disponível."; G.render(); return; }
    var meuT = meuTimeIdx(D.est) >= 0 ? D.est.times[meuTimeIdx(D.est)].id : null;
    window.MATCH.replay(rp, { user:rp.b === meuT ? "B" : "A", evNome:"Champions do Draft", onExit:function () { G.render(); } });
    G.UI.scrollTop = 0; G.render();
  };
  if (D.replays[rid]) { abre(D.replays[rid]); return; }
  if (!D.online) { abre(null); return; }
  D.msg = "Carregando replay…"; G.render();
  NET.db.doc("salas/" + D.code + "/replays/" + rid).get().then(function (s) { D.msg = null; var rp = s.exists ? s.data() : null; if (rp) D.replays[rid] = rp; abre(rp); }, function () { D.msg = "Não deu pra carregar o replay."; G.render(); });
};

/* entradas de texto e seletores */
var root = document.getElementById("app");
function onInput(ev) {
  var el = ev.target, k = el.getAttribute && el.getAttribute("data-dr"); if (!k || !D.ativo) return;
  if (k === "nick" || k === "nome") { D.me[k] = el.value; }
  else if (k === "tag") { D.me.tag = tagLimpa(el.value); }
  else if (k === "hue") { D.me.hue = +el.value; }
  else if (k === "codigo") { D.codigoDig = tagLimpa(el.value); return; }
  else if (k === "timer") { D.cfgTimer = +el.value; return; }
  else if (k === "prep") { D.cfgPrep = +el.value; return; }
  else if (k === "q") { D.filtro.q = el.value; var pos = el.selectionStart; G.render(); var n = document.getElementById("drq"); if (n) { n.focus(); n.setSelectionRange(pos, pos); } return; }
  else if (k === "tit") {
    var cid = el.value, t = D.plan.tit;
    if (el.checked && t.indexOf(cid) < 0) { if (t.length >= 5) t.shift(); t.push(cid); } else if (!el.checked) D.plan.tit = t.filter(function (x) { return x !== cid; });
    D.plan.ok = false; publicarPresenca(); G.render(); return;
  }
  salvarMe();
  var pv = document.getElementById("drprev"); if (pv) pv.innerHTML = crestTag(tagLimpa(D.me.tag) || "NEW", D.me.hue, "xl") + "<strong>" + esc(D.me.nome || "Seu time") + "</strong>";
  if (D.code) publicarPresenca();
}
if (root) { root.addEventListener("input", onInput); root.addEventListener("change", function (ev) { var k = ev.target.getAttribute && ev.target.getAttribute("data-dr"); if (k === "timer" || k === "prep") onInput(ev); }); }

window.DRAFT = {
  abrir:abrir, active:function () { return D.ativo; }, view:view, after:after,
  _D:D, _host:hostTick, _cartas:cartas, _pres:presDe, _exp:function (pc, id) { return planoExpandido(pc, id); }
};
})();
