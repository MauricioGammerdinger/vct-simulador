/* =====================================================================
   VCT MANAGER — interface estilo "manager" (sidebar, perfis, staff,
   treino por mapa, táticas). A partida ao vivo fica em match.js.
   ===================================================================== */
(function () {
"use strict";
var VM = window.VM, ART = window.ART;
var root = document.getElementById("app");
var UI = { view:"inicio", ligaSel:"AMER", teamSel:null, elencoModo:"cards", perfil:null, perfilAba:"atributos",
  mercadoAba:"jogadores", mercadoLiga:"todas", mercadoRole:"todas", busca:"", compAba:"atual", treinoAba:"time",
  tacMap:null, tacSide:"atk", staffRole:"tecnico", statLiga:"minha", toast:null, ofertas:{}, venda:{}, mailSel:0 };
var ACT = {}, VIEWS = {};

/* ---------------------------------------------------------------------
   Utilidades
   --------------------------------------------------------------------- */
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
  return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]; }); }
function S() { return VM.S; }
function me() { return VM.T(S().userTeam); }
function pct(x) { return Math.round(x * 100) + "%"; }
function roleTag(r) { return '<span class="role r-' + r + '">' + esc(VM.ROLE_NAME[r] || r) + "</span>"; }
function tagOf(p) { var t = p && p.teamId ? VM.T(p.teamId) : null; return t ? t.tag : "FA"; }
function face(p, cls) { return ART.face(p.nick, tagOf(p), cls); }
function staffFace(st, cls) { var t = st.teamId ? VM.T(st.teamId) : null; return ART.face(st.nome, t ? t.tag : "FA", cls, { staff:true }); }
function crest(id, cls) { var t = VM.T(id); return '<span class="cw ' + (cls || "") + '">' + ART.crest(t ? t.tag : id) + "</span>"; }
function teamName(id) { var t = VM.T(id); return t ? esc(t.nome) : "—"; }
function teamChip(id, full) {
  var t = VM.T(id); if (!t) return '<span class="muted">a definir</span>';
  return '<span class="tchip' + (id === S().userTeam ? " you" : "") + '" title="' + esc(t.nome) + '">' + crest(id, "xs") + "<b>" + esc(full ? t.nome : t.tag) + "</b></span>";
}
function avgOvr(t) { var f = VM.activeFive(t); var s = 0; f.forEach(function (p) { s += VM.ovr(p); }); return Math.round(s / Math.max(1, f.length)); }
function toast(msg, ok) { UI.toast = { msg:msg, ok:ok !== false }; render(); clearTimeout(UI.toT); UI.toT = setTimeout(function () { UI.toast = null; render(); }, 3200); }
function persist() { if (!VM.save()) UI.saveWarn = true; }
function go(view, extra, noHist) {
  if (!noHist && UI.view !== view) { UI.hist = (UI.hist || []).slice(0, (UI.hi == null ? -1 : UI.hi) + 1); UI.hist.push(view); UI.hi = UI.hist.length - 1; }
  UI.view = view; if (extra) Object.keys(extra).forEach(function (k) { UI[k] = extra[k]; }); UI.scrollTop = 0; render(); }
function to20(v) { return Math.max(1, Math.min(20, Math.round((v - 30) / 67 * 19 + 1))); }
function attrClass(n) { return n >= 17 ? "a5" : n >= 14 ? "a4" : n >= 11 ? "a3" : n >= 8 ? "a2" : "a1"; }
function seg(action, cur, opts, cls) {
  return '<div class="seg ' + (cls || "") + '">' + opts.map(function (o) {
    return '<button data-a="' + action + '" data-v="' + esc(o[0]) + '" class="' + (String(cur) === String(o[0]) ? "on" : "") + '">' + o[1] + "</button>";
  }).join("") + "</div>";
}
function bar(v, cls, max) { var w = Math.max(0, Math.min(100, v / (max || 100) * 100)); return '<span class="bar ' + (cls || "") + '"><i style="width:' + w.toFixed(0) + '%"></i></span>'; }
function formTxt(f) { return (f > 0 ? "+" : "") + f.toFixed(1); }
function formLevel(f) { return Math.round((f + 3) / 6 * 100); }
function money(v) { return VM.money(v); }

/* Datas de jogo: cada fase começa numa data e cada dia jogado avança 2 dias. */
var FASE_INICIO = { KICKOFF:[0, 12], SANTIAGO:[2, 1], STAGE1:[3, 5], LONDON:[5, 7], STAGE2G:[6, 12], PLAYINS:[7, 16], STAGE2P:[7, 23], CHAMPIONS:[8, 13], OFF:[10, 15] };
var MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
var DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
function gameDate() {
  var s = S(), f = VM.FASES[s.fase].id, b = FASE_INICIO[f] || [0, 1];
  var d = new Date(Date.UTC(s.temporada, b[0], b[1] + (s.diaFase || 0) * 2));
  return DIAS[d.getUTCDay()] + ", " + d.getUTCDate() + " " + MESES[d.getUTCMonth()] + " " + d.getUTCFullYear();
}
var DIAS_L = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
function gameDateParts(fase, dia, temp) {
  var s = S(), f = VM.FASES[fase == null ? s.fase : fase].id, b = FASE_INICIO[f] || [0, 1];
  var d = new Date(Date.UTC(temp || s.temporada, b[0], b[1] + (dia == null ? (s.diaFase || 0) : dia) * 2));
  return { wd:DIAS_L[d.getUTCDay()], dm:("0" + d.getUTCDate()).slice(-2) + " " + MESES[d.getUTCMonth()] + " " + d.getUTCFullYear(), short:("0" + d.getUTCDate()).slice(-2) + "/" + ("0" + (d.getUTCMonth() + 1)).slice(-2) + "/" + d.getUTCFullYear() };
}
function playDay(res) { var r = VM.playDay(res); S().diaFase = (S().diaFase || 0) + 1; return r; }
function nextPhase() { VM.nextPhase(); S().diaFase = 0; }

/* ---------------------------------------------------------------------
   Render
   --------------------------------------------------------------------- */
function render() {
  if (S() && S().customOrg) ART.setCustom(S().customOrg.tag, S().customOrg);
  var st = root.querySelector(".stage");
  if (st && UI.scrollTop !== 0) UI.scrollTop = st.scrollTop;
  var html;
  var M = window.MATCH;
  var IN = window.INTRO && window.INTRO.active();
  if (IN) html = window.INTRO.view();
  else if (M && M.locked()) html = shell(M.view(), true);
  else if (S().demitido && window.CARREIRA) html = shell(window.CARREIRA.demitido(), true);
  else html = shell((VIEWS[UI.view] || VIEWS.inicio)(), false);
  if (UI.toast) html += '<div class="toast ' + (UI.toast.ok ? "ok" : "bad") + '" role="status">' + esc(UI.toast.msg) + "</div>";
  root.innerHTML = html;
  var st2 = root.querySelector(".stage");
  if (st2) st2.scrollTop = UI.scrollTop || 0;
  UI.scrollTop = null;
  if (!IN) { window.SFX_WANT_MUSIC = false; if (window.SFX) window.SFX.musicStop(); }
  if (IN) window.INTRO.after();
  else if (M && M.locked() && M.after) M.after();
  else if (window.TELAS) window.TELAS.after();
}

