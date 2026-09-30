/* =====================================================================
   VCT MANAGER — telas no estilo "manager": Início, E-mail, Estratégias,
   Transferências, QG, Patrocinadores e Finanças.
   ===================================================================== */
(function () {
"use strict";
var VM = window.VM, ART = window.ART, G = window.GUI, ACT = G.ACT, VIEWS = G.VIEWS, UI = G.UI;
var esc = G.esc, money = G.money;
function S() { return VM.S; }
function me() { return G.me(); }
function sec(t, extra) { return '<h3 class="sec2"><i>»</i> ' + t + (extra || "") + "</h3>"; }
function h32(s) { var h = 2166136261 >>> 0; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function dateOf(o) { return G.gameDateParts(o.fase, o.dia, o.temp); }

/* ---------------------------------------------------------------------
   Arte extra: medalhas de torneio, logos de patrocinador, camisa, ícones
   --------------------------------------------------------------------- */
var EV_STYLE = { KICKOFF:["KO", "#8A93A6"], SANTIAGO:["M", "#C9CED8"], STAGE1:["S1", "#8A93A6"], LONDON:["M", "#C9CED8"], STAGE2:["S2", "#8A93A6"], CHAMPIONS:["C", "#F2C75C"], CHAL:["CH", "#3FD1B8"] };
function eventBadge(key, size) {
  var st = EV_STYLE[key] || EV_STYLE.STAGE1, id = "eb" + key;
  return '<svg viewBox="0 0 64 64" class="evb" width="' + (size || 44) + '" height="' + (size || 44) + '" aria-hidden="true"><defs><radialGradient id="' + id + '" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".35" stop-color="' + st[1] + '"/><stop offset="1" stop-color="#1b1f2a"/></radialGradient></defs>' +
    '<circle cx="32" cy="32" r="30" fill="url(#' + id + ')" stroke="' + st[1] + '" stroke-width="2"/><circle cx="32" cy="32" r="23" fill="#12151d" stroke="rgba(255,255,255,.25)"/>' +
    '<text x="32" y="' + (st[0].length > 1 ? 38 : 40) + '" text-anchor="middle" font-family="Saira Condensed,sans-serif" font-weight="800" font-style="italic" font-size="' + (st[0].length > 1 ? 18 : 24) + '" fill="' + st[1] + '">' + st[0] + "</text></svg>";
}
function sponsorLogo(sp, size) {
  var h = h32(sp.id), hue = h % 360, shape = h % 4;
  var col = "hsl(" + hue + ",70%,58%)";
  var glyph = shape === 0 ? '<circle cx="20" cy="20" r="11" fill="none" stroke="' + col + '" stroke-width="5"/>' :
    shape === 1 ? '<path d="M8 30 L20 8 L32 30Z" fill="' + col + '"/>' :
    shape === 2 ? '<rect x="9" y="9" width="22" height="22" rx="5" fill="none" stroke="' + col + '" stroke-width="5" transform="rotate(45 20 20)"/>' :
    '<path d="M8 22 Q20 2 32 22 Q20 38 8 22Z" fill="' + col + '"/>';
  return '<svg viewBox="0 0 40 40" width="' + (size || 44) + '" height="' + (size || 44) + '" class="splogo" aria-hidden="true"><rect width="40" height="40" rx="8" fill="#10131a"/>' + glyph + "</svg>";
}
function jersey(t, main, s1, s2) {
  var c = ART.teamColors(t.tag);
  var wm = main ? esc(main.nome.split(" ")[0].toUpperCase()) : "";
  function sleeve(sp, x) { return sp ? '<text x="' + x + '" y="92" text-anchor="middle" font-family="Barlow,sans-serif" font-weight="800" font-size="9" fill="' + c.c2 + '" transform="rotate(' + (x < 150 ? -28 : 28) + ' ' + x + ' 92)">' + esc(sp.nome.split(" ")[0].toUpperCase()) + "</text>" : ""; }
  return '<svg viewBox="0 0 300 300" class="jersey" aria-hidden="true"><defs><linearGradient id="jg" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".5" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient></defs>' +
    '<path d="M95 30 Q150 52 205 30 L262 62 L292 128 L246 146 L232 118 L232 282 Q150 296 68 282 L68 118 L54 146 L8 128 L38 62Z" fill="' + c.c1 + '"/>' +
    '<path d="M95 30 Q150 52 205 30 L262 62 L292 128 L246 146 L232 118 L232 282 Q150 296 68 282 L68 118 L54 146 L8 128 L38 62Z" fill="url(#jg)"/>' +
    '<path d="M118 34 Q150 58 182 34" fill="none" stroke="' + c.c2 + '" stroke-width="8"/>' +
    '<path d="M68 200 L232 170 L232 190 L68 220Z" fill="' + c.c2 + '" opacity=".35"/>' +
    '<g transform="translate(176 62) scale(.5)">' + ART.crest(t.tag).replace(/<span[^>]*>|<\/span>|<img[^>]*>/g, "").replace("<svg viewBox", '<svg width="100" height="100" viewBox') + "</g>" +
    (wm ? '<text x="150" y="160" text-anchor="middle" font-family="Saira Condensed,sans-serif" font-weight="800" font-style="italic" font-size="' + Math.max(22, 44 - wm.length * 2) + '" fill="#fff" stroke="rgba(0,0,0,.3)" stroke-width="1">' + wm + "</text>" : "") +
    sleeve(s1, 44) + sleeve(s2, 256) + "</svg>";
}
var QG_ICON = {
  bootcamp:"M3 20V9l9-5 9 5v11M8 20v-6h8v6",
  pc:"M7 3h10v18H7zM10 7h4M10 11h4",
  monitor:"M3 4h18v12H3zM9 20h6M12 16v4",
  mouse:"M12 3a6 6 0 0 1 6 6v6a6 6 0 0 1-12 0V9a6 6 0 0 1 6-6zM12 3v6",
  mousepad:"M3 7h18v10H3zM6 10h5",
  teclado:"M2 7h20v10H2zM5 10h1M8 10h1M11 10h1M14 10h1M17 10h1M6 14h12",
  fone:"M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v5H4zM17 15h3v5h-3z",
  cadeira:"M7 3h10v9H7zM5 12h14M12 12v6M8 21l4-3 4 3",
  mesa:"M2 9h20M5 9v11M19 9v11M8 9v5h8V9",
  bebida:"M8 3h8l-1 18H9zM8 8h8"
};
function qicon(k) { return '<svg viewBox="0 0 24 24" class="qico" aria-hidden="true"><path d="' + QG_ICON[k] + '"/></svg>'; }

/* ---------------------------------------------------------------------
   Datas das fases (pra "começa em N dias")
   --------------------------------------------------------------------- */
var FASE_INI = { KICKOFF:[0, 12], SANTIAGO:[2, 1], STAGE1:[3, 5], LONDON:[5, 7], STAGE2G:[6, 12], PLAYINS:[7, 16], STAGE2P:[7, 23], CHAMPIONS:[8, 13], OFF:[10, 15] };
function faseDate(id, temp) { var b = FASE_INI[id]; return Date.UTC(temp, b[0], b[1]); }
function nowDate() { var s = S(), b = FASE_INI[VM.FASES[s.fase].id]; return Date.UTC(s.temporada, b[0], b[1] + (s.diaFase || 0) * 2); }
var TIMELINE = [["KICKOFF", "Kickoff", ["KICKOFF"]], ["SANTIAGO", "Masters Santiago", ["SANTIAGO"]], ["STAGE1", "Stage 1", ["STAGE1"]], ["LONDON", "Masters London", ["LONDON"]], ["STAGE2", "Stage 2", ["STAGE2G", "PLAYINS", "STAGE2P"]], ["CHAMPIONS", "Champions", ["CHAMPIONS"]]];

/* ---------------------------------------------------------------------
   INÍCIO
   --------------------------------------------------------------------- */
VIEWS.inicio = function () {
  var s = S(), t = me(), fid = VM.FASES[s.fase].id, um = VM.userMatchToday(), ev = G.userEvent();
  var curIdx = TIMELINE.findIndex(function (x) { return x[2].indexOf(fid) >= 0; });
  if (fid === "OFF") curIdx = TIMELINE.length;
  var strip = TIMELINE.map(function (x, i) {
    return '<span class="tl ' + (i < curIdx ? "done" : i === curIdx ? "now" : "") + '" title="' + esc(x[1]) + '">' + eventBadge(x[0], i === curIdx ? 50 : 40) + "</span>";
  }).join('<i class="tlsep"></i>');
  var big = TIMELINE.filter(function (x, i) { return i > curIdx && (x[0] === "SANTIAGO" || x[0] === "LONDON" || x[0] === "CHAMPIONS"); })[0];
  var bigTxt = "";
  if (big) {
    var days = Math.max(0, Math.round((faseDate(big[2][0], s.temporada) - nowDate()) / 864e5));
    bigTxt = '<div class="bigev">' + eventBadge(big[0], 62) + "<div><strong>" + esc(big[1].toUpperCase()) + "</strong><small>Em " + (days > 45 ? Math.round(days / 30) + " mês(es)" : days + " dia(s)") + "</small></div></div>";
  } else if (curIdx < TIMELINE.length) bigTxt = '<div class="bigev">' + eventBadge(TIMELINE[curIdx][0], 62) + "<div><strong>" + esc(TIMELINE[curIdx][1].toUpperCase()) + "</strong><small>Em andamento</small></div></div>";
  var msg;
  if (VM.phaseOver()) msg = "<b>" + esc(VM.FASES[s.fase].nome) + "</b> terminou. Clique em <b>Próxima fase</b> para seguir.";
  else if (um) msg = "Dia de jogo! <b>" + esc(t.tag) + " × " + esc(VM.T(um.a === t.id ? um.b : um.a).tag) + "</b> pelo " + esc(um.evNome) + ". Vá para a partida.";
  else if (ev) msg = "Sem jogo hoje. <b>Avance</b> para continuar.";
  else msg = "Seu time não joga nesta fase. <b>Avance</b> até a próxima.";
  var top = '<div class="hstrip"><p class="hmsg">' + msg + '</p><div class="tlw">' + strip + "</div>" + bigTxt + "</div>";

  /* coluna 1 */
  var five = VM.activeFive(t);
  var inj = t.roster.map(VM.P).filter(function (p) { return p.lesao && p.lesao.dias > 0; });
  var tired = five.filter(function (p) { return (p.saude == null ? 100 : p.saude) < 70 && inj.indexOf(p) < 0; });
  var low = five.filter(function (p) { return p.morale < 50; });
  var cond = inj.length ? '<p class="cond bad">✚ Lesionados: ' + inj.map(function (p) { return esc(p.nick) + " (" + p.lesao.dias + " dias)"; }).join(", ") + "</p>" : "";
  cond += '<p class="cond ' + ((t.quimica == null ? 75 : t.quimica) < 60 ? "warn" : "ok") + '">Química do time: <b>' + Math.round(t.quimica == null ? 75 : t.quimica) + "%</b>" + ((t.quimica || 75) < 60 ? " — elenco ainda se entrosando" : "") + "</p>";
  cond += '<p class="cond">Torcida <b>' + Math.round(s.torcida || 0) + '%</b> · Hype <b>' + Math.round(s.hype || 0) + "%</b>" + ((s.hype || 0) > 75 ? " — expectativa alta: derrota agora pesa mais na moral" : "") + "</p>";
  cond += tired.length ? '<p class="cond warn">! ' + tired.map(function (p) { return esc(p.nick); }).join(", ") + (tired.length > 1 ? " estão cansados." : " está cansado.") + "</p>"
    : low.length ? '<p class="cond warn">! Moral baixa: ' + low.map(function (p) { return esc(p.nick); }).join(", ") + ".</p>" : '<p class="cond ok">! Todos os jogadores estão em <b>boa condição</b>!</p>';
  var elenco = '<div class="hsec"><div class="k">Elenco</div><div class="circles">' + five.map(function (p) {
    return '<button class="circ" data-a="perfil" data-v="' + p.id + '" title="' + esc(p.nick) + '">' + G.face(p, "md round") + "<small>" + esc(p.nick) + "</small></button>";
  }).join("") + "</div>" + cond + "</div>";
  var nextm = "";
  if (um) {
    var opp = um.a === t.id ? um.b : um.a, odds = VM.preMatchOdds(um.a, um.b, 50); if (um.a !== t.id) odds = 1 - odds;
    nextm = sec("Próxima partida") + '<div class="nextrow">' + G.crest(t.id, "lg") + '<div class="nx"><small>' + esc(um.evNome) + " · Bo" + um.bo + '</small><b>HOJE</b><span>' + G.pct(odds) + " por mapa</span></div>" + G.crest(opp, "lg") + '</div><div class="row center"><button class="btn primary" data-a="irPartida">Ir para a partida</button><button class="btn ghost" data-a="scrim" data-v="' + opp + '" ' + (s.scrimDia === VM.talkKey() ? "disabled" : "") + ">" + (VM.scrimReport(opp) ? "Scrim feito ✓" : "Fazer scrim") + '</button><button class="btn ghost" data-a="nav" data-v="taticas">Estratégias</button></div>' +
      '<p class="muted small">O scrim revela as tendências do adversário na preparação da partida (custa um pouco de saúde).</p>';
  }
  var evs = (s.noticias || []).slice(0, 4).map(function (n, i) {
    var r = remet(n);
    return '<button class="evrow" data-a="mailOpen" data-v="' + i + '">' + r.ico + "<span><b>" + esc(r.assunto) + "</b><small>" + esc(n.t) + "</small></span></button>";
  }).join("");
  var cf = s.board ? s.board.conf : 60;
  var obj = s.manager ? sec("Objetivo da diretoria") + '<p class="objtxt">' + esc(s.manager.objetivo || "") + '</p><button class="confbar" data-a="nav" data-v="diretoria"><span>Confiança do Conselho</span><i><b style="width:' + cf + "%;background:" + (window.CARREIRA ? window.CARREIRA.confColor(cf) : "var(--win)") + '"></b></i><em>' + cf + "%</em></button>" + ((s.propostas || []).length ? '<button class="evrow" data-a="nav" data-v="diretoria"><span class="mico">✉</span><span><b>' + s.propostas.length + " proposta(s) de outros clubes</b><small>Veja em Diretoria</small></span></button>" : "") : "";
  var col1 = elenco + nextm + sec("Eventos principais") + (evs || '<p class="muted">Nada ainda.</p>') + obj;

  /* coluna 2 */
  var prox = [];
  TIMELINE.forEach(function (x, i) {
    if (i < curIdx) return;
    var d = Math.round((faseDate(x[2][0], s.temporada) - nowDate()) / 864e5);
    var tier = x[0] === "CHAMPIONS" ? 5 : (x[0] === "SANTIAGO" || x[0] === "LONDON") ? 4 : 3;
    prox.push('<div class="trn">' + eventBadge(x[0], 52) + "<div><strong>" + esc(x[1].toUpperCase()) + "</strong>" + ART.stars(tier) + "<small>" + (i === curIdx ? "Em andamento" : "Começa em " + Math.max(0, d) + " dia(s)") + "</small></div></div>");
  });
  if (VM.isChal(t.liga)) prox.unshift('<div class="trn">' + eventBadge("CHAL", 52) + "<div><strong>" + esc(s.ligasNome[t.liga].toUpperCase()) + "</strong>" + ART.stars(2) + "<small>Sua liga · caminho pros Play-Ins</small></div></div>");
  var jogos = (s.meusJogos || []).filter(function (j) { return j.temp === s.temporada; }).slice(0, 5);
  var res = jogos.length ? jogos.map(function (j) {
    return '<div class="rrow ' + (j.won ? "w" : "l") + '">' + G.crest(t.id, "sm") + "<b>" + j.wa + " : " + j.wb + "</b>" + G.crest(j.opp, "sm") + "<span>" + esc(VM.T(j.opp).nome) + "<small>" + esc(j.ev) + " · " + esc(dateOf(j).short) + "</small></span></div>";
  }).join("") : '<p class="empty">SEM JOGOS RECENTES</p>';
  var col2 = sec("Próximos torneios") + prox.slice(0, 4).join("") + sec("Resultados recentes") + res;

  /* coluna 3: ranking */
  var elo = s.elo || {};
  var ids = Object.keys(s.teams).sort(function (a, b) { return (elo[b] || 0) - (elo[a] || 0); });
  var rk = ids.map(function (id, i) {
    var x = s.teams[id];
    return '<div class="rk' + (id === t.id ? " me" : "") + '"' + (id === t.id ? ' id="rkme"' : "") + '><span class="rn">#' + (i + 1) + "</span>" + G.crest(id, "xs") + "<b>" + esc(x.nome) + "</b><em>" + (elo[id] || 0) + "</em></div>";
  }).join("");
  var col3 = sec("Ranking global", ' <span class="hint" title="Pontuação tipo Elo: sobe ao vencer, mais ainda contra times fortes.">?</span>') + '<div class="rklist" id="rklist">' + rk + "</div>";
  return top + '<div class="hgrid"><div>' + col1 + "</div><div>" + col2 + "</div><div>" + col3 + "</div></div>";
};

/* ---------------------------------------------------------------------
   E-MAIL
   --------------------------------------------------------------------- */
function remet(n) {
  var s = S(), t = me(), txt = n.t;
  var r = { de:"Assessoria de imprensa", end:"imprensa · " + t.tag, ico:'<span class="mico">' + G.icon("M4 5h16v14H4zM8 9h8M8 13h5") + "</span>", assunto:"Informe" };
  if (n.tipo === "titulo") r = { de:"Liga", end:"comunicados · VCT", ico:'<span class="mico">' + eventBadge("CHAMPIONS", 30) + "</span>", assunto:"Comunicado oficial" };
  if (n.tipo === "bom" || n.tipo === "ruim") r = { de:"Conselho de Administração", end:"diretoria · " + t.tag, ico:'<span class="mico">' + G.crest(t.id, "sm") + "</span>", assunto:n.tipo === "bom" ? "Boas notícias" : "Atenção" };
  if (/assinou como manager/.test(txt)) return { de:"Conselho de Administração", end:"diretoria · " + t.tag, org:t.nome, ico:'<span class="mico">' + G.crest(t.id, "sm") + "</span>", assunto:"Bem-vindo!" };
  r.org = n.tipo === "titulo" ? "VCT" : t.nome;
  if (/^Mercado:/.test(txt)) { r.de = "Central de transferências"; r.end = "mercado · VCT"; r.org = "VCT"; r.assunto = "Mercado"; }
  if (/^Vitória|^Derrota/.test(txt)) r.assunto = "Resultado da partida";
  else if (/campeão/.test(txt)) r.assunto = "Resultado do torneio";
  else if (/Começa|começou/.test(txt)) r.assunto = "Calendário";
  else if (/contrat|vendido|liberado|assinou com|agente livre/i.test(txt)) r.assunto = "Movimentação no elenco";
  else if (/patrocínio/.test(txt)) r.assunto = "Patrocínio";
  else if (/terminou o/.test(txt)) r.assunto = "Balanço do torneio";
  return r;
}
function mailBody(n, r) {
  var s = S(), nome = s.manager ? (s.manager.nome || s.manager.nick) + " " + (s.manager.sobrenome || "") : "Manager";
  var body = esc(n.t);
  if (r.assunto === "Bem-vindo!") body = "O Conselho de Administração dá as boas-vindas a você! Os fãs estão esperando que você leve a equipe à glória. " + esc(n.t.split("Objetivo da diretoria:")[1] ? "Nosso objetivo para a temporada:" + n.t.split("Objetivo da diretoria:")[1] : "") + " Boa sorte!";
  return "<p>Prezado(a) <u>" + esc(nome.trim()) + "</u>,</p><p>" + body + "</p><p>Atenciosamente,<br><b>" + esc(r.de) + "</b><br><span class=\"lnk\">" + esc(r.org || me().nome) + "</span></p>";
}
VIEWS.caixa = function () {
  var s = S(), list = s.noticias || [];
  var q = (UI.mailBusca || "").toLowerCase();
  var idx = list.map(function (n, i) { return i; }).filter(function (i) { return !q || list[i].t.toLowerCase().indexOf(q) >= 0; });
  var sel = UI.mailSel != null && list[UI.mailSel] ? UI.mailSel : idx[0];
  if (sel != null && list[sel]) list[sel].lida = true;
  var unread = list.filter(function (n) { return !n.lida; }).length;
  var bar = '<div class="mailbar"><button class="on">Caixa de entrada <b>' + unread + '</b></button><button data-a="mailLerTudo">✓ Ler tudo</button><button data-a="mailExcluirTudo">🗑 ' + (UI.cfMail ? "Clique de novo" : "Excluir tudo") + '</button><span class="mcount">' + list.length + ' e-mail(s)</span><input id="mailBusca" data-in2="mailBusca" placeholder="Buscar" value="' + esc(UI.mailBusca || "") + '"></div>';
  if (!list.length) return bar + '<p class="empty">NENHUM E-MAIL</p>';
  var rows = idx.slice(0, 80).map(function (i) {
    var n = list[i], r = remet(n), d = n.fi != null ? dateOf({ fase:n.fi, dia:n.dia, temp:n.temp }).short : n.fase;
    return '<button class="mrow' + (i === sel ? " on" : "") + (n.lida ? "" : " unread") + '" data-a="mailSel" data-v="' + i + '">' + r.ico + "<span><b>" + esc(r.de) + "</b><em>" + esc(r.assunto) + "</em><small>" + esc(n.t) + "</small></span><time>" + esc(d) + "</time></button>";
  }).join("");
  var n = list[sel], r = remet(n), dp = n.fi != null ? dateOf({ fase:n.fi, dia:n.dia, temp:n.temp }) : null;
  var letter = '<article class="letter"><header>' + r.ico.replace("mico", "mico big") + '<div><h2>' + esc(r.de) + "</h2><small>" + esc(r.end) + '</small><span class="subj">' + esc(r.assunto) + "</span></div><time>" + (dp ? esc(dp.wd + ", " + dp.dm) : esc(n.fase + " · " + n.temp)) + '</time><button class="btn ghost sm" data-a="mailExcluir" data-v="' + sel + '">🗑 Excluir</button></header>' + mailBody(n, r) + "</article>";
  return bar + '<div class="mailw"><div class="mlist2">' + rows + "</div>" + letter + "</div>";
};
ACT.scrim = function (v) { var r = VM.doScrim(v); G.persist(); G.toast(r.msg, r.ok); };
ACT.mailSel = function (v) { UI.mailSel = +v; G.render(); };
ACT.mailOpen = function (v) { UI.mailSel = +v; G.go("caixa"); };
ACT.mailLerTudo = function () { (S().noticias || []).forEach(function (n) { n.lida = true; }); G.persist(); G.render(); };
ACT.mailExcluir = function (v) { S().noticias.splice(+v, 1); UI.mailSel = Math.max(0, +v - 0); G.persist(); G.render(); };
ACT.mailExcluirTudo = function () {
  if (!UI.cfMail) { UI.cfMail = true; G.render(); setTimeout(function () { UI.cfMail = false; }, 4000); return; }
  UI.cfMail = false; S().noticias = []; G.persist(); G.render();
};

/* ---------------------------------------------------------------------
   ESTRATÉGIAS E TÁTICAS
   --------------------------------------------------------------------- */
var ESTILOS = {
  agressivo:["Estratégia agressiva", "Ataques rápidos, execuções velozes e lutas no início do round. Forte no ataque e em rounds de eco; se expõe mais na defesa.", "M4 20 20 4M14 4h6v6M4 14l6 6"],
  padrao:["Estratégia equilibrada", "Joga pelo tempo e pela informação. Não ganha nem perde muito em nenhum lado.", "M12 3v18M5 8h14M7 8l-3 7h6zM17 8l-3 7h6z"],
  defensivo:["Estratégia cautelosa", "Segura posições, espera o erro do adversário e joga retake. Forte na defesa, lenta no ataque.", "M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"]
};
var COMPRAS = [["pistol", "Round de pistola"], ["full", "Compra completa"], ["force", "Force / semi-buy"], ["eco", "Eco"]];
function planSelect(path, cur, withIgual) {
  var opts = (withIgual ? [["igual", "Plano principal"]] : []).concat(Object.keys(VM.ATK_PLANOS).map(function (k) { return [k, VM.ATK_PLANOS[k].split(" (")[0]]; }));
  return '<select data-c="tacSel" data-k="' + path + '">' + opts.map(function (o) { return '<option value="' + o[0] + '" ' + (cur === o[0] ? "selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select>";
}
function setPath(obj, path, v) { var p = path.split("."), o = obj; for (var i = 0; i < p.length - 1; i++) o = o[p[i]] = o[p[i]] || {}; o[p[p.length - 1]] = v; }
function getPath(obj, path) { return path.split(".").reduce(function (o, k) { return o ? o[k] : undefined; }, obj); }
function tchips(path, cur, opts) {
  return '<div class="cchips">' + opts.map(function (o) { return '<button class="cchip ' + (cur === o[0] ? "on" : "") + '" data-a="tacSet" data-k="' + path + '" data-v="' + o[0] + '">' + o[1] + "</button>"; }).join("") + "</div>";
}
VIEWS.taticas = function () {
  var t = me(), s = S();
  VM.ensureTactics(t);
  if (!UI.tacMap || s.mapas.indexOf(UI.tacMap) < 0) UI.tacMap = s.mapas[0];
  UI.tacAba = UI.tacAba || "criador";
  var tabs = '<div class="ttabs">' + [["gerais", "Abrangentes"], ["criador", "Criador de táticas"], ["meta", "Meta do patch"]].map(function (x) { return '<button data-a="tacAba" data-v="' + x[0] + '" class="' + (UI.tacAba === x[0] ? "on" : "") + '">' + x[1] + "</button>"; }).join("") + "</div>";
  if (UI.tacAba === "meta" && window.CARREIRA) return tabs + window.CARREIRA.metaView();
  if (UI.tacAba === "gerais") {
    return tabs + '<div class="tblwrap"><table class="lb"><thead><tr><th>Mapa</th><th>Domínio</th><th>Estilo ATQ</th><th>Plano ATQ</th><th>Site</th><th>Estilo DEF</th><th>Setup DEF</th><th></th></tr></thead><tbody>' + s.mapas.map(function (m) {
      var tc = t.taticas[m];
      return "<tr><td><b>" + m + '</b></td><td class="num">' + Math.round(t.mapProf[m]) + "</td><td>" + ESTILOS[tc.estilo.atk][0].replace("Estratégia ", "") + "</td><td>" + VM.ATK_PLANOS[tc.atk.plano].split(" (")[0] + "</td><td>" + (tc.atk.site === "variar" ? "Variar" : tc.atk.site) + "</td><td>" + ESTILOS[tc.estilo.def][0].replace("Estratégia ", "") + "</td><td>" + VM.DEF_SETUPS[tc.def.setup].split(" (")[0] + (tc.def.setup === "stack" ? " " + tc.def.site : "") + '</td><td><button class="btn sm ghost" data-a="tacGo" data-v="' + m + '">Editar</button></td></tr>';
    }).join("") + "</tbody></table></div>";
  }
  var map = UI.tacMap, tac = t.taticas[map], side = UI.tacSide || "atk", sites = VM.SITES[map] || ["A", "B"];
  var mtabs = '<div class="mtabs">' + s.mapas.map(function (m) { return '<button data-a="tacMap" data-v="' + m + '" class="' + (m === map ? "on" : "") + '">' + m.toUpperCase() + "</button>"; }).join("") + "</div>" +
    '<div class="mtabs sm">' + [["atk", "ATAQUE"], ["def", "DEFESA"]].map(function (x) { return '<button data-a="tacSide" data-v="' + x[0] + '" class="' + (side === x[0] ? "on" : "") + '">' + x[1] + "</button>"; }).join("") + "</div>";
  var est = tac.estilo[side], E = ESTILOS[est];
  var icons = '<div class="esticons">' + Object.keys(ESTILOS).map(function (k) {
    return '<button class="esti ' + (k === est ? "on" : "") + '" data-a="tacSet" data-k="estilo.' + side + '" data-v="' + k + '" title="' + ESTILOS[k][0] + '">' + G.icon(ESTILOS[k][2]) + "</button>";
  }).join("") + "</div>";
  var detail;
  if (side === "atk") {
    detail = '<div class="plans">' + COMPRAS.map(function (c) {
      var cur = tac.atk.compra[c[0]] || "igual";
      return '<div class="plan"><i class="dot ' + (cur === "igual" ? "" : "on") + '"></i><span>' + c[1] + "</span>" + planSelect("atk.compra." + c[0], cur, true) + "</div>";
    }).join("") + "</div>" +
      '<div class="cgroup"><label>Plano principal</label>' + tchips("atk.plano", tac.atk.plano, Object.keys(VM.ATK_PLANOS).map(function (k) { return [k, VM.ATK_PLANOS[k].split(" (")[0]]; })) + "</div>" +
      '<div class="cgroup"><label>Site alvo</label>' + tchips("atk.site", tac.atk.site, [["variar", "Variar"]].concat(sites.map(function (x) { return [x, "Site " + x]; }))) + "</div>" +
      '<div class="cgroup"><label>Ritmo</label>' + tchips("atk.ritmo", tac.atk.ritmo, G.RITMO) + "</div>" +
      '<p class="tip">' + esc(G.TAC_DICA[tac.atk.plano] || "") + "</p>";
  } else {
    detail = '<div class="cgroup"><label>Setup de defesa</label>' + tchips("def.setup", tac.def.setup, Object.keys(VM.DEF_SETUPS).map(function (k) { return [k, VM.DEF_SETUPS[k]]; })) + "</div>" +
      '<div class="cgroup"><label>' + (tac.def.setup === "stack" ? "Site do stack" : "Site de referência") + "</label>" + tchips("def.site", tac.def.site, sites.map(function (x) { return [x, "Site " + x]; })) + "</div>" +
      '<div class="cgroup"><label>Rotação</label>' + tchips("def.rotacao", tac.def.rotacao, G.ROT) + "</div>" +
      '<p class="tip">' + esc(G.TAC_DICA[tac.def.setup] || "Seguro: 2-1-2 e rotação conforme a informação.") + "</p>";
  }
  var prev = G.tacticPreview ? G.tacticPreview(map, tac, side) : "";
  return tabs + mtabs + '<div class="tcreator"><div class="tcmap"><span class="cb tl"></span><span class="cb tr"></span><span class="cb bl"></span><span class="cb br"></span>' + prev + "</div>" + icons +
    '<div class="tcdet"><h2 class="esth">✎ ' + E[0] + ', <span>' + map.toUpperCase() + ", " + (side === "atk" ? "ATQ" : "DEF") + "</span></h2><p class=\"muted\">" + E[1] + "</p>" + detail +
    (VM.MAP_TRAITS[map] ? '<p class="tip mapt"><b>Estrutura do mapa:</b> ' + esc(VM.MAP_TRAITS[map].txt) + "</p>" : "") + '<div class="row"><button class="btn sm ghost" data-a="tacReset">Voltar ao padrão</button></div></div></div>';
};
ACT.tacAba = function (v) { UI.tacAba = v; G.render(); };
ACT.tacGo = function (v) { UI.tacAba = "criador"; UI.tacMap = v; G.render(); };
ACT.tacSet = function (v, el) { setPath(me().taticas[UI.tacMap], el.getAttribute("data-k"), v); G.persist(); G.render(); };
ACT.tacSel = function (v, el) { setPath(me().taticas[UI.tacMap], el.getAttribute("data-k"), v); G.persist(); G.render(); };

/* ---------------------------------------------------------------------
   TRANSFERÊNCIAS
   --------------------------------------------------------------------- */
VIEWS.transferencias = function () {
  var s = S(), t = me();
  UI.trAba = UI.trAba || "mundo";
  var tabs = '<div class="ttabs">' + [["mundo", "Transferências mundiais"], ["minhas", "Do meu time"], ["propostas", "Propostas recebidas (" + ((s.propRecebidas || []).length) + ")"]].map(function (x) { return '<button data-a="trAba" data-v="' + x[0] + '" class="' + (UI.trAba === x[0] ? "on" : "") + '">' + x[1] + "</button>"; }).join("") + '<button data-a="nav" data-v="mercado">Ir pro mercado →</button></div>';
  if (UI.trAba === "propostas" && window.CARREIRA) return tabs + window.CARREIRA.bidsView();
  var list = (s.transfers || []).filter(function (x) { return UI.trAba === "mundo" || x.from === t.id || x.to === t.id; }).slice(0, 120);
  function side(id) { return id ? G.teamChip(id) : '<span class="muted">Sem clube</span>'; }
  var rows = list.map(function (x) {
    var p = VM.P(x.pid);
    return "<tr><td>" + (p ? '<button class="plink" data-a="perfil" data-v="' + p.id + '">' + G.face(p, "xs") + "<strong>" + esc(x.nick) + "</strong></button>" : esc(x.nick)) + "</td><td>" + G.roleTag(x.role) + '</td><td class="num">' + x.age + "</td><td>" + ART.stars(Math.max(.5, Math.min(5, Math.round((x.ovr - 55) / 33 * 10) / 2))) + "</td><td>" + esc(x.nat) + "</td><td>" + side(x.from) + "</td><td>" + side(x.to) + '</td><td class="num">' + esc(dateOf(x).short) + '</td><td class="num">' + (x.valor ? money(x.valor) : '<span class="muted">' + esc(x.tipo) + "</span>") + "</td></tr>";
  }).join("");
  return tabs + '<div class="tblwrap"><table class="lb trtab"><thead><tr><th>Jogador</th><th>Função</th><th class="num">Idade</th><th>Classificação</th><th>Nação</th><th>De</th><th>Para</th><th class="num">Data</th><th class="num">Valor</th></tr></thead><tbody>' +
    (rows || '<tr><td colspan="9"><p class="empty">SEM RESULTADOS</p></td></tr>') + "</tbody></table></div>";
};
ACT.trAba = function (v) { UI.trAba = v; G.render(); };

/* ---------------------------------------------------------------------
   QG
   --------------------------------------------------------------------- */
var BONUS_LABEL = { aim:["Técnico", "Mira"], mov:["Técnico", "Movimentação"], reflex:["Físico", "Reflexo"], perc:["Mental", "Percepção"], comms:["Mental", "Comunicação"], cons:["Mental", "Consistência"], team:["Mental", "Trabalho em equipe"], comp:["Mental", "Compostura"], stam:["Físico", "Resistência"] };
VIEWS.qg = function () {
  var s = S(), t = me(), q = s.qg || {}, items = VM.QG_ITEMS, b = VM.qgBonus(t);
  var boot = items.bootcamp, bl = q.bootcamp || 1;
  var hero = '<div class="qhero"><div class="qroom">' + roomArt(bl) + '</div><div class="qhinfo">' + ART.stars(bl) + "<small>Bootcamp</small><strong>" + ["Garagem de treino", "Sala alugada", "Gaming house", "Centro de treinamento", "Complexo de alto rendimento"][bl - 1] + "</strong><p>" + esc(boot.extra) + "</p>" +
    (bl < 5 ? '<button class="btn primary sm" data-a="qgUp" data-v="bootcamp">Melhorar · ' + money(VM.qgCost("bootcamp", bl)) + "</button>" : '<span class="chip ok">nível máximo</span>') + "</div></div>";
  var cards = Object.keys(items).filter(function (k) { return k !== "bootcamp"; }).map(function (k) {
    var it = items[k], l = q[k] || 1;
    var bon = Object.keys(it.bonus).map(function (a) { return BONUS_LABEL[a][1] + " +" + it.bonus[a].toFixed(2).replace(".", ",") + "/nív."; }).join(" · ");
    return '<div class="qcard">' + qicon(k) + ART.stars(l) + "<small>" + esc(it.nome) + "</small><strong>" + esc(["Básico", "Intermediário", "Pro", "Elite", "Lendário"][l - 1]) + "</strong><em>" + esc(bon) + "</em>" + (it.extra ? "<em>" + esc(it.extra) + "</em>" : "") +
      (l < 5 ? '<button class="btn sm" data-a="qgUp" data-v="' + k + '">Melhorar · ' + money(VM.qgCost(k, l)) + "</button>" : '<span class="chip ok">máximo</span>') + "</div>";
  }).join("");
  var groups = { "Técnico":[], "Mental":[], "Físico":[] };
  Object.keys(BONUS_LABEL).forEach(function (a) { groups[BONUS_LABEL[a][0]].push('<div class="arow"><span>' + BONUS_LABEL[a][1] + '</span><b class="' + ((b[a] || 0) > 0 ? "a4" : "a0") + '">' + (b[a] || 0).toFixed(2).replace(".", ",") + "</b></div>"); });
  var tot = '<div class="attrs">' + Object.keys(groups).map(function (g) { return '<div class="agroup"><h4>' + g + "</h4>" + groups[g].join("") + "</div>"; }).join("") + "</div>";
  var equip = '<table class="lb"><thead><tr><th>Categoria</th><th class="num">Nível</th><th class="num">Próximo nível</th></tr></thead><tbody>' + Object.keys(items).map(function (k) {
    var l = q[k] || 1; return "<tr><td>" + esc(items[k].nome) + '</td><td class="num">' + l + '/5</td><td class="num">' + (l < 5 ? money(VM.qgCost(k, l)) : "—") + "</td></tr>";
  }).join("") + "</tbody></table>";
  return '<div class="qgrid"><div>' + hero + '<div class="qcards">' + cards + "</div></div><div>" + sec("Total de bônus") + tot +
    '<p class="muted">Os bônus somam força pro time em toda partida (+' + VM.qgEff(t).toFixed(1).replace(".", ",") + " de força hoje). Cada melhoria é paga uma vez, do caixa.</p>" + sec("Equipamento") + equip + "</div></div>";
};
function roomArt(l) {
  var desks = Math.min(5, l + 1), s = '<svg viewBox="0 0 320 170" class="roomsvg" aria-hidden="true"><defs><linearGradient id="rw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + ["#3a3024", "#2c3140", "#2a2240", "#1e2a3a", "#161d2c"][l - 1] + '"/><stop offset="1" stop-color="#0d0f14"/></linearGradient></defs><rect width="320" height="170" fill="url(#rw)"/>';
  s += '<rect x="0" y="120" width="320" height="50" fill="#0b0d12"/>';
  if (l >= 3) s += '<rect x="20" y="16" width="280" height="10" rx="3" fill="rgba(229,22,43,.5)"/>';
  for (var i = 0; i < desks; i++) {
    var x = 20 + i * (280 / desks) + 6, w = 280 / desks - 12;
    s += '<rect x="' + x + '" y="92" width="' + w + '" height="6" fill="#2b3040"/><rect x="' + (x + w * .2) + '" y="62" width="' + (w * .6) + '" height="26" rx="2" fill="#0f1a2a" stroke="#3a4a6a"/><rect x="' + (x + w * .24) + '" y="66" width="' + (w * .52) + '" height="18" fill="' + (l >= 4 ? "#1d4d7a" : "#22324a") + '"/><rect x="' + (x + w * .3) + '" y="100" width="' + (w * .4) + '" height="30" rx="6" fill="#1a1d27"/>';
  }
  if (l >= 5) s += '<circle cx="290" cy="40" r="14" fill="#F2C75C" opacity=".8"/>';
  return s + "</svg>";
}
ACT.qgUp = function (v) { var r = VM.qgUpgrade(v); G.persist(); G.toast(r.msg, r.ok); };

/* ---------------------------------------------------------------------
   PATROCINADORES
   --------------------------------------------------------------------- */
VIEWS.patrocinadores = function () {
  var s = S(), t = me(), P = s.patrocinio || { principal:null, sec:[null, null] };
  var tier = UI.spTier || "todos";
  var tabs = '<div class="ttabs">' + [["todos", "Todos"], ["S", "Tier S"], ["A", "Tier A"], ["B", "Tier B"], ["C", "Tier C"], ["D", "Tier D"]].map(function (x) { return '<button data-a="spTier" data-v="' + x[0] + '" class="' + (tier === x[0] ? "on" : "") + '">' + x[1] + "</button>"; }).join("") + "</div>";
  var open = VM.marketOpen();
  var list = VM.SPONSORS.filter(function (sp) { return tier === "todos" || sp.tier === tier; }).map(function (sp) {
    var req = VM.sponsorReq(sp.tier, t), slot = P.principal === sp.id ? "Principal" : P.sec[0] === sp.id ? "Manga esquerda" : P.sec[1] === sp.id ? "Manga direita" : "";
    return '<div class="spc' + (slot ? " on" : "") + (req.ok ? "" : " off") + '">' + sponsorLogo(sp, 52) + '<div class="spi"><strong>' + esc(sp.nome.toUpperCase()) + "</strong>" + ART.stars(sp.stars) + '<span class="meta"><em class="cat">' + esc(sp.cat) + '</em> Tier <b class="t' + sp.tier + '">' + sp.tier + "</b></span><small>" + money(sp.pay) + "/fase no peito · " + money(Math.round(sp.pay * .35 / 1000) * 1000) + " na manga</small>" +
      (req.ok ? "" : '<small class="neg">Exige: ' + esc(req.txt.toLowerCase()) + "</small>") + "</div>" +
      (slot ? '<span class="chip ok">' + slot + "</span>" : req.ok ? '<div class="spbtns"><button class="btn sm" data-a="spSet" data-v="' + sp.id + '" data-slot="principal" ' + (open ? "" : "disabled") + '>Peito</button><button class="btn sm ghost" data-a="spSet" data-v="' + sp.id + '" data-slot="0" ' + (open ? "" : "disabled") + '>Manga E</button><button class="btn sm ghost" data-a="spSet" data-v="' + sp.id + '" data-slot="1" ' + (open ? "" : "disabled") + ">Manga D</button></div>" : "") + "</div>";
  }).join("");
  var main = VM.sponsorById(P.principal), s1 = VM.sponsorById(P.sec[0]), s2 = VM.sponsorById(P.sec[1]);
  var total = VM.sponsorIncome(t);
  return '<div class="spgrid"><div>' + tabs + (open ? "" : '<div class="banner">Os contratos só podem ser trocados com a janela aberta (começo de cada fase).</div>') + '<div class="splist">' + list + "</div></div>" +
    '<div class="spside">' + jersey(t, main, s1, s2) + sec("Contratos atuais") +
    '<dl class="kv"><dt>Peito</dt><dd>' + (main ? esc(main.nome) + " · " + money(main.pay) : "—") + "</dd><dt>Manga esquerda</dt><dd>" + (s1 ? esc(s1.nome) + " · " + money(Math.round(s1.pay * .35)) : "—") + "</dd><dt>Manga direita</dt><dd>" + (s2 ? esc(s2.nome) + " · " + money(Math.round(s2.pay * .35)) : "—") + "</dd><dt>Total por fase</dt><dd class=\"pos\">" + money(Math.round(total)) + "</dd></dl>" +
    '<p class="muted small">Torcida em ' + Math.round(s.torcida || 0) + "%: os patrocínios pagam " + Math.round((0.9 + (s.torcida || 50) / 500) * 100) + '% do valor base. Vitórias e títulos aumentam a torcida.</p>' +
    '<p class="muted">Patrocinadores são marcas inventadas pelo jogo. Times maiores e com títulos atraem tiers melhores.</p></div></div>';
};
ACT.spTier = function (v) { UI.spTier = v; G.render(); };
ACT.spSet = function (v, el) { var r = VM.setSponsor(el.getAttribute("data-slot"), v); G.persist(); G.toast(r.msg, r.ok); };

/* ---------------------------------------------------------------------
   FINANÇAS
   --------------------------------------------------------------------- */
var C_REC = "#2E9BD6", C_DES = "#E0703E";
function barChart(hist) {
  if (!hist.length) return '<p class="empty">AINDA NÃO HÁ DADOS — o primeiro balanço sai no fim desta fase.</p>';
  var W = 560, H = 200, pad = 34, n = hist.length, max = Math.max.apply(null, hist.map(function (h) { return Math.max(h.receita, h.despesa); })) || 1;
  var gw = (W - pad - 10) / n, bw = Math.max(6, Math.min(22, gw / 2 - 4));
  var s = '<svg viewBox="0 0 ' + W + " " + (H + 30) + '" class="finchart" role="img" aria-label="Receita e despesa por fase">';
  [0, .5, 1].forEach(function (f) { var y = H - f * (H - 10); s += '<line x1="' + pad + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" class="gl"/><text x="' + (pad - 4) + '" y="' + (y + 4) + '" text-anchor="end" class="ax">' + (f ? Math.round(max * f / 1000) + "k" : "0") + "</text>"; });
  hist.forEach(function (h, i) {
    var x = pad + i * gw + gw / 2, hr = h.receita / max * (H - 10), hd = h.despesa / max * (H - 10);
    s += '<g class="fb"><title>' + esc(h.fase + " " + h.temp) + " — receita " + money(h.receita) + ", despesa " + money(h.despesa) + "</title>" +
      '<rect x="' + (x - bw - 1) + '" y="' + (H - hr) + '" width="' + bw + '" height="' + hr + '" rx="3" fill="' + C_REC + '"/>' +
      '<rect x="' + (x + 1) + '" y="' + (H - hd) + '" width="' + bw + '" height="' + hd + '" rx="3" fill="' + C_DES + '"/>' +
      '<rect x="' + (x - gw / 2) + '" y="0" width="' + gw + '" height="' + H + '" fill="transparent"/></g>' +
      '<text x="' + x + '" y="' + (H + 16) + '" text-anchor="middle" class="ax">' + esc(h.fase.replace("Masters ", "M. ").replace("Stage 2 — ", "S2 ").slice(0, 10)) + "</text>";
  });
  return s + "</svg>" + '<div class="legend"><span><i style="background:' + C_REC + '"></i>Receita</span><span><i style="background:' + C_DES + '"></i>Despesa</span></div>';
}
VIEWS.financas = function () {
  var s = S(), t = me(), hist = s.finHist || [], acc = s.finAcc || { receita:0, despesa:0 };
  var rec = hist.reduce(function (a, h) { return a + h.receita; }, 0) + acc.receita, des = hist.reduce(function (a, h) { return a + h.despesa; }, 0) + acc.despesa;
  var jog = t.roster.reduce(function (a, id) { return a + VM.P(id).salary; }, 0), stf = VM.staffPayroll(t);
  var base = VM.baseIncome(t), spn = VM.sponsorIncome(t), inc = VM.incomeFor(t), gasto = Math.round((jog + stf) / 7);
  var rows = [["Repasse da liga", base, C_REC], ["Patrocínios", spn, C_REC], ["Ajustes (dificuldade, desempenho, educação financeira)", inc - base - spn, inc - base - spn < 0 ? C_DES : C_REC], ["Salários de jogadores", -Math.round(jog / 7), C_DES], ["Salários do staff", -Math.round(stf / 7), C_DES]];
  var cap = VM.salaryCap(t), pr = VM.payroll(t);
  var mx = Math.max.apply(null, rows.map(function (r) { return Math.abs(r[1]); })) || 1;
  var split = rows.filter(function (r) { return r[1]; }).map(function (r) {
    return '<div class="frow"><span>' + r[0] + '</span><i style="width:' + Math.round(Math.abs(r[1]) / mx * 100) + "%;background:" + r[2] + '"></i><b class="' + (r[1] < 0 ? "neg" : "pos") + '">' + (r[1] > 0 ? "+" : "") + money(r[1]) + "</b></div>";
  }).join("");
  var tx = (s.transacoes || []).slice(0, 40).map(function (x) {
    return '<tr><td class="num">' + esc(dateOf(x).short) + "</td><td>" + esc(x.tipo) + '</td><td class="num ' + (x.valor < 0 ? "neg" : "pos") + '">' + (x.valor > 0 ? "+" : "") + money(x.valor) + "</td><td>" + esc(x.desc) + "</td></tr>";
  }).join("");
  var dirName = ["Elias", "Marta", "Otávio", "Renata", "Hugo", "Clara"][h32(t.tag) % 6] + " " + ["Hernandes", "Figueira", "Monteiro", "Salles", "Queiroz"][h32(t.tag + "x") % 5];
  var dir = '<div class="fdir">' + ART.face(dirName, t.tag, "md", { staff:true, suit:true }) + "<div><small>Diretor financeiro</small><strong>" + esc(dirName) + "</strong></div><p>" +
    (inc - gasto >= 0 ? "As contas fecham no azul: sobram " + money(inc - gasto) + " por fase antes das premiações." : "Atenção: gastamos " + money(gasto - inc) + " a mais do que entra por fase. Premiações ou vendas precisam cobrir.") + "</p></div>";
  return '<div class="fgrid"><div><div class="kpis"><div><small>Receita total</small><b>' + money(rec) + "</b></div><div><small>Despesa total</small><b>" + money(des) + "</b></div><div><small>Caixa</small><b class=\"" + (t.cash < 0 ? "neg" : "") + '">' + money(t.cash) + "</b></div><div><small>Fluxo por fase</small><b class=\"" + (inc - gasto < 0 ? "neg" : "pos") + '">' + (inc - gasto >= 0 ? "+" : "") + money(inc - gasto) + "</b></div></div>" +
    sec("Receita e despesa por fase") + barChart(hist) + sec("Orçamento por fase") + split + '<div class="caprow ' + (pr > cap ? "over" : "") + '"><span>Teto salarial da liga</span><i><b style="width:' + Math.min(100, Math.round(pr / cap * 100)) + '%"></b></i><em>' + money(pr) + " / " + money(cap) + "</em></div>" + (pr > cap ? '<p class="neg small">Folha acima do teto: a diretoria perde confiança a cada fase.</p>' : "") + dir + "</div>" +
    "<div>" + sec("Transações") + '<div class="tblwrap ftx"><table class="lb"><thead><tr><th class="num">Data</th><th>Tipo</th><th class="num">Quantia</th><th>Descrição</th></tr></thead><tbody>' + (tx || '<tr><td colspan="4"><p class="empty">AINDA NÃO HÁ DADOS DE TRANSAÇÕES</p></td></tr>') + "</tbody></table></div></div></div>";
};

/* ---------------------------------------------------------------------
   Pós-render: rola o ranking até o seu time; busca do e-mail
   --------------------------------------------------------------------- */
window.TELAS = {
  after:function () {
    var m = document.getElementById("rkme"), l = document.getElementById("rklist");
    if (m && l) l.scrollTop = Math.max(0, m.offsetTop - l.offsetTop - l.clientHeight / 2);
  },
  eventBadge:eventBadge, sponsorLogo:sponsorLogo
};
document.getElementById("app").addEventListener("input", function (e) {
  var el = e.target;
  if (el.getAttribute("data-in2") === "mailBusca") {
    UI.mailBusca = el.value; UI.mailSel = null; var pos = el.selectionStart; G.render();
    var n = document.getElementById("mailBusca"); if (n) { n.focus(); n.setSelectionRange(pos, pos); }
  }
});
})();