var NAV = [
  ["inicio", "Início", "M3 11 12 3l9 8v10h-6v-6H9v6H3z"],
  ["caixa", "E-mail", "M3 5h18v14H3zM3 6l9 7 9-7"],
  ["-"],
  ["elenco", "Elenco", "M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c0-4 3-7 6-7s6 3 6 7M17 11a3 3 0 1 0 0-6M22 20c0-3-2-5-4-6"],
  ["academia", "Academia", "M12 3 2 8l10 5 10-5zM6 10v5c0 2 3 4 6 4s6-2 6-4v-5"],
  ["treino", "Treino", "M6 5v14M18 5v14M3 8v8M21 8v8M6 12h12"],
  ["taticas", "Estratégias", "M4 4h16v16H4zM8 9l3 3-3 3M13 15h4"],
  ["staff", "Staff", "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-7 8-7s8 3 8 7M12 14v7"],
  ["-"],
  ["mercado", "Olheiros", "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5"],
  ["transferencias", "Transferências", "M4 8h13l-3-3M20 16H7l3 3"],
  ["-"],
  ["competicoes", "Torneios", "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"],
  ["estatisticas", "Estatísticas", "M12 3a9 9 0 1 0 9 9h-9z M14 1v8h8a8 8 0 0 0-8-8z"],
  ["hof", "Hall da fama", "M8 21h8M12 17v4M6 3h12l-1 7a5 5 0 0 1-10 0z"],
  ["-"],
  ["qg", "QG", "M3 21V9l9-6 9 6v12M9 21v-7h6v7"],
  ["-"],
  ["patrocinadores", "Patrocinadores", "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 21c0-4 3-6 7-6s7 2 7 6"],
  ["financas", "Finanças", "M3 7h18v13H3zM8 7V4h8v3M3 12h18"],
  ["diretoria", "Diretoria", "M4 21V8l8-5 8 5v13M9 21v-5h6v5M9 11h6"]
];
var NAV_BOTTOM = ["config", "Configurações", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-2-4-2 1-2-1V5h-4v2l-2 1-2-1-2 4 2 1v2l-2 1 2 4 2-1 2 1v2h4v-2l2-1 2 1 2-4-2-1z"];
function icon(d) { return '<svg viewBox="0 0 24 24" class="ico" aria-hidden="true"><path d="' + d + '"/></svg>'; }

function continueBtn(locked) {
  if (locked) return '<span class="contw"><span class="chip live">' + (S().demitido ? "DEMITIDO" : "PARTIDA EM ANDAMENTO") + '</span></span>';
  var um = VM.userMatchToday();
  if (VM.phaseOver()) {
    var f = VM.FASES[S().fase];
    var nx = f.id === "CHAMPIONS" ? "Pré-temporada" : f.id === "OFF" ? "Temporada " + (S().temporada + 1) : VM.FASES[S().fase + 1].nome;
    return '<span class="contw"><button class="btn cont" data-a="proxFase" title="Ir para ' + esc(nx) + '">PRÓXIMA FASE</button></span>';
  }
  if (um) return '<span class="contw"><button class="btn ghost sm" data-a="simUser" title="Simula sua partida sem assistir">Simular</button><button class="btn cont" data-a="irPartida">IR PARA A PARTIDA</button></span>';
  return '<span class="contw"><button class="btn cont" data-a="avancar">CONTINUAR</button><button class="btn ff" data-a="ateMeuJogo" title="Avança até o seu próximo jogo (ou até o fim da fase)">»</button></span>';
}

function shell(content, locked) {
  var s = S(), t = me();
  var unread = (s.noticias || []).filter(function (n) { return !n.lida; }).length;
  function navBtn(n) {
    var on = !locked && (UI.view === n[0] || (n[0] === "elenco" && UI.view === "perfil"));
    return '<button class="navi ' + (on ? "on" : "") + '" data-a="nav" data-v="' + n[0] + '" ' + (locked ? "disabled" : "") + ">" + icon(n[2]) + "<span>" + n[1] + "</span>" +
      (n[0] === "caixa" && unread > 0 ? '<i class="badge">' + Math.min(unread, 99) + "</i>" : "") + "</button>";
  }
  var nav = NAV.map(function (n) { return n[0] === "-" ? '<div class="navsep"></div>' : navBtn(n); }).join("");
  var dp = gameDateParts();
  var canBack = UI.hi > 0, canFwd = UI.hist && UI.hi < UI.hist.length - 1;
  var tc = ART.teamColors(t.tag);
  return '<div class="game" style="--glow:hsla(' + tc.hue + ',70%,45%,.30)"><div class="gamebg"></div><aside class="side">' +
    '<div class="sidetop">' + (s.manager && window.INTRO ? window.INTRO.mgrFace(s.manager, "sm", t.tag) : crest(t.id, "sm")) + "<div><strong>" + esc(s.manager ? s.manager.nick : t.nome) + "</strong><small>" + crest(t.id, "xs") + " " + esc(t.tag) + "</small></div></div>" +
    '<nav class="navs">' + nav + '</nav><div class="sidebottom">' + navBtn(NAV_BOTTOM) + '<div class="sidecash">' + money(t.cash) + "<small>em caixa</small></div></div></aside>" +
    '<section class="mainc"><header class="topbar"><div class="tt"><button class="arrow" data-a="navBack" ' + (canBack && !locked ? "" : "disabled") + ' aria-label="Voltar">‹</button><button class="arrow" data-a="navFwd" ' + (canFwd && !locked ? "" : "disabled") + ' aria-label="Avançar">›</button><h1>' + esc(locked ? "Partida" : viewTitle()) + "</h1></div>" +
    '<div class="date"><small>' + esc(dp.wd) + ",</small><b>" + esc(dp.dm) + "</b></div>" + continueBtn(locked) + "</header>" +
    (UI.saveWarn ? '<div class="warn">O navegador não deixou salvar. Use Configurações → Exportar save pra não perder nada.</div>' : "") +
    '<main class="stage">' + content +
    '<footer class="foot">Projeto pessoal de fã. Criado sob a política "Legal Jibber Jabber" da Riot Games usando recursos de propriedade da Riot Games. A Riot Games não endossa nem patrocina este projeto. Avatares, escudos e patrocinadores são ilustrações e nomes inventados pelo jogo. Elencos: ' + esc(VALDB.fonte) + ".</footer></main></section></div>";
}
function viewTitle() {
  if (UI.view === "perfil" && UI.perfil) return "Perfil do jogador";
  var n = NAV.concat([NAV_BOTTOM]).filter(function (x) { return x[0] === UI.view; })[0];
  return n ? n[1] : "Início";
}

/* ---------------------------------------------------------------------
   Escolha de time
   --------------------------------------------------------------------- */
var LIGAS = ["AMER", "EMEA", "PAC", "CN", "CBR", "CNA", "CLAT", "CEMEA", "CPAC", "CCN"];
var DIF = { 5:["Favorito", "d5"], 4:["Forte", "d4"], 3:["Médio", "d3"], 2:["Desafio", "d2"], 1:["Muito difícil", "d1"] };
function viewEscolha() {
  var db = window.VALDB;
  var times = db.times.filter(function (t) { return t.liga === UI.ligaSel; })
    .sort(function (a, b) { return b.nivel - a.nivel || a.nome.localeCompare(b.nome); });
  if (!UI.teamSel || !times.some(function (t) { return t.tag === UI.teamSel; })) UI.teamSel = times[0] && times[0].tag;
  var sel = times.filter(function (t) { return t.tag === UI.teamSel; })[0];
  var cont = VM.hasSave() ? '<div class="savebar"><div><strong>Carreira salva</strong><small>Continue de onde parou.</small></div>' +
    '<button class="btn primary" data-a="continuar">Continuar carreira</button>' +
    '<button class="btn ghost" data-a="apagarSave">' + (UI.confirmApagar ? "Clique de novo pra apagar" : "Apagar save") + "</button></div>" : "";
  var list = times.map(function (t) {
    var d = DIF[t.nivel] || DIF[3];
    return '<button class="trow ' + (t.tag === UI.teamSel ? "on" : "") + '" data-a="teamSel" data-v="' + esc(t.tag) + '">' +
      '<span class="cw sm">' + ART.crest(t.tag) + '</span><span class="tn"><strong>' + esc(t.nome) + "</strong><small>" + esc(t.pais || "") + "</small></span>" +
      ART.stars(t.nivel) + '<span class="dif ' + d[1] + '">' + d[0] + "</span></button>";
  }).join("");
  var detail = "";
  if (sel) {
    var d2 = DIF[sel.nivel] || DIF[3];
    detail = '<div class="tdetail"><div class="thead"><span class="cw xl">' + ART.crest(sel.tag) + '</span><div><h2>' + esc(sel.nome) + "</h2><p class=\"muted\">" + esc(db.ligas[sel.liga]) + " · " + esc(sel.pais || "") + "</p>" + ART.stars(sel.nivel) + ' <span class="dif ' + d2[1] + '">' + d2[0] + "</span></div></div>" +
      (sel.incerto ? '<div class="banner">Elenco em reformulação — usando a última formação conhecida.</div>' : "") +
      '<h4 class="sec">Jogadores</h4><div class="pmini">' + sel.jogadores.map(function (j) {
        return '<div class="pm">' + ART.face(j[0], sel.tag, "lg") + "<strong>" + esc(j[0]) + "</strong>" + roleTag(j[2]) + "</div>";
      }).join("") + (sel.jogadores.length < 5 ? '<div class="pm empty"><span class="face lg empty">+' + (5 - sel.jogadores.length) + "</span><strong>vagas</strong><small>completadas pelo jogo</small></div>" : "") + "</div>" +
      '<h4 class="sec">Comissão técnica</h4><div class="coach">' + ART.face(sel.tecnico || "—", sel.tag, "md", { staff:true }) + "<div><strong>" + esc(sel.tecnico || "—") + '</strong><small>Técnico principal</small></div></div>' +
      '<button class="btn primary big" data-a="escolher" data-v="' + esc(sel.tag) + '">Assinar com ' + esc(sel.nome) + "</button></div>";
  }
  return '<div class="pick"><div class="pickhead"><div class="brand big"><b></b><span>VCT<em>MANAGER</em></span></div>' +
    "<h1>Escolha seu time</h1><p class=\"muted\">Temporada " + db.temporada + " — ligas internacionais, todos os Challengers, dois Masters e Champions no formato atual.</p></div>" + cont +
    '<div class="ligtabs">' + LIGAS.map(function (l) {
      return '<button data-a="ligaSel" data-v="' + l + '" class="' + (UI.ligaSel === l ? "on" : "") + '">' + esc(db.ligas[l]) + "</button>";
    }).join("") + "</div>" +
    '<div class="pickgrid"><div class="tlist">' + list + "</div>" + detail + "</div>" +
    '<p class="fine">Atributos gerados pelo jogo a partir do nível de cada time — não são números oficiais. Avatares e escudos são ilustrações geradas. Coloque suas próprias imagens em fotos/NICK.png e escudos/TAG.png se quiser.</p>' +
    '<footer class="foot">Projeto pessoal de fã sob a política "Legal Jibber Jabber" da Riot Games. A Riot Games não endossa nem patrocina este projeto.</footer></div>';
}

/* ---------------------------------------------------------------------
   Competição do usuário (helpers)
   --------------------------------------------------------------------- */
function stageHasTeam(st, id) {
  if (st.kind === "groups") return st.groups.some(function (g) { return g.teams.indexOf(id) >= 0; });
  if (st.kind === "bracket") return st.seeds.indexOf(id) >= 0;
  if (st.kind === "swiss") return st.teams.indexOf(id) >= 0;
  if (st.kind === "multi") return st.subs.some(function (x) { return stageHasTeam(x, id); });
  return false;
}
function userEvent() {
  var u = S().userTeam;
  return S().eventos.filter(function (ev) { return ev.stages.some(function (st) { return stageHasTeam(st, u); }); })[0] || null;
}

function stageHtml(st, compact) {
  var u = S().userTeam;
  if (st.kind === "groups") {
    return '<div class="groups">' + st.groups.map(function (g) {
      var rank = VM.standings(g);
      return '<div class="gtable"><div class="gh">' + esc(g.nome) + '</div><table><thead><tr><th>#</th><th>Time</th><th class="num">V</th><th class="num">D</th><th class="num">Mapas</th>' + (compact ? "" : '<th class="num">Rds</th>') + "</tr></thead><tbody>" +
        rank.map(function (id, i) {
          var x = g.st[id];
          return '<tr class="' + (id === u ? "you" : "") + '"><td class="num">' + (i + 1) + "</td><td>" + teamChip(id, !compact) + '</td><td class="num">' + x.w + '</td><td class="num">' + x.l + '</td><td class="num">' + (x.md > 0 ? "+" : "") + x.md + "</td>" + (compact ? "" : '<td class="num">' + (x.rd > 0 ? "+" : "") + x.rd + "</td>") + "</tr>";
        }).join("") + "</tbody></table></div>";
    }).join("") + "</div>";
  }
  if (st.kind === "swiss") {
    var ids = st.teams.slice().sort(function (a, b) { return (st.rec[b].w - st.rec[b].l) - (st.rec[a].w - st.rec[a].l); });
    return '<table class="swiss"><thead><tr><th>Time</th><th class="num">Campanha</th><th>Situação</th></tr></thead><tbody>' + ids.map(function (id) {
      var r = st.rec[id], sit = st.adv.indexOf(id) >= 0 ? '<span class="chip ok">classificado</span>' : st.out.indexOf(id) >= 0 ? '<span class="chip bad">eliminado</span>' : '<span class="chip">em disputa</span>';
      return '<tr class="' + (id === u ? "you" : "") + '"><td>' + teamChip(id, true) + '</td><td class="num">' + r.w + "–" + r.l + "</td><td>" + sit + "</td></tr>";
    }).join("") + "</tbody></table>";
  }
  if (st.kind === "bracket") {
    var cols = {};
    VM.TEMPLATES[st.template].forEach(function (n) { (cols[n.d] = cols[n.d] || []).push(n); });
    return '<div class="bracket">' + Object.keys(cols).map(function (d) {
      return '<div class="bcol">' + cols[d].map(function (n) {
        var node = st.nodes[n.id], a = VM.nodeTeam(st, n.a), b = VM.nodeTeam(st, n.b), r = node.res;
        function side(id, score, win) {
          return '<div class="bs ' + (win ? "w" : "") + (id === u ? " you" : "") + '">' + (id ? teamChip(id) : '<span class="muted">a definir</span>') + "<b>" + (r ? score : "") + "</b></div>";
        }
        return '<div class="bm"><div class="bn">' + esc(n.nome) + (n.bo5 ? " · Bo5" : "") + "</div>" +
          side(a, r ? (r.a === a ? r.wa : r.wb) : "", r && r.winner === a) + side(b, r ? (r.a === b ? r.wa : r.wb) : "", r && r.winner === b) + "</div>";
      }).join("") + "</div>";
    }).join("") + "</div>";
  }
  if (st.kind === "multi") {
    return '<div class="multi">' + st.subs.map(function (sub) {
      return '<div class="card inner"><h4>' + esc(sub.label) + "</h4>" + stageHtml(sub, compact) + "</div>";
    }).join("") + "</div>";
  }
  return "";
}

/* ---------------------------------------------------------------------
   Início
   --------------------------------------------------------------------- */
VIEWS.inicio = function () {
  var s = S(), t = me(), um = VM.userMatchToday(), ev = userEvent();
  var next;
  if (VM.phaseOver()) {
    next = '<div class="card nextm"><div class="k">Fase encerrada</div><h2>' + esc(VM.FASES[s.fase].nome) + " terminou</h2><p class=\"muted\">Use PRÓXIMA FASE no topo pra seguir. A janela de transferências abre no começo de cada fase.</p></div>";
  } else if (um) {
    var opp = um.a === s.userTeam ? um.b : um.a;
    var odds = VM.preMatchOdds(um.a, um.b, 60); if (um.a !== s.userTeam) odds = 1 - odds;
    next = '<div class="card nextm hot"><div class="k">Hoje · ' + esc(um.evNome) + (um.nome ? " · " + esc(um.nome) : "") + " · Bo" + um.bo + "</div>" +
      '<div class="vsbig"><div>' + crest(s.userTeam, "xl") + "<strong>" + esc(t.nome) + "</strong><small>força " + avgOvr(t) + '</small></div><span class="vs">VS</span><div>' + crest(opp, "xl") + "<strong>" + teamName(opp) + "</strong><small>força " + avgOvr(VM.T(opp)) + "</small></div></div>" +
      '<div class="oddbar"><i style="width:' + Math.round(odds * 100) + '%"></i><span>' + pct(odds) + " chance por mapa</span></div>" +
      '<div class="row center"><button class="btn primary" data-a="irPartida">Ir para a partida</button><button class="btn ghost" data-a="taticasRapido">Revisar táticas</button></div></div>';
  } else {
    next = '<div class="card nextm"><div class="k">' + esc(VM.FASES[s.fase].nome) + "</div><h2>" + (ev ? "Sem jogo seu hoje" : "Seu time não joga nesta fase") + '</h2><p class="muted">Clique em CONTINUAR pra avançar um dia, ou » pra ir direto ao seu próximo jogo.</p></div>';
  }
  var five = VM.activeFive(t);
  var saude = Math.round(five.reduce(function (a, p) { return a + (p.saude == null ? 100 : p.saude); }, 0) / 5);
  var moral = Math.round(five.reduce(function (a, p) { return a + p.morale; }, 0) / 5);
  var forma = five.reduce(function (a, p) { return a + p.form; }, 0) / 5;
  var squad = '<div class="card"><h3>Titulares</h3><div class="lineup">' + five.map(function (p) {
    return '<button class="lu" data-a="perfil" data-v="' + p.id + '">' + face(p, "md") + "<strong>" + esc(p.nick) + "</strong>" + roleTag(p.role) + "<b>" + VM.ovr(p) + "</b></button>";
  }).join("") + '</div><div class="rings">' + ART.ring(avgOvr(t), 100, "Força", "var(--red2)") + ART.ring(saude, 100, "Saúde", "var(--win)") + ART.ring(moral, 100, "Moral", "var(--warn)") + ART.ring(formLevel(forma), 100, "Forma", "var(--def)") + "</div></div>";
  var res = (s.ultimosResultados || []).slice(0, 8);
  var resHtml = res.length ? '<ul class="results">' + res.map(function (r) {
    var aw = r.wa > r.wb;
    return '<li><span class="ev">' + esc(r.ev) + "</span>" + teamChip(r.a) + '<b class="' + (aw ? "w" : "") + '">' + r.wa + '</b><i>:</i><b class="' + (!aw ? "w" : "") + '">' + r.wb + "</b>" + teamChip(r.b) + "</li>";
  }).join("") + "</ul>" : '<p class="muted">Nenhum jogo ainda nesta fase.</p>';
  var mini = ev ? '<div class="card"><h3>' + esc(ev.nome) + '</h3><div class="k">' + esc(ev.stages[ev.si].label || "") + "</div>" + stageHtml(ev.stages[ev.si], true) + "</div>" : "";
  var nws = (s.noticias || []).slice(0, 5).map(function (n) { return '<li class="n-' + n.tipo + '">' + esc(n.t) + "</li>"; }).join("");
  var obj = s.manager ? '<div class="card objc">' + (window.INTRO ? window.INTRO.mgrFace(s.manager, "md", t.tag) : "") + '<div><div class="k">Objetivo da diretoria</div><strong>' + esc(s.manager.objetivo || "") + "</strong><small>" + esc(s.manager.nome + " " + s.manager.sobrenome) + " · manager</small></div></div>" : "";
  return '<div class="grid2"><div class="col">' + next + obj + squad + mini + "</div>" +
    '<div class="col"><div class="card"><h3>Últimos resultados</h3>' + resHtml + '</div><div class="card"><div class="head"><h3>Notícias</h3><button class="btn sm ghost" data-a="nav" data-v="caixa">Ver todas</button></div><ul class="news">' + (nws || '<li class="muted">Nada ainda.</li>') + "</ul></div></div></div>";
};

/* ---------------------------------------------------------------------
   Caixa de entrada
   --------------------------------------------------------------------- */
var REMET = { bom:["Diretoria", "Parabéns"], ruim:["Diretoria", "Atenção"], titulo:["Liga", "Comunicado"], info:["Assessoria", "Informe"] };
VIEWS.caixa = function () {
  var s = S(); s.lidas = (s.noticias || []).length;
  var list = s.noticias || [];
  if (!list.length) return '<div class="card"><p class="muted">Caixa vazia.</p></div>';
  var i = Math.min(UI.mailSel, list.length - 1), n = list[i], r = REMET[n.tipo] || REMET.info;
  return '<div class="mail"><ul class="mlist">' + list.map(function (x, k) {
    var rr = REMET[x.tipo] || REMET.info;
    return '<li><button class="' + (k === i ? "on" : "") + ' n-' + x.tipo + '" data-a="mailSel" data-v="' + k + '"><strong>' + rr[0] + "</strong><span>" + esc(x.t) + "</span><small>" + esc(x.fase) + " · " + x.temp + "</small></button></li>";
  }).join("") + '</ul><div class="card mread"><div class="k">' + r[0] + " · " + esc(n.fase) + " " + n.temp + "</div><h2>" + r[1] + "</h2><p>" + esc(n.t) + "</p></div></div>";
};

/* ---------------------------------------------------------------------
   Elenco
   --------------------------------------------------------------------- */
VIEWS.elenco = function () {
  var t = me();
  var five = VM.activeFive(t).map(function (p) { return p.id; });
  var list = t.roster.map(VM.P).sort(function (a, b) { return (five.indexOf(b.id) >= 0) - (five.indexOf(a.id) >= 0) || VM.ovr(b) - VM.ovr(a); });
  var body;
  if (UI.elencoModo === "cards") {
    body = '<div class="pcards">' + list.map(function (p) {
      var tit = five.indexOf(p.id) >= 0, sa = p.saude == null ? 100 : p.saude;
      return '<div class="pcard ' + (tit ? "tit" : "res") + (UI.swapOut === p.id ? " swap" : "") + '"><button class="pc-main" data-a="perfil" data-v="' + p.id + '">' + face(p, "xl") +
        '<span class="pc-ovr">' + VM.ovr(p) + "</span><strong>" + esc(p.nick) + "</strong><small>" + esc(p.nat) + " · " + p.age + " anos</small>" + roleTag(p.role) +
        '<span class="pc-stars">' + ART.stars(VM.playerStars(p)) + '<em>pot</em>' + ART.stars(VM.potStars(p)) + "</span>" +
        '<span class="pc-ag">' + esc(p.agents.slice(0, 3).join(" · ") || "pool livre") + "</span>" +
        '<span class="bars"><label>Saúde</label>' + bar(sa, "hp") + '<label>Moral</label>' + bar(p.morale, "mo") + '<label>Forma</label>' + bar(formLevel(p.form), "fo") + "</span></button>" +
        '<button class="tog ' + (tit ? "on" : "") + '" data-a="titular" data-v="' + p.id + '">' + (tit ? "Titular" : "Reserva") + "</button></div>";
    }).join("") + "</div>";
  } else {
    body = '<div class="tblwrap"><table class="roster"><thead><tr><th></th><th>Jogador</th><th>Função</th><th class="num">GER</th><th class="num">MIR</th><th class="num">UTL</th><th class="num">LEI</th><th class="num">CLU</th><th class="num">COM</th><th class="num">Saúde</th><th class="num">Moral</th><th class="num">Forma</th><th class="num">Contrato</th><th class="num">Salário</th><th></th></tr></thead><tbody>' +
      list.map(function (p) {
        var tit = five.indexOf(p.id) >= 0;
        function c(v) { var n = to20(v); return '<td class="num ' + attrClass(n) + '">' + n + "</td>"; }
        return '<tr class="' + (tit ? "tit" : "") + '"><td><button class="tog sm ' + (tit ? "on" : "") + '" data-a="titular" data-v="' + p.id + '">' + (tit ? "T" : "R") + "</button></td>" +
          '<td><button class="plink" data-a="perfil" data-v="' + p.id + '">' + face(p, "xs") + "<strong>" + esc(p.nick) + "</strong></button></td><td>" + roleTag(p.role) + '</td><td class="num big">' + VM.ovr(p) + "</td>" +
          c(p.aim) + c(p.util) + c(p.sense) + c(p.clutch) + c(p.comms) + '<td class="num">' + Math.round(p.saude == null ? 100 : p.saude) + '</td><td class="num">' + Math.round(p.morale) + '</td><td class="num ' + (p.form > 0.5 ? "pos" : p.form < -0.5 ? "neg" : "") + '">' + formTxt(p.form) + "</td>" +
          '<td class="num">' + p.contract + '</td><td class="num">' + money(p.salary) + '</td><td class="acts"><button class="btn sm ghost" data-a="renovar" data-v="' + p.id + '">Renovar</button></td></tr>';
      }).join("") + "</tbody></table></div>";
  }
  var payroll = t.roster.reduce(function (a, id) { return a + VM.P(id).salary; }, 0);
  return '<div class="card"><div class="head"><div><h2>' + esc(t.nome) + '</h2><p class="muted">' + t.roster.length + "/7 jogadores · folha " + money(payroll) + '/ano · clique num titular e depois num reserva pra trocar</p></div>' +
    seg("elencoModo", UI.elencoModo, [["cards", "Cartas"], ["tabela", "Tabela"]]) + "</div>" + body + "</div>";
};

/* ---------------------------------------------------------------------
   Perfil do jogador
   --------------------------------------------------------------------- */
var ATTR_GROUPS = [
  ["Técnico", [["aim", "Mira"], ["util", "Utilitária"], ["mov", "Movimentação"], ["op", "Operator"], ["reflex", "Reflexo"]]],
  ["Mental", [["sense", "Leitura de jogo"], ["clutch", "Clutch"], ["comms", "Comunicação"], ["lead", "Liderança"], ["team", "Trabalho em equipe"], ["cons", "Consistência"], ["comp", "Compostura"], ["perc", "Percepção"]]],
  ["Físico", [["stam", "Resistência"], ["saude", "Saúde"]]]
];
VIEWS.perfil = function () {
  var p = VM.P(UI.perfil);
  if (!p) { UI.view = "elenco"; return VIEWS.elenco(); }
  var mine = p.teamId === S().userTeam, known = VM.isScouted(p.id);
  var t = p.teamId ? VM.T(p.teamId) : null;
  var jitter = function (k) { var h = 0, s = p.id + k; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (Math.abs(h) % 3) - 1; };
  function attrRow(k, label) {
    var v = k === "saude" ? (p.saude == null ? 100 : p.saude) : p[k];
    var n = to20(v || 50);
    if (!known && k !== "saude") { var c = n + jitter(k); return '<div class="arow unk"><span>' + label + '</span><b class="a0">' + Math.max(1, c - 2) + "–" + Math.min(20, c + 2) + "</b></div>"; }
    return '<div class="arow"><span>' + label + '</span><b class="' + attrClass(n) + '">' + n + "</b></div>";
  }
  var attrs = '<div class="attrs">' + ATTR_GROUPS.map(function (g) {
    return '<div class="agroup"><h4>' + g[0] + "</h4>" + g[1].map(function (a) { return attrRow(a[0], a[1]); }).join("") + "</div>";
  }).join("") + "</div>";
  var rad = known ? ART.radar([{ label:"Mira", v:p.aim }, { label:"Util", v:p.util }, { label:"Leitura", v:p.sense }, { label:"Clutch", v:p.clutch }, { label:"Comms", v:p.comms }, { label:"Movim.", v:p.mov || 60 }])
    : '<div class="radar-unk">Observe o jogador pra ver o radar exato.</div>';
  var st = p.stats || { mapas:0, k:0, d:0, a:0, acsSum:0 };
  var tabs = seg("perfilAba", UI.perfilAba, [["atributos", "Atributos"], ["stats", "Estatísticas"], ["contrato", "Contrato"]].concat(mine ? [["conversa", "Conversa"]] : []), "sm");
  var body;
  if (UI.perfilAba === "stats") {
    body = '<div class="statgrid"><div><b>' + st.mapas + "</b><small>Mapas</small></div><div><b>" + st.k + "</b><small>Abates</small></div><div><b>" + st.d + "</b><small>Mortes</small></div><div><b>" + st.a + "</b><small>Assist.</small></div>" +
      "<div><b>" + (st.d ? (st.k / st.d).toFixed(2) : "—") + "</b><small>K/D</small></div><div><b>" + (st.mapas ? Math.round(st.acsSum / st.mapas) : "—") + "</b><small>ACS médio</small></div></div>" +
      '<p class="muted">Estatísticas desta temporada, somando todos os campeonatos.</p>';
  } else if (UI.perfilAba === "conversa" && window.CARREIRA) {
    body = window.CARREIRA.conversa(p);
  } else if (UI.perfilAba === "contrato" && p.academia) {
    body = '<p class="muted">Jogador da sua academia. Suba ele pro elenco em Academia quando estiver pronto.</p><button class="btn primary" data-a="yPromover" data-v="' + p.id + '">Subir pro elenco</button>';
  } else if (UI.perfilAba === "contrato" && mine && window.CARREIRA) {
    body = window.CARREIRA.contrato(p);
  } else if (UI.perfilAba === "contrato") {
    body = '<dl class="kv"><dt>Time</dt><dd>' + (t ? teamChip(t.id, true) : "Agente livre") + "</dd><dt>Salário</dt><dd>" + money(p.salary) + "/ano</dd><dt>Contrato</dt><dd>" + p.contract + " temporada(s)</dd><dt>Valor de mercado</dt><dd>" + money(VM.valueFor(p)) + "</dd></dl>" +
      (mine ? '<div class="row"><button class="btn" data-a="renovar" data-v="' + p.id + '">Renovar 3 temporadas</button><button class="btn ghost" data-a="liberar" data-v="' + p.id + '">Liberar</button>' +
        (VM.marketOpen() ? '<button class="btn ghost" data-a="vender" data-v="' + p.id + '">Procurar comprador</button>' : "") + "</div>" +
        (UI.venda[p.id] ? '<div class="banner">' + (UI.venda[p.id] === "nada" ? "Nenhum time tem interesse agora." : "Proposta da " + teamName(UI.venda[p.id].team) + ": <strong>" + money(UI.venda[p.id].valor) + '</strong> <button class="btn sm primary" data-a="aceitarVenda" data-v="' + p.id + '">Aceitar</button> <button class="btn sm ghost" data-a="recusarVenda" data-v="' + p.id + '">Recusar</button>') + "</div>" : "")
        : (t ? '<div class="row"><input class="offer-in" type="number" step="10000" min="0" id="of-' + p.id + '" value="' + (UI.ofertas[p.id] || VM.valueFor(p)) + '" aria-label="Valor da oferta"><button class="btn primary" data-a="ofertar" data-v="' + p.id + '" ' + (VM.marketOpen() ? "" : "disabled") + ">Fazer oferta</button></div>"
          : '<button class="btn primary" data-a="assinar" data-v="' + p.id + '" ' + (VM.marketOpen() ? "" : "disabled") + ">Contratar agente livre</button>"));
  } else body = attrs;
  return '<div class="row"><button class="btn ghost sm" data-a="voltar">← Voltar</button></div>' +
    '<div class="phead card">' + face(p, "xxl") + '<div class="pinfo"><div class="k">' + (t ? esc(t.nome) : p.academia ? "Academia" : "Agente livre") + "</div><h2>" + esc(p.nick) + "</h2>" +
    '<p>' + roleTag(p.role) + " " + esc(p.nat) + " · " + p.age + " anos · " + esc(p.agents.join(", ") || "pool livre") + "</p>" +
    '<div class="pstars"><span>Habilidade</span>' + ART.stars(VM.playerStars(p)) + "<span>Potencial</span>" + (known ? ART.stars(VM.potStars(p)) : '<span class="muted">?</span>') + "</div>" +
    (!known ? '<button class="btn sm" data-a="observar" data-v="' + p.id + '">Observar (' + (S().scoutUsados || 0) + "/" + VM.scoutLimit() + " nesta fase)</button>" : "") + "</div>" +
    '<div class="rings">' + ART.ring(known ? VM.ovr(p) : 0, 100, known ? "Geral" : "Geral ?", "var(--red2)") + ART.ring(p.saude == null ? 100 : p.saude, 100, "Saúde", "var(--win)") + ART.ring(p.morale, 100, "Moral", "var(--warn)") + ART.ring(formLevel(p.form), 100, "Forma " + formTxt(p.form), "var(--def)") + "</div>" +
    (t ? '<span class="pcrest">' + crest(t.id, "xl") + "</span>" : "") + "</div>" +
    '<div class="grid2 wide"><div class="card">' + tabs + body + '</div><div class="card"><h3>Perfil</h3>' + rad + "</div></div>";
};

/* ---------------------------------------------------------------------
   Staff
   --------------------------------------------------------------------- */
VIEWS.staff = function () {
  var t = me();
  var cards = VM.STAFF_ROLES.map(function (role) {
    var st = VM.staffOf(t, role);
    return '<div class="scard ' + (UI.staffRole === role ? "on" : "") + '"><div class="k">' + VM.STAFF_NOME[role] + "</div>" +
      (st ? staffFace(st, "lg") + "<strong>" + esc(st.nome) + "</strong>" + ART.stars(st.nivel) + "<small>" + money(st.salario) + '/ano</small><button class="btn sm ghost" data-a="demitir" data-v="' + role + '">Desligar</button>'
        : '<span class="face lg empty">?</span><strong>Vaga aberta</strong><small class="muted">sem efeito</small>') +
      '<p class="eff">' + esc(VM.STAFF_EFEITO[role]) + '</p><button class="btn sm" data-a="staffRole" data-v="' + role + '">Ver mercado</button></div>';
  }).join("");
  var livres = S().staffLivre.map(function (id) { return S().staff[id]; }).filter(function (x) { return x && x.role === UI.staffRole; })
    .sort(function (a, b) { return b.nivel - a.nivel; });
  var cur = VM.staffOf(t, UI.staffRole);
  var market = '<div class="card"><div class="head"><h3>Mercado de ' + VM.STAFF_NOME[UI.staffRole].toLowerCase() + "s</h3>" +
    seg("staffRole", UI.staffRole, VM.STAFF_ROLES.map(function (r) { return [r, VM.STAFF_NOME[r]]; }), "sm") + "</div>" +
    '<div class="tblwrap"><table><thead><tr><th>Nome</th><th>Nível</th><th class="num">Salário</th><th class="num">Luvas</th><th></th></tr></thead><tbody>' +
    (livres.map(function (st) {
      var better = !cur || st.nivel > cur.nivel;
      return '<tr><td><span class="plink">' + staffFace(st, "xs") + "<strong>" + esc(st.nome) + "</strong></span></td><td>" + ART.stars(st.nivel) + (better ? ' <span class="chip ok">melhor que o atual</span>' : "") + '</td><td class="num">' + money(st.salario) + '</td><td class="num">' + money(Math.round(st.salario * 0.25 / 1000) * 1000) + '</td><td class="acts"><button class="btn sm primary" data-a="contratarStaff" data-v="' + st.id + '">Contratar</button></td></tr>';
    }).join("") || '<tr><td colspan="5" class="muted">Ninguém disponível.</td></tr>') + "</tbody></table></div>" +
    '<p class="muted">Contratar substitui quem está na função (o antigo vai pro mercado). Salário do staff entra na folha a cada fase.</p></div>';
  return '<div class="scards">' + cards + "</div>" + market;
};

/* ---------------------------------------------------------------------
   Treino
   --------------------------------------------------------------------- */
VIEWS.treino = function () {
  var s = S(), t = me();
  var tabs = seg("treinoAba", UI.treinoAba, [["time", "Treino do time"], ["mapas", "Treino de mapas"], ["saude", "Saúde e desgaste"]]);
  var body;
  if (UI.treinoAba === "mapas") {
    var g = VM.mapGain(t);
    body = '<div class="card"><h3>Escolha 3 mapas pra treinar</h3><p class="muted">Cada dia, os mapas marcados sobem <strong>+' + g.toFixed(2) + "</strong> de domínio (técnico nível " + VM.staffLvl(t, "tecnico") + (s.treino === "tatica" ? " + treino tático" : "") + "). Os outros caem 0,08 por dia. Domínio pesa na força do time e no veto.</p>" +
      '<div class="mapcards">' + s.mapas.map(function (m) {
        var on = (s.treinoMapas || []).indexOf(m) >= 0, v = Math.round(t.mapProf[m]);
        return '<button class="mapc ' + (on ? "on" : "") + '" data-a="treinoMapa" data-v="' + m + '" style="background:' + ART.mapCard(m) + '"><strong>' + m + "</strong>" + ART.ring(v, 100, "domínio", on ? "var(--win)" : "var(--muted)") + "<em>" + (on ? "TREINANDO · +" + g.toFixed(2) + "/dia" : "−0,08/dia") + "</em></button>";
      }).join("") + "</div></div>";
  } else if (UI.treinoAba === "saude") {
    var f = VM.staffLvl(t, "fisio");
    body = '<div class="card"><h3>Condição física</h3><p class="muted">Cada mapa jogado desgasta. Fisioterapeuta nível ' + f + " recupera +" + (5 + f * 1.3).toFixed(1) + " de saúde por dia. Abaixo de 70, o jogador rende menos. Treino de descanso sobe moral e forma.</p>" +
      '<div class="hlist">' + t.roster.map(VM.P).map(function (p) {
        var sa = Math.round(p.saude == null ? 100 : p.saude);
        return '<div class="hrow">' + face(p, "sm") + "<strong>" + esc(p.nick) + "</strong>" + bar(sa, sa < 70 ? "hp low" : "hp") + "<b>" + sa + '</b><span class="muted">resist. ' + to20(p.stam || 70) + "</span></div>";
      }).join("") + "</div></div>";
  } else {
    var focos = { equilibrado:"Um pouco de tudo: mira, utilitária, leitura e comunicação.", mira:"Mira e clutch. Evolução mais rápida em menos atributos.", utilitaria:"Só utilitária, bem focado.", tatica:"Leitura e comunicação, e acelera o treino de mapas.", descanso:"Sem evolução. Recupera moral e forma." };
    body = '<div class="card"><h3>Foco da semana</h3><p class="muted">Vale até você mudar. Jovens evoluem mais rápido. Técnico nível ' + VM.staffLvl(t, "tecnico") + " multiplica a evolução por " + (0.7 + 0.15 * VM.staffLvl(t, "tecnico")).toFixed(2) + ".</p>" +
      '<div class="focus">' + Object.keys(VM.TREINOS).map(function (k) {
        return '<button class="fc ' + (s.treino === k ? "on" : "") + '" data-a="treino" data-v="' + k + '"><strong>' + VM.TREINOS[k].nome + "</strong><small>" + focos[k] + "</small></button>";
      }).join("") + "</div></div>";
  }
  return tabs + body;
};

/* ---------------------------------------------------------------------
   Táticas
   --------------------------------------------------------------------- */
var RITMO = [["rapido", "Rápido"], ["medio", "Médio"], ["lento", "Lento"]];
var ROT = [["rapida", "Rápida"], ["media", "Média"], ["lenta", "Lenta"]];
var ECO = [["igual", "Mesmo plano"], ["rush", "Rush"], ["padrao", "Padrão"], ["exec", "Execução"]];
var TAC_DICA = {
  padrao:"Seguro: não ganha muito nem perde muito contra nenhuma defesa.",
  exec:"Forte contra stack no outro site e defesa agressiva. Fraco se a defesa empilhar no site escolhido.",
  split:"Equilibrado. Sofre menos que exec se a defesa empilhar.",
  rush:"Pune stack no outro site, mas morre contra stack no site e contra defesa agressiva.",
  fake:"Excelente se a defesa empilhar no site do fake. Rotação rápida da defesa ajuda o fake.",
  lurk:"Bom contra defesa agressiva, ruim contra quem cede e retoma.",
  stack:"Aposta num site. Destrói exec/rush lá, mas é punido se o ataque for no outro.",
  agressivo:"Pega espaço cedo. Bom contra rush e lurk, ruim contra exec.",
  retake:"Cede o site e retoma. Bom contra exec, fraco contra lurk."
};
function chipGroup(label, key, cur, opts) {
  return '<div class="cgroup"><label>' + label + '</label><div class="cchips">' + opts.map(function (o) {
    return '<button class="cchip ' + (cur === o[0] ? "on" : "") + '" data-a="tac" data-k="' + key + '" data-v="' + o[0] + '">' + o[1] + "</button>";
  }).join("") + "</div></div>";
}
function tacticPreview(map, tac, side) {
  var sites = VM.SITES[map] || ["A", "B"];
  var L = ART.layout(map, sites), svg = ART.mapSVG(map, sites), marks = [];
  function poly(pts, cls) { return '<polyline points="' + pts.map(function (p) { return p.x + "," + p.y; }).join(" ") + '" class="' + cls + '"/>'; }
  if (side === "atk") {
    var a = tac.atk, targets = a.site === "variar" ? sites : [a.site];
    targets.forEach(function (sk) {
      if (a.plano === "split") { marks.push(poly(L.routes[sk], "rt atk")); marks.push(poly(L.routes[sk + "_mid"], "rt atk")); }
      else if (a.plano === "lurk") { marks.push(poly(L.routes[sk], "rt atk")); var o = sites.filter(function (x) { return x !== sk; })[0]; if (o) marks.push(poly(L.routes[o].slice(0, 3), "rt lurk")); }
      else if (a.plano === "fake") { var o2 = sites.filter(function (x) { return x !== sk; })[0]; if (o2) marks.push(poly(L.routes[o2].slice(0, 3), "rt lurk")); marks.push(poly(L.routes[sk + "_mid"], "rt atk")); }
      else if (a.plano === "padrao") { marks.push(poly(L.routes[sk + "_mid"], "rt atk thin")); }
      else marks.push(poly(L.routes[sk], "rt atk" + (a.plano === "rush" ? " fast" : "")));
    });
    if (a.plano === "padrao") sites.forEach(function (sk) { marks.push(poly(L.routes[sk].slice(0, 3), "rt atk thin")); });
  } else {
    var d = tac.def;
    var pos = [];
    if (d.setup === "stack") { pos = L.defPos[d.site].concat([{ x:L.sites[d.site].x, y:L.sites[d.site].y + 40 }]); pos.push(L.midPos[0]); }
    else if (d.setup === "agressivo") { sites.forEach(function (sk) { pos.push(L.routes[sk][2]); }); pos.push(L.mid); pos.push(L.midPos[1]); }
    else if (d.setup === "retake") { sites.forEach(function (sk) { pos.push({ x:(L.def.x + L.sites[sk].x) / 2, y:L.sites[sk].y - 90 }); }); pos.push(L.def); pos.push(L.midPos[0]); }
    else { sites.forEach(function (sk, i) { pos.push(L.defPos[sk][0]); if (i < 2 || sites.length === 2) pos.push(L.defPos[sk][1]); }); pos.push(L.midPos[0]); }
    pos.slice(0, 5).forEach(function (p) { marks.push('<circle cx="' + p.x + '" cy="' + p.y + '" r="16" class="dp"/>'); });
  }
  return svg.replace('<g id="marks"></g>', '<g id="marks">' + marks.join("") + "</g>");
}
VIEWS.taticas = function () {
  var t = me(), s = S();
  VM.ensureTactics(t);
  if (!UI.tacMap || s.mapas.indexOf(UI.tacMap) < 0) UI.tacMap = s.mapas[0];
  var map = UI.tacMap, tac = t.taticas[map], sites = VM.SITES[map] || ["A", "B"];
  var maps = '<div class="mapstrip">' + s.mapas.map(function (m) {
    return '<button class="mstrip ' + (m === map ? "on" : "") + '" data-a="tacMap" data-v="' + m + '" style="background:' + ART.mapCard(m) + '">' + m + "<small>" + Math.round(t.mapProf[m]) + "</small></button>";
  }).join("") + "</div>";
  var form;
  if (UI.tacSide === "atk") {
    form = chipGroup("Plano de ataque", "atk.plano", tac.atk.plano, Object.keys(VM.ATK_PLANOS).map(function (k) { return [k, VM.ATK_PLANOS[k]]; })) +
      chipGroup("Site alvo", "atk.site", tac.atk.site, [["variar", "Variar"]].concat(sites.map(function (x) { return [x, "Site " + x]; }))) +
      chipGroup("Ritmo", "atk.ritmo", tac.atk.ritmo, RITMO) +
      chipGroup("Em round de eco", "atk.eco", tac.atk.eco, ECO) +
      '<p class="tip">' + esc(TAC_DICA[tac.atk.plano] || "") + "</p>";
  } else {
    form = chipGroup("Setup de defesa", "def.setup", tac.def.setup, Object.keys(VM.DEF_SETUPS).map(function (k) { return [k, VM.DEF_SETUPS[k]]; })) +
      chipGroup(tac.def.setup === "stack" ? "Site do stack" : "Site de referência", "def.site", tac.def.site, sites.map(function (x) { return [x, "Site " + x]; })) +
      chipGroup("Rotação", "def.rotacao", tac.def.rotacao, ROT) +
      '<p class="tip">' + esc(TAC_DICA[tac.def.setup] || "Seguro: 2-1-2 e rotação conforme a info.") + "</p>";
  }
  return maps + '<div class="tacgrid"><div class="card"><div class="head"><h3>' + esc(map) + "</h3>" + seg("tacSide", UI.tacSide, [["atk", "Ataque"], ["def", "Defesa"]]) + "</div>" + form +
    '<div class="row"><button class="btn sm ghost" data-a="tacReset">Voltar ao padrão</button></div><p class="muted">A tática vale em todo jogo seu neste mapa. Dá pra trocar durante a partida também. A IA adversária lê o seu padrão: se você sempre vai no mesmo site, ela empilha.</p></div>' +
    '<div class="card tacmap">' + tacticPreview(map, tac, UI.tacSide) + "</div></div>";
};

/* ---------------------------------------------------------------------
   Mercado
   --------------------------------------------------------------------- */
VIEWS.mercado = function () {
  var s = S(), open = VM.marketOpen();
  var banner = open ? '<div class="banner ok">Janela <strong>aberta</strong> — fecha quando o primeiro dia da fase for jogado.</div>'
    : '<div class="banner">Janela <strong>fechada</strong>. Abre no início da próxima fase e na pré-temporada.</div>';
  var abas = seg("mAba", UI.mercadoAba, [["jogadores", "Jogadores"], ["livres", "Agentes livres (" + s.freeAgents.length + ")"], ["observados", "Observados (" + Object.keys(s.scout || {}).length + ")"]]);
  var filtros = '<div class="filters"><input id="busca" placeholder="Buscar jogador ou time" value="' + esc(UI.busca) + '" data-in="busca">' +
    (UI.mercadoAba === "jogadores" ? '<select data-c="mLiga"><option value="todas">Todas as ligas</option>' + LIGAS.map(function (l) {
      return '<option value="' + l + '" ' + (UI.mercadoLiga === l ? "selected" : "") + ">" + esc(s.ligasNome[l]) + "</option>"; }).join("") + "</select>" : "") +
    '<select data-c="mRole"><option value="todas">Todas as funções</option>' + ["D", "I", "C", "S", "F"].map(function (r) {
      return '<option value="' + r + '" ' + (UI.mercadoRole === r ? "selected" : "") + ">" + VM.ROLE_NAME[r] + "</option>"; }).join("") + "</select>" +
    '<span class="muted">Observações: ' + (s.scoutUsados || 0) + "/" + VM.scoutLimit() + "</span></div>";
  var q = UI.busca.trim().toLowerCase();
  var list = Object.keys(s.players).map(VM.P).filter(function (p) {
    if (UI.mercadoAba === "livres") { if (s.freeAgents.indexOf(p.id) < 0) return false; }
    else if (UI.mercadoAba === "observados") { if (!s.scout[p.id]) return false; }
    else { if (!p.teamId || p.teamId === s.userTeam) return false; var t = VM.T(p.teamId); if (t.desafiante) return false; if (UI.mercadoLiga !== "todas" && t.liga !== UI.mercadoLiga) return false; }
    if (UI.mercadoRole !== "todas" && p.role !== UI.mercadoRole) return false;
    if (q) { var tt = p.teamId ? VM.T(p.teamId) : null; if (p.nick.toLowerCase().indexOf(q) < 0 && !(tt && (tt.nome.toLowerCase().indexOf(q) >= 0 || tt.tag.toLowerCase() === q))) return false; }
    return true;
  }).sort(function (a, b) { return VM.ovr(b) - VM.ovr(a); });
  var total = list.length; list = list.slice(0, 60);
  var rows = list.map(function (p) {
    var known = VM.isScouted(p.id);
    var st = VM.playerStars(p);
    return '<tr><td><button class="plink" data-a="perfil" data-v="' + p.id + '">' + face(p, "sm") + "<span><strong>" + esc(p.nick) + "</strong><small>" + esc(p.nat) + " · " + p.age + " anos</small></span></button></td>" +
      "<td>" + (p.teamId ? teamChip(p.teamId) : '<span class="muted">livre</span>') + "</td><td>" + roleTag(p.role) + "</td>" +
      "<td>" + ART.stars(known ? st : Math.round(st)) + "</td><td>" + (known ? ART.stars(VM.potStars(p)) : '<span class="muted">?</span>') + '</td><td class="num">' + money(p.salary) + '</td><td class="num">' + (p.teamId ? money(VM.valueFor(p)) : "luvas " + money(Math.round(p.salary * 0.25 / 1000) * 1000)) + "</td>" +
      '<td class="acts">' + (known ? "" : '<button class="btn sm ghost" data-a="observar" data-v="' + p.id + '">Observar</button>') +
      (p.teamId ? '<button class="btn sm primary" data-a="perfilContrato" data-v="' + p.id + '" ' + (open ? "" : "disabled") + ">Ofertar</button>" : '<button class="btn sm primary" data-a="assinar" data-v="' + p.id + '" ' + (open ? "" : "disabled") + ">Contratar</button>") + "</td></tr>";
  }).join("");
  return '<div class="card"><div class="head"><div><h2>Mercado</h2><p class="muted">Caixa ' + money(me().cash) + " · elenco " + me().roster.length + "/7 · sem observar, você só vê as estrelas aproximadas</p></div></div>" + banner + abas + filtros +
    '<div class="tblwrap"><table class="market"><thead><tr><th>Jogador</th><th>Time</th><th>Função</th><th>Habilidade</th><th>Potencial</th><th class="num">Salário</th><th class="num">Valor</th><th></th></tr></thead><tbody>' +
    (rows || '<tr><td colspan="8" class="muted">Ninguém com esses filtros.</td></tr>') + "</tbody></table></div>" +
    (total > 60 ? '<p class="muted">Mostrando 60 de ' + total + ". Use os filtros.</p>" : "") + "</div>";
};

/* ---------------------------------------------------------------------
   Competições
   --------------------------------------------------------------------- */
VIEWS.competicoes = function () {
  var s = S();
  var abas = seg("cAba", UI.compAba, [["atual", "Fase atual"], ["cp", "Pontos (CP)"], ["formato", "Formato"], ["hist", "Campeões"]]);
  var body = "";
  if (UI.compAba === "atual") {
    if (!s.eventos.length) body = '<div class="card"><p class="muted">Pré-temporada: nenhuma competição rolando.</p></div>';
    var mine = userEvent();
    var evs = s.eventos.slice().sort(function (a, b) { return (b === mine) - (a === mine); });
    body += evs.map(function (ev) {
      return '<div class="card"><div class="head"><h3>' + esc(ev.nome) + "</h3>" + (ev.done ? '<span class="chip ok">encerrado</span>' : '<span class="chip">' + esc(ev.stages[ev.si].label || "") + "</span>") + "</div>" +
        ev.stages.map(function (st) { return (ev.stages.length > 1 ? '<div class="k">' + esc(st.label || "") + "</div>" : "") + stageHtml(st, false); }).join("") + "</div>";
    }).join("");
  } else if (UI.compAba === "cp") {
    body = '<div class="grid2">' + ["AMER", "EMEA", "PAC", "CN"].map(function (lg) {
      var ids = Object.keys(s.teams).filter(function (id) { return s.teams[id].liga === lg; }).sort(function (a, b) { return (s.cp[b] || 0) - (s.cp[a] || 0); });
      return '<div class="card"><h3>' + esc(s.ligasNome[lg]) + '</h3><table><thead><tr><th>#</th><th>Time</th><th class="num">CP</th></tr></thead><tbody>' +
        ids.map(function (id, i) { return '<tr class="' + (id === s.userTeam ? "you" : "") + '"><td class="num">' + (i + 1) + "</td><td>" + teamChip(id, true) + '</td><td class="num">' + (s.cp[id] || 0) + "</td></tr>"; }).join("") + "</tbody></table></div>";
    }).join("") + '</div><p class="muted">Campeão e vice do Stage 2 vão direto pro Champions. As outras duas vagas de cada liga saem por CP.</p>';
  } else if (UI.compAba === "formato") {
    body = '<div class="card fmt"><ol>' +
      "<li><strong>Kickoff</strong> — 2 grupos de 6 (Bo3) e final four em dupla eliminação. Top 3 ao Masters Santiago. <em>Simplificado: o real é tripla eliminação.</em></li>" +
      "<li><strong>Masters Santiago</strong> — 12 times. Campeões de liga direto aos playoffs; os outros 8 na fase suíça. Playoffs em dupla eliminação, finais Bo5.</li>" +
      "<li><strong>Stage 1</strong> — 2 grupos de 6, Bo3 (+1 CP por vitória). Top 4 de cada grupo aos playoffs. Top 3 ao Masters London. Challengers Stage 1 em paralelo.</li>" +
      "<li><strong>Masters London</strong> — mesmo formato. Challengers Stage 2 em paralelo define quem vai aos Play-Ins.</li>" +
      "<li><strong>Stage 2</strong> — 1º e 2º de cada grupo direto aos playoffs; 3º a 6º vão aos Play-Ins com 4 times do Challengers (Americas: campeões de NA, Brasil e LATAM + melhor vice; outras regiões: top 4 do Challengers). <em>Play-Ins simplificados em 4 grupos de 3.</em></li>" +
      "<li><strong>Champions</strong> — 16 times: 4 grupos GSL e playoffs de 8 em dupla eliminação.</li>" +
      "<li><strong>Pré-temporada</strong> — evolução, contratos, janela aberta.</li></ol></div>";
  } else {
    var h = s.historico.slice().reverse();
    body = '<div class="card">' + (h.length ? '<table><thead><tr><th>Temp.</th><th>Evento</th><th>Campeão</th><th>Vice</th></tr></thead><tbody>' + h.map(function (x) {
      return '<tr><td class="num">' + x.temporada + "</td><td>" + esc(x.evento) + "</td><td>" + teamChip(x.campeao, true) + "</td><td>" + (x.vice ? teamChip(x.vice, true) : "—") + "</td></tr>";
    }).join("") + "</tbody></table>" : '<p class="muted">Nenhum título decidido ainda.</p>') +
      (s.conquistas.length ? "<h3>Suas conquistas</h3><ul>" + s.conquistas.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul>" : "") + "</div>";
  }
  return abas + body;
};

/* ---------------------------------------------------------------------
   Estatísticas
   --------------------------------------------------------------------- */
VIEWS.estatisticas = function () {
  var s = S(), t = me();
  var ps = Object.keys(s.players).map(VM.P).filter(function (p) {
    if (!p.stats || !p.stats.mapas || !p.teamId) return false;
    if (UI.statLiga === "minha") return VM.T(p.teamId).liga === t.liga;
    if (UI.statLiga === "time") return p.teamId === t.id;
    return true;
  });
  function acs(p) { return p.stats.acsSum / p.stats.mapas; }
  ps.sort(function (a, b) { return acs(b) - acs(a); });
  var rows = ps.slice(0, 40).map(function (p, i) {
    var st = p.stats;
    return '<tr class="' + (p.teamId === t.id ? "you" : "") + '"><td class="num">' + (i + 1) + '</td><td><button class="plink" data-a="perfil" data-v="' + p.id + '">' + face(p, "xs") + "<strong>" + esc(p.nick) + "</strong></button></td><td>" + teamChip(p.teamId) + "</td><td>" + roleTag(p.role) + '</td><td class="num">' + st.mapas + '</td><td class="num">' + st.k + '</td><td class="num">' + st.d + '</td><td class="num">' + (st.d ? (st.k / st.d).toFixed(2) : "—") + '</td><td class="num big">' + Math.round(acs(p)) + "</td></tr>";
  }).join("");
  return '<div class="card"><div class="head"><h2>Líderes da temporada</h2>' + seg("statLiga", UI.statLiga, [["time", "Meu time"], ["minha", "Minha liga"], ["todas", "Todas"]], "sm") + "</div>" +
    '<div class="tblwrap"><table class="lb"><thead><tr><th>#</th><th>Jogador</th><th>Time</th><th>Função</th><th class="num">Mapas</th><th class="num">K</th><th class="num">D</th><th class="num">K/D</th><th class="num">ACS</th></tr></thead><tbody>' +
    (rows || '<tr><td colspan="9" class="muted">Ninguém jogou ainda nesta temporada.</td></tr>') + "</tbody></table></div></div>";
};

/* ---------------------------------------------------------------------
   Finanças
   --------------------------------------------------------------------- */
VIEWS.financas = function () {
  var t = me();
  var jog = t.roster.reduce(function (a, id) { return a + VM.P(id).salary; }, 0), stf = VM.staffPayroll(t);
  var income = VM.incomeFor(t);
  var fase = Math.round((jog + stf) / 7);
  var saldo = income - fase;
  return '<div class="grid3"><div class="card kpi"><small>Caixa</small><b class="' + (t.cash < 0 ? "neg" : "") + '">' + money(t.cash) + '</b></div><div class="card kpi"><small>Receita por fase</small><b class="pos">' + money(income) + '</b></div><div class="card kpi"><small>Saldo por fase</small><b class="' + (saldo < 0 ? "neg" : "pos") + '">' + money(saldo) + "</b></div></div>" +
    '<div class="grid2"><div class="card"><h3>Folha salarial</h3><dl class="kv"><dt>Jogadores</dt><dd>' + money(jog) + "/ano</dd><dt>Staff</dt><dd>" + money(stf) + "/ano</dd><dt>Custo por fase</dt><dd>" + money(fase) + "</dd></dl>" +
    '<p class="muted">Folha e receita entram a cada troca de fase (7 por temporada). Premiações entram ao fim de cada evento. Valores do jogo, não reais.</p></div>' +
    '<div class="card"><h3>Maiores salários</h3><table><tbody>' + t.roster.map(VM.P).sort(function (a, b) { return b.salary - a.salary; }).map(function (p) {
      return '<tr><td><span class="plink">' + face(p, "xs") + "<strong>" + esc(p.nick) + '</strong></span></td><td class="num">' + money(p.salary) + '</td><td class="num muted">' + p.contract + " temp.</td></tr>";
    }).join("") + "</tbody></table></div></div>";
};

/* ---------------------------------------------------------------------
   Configurações
   --------------------------------------------------------------------- */
VIEWS.config = function () {
  var A = window.SFX ? window.SFX.cfg : { sfx:false, music:false, vol:.6 };
  var som = '<div class="card"><h3>Som</h3><div class="row"><button class="btn ' + (A.sfx ? "primary" : "ghost") + '" data-a="audioSfx">Efeitos: ' + (A.sfx ? "ligados" : "desligados") + '</button><button class="btn ' + (A.music ? "primary" : "ghost") + '" data-a="audioMusic">Música do menu: ' + (A.music ? "ligada" : "desligada") + '</button></div><label class="nf"><span>Volume <b>' + Math.round(A.vol * 100) + '%</b></span><input type="range" min="0" max="1" step="0.05" value="' + A.vol + '" data-c="audioVol"></label><p class="muted">Tiros, spike, explosão e cliques são gerados pelo navegador. Na velocidade Turbo os efeitos da partida ficam mudos.</p></div>';
  return som + '<div class="grid2"><div class="card"><h3>Save</h3><p class="muted">O jogo salva sozinho neste navegador depois de cada dia. Pra backup ou levar pra outro PC, exporte o texto e guarde num arquivo.</p>' +
    '<div class="row"><button class="btn" data-a="exportar">Exportar save</button><button class="btn ghost" data-a="importar">Importar save</button></div>' +
    '<textarea id="saveBox" rows="4" placeholder="O save aparece aqui ao exportar. Pra importar, cole aqui e clique em Importar."></textarea></div>' +
    '<div class="card"><h3>Trocar de time / recomeçar</h3><p class="muted">Apaga a carreira atual e volta pra escolha de time.</p>' +
    '<button class="btn danger" data-a="novoJogo">' + (UI.confirmNovo ? "Clique de novo pra confirmar" : "Trocar de time") + "</button>" +
    '<h3 style="margin-top:18px">Fotos e escudos</h3><p class="muted">Os rostos e escudos são ilustrações geradas. Se quiser usar imagens suas, coloque na pasta do jogo:</p>' +
    '<ul class="muted"><li><code>fotos/NICK.png</code> — jogador (ex.: fotos/aspas.png)</li><li><code>fotos/staff/NOME.png</code> — staff</li><li><code>escudos/TAG.png</code> — time (ex.: escudos/LOUD.png)</li></ul></div></div>';
};

/* ---------------------------------------------------------------------
   Simulação em lote
   --------------------------------------------------------------------- */
function simUntilMatch(max) {
  var n = 0;
  while (n < (max || 300) && !VM.phaseOver()) {
    if (VM.userMatchToday()) break;
    playDay(); n++;
  }
  persist();
}

/* ---------------------------------------------------------------------
   Ações
   --------------------------------------------------------------------- */
function confirmTwice(flag, fn) {
  if (!UI[flag]) { UI[flag] = true; render(); clearTimeout(UI.cfT); UI.cfT = setTimeout(function () { UI[flag] = false; render(); }, 4000); return; }
  clearTimeout(UI.cfT); UI[flag] = false; fn();
}
ACT.ligaSel = function (v) { UI.ligaSel = v; UI.teamSel = null; render(); };
ACT.teamSel = function (v) { UI.teamSel = v; render(); };
ACT.continuar = function () { if (VM.load()) go("inicio"); else toast("Não consegui ler o save.", false); };
ACT.apagarSave = function () { confirmTwice("confirmApagar", function () { VM.wipe(); toast("Save apagado."); }); };
ACT.escolher = function (v) {
  VM.newWorld(window.VALDB, (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0);
  VM.S.userTeam = v; VM.S.diaFase = 0; VM.S.lidas = 0;
  VM.news("Você assumiu a " + VM.T(v).nome + ". A diretoria espera briga por título na temporada " + VM.S.temporada + ".", "titulo");
  persist(); go("inicio");
};
ACT.nav = function (v) { UI.confirmNovo = false; go(v); };
ACT.navBack = function () { if (UI.hi > 0) { UI.hi--; go(UI.hist[UI.hi], null, true); } };
ACT.navFwd = function () { if (UI.hist && UI.hi < UI.hist.length - 1) { UI.hi++; go(UI.hist[UI.hi], null, true); } };
ACT.voltar = function () { go(UI.backTo || "elenco"); };
ACT.perfil = function (v) { UI.backTo = UI.view === "perfil" ? UI.backTo : UI.view; UI.perfilAba = "atributos"; go("perfil", { perfil:v }); };
ACT.perfilContrato = function (v) { UI.backTo = UI.view; UI.perfilAba = "contrato"; go("perfil", { perfil:v }); };
ACT.perfilAba = function (v) { UI.perfilAba = v; render(); };
ACT.avancar = function () { playDay(); persist(); render(); };
ACT.ateMeuJogo = function () { simUntilMatch(300); render(); };
ACT.simUser = function () { playDay(); persist(); toast("Partida simulada. Veja o resultado em Início."); };
ACT.proxFase = function () { nextPhase(); persist(); go("inicio"); };
ACT.irPartida = function () { var m = VM.userMatchToday(); if (m && window.MATCH) { window.MATCH.start(m); UI.scrollTop = 0; render(); } };
ACT.taticasRapido = function () { go("taticas"); };
ACT.mailSel = function (v) { UI.mailSel = +v; render(); };
ACT.elencoModo = function (v) { UI.elencoModo = v; render(); };
ACT.titular = function (pid) {
  var t = me(), five = VM.activeFive(t).map(function (p) { return p.id; });
  if (five.indexOf(pid) >= 0) {
    if (t.roster.length <= 5) { toast("Você só tem 5 jogadores — todos são titulares.", false); return; }
    UI.swapOut = pid; toast("Agora clique em um reserva pra entrar no lugar de " + VM.P(pid).nick + "."); return;
  }
  var out = UI.swapOut && five.indexOf(UI.swapOut) >= 0 ? UI.swapOut : five[five.length - 1];
  five[five.indexOf(out)] = pid; t.lineup = five; UI.swapOut = null;
  persist(); toast(VM.P(pid).nick + " entra no lugar de " + VM.P(out).nick + ".");
};
ACT.renovar = function (v) { UI.backTo = UI.view; UI.perfilAba = "contrato"; go("perfil", { perfil:v }); };
ACT.liberar = function (v) { var r = VM.releaseUser(v); persist(); if (r.ok && UI.view === "perfil") UI.view = "elenco"; toast(r.msg, r.ok); };
ACT.vender = function (v) { UI.venda[v] = VM.sellOffer(v) || "nada"; render(); };
ACT.aceitarVenda = function (v) { var r = VM.sellPlayer(v, UI.venda[v]); delete UI.venda[v]; persist(); if (r.ok) UI.view = "elenco"; toast(r.msg, r.ok); };
ACT.recusarVenda = function (v) { delete UI.venda[v]; render(); };
ACT.observar = function (v) { var r = VM.observe(v); persist(); toast(r.msg, r.ok); };
ACT.ofertar = function (v) {
  var inp = document.getElementById("of-" + v); var val = Math.max(0, Math.round(+(inp && inp.value) || 0));
  UI.ofertas[v] = val; var r = VM.buyPlayer(v, val); persist(); toast(r.msg, r.ok);
};
ACT.assinar = function (v) { var r = VM.signFree(v); persist(); toast(r.msg, r.ok); };
ACT.mAba = function (v) { UI.mercadoAba = v; render(); };
ACT.cAba = function (v) { UI.compAba = v; render(); };
ACT.statLiga = function (v) { UI.statLiga = v; render(); };
ACT.staffRole = function (v) { UI.staffRole = v; render(); };
ACT.contratarStaff = function (v) { var r = VM.hireStaff(v); persist(); toast(r.msg, r.ok); };
ACT.demitir = function (v) { var r = VM.fireStaff(v); persist(); toast(r.msg, r.ok); };
ACT.treinoAba = function (v) { UI.treinoAba = v; render(); };
ACT.treino = function (v) { S().treino = v; persist(); render(); };
ACT.treinoMapa = function (v) {
  var tm = S().treinoMapas = (S().treinoMapas || []).slice(), i = tm.indexOf(v);
  if (i >= 0) { if (tm.length <= 1) { toast("Deixe pelo menos 1 mapa no treino.", false); return; } tm.splice(i, 1); }
  else { if (tm.length >= 3) tm.shift(); tm.push(v); }
  persist(); render();
};
ACT.tacMap = function (v) { UI.tacMap = v; render(); };
ACT.tacSide = function (v) { UI.tacSide = v; render(); };
ACT.tac = function (v, el) {
  var k = el.getAttribute("data-k").split("."), tac = me().taticas[UI.tacMap];
  tac[k[0]][k[1]] = v; persist(); render();
};
ACT.tacReset = function () { me().taticas[UI.tacMap] = VM.defaultTactic(UI.tacMap); persist(); render(); };
ACT.exportar = function () { var b = document.getElementById("saveBox"); b.value = VM.exportSave(); b.select(); toast("Save na caixa. Copie e guarde num arquivo."); };
ACT.importar = function () {
  var txt = document.getElementById("saveBox").value.trim();
  try { VM.importSave(txt); persist(); UI.view = "inicio"; toast("Save importado."); } catch (err) { toast("Esse texto não é um save válido.", false); }
};
ACT.novoJogo = function () {
  confirmTwice("confirmNovo", function () {
    VM.wipe(); if (window.MATCH && window.MATCH.reset) window.MATCH.reset(); if (window.INTRO) window.INTRO.reset();
    UI.view = "inicio"; UI.teamSel = null; render();
  });
};
/* change / input */
ACT.audioSfx = function () { if (window.SFX) window.SFX.set("sfx", !window.SFX.cfg.sfx); render(); };
ACT.audioMusic = function () { if (window.SFX) window.SFX.set("music", !window.SFX.cfg.music); render(); };
ACT.audioVol = function (v) { if (window.SFX) { window.SFX.set("vol", +v); window.SFX.play("cash"); } render(); };
ACT.mLiga = function (v) { UI.mercadoLiga = v; render(); };
ACT.mRole = function (v) { UI.mercadoRole = v; render(); };

root.addEventListener("click", function (e) {
  var el = e.target.closest("[data-a]"); if (!el || el.disabled || el.tagName === "SELECT" || el.tagName === "INPUT") return;
  var a = el.getAttribute("data-a"), f = ACT[a];
  if (f) f(el.getAttribute("data-v"), el);
});
root.addEventListener("change", function (e) {
  var el = e.target, c = el.getAttribute("data-c");
  if (c && ACT[c]) ACT[c](el.value, el);
});
root.addEventListener("input", function (e) {
  var el = e.target;
  if (el.getAttribute("data-in") === "busca") {
    UI.busca = el.value; var pos = el.selectionStart; render();
    var n = document.getElementById("busca"); if (n) { n.focus(); n.setSelectionRange(pos, pos); }
  }
});

window.GUI = { tacticPreview:tacticPreview, gameDateParts:gameDateParts, icon:icon, stageHasTeam:stageHasTeam, userEvent:userEvent, formLevel:formLevel, to20:to20, UI:UI, ACT:ACT, VIEWS:VIEWS, render:render, go:go, toast:toast, persist:persist, esc:esc, face:face, staffFace:staffFace,
  crest:crest, teamChip:teamChip, teamName:teamName, roleTag:roleTag, avgOvr:avgOvr, pct:pct, stageHtml:stageHtml, me:me, seg:seg,
  bar:bar, playDay:playDay, chipGroup:chipGroup, RITMO:RITMO, ROT:ROT, TAC_DICA:TAC_DICA, money:money };
document.addEventListener("DOMContentLoaded", render);
if (document.readyState !== "loading") setTimeout(render, 0);
})();
