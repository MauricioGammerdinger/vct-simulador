/* =====================================================================
   VCT MANAGER — arte gerada: avatares, escudos, mapas 2D, gráficos
   Tudo em SVG, gerado a partir do nome. Nenhuma imagem externa.
   Fotos próprias: coloque em fotos/<nick>.png e escudos/<TAG>.png
   ===================================================================== */
(function () {
"use strict";

function h32(s) {
  var h = 2166136261 >>> 0;
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]; }); }

/* ---------------------------------------------------------------------
   Cores dos times
   --------------------------------------------------------------------- */
var cache = {}, CUSTOM = {};
function setCustom(tag, o) { CUSTOM[tag] = o; delete cache[tag]; }
function clearCustom(tag) { delete CUSTOM[tag]; }
function teamColors(tag) {
  if (CUSTOM[tag]) return { c1:CUSTOM[tag].c1, c2:CUSTOM[tag].c2, hue:CUSTOM[tag].hue };
  if (cache[tag]) return cache[tag];
  var r = rng(h32("cor:" + tag));
  var hue = Math.floor(r() * 360);
  var sat = 55 + Math.floor(r() * 30);
  var c1 = "hsl(" + hue + "," + sat + "%," + (38 + Math.floor(r() * 14)) + "%)";
  var mode = r();
  var hue2 = mode < .4 ? (hue + 180) % 360 : mode < .7 ? (hue + 40) % 360 : hue;
  var c2 = mode >= .7 ? "hsl(0,0%," + (r() < .5 ? 92 : 12) + "%)" : "hsl(" + hue2 + "," + (sat - 10) + "%," + (60 + Math.floor(r() * 15)) + "%)";
  return (cache[tag] = { c1:c1, c2:c2, hue:hue });
}

/* ---------------------------------------------------------------------
   Avatares ilustrados
   --------------------------------------------------------------------- */
var SKIN = ["#F6D7C3", "#EFC3A4", "#E0A98A", "#C98C68", "#A96E4C", "#8A5537", "#6B3E27", "#F1CBB0"];
var HAIR = ["#1C1410", "#2E1F16", "#4A3222", "#6B4A2E", "#A8753F", "#D9B06A", "#141414", "#3B2A20", "#8E8E8E", "#B34A2A"];

function avatar(seedName, tag, opts) {
  opts = opts || {};
  var r = rng(h32("av:" + seedName));
  var col = teamColors(tag || "FA");
  var skin = pick(r, SKIN), hair = pick(r, HAIR);
  if (opts.staff && r() < .25) hair = pick(r, ["#8E8E8E", "#B8B8B8", "#5A5A5A"]);
  var style = pick(r, ["curto", "curto", "raspado", "cacheado", "topete", "longo", "moicano", "careca", "bone"]);
  if (opts.staff && style === "moicano") style = "curto";
  if (opts.fem) style = pick(r, ["longo", "longo", "cacheado", "coque", "rabo"]);
  var beard = opts.fem ? 0 : r(); var glasses = r() < (opts.staff ? .35 : .22); var headset = !opts.staff && r() < .7;
  var brow = r() < .5 ? 2.6 : 3.4;
  var faceW = 25 + r() * 4, faceH = 30 + r() * 4;
  var id = "a" + (h32(seedName + (tag || "")) % 1e8);
  var s = [];
  s.push('<svg viewBox="0 0 100 100" class="av" aria-hidden="true">');
  s.push('<defs><linearGradient id="bg' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + col.c1 + '"/><stop offset="1" stop-color="#0b0c10"/></linearGradient>' +
    '<clipPath id="cp' + id + '"><rect x="0" y="0" width="100" height="100" rx="14"/></clipPath></defs>');
  s.push('<g clip-path="url(#cp' + id + ')"><rect width="100" height="100" fill="url(#bg' + id + ')"/>');
  s.push('<circle cx="50" cy="44" r="40" fill="' + col.c2 + '" opacity=".08"/>');
  /* corpo / camisa */
  var shirt = opts.suit ? "#1B1E27" : opts.staff ? "#20242E" : col.c1;
  s.push('<path d="M8 104 C10 80 28 72 50 72 C72 72 90 80 92 104 Z" fill="' + shirt + '"/>');
  if (!opts.staff) s.push('<path d="M8 104 C10 84 22 78 30 76 L34 104 Z" fill="' + col.c2 + '" opacity=".55"/><path d="M92 104 C90 84 78 78 70 76 L66 104 Z" fill="' + col.c2 + '" opacity=".55"/>');
  else if (opts.suit) s.push('<path d="M42 72 L50 90 L58 72 Z" fill="#E9ECF2"/><path d="M48 76 L50 96 L52 76 Z" fill="' + (opts.tie || "#E5162B") + '"/><path d="M30 76 L44 72 L50 100 Z M70 76 L56 72 L50 100 Z" fill="#262A36"/>');
  else s.push('<path d="M40 72 L50 86 L60 72" fill="none" stroke="' + col.c1 + '" stroke-width="4"/>');
  /* pescoço e rosto */
  s.push('<rect x="42" y="58" width="16" height="17" rx="6" fill="' + skin + '"/>');
  s.push('<path d="M38 74 Q50 82 62 74" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="3"/>');
  s.push('<ellipse cx="50" cy="44" rx="' + faceW.toFixed(1) + '" ry="' + faceH.toFixed(1) + '" fill="' + skin + '"/>');
  s.push('<ellipse cx="' + (50 - faceW + 1).toFixed(1) + '" cy="47" rx="4" ry="6" fill="' + skin + '"/><ellipse cx="' + (50 + faceW - 1).toFixed(1) + '" cy="47" rx="4" ry="6" fill="' + skin + '"/>');
  /* barba */
  if (beard > .72) s.push('<path d="M' + (50 - faceW + 3) + ' 50 Q50 ' + (44 + faceH + 6) + ' ' + (50 + faceW - 3) + ' 50 Q50 ' + (44 + faceH - 4) + ' ' + (50 - faceW + 3) + ' 50Z" fill="' + hair + '" opacity=".92"/>');
  else if (beard > .5) s.push('<path d="M' + (50 - faceW + 4) + ' 52 Q50 ' + (44 + faceH + 4) + ' ' + (50 + faceW - 4) + ' 52" fill="none" stroke="' + hair + '" stroke-width="6" opacity=".35"/>');
  if (beard > .6 && beard < .72) s.push('<path d="M42 58 Q50 55 58 58" fill="none" stroke="' + hair + '" stroke-width="3" stroke-linecap="round"/>');
  /* olhos, sobrancelhas, boca */
  s.push('<ellipse cx="40" cy="45" rx="3" ry="3.4" fill="#1a1a1a"/><ellipse cx="60" cy="45" rx="3" ry="3.4" fill="#1a1a1a"/>');
  if (opts.fem) s.push('<path d="M36 42 L34 40 M64 42 L66 40" stroke="#1a1a1a" stroke-width="1.6" stroke-linecap="round"/>');
  s.push('<circle cx="41" cy="44" r="1" fill="#fff" opacity=".7"/><circle cx="61" cy="44" r="1" fill="#fff" opacity=".7"/>');
  s.push('<path d="M34 37 Q40 ' + (34 - r() * 2).toFixed(1) + ' 46 37" stroke="' + hair + '" stroke-width="' + brow + '" fill="none" stroke-linecap="round"/>');
  s.push('<path d="M54 37 Q60 ' + (34 - r() * 2).toFixed(1) + ' 66 37" stroke="' + hair + '" stroke-width="' + brow + '" fill="none" stroke-linecap="round"/>');
  s.push('<path d="M47 52 Q50 55 53 52" stroke="rgba(0,0,0,.25)" stroke-width="2" fill="none" stroke-linecap="round"/>');
  var smile = r();
  s.push('<path d="M43 ' + (60 + (beard > .72 ? -1 : 0)) + ' Q50 ' + (smile > .5 ? 65 : 62) + ' 57 ' + (60 + (beard > .72 ? -1 : 0)) + '" stroke="#6b2b2b" stroke-width="2.4" fill="none" stroke-linecap="round"/>');
  if (glasses) s.push('<g fill="none" stroke="#111" stroke-width="2.2"><rect x="32" y="39" width="15" height="11" rx="4"/><rect x="53" y="39" width="15" height="11" rx="4"/><path d="M47 44 L53 44"/></g>');
  /* cabelo */
  var top = 44 - faceH;
  if (style === "curto") s.push('<path d="M' + (50 - faceW - 1) + ' 42 C' + (50 - faceW) + ' ' + (top - 4) + ' ' + (50 + faceW) + ' ' + (top - 4) + ' ' + (50 + faceW + 1) + ' 42 C' + (50 + faceW - 4) + ' 30 60 26 50 27 C40 26 ' + (50 - faceW + 4) + ' 30 ' + (50 - faceW - 1) + ' 42Z" fill="' + hair + '"/>');
  if (style === "raspado") s.push('<path d="M' + (50 - faceW) + ' 38 C' + (50 - faceW) + ' ' + (top - 1) + ' ' + (50 + faceW) + ' ' + (top - 1) + ' ' + (50 + faceW) + ' 38 C' + (50 + faceW - 6) + ' 30 ' + (50 - faceW + 6) + ' 30 ' + (50 - faceW) + ' 38Z" fill="' + hair + '" opacity=".55"/>');
  if (style === "cacheado") { for (var i = 0; i < 9; i++) { var ang = Math.PI * (0.95 + i * 0.14); s.push('<circle cx="' + (50 + Math.cos(ang) * (faceW + 1)).toFixed(1) + '" cy="' + (38 + Math.sin(ang) * (faceH - 2)).toFixed(1) + '" r="' + (7 + r() * 2).toFixed(1) + '" fill="' + hair + '"/>'); } }
  if (style === "topete") s.push('<path d="M' + (50 - faceW - 1) + ' 40 C' + (50 - faceW) + ' ' + (top - 2) + ' 50 ' + (top - 12) + ' ' + (50 + faceW + 2) + ' ' + (top + 2) + ' C' + (50 + faceW + 1) + ' 32 58 28 46 29 C40 30 ' + (50 - faceW + 3) + ' 33 ' + (50 - faceW - 1) + ' 40Z" fill="' + hair + '"/>');
  if (style === "longo") s.push('<path d="M' + (50 - faceW - 3) + ' 64 C' + (50 - faceW - 6) + ' ' + (top - 6) + ' ' + (50 + faceW + 6) + ' ' + (top - 6) + ' ' + (50 + faceW + 3) + ' 64 L' + (50 + faceW - 3) + ' 64 C' + (50 + faceW - 2) + ' 34 60 27 50 28 C40 27 ' + (50 - faceW + 2) + ' 34 ' + (50 - faceW + 3) + ' 64Z" fill="' + hair + '"/>');
  var capH = 'M' + (50 - faceW - 1) + ' 44 C' + (50 - faceW) + ' ' + (top - 3) + ' ' + (50 + faceW) + ' ' + (top - 3) + ' ' + (50 + faceW + 1) + ' 44 C' + (50 + faceW - 4) + ' 31 60 27 50 28 C40 27 ' + (50 - faceW + 4) + ' 31 ' + (50 - faceW - 1) + ' 44Z';
  if (style === "coque") s.push('<circle cx="50" cy="' + (top - 6) + '" r="10" fill="' + hair + '"/><path d="' + capH + '" fill="' + hair + '"/>');
  if (style === "rabo") s.push('<path d="M' + (50 + faceW - 2) + ' 34 Q' + (50 + faceW + 16) + ' 50 ' + (50 + faceW + 6) + ' 72" fill="none" stroke="' + hair + '" stroke-width="9" stroke-linecap="round"/><path d="' + capH + '" fill="' + hair + '"/>');
  if (style === "moicano") s.push('<path d="M44 ' + (top + 6) + ' Q50 ' + (top - 14) + ' 56 ' + (top + 6) + ' L56 30 L44 30Z" fill="' + hair + '"/><path d="M' + (50 - faceW) + ' 38 Q50 ' + (top + 2) + ' ' + (50 + faceW) + ' 38" fill="none" stroke="' + hair + '" stroke-width="3" opacity=".35"/>');
  if (style === "bone") s.push('<path d="M' + (50 - faceW - 2) + ' 36 C' + (50 - faceW) + ' ' + (top - 6) + ' ' + (50 + faceW) + ' ' + (top - 6) + ' ' + (50 + faceW + 2) + ' 36Z" fill="' + col.c2 + '"/><path d="M' + (50 - faceW - 2) + ' 36 L' + (50 + faceW + 12) + ' 34 L' + (50 + faceW + 2) + ' 38Z" fill="' + col.c1 + '"/>');
  /* headset */
  if (headset) {
    s.push('<path d="M' + (50 - faceW - 4) + ' 46 C' + (50 - faceW - 4) + ' ' + (top - 10) + ' ' + (50 + faceW + 4) + ' ' + (top - 10) + ' ' + (50 + faceW + 4) + ' 46" fill="none" stroke="#15171c" stroke-width="4.5"/>');
    s.push('<rect x="' + (50 - faceW - 9) + '" y="39" width="10" height="17" rx="4" fill="#15171c"/><rect x="' + (50 + faceW - 1) + '" y="39" width="10" height="17" rx="4" fill="#15171c"/>');
    s.push('<rect x="' + (50 - faceW - 7) + '" y="42" width="3" height="11" rx="1.5" fill="' + col.c1 + '"/>');
    if (r() < .6) s.push('<path d="M' + (50 - faceW - 4) + ' 54 Q' + (50 - faceW - 2) + ' 64 42 63" fill="none" stroke="#15171c" stroke-width="2.4"/><circle cx="42" cy="63" r="2.4" fill="#15171c"/>');
  }
  s.push("</g></svg>");
  return s.join("");
}

/* Avatar com foto opcional por cima (fotos/<nick>.png). */
function face(name, tag, cls, opts) {
  var src = (opts && opts.staff ? "fotos/staff/" : "fotos/") + encodeURIComponent(name) + ".png";
  return '<span class="face ' + (cls || "") + '">' + avatar(name, tag, opts) +
    '<img src="' + src + '" alt="" loading="lazy" onerror="this.remove()"></span>';
}

/* ---------------------------------------------------------------------
   Escudos
   --------------------------------------------------------------------- */
function crest(tag, size, co) {
  var col = co || teamColors(tag), r = rng(h32("crest:" + tag));
  var id = "c" + (h32(tag) % 1e8);
  var SH = ["M50 4 L92 16 L88 62 Q84 84 50 98 Q16 84 12 62 L8 16 Z", "M50 4 L94 26 L94 70 L50 96 L6 70 L6 26 Z", "M12 8 H88 V58 Q88 86 50 98 Q12 86 12 58 Z", "M50 3 C74 3 96 20 96 50 C96 80 74 97 50 97 C26 97 4 80 4 50 C4 20 26 3 50 3Z"];
  var shape = pick(r, SH); var cs = co || CUSTOM[tag]; if (cs && cs.shape != null) shape = SH[cs.shape];
  var pat = r();
  var txt = tag.length > 4 ? tag.slice(0, 4) : tag;
  var fs = txt.length <= 2 ? 34 : txt.length === 3 ? 27 : 21;
  var s = '<svg viewBox="0 0 100 100" class="crest" ' + (size ? 'width="' + size + '" height="' + size + '"' : "") + ' aria-hidden="true">' +
    '<defs><linearGradient id="g' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col.c1 + '"/><stop offset="1" stop-color="#0d0f14"/></linearGradient>' +
    '<clipPath id="k' + id + '"><path d="' + shape + '"/></clipPath></defs>' +
    '<path d="' + shape + '" fill="url(#g' + id + ')" stroke="' + col.c2 + '" stroke-width="4"/>' +
    '<g clip-path="url(#k' + id + ')" opacity=".22">' +
    (pat < .33 ? '<path d="M0 30 L100 -10 L100 10 L0 50Z M0 70 L100 30 L100 50 L0 90Z" fill="' + col.c2 + '"/>' :
     pat < .66 ? '<rect x="40" y="0" width="20" height="100" fill="' + col.c2 + '"/>' : '<circle cx="50" cy="40" r="30" fill="none" stroke="' + col.c2 + '" stroke-width="8"/>') +
    '</g><text x="50" y="' + (58 + (fs < 25 ? -2 : 0)) + '" text-anchor="middle" font-family="Saira Condensed, Arial Narrow, sans-serif" font-weight="800" font-style="italic" font-size="' + fs + '" fill="#fff" letter-spacing="1">' + esc(txt) + "</text></svg>";
  return '<span class="crestw">' + s + '<img src="escudos/' + encodeURIComponent(tag) + '.png" alt="" loading="lazy" onerror="this.remove()"></span>';
}

/* ---------------------------------------------------------------------
   Mapas 2D esquemáticos (não são as plantas reais — layouts inspirados)
   --------------------------------------------------------------------- */
var LAYOUTS = {};
function layout(map, sites) {
  if (LAYOUTS[map]) return LAYOUTS[map];
  var r = rng(h32("map:" + map));
  function j(v, d) { return Math.round(v + (r() * 2 - 1) * d); }
  var W = 1000, H = 640;
  var L = { W:W, H:H, sites:{}, atk:{ x:500, y:600 }, def:{ x:500, y:52 }, mid:{ x:j(500, 30), y:j(330, 25) }, routes:{}, defPos:{}, blocks:[], lanes:[] };
  var PRE = {
    Ascent:{ A:[215, 235], B:[785, 215], mid:[500, 330] },
    Abyss:{ A:[250, 185], B:[760, 255], mid:[470, 365] },
    Split:{ A:[195, 215], B:[805, 225], mid:[500, 390] },
    Sunset:{ A:[235, 245], B:[775, 185], mid:[530, 300] },
    Summit:{ A:[265, 170], B:[735, 175], mid:[500, 320] },
    Haven:{ A:[165, 255], B:[500, 240], C:[835, 250], mid:[330, 385] },
    Lotus:{ A:[175, 225], B:[500, 250], C:[830, 265], mid:[665, 390] },
    Bind:{ A:[200, 240], B:[800, 240], mid:[500, 420] },
    Breeze:{ A:[240, 170], B:[790, 230], mid:[520, 330] },
    Icebox:{ A:[210, 200], B:[780, 260], mid:[480, 360] },
    Fracture:{ A:[180, 300], B:[820, 290], mid:[500, 250] },
    Pearl:{ A:[230, 215], B:[775, 205], mid:[505, 355] },
    Corrode:{ A:[220, 250], B:[790, 195], mid:[470, 340] }
  }[map];
  if (PRE) {
    sites.forEach(function (sk) { L.sites[sk] = { x:j(PRE[sk][0], 8), y:j(PRE[sk][1], 8) }; });
    L.mid = { x:j(PRE.mid[0], 8), y:j(PRE.mid[1], 8) };
  } else if (sites.length === 3) {
    L.sites.A = { x:j(175, 25), y:j(230, 30) }; L.sites.B = { x:j(500, 20), y:j(240, 15) }; L.sites.C = { x:j(825, 25), y:j(230, 30) };
  } else {
    L.sites.A = { x:j(230, 35), y:j(200, 35) }; L.sites.B = { x:j(770, 35), y:j(200, 35) };
  }
  var mains = {};
  sites.forEach(function (sk) {
    var S = L.sites[sk];
    var side = S.x < 400 ? -1 : S.x > 600 ? 1 : 0;
    var lobby = { x:side === 0 ? S.x + j(0, 10) : j(500 + side * 250, 30), y:j(510, 20) };
    var main = { x:side === 0 ? S.x + j(0, 12) : j(S.x + side * 10, 20), y:side === 0 ? j(S.y + 160, 10) : j(S.y + 150, 20) };
    mains[sk] = main;
    L.routes[sk] = [L.atk, lobby, main, S];
    L.lanes.push([L.atk, lobby, main, S]);
    L.defPos[sk] = [{ x:S.x + j(-40, 10), y:S.y + j(-20, 10) }, { x:S.x + j(45, 10), y:S.y + j(15, 10) }, { x:S.x + j(0, 20), y:S.y + j(-55, 10) }];
    L.lanes.push([L.def, { x:(L.def.x + S.x) / 2, y:j(95, 15) }, S]);
  });
  /* conectores pelo meio */
  L.lanes.push([L.atk, { x:L.mid.x, y:470 }, L.mid]);
  sites.forEach(function (sk) {
    var S = L.sites[sk];
    var c = { x:Math.round((L.mid.x + S.x) / 2), y:Math.round((L.mid.y + S.y) / 2) + j(20, 15) };
    L.lanes.push([L.mid, c, S]);
    L.routes[sk + "_mid"] = [L.atk, { x:L.mid.x, y:470 }, L.mid, c, S];
  });
  L.midPos = [{ x:L.mid.x + j(-30, 10), y:L.mid.y - 60 }, { x:L.mid.x + j(30, 10), y:L.mid.y - 40 }];
  for (var i = 0; i < 9; i++) L.blocks.push({ x:j(500, 430), y:j(330, 250), w:j(70, 30), h:j(50, 25) });
  return (LAYOUTS[map] = L);
}
function pathD(pts) { return "M" + pts.map(function (p) { return p.x + " " + p.y; }).join(" L"); }

function mid2(a, b) { return { x:(a.x + b.x) / 2, y:(a.y + b.y) / 2 }; }
function callouts(L, sites) {
  var c = [];
  sites.forEach(function (sk) {
    var r = L.routes[sk], S = L.sites[sk];
    c.push({ x:r[1].x, y:r[1].y + 34, t:sk + " LOBBY" });
    c.push({ x:mid2(r[1], r[2]).x, y:mid2(r[1], r[2]).y, t:sk + " MAIN" });
    var rm = L.routes[sk + "_mid"];
    c.push({ x:rm[3].x, y:rm[3].y + 4, t:sk + " LINK" });
    c.push({ x:S.x, y:S.y - 92, t:sk + " HEAVEN" });
    if (Math.abs(S.x - L.def.x) > 150) c.push({ x:(L.def.x + S.x) / 2, y:(L.def.y + S.y) / 2 - 8, t:sk + " CT" });
  });
  c.push({ x:L.mid.x, y:L.mid.y + 50, t:"MEIO" });
  c.push({ x:L.mid.x, y:470 + 30, t:"MID BOTTOM" });
  return c;
}
function mapSVG(map, sites) {
  var L = layout(map, sites), r = rng(h32("deco:" + map));
  var s = ['<svg viewBox="0 0 ' + L.W + " " + L.H + '" class="map2d" id="map2d" preserveAspectRatio="xMidYMid meet">'];
  s.push('<defs>' +
    '<pattern id="wallp" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="14" fill="#07080C"/><path d="M0 0V14" stroke="#10131B" stroke-width="5"/></pattern>' +
    '<pattern id="floorp" width="36" height="36" patternUnits="userSpaceOnUse"><rect width="36" height="36" fill="#1A1F2B"/><path d="M36 0H0V36" fill="none" stroke="#212736" stroke-width="1.5"/><circle cx="18" cy="18" r="1" fill="#252C3C"/></pattern>' +
    '<pattern id="sitep" width="36" height="36" patternUnits="userSpaceOnUse"><rect width="36" height="36" fill="#221C24"/><path d="M36 0H0V36" fill="none" stroke="#2C2330" stroke-width="1.5"/></pattern>' +
    '<radialGradient id="vig" cx="50%" cy="50%" r="70%"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>' +
    '<filter id="glowf" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter></defs>');
  s.push('<rect width="' + L.W + '" height="' + L.H + '" fill="url(#wallp)"/>');
  /* salas: spawns, meio e sites */
  var rooms = [];
  rooms.push({ x:L.atk.x - 110, y:L.atk.y - 44, w:220, h:88, k:"spawn" });
  rooms.push({ x:L.def.x - 110, y:L.def.y - 40, w:220, h:80, k:"spawn" });
  rooms.push({ x:L.mid.x - 62, y:L.mid.y - 52, w:124, h:104, k:"mid" });
  sites.forEach(function (sk) { var S = L.sites[sk]; rooms.push({ x:S.x - 112, y:S.y - 84, w:224, h:168, k:"site", sk:sk }); });
  /* borda das paredes (desenhada por baixo, mais larga) */
  L.lanes.forEach(function (ln) { s.push('<path d="' + pathD(ln) + '" fill="none" stroke="#343C50" stroke-width="84" stroke-linejoin="round" stroke-linecap="round"/>'); });
  rooms.forEach(function (o) { s.push('<rect x="' + (o.x - 7) + '" y="' + (o.y - 7) + '" width="' + (o.w + 14) + '" height="' + (o.h + 14) + '" rx="14" fill="#343C50"/>'); });
  /* chão */
  L.lanes.forEach(function (ln) { s.push('<path d="' + pathD(ln) + '" fill="none" stroke="url(#floorp)" stroke-width="70" stroke-linejoin="round" stroke-linecap="round"/>'); });
  rooms.forEach(function (o) { s.push('<rect x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + o.h + '" rx="10" fill="url(#' + (o.k === "site" ? "sitep" : "floorp") + ')"/>'); });
  /* portas / chokes nos mains */
  sites.forEach(function (sk) {
    var rt = L.routes[sk], p = rt[2], q = rt[3];
    var dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    var cx = p.x + ux * Math.min(70, d * .4), cy = p.y + uy * Math.min(70, d * .4), nx = -uy, ny = ux;
    [-1, 1].forEach(function (sg) {
      var ox = cx + nx * sg * 38, oy = cy + ny * sg * 38;
      s.push('<line x1="' + ox.toFixed(1) + '" y1="' + oy.toFixed(1) + '" x2="' + (ox - nx * sg * 16).toFixed(1) + '" y2="' + (oy - ny * sg * 16).toFixed(1) + '" stroke="#4A5470" stroke-width="10" stroke-linecap="round"/>');
    });
  });
  /* site: placa, letra, zona de plant e caixas de cobertura */
  sites.forEach(function (sk) {
    var S = L.sites[sk];
    s.push('<rect x="' + (S.x - 96) + '" y="' + (S.y - 70) + '" width="192" height="140" rx="10" fill="rgba(229,22,43,.06)" stroke="rgba(229,22,43,.5)" stroke-width="2.5" stroke-dasharray="10 7"/>');
    s.push('<text x="' + S.x + '" y="' + (S.y + 24) + '" text-anchor="middle" class="sitel">' + sk + "</text>");
    s.push('<rect x="' + (S.x - 24) + '" y="' + (S.y - 17) + '" width="48" height="34" rx="6" fill="rgba(229,22,43,.18)" stroke="rgba(229,22,43,.55)" id="plant-' + sk + '"/>');
    var boxes = [[-70, -44, 30, 26], [58, -40, 26, 34], [-62, 38, 36, 22], [46, 40, 28, 24], [0, -58, 22, 18]];
    boxes.forEach(function (bx, i) {
      if (r() < .25 && i > 1) return;
      var x = S.x + bx[0] + (r() * 2 - 1) * 8, y = S.y + bx[1] + (r() * 2 - 1) * 6, w = bx[2], h = bx[3];
      s.push('<rect x="' + (x - w / 2).toFixed(1) + '" y="' + (y - h / 2).toFixed(1) + '" width="' + w + '" height="' + h + '" rx="3" fill="#353C4E" stroke="#4A536A" stroke-width="2"/>' +
        '<path d="M' + (x - w / 2 + 3).toFixed(1) + " " + (y - h / 2 + 3).toFixed(1) + " L" + (x + w / 2 - 3).toFixed(1) + " " + (y + h / 2 - 3).toFixed(1) + '" stroke="#2A3040" stroke-width="2"/>');
    });
  });
  /* caixas no meio e nos mains */
  [[L.mid.x - 34, L.mid.y - 20, 26, 22], [L.mid.x + 30, L.mid.y + 16, 22, 28]].forEach(function (b) {
    s.push('<rect x="' + (b[0] - b[2] / 2) + '" y="' + (b[1] - b[3] / 2) + '" width="' + b[2] + '" height="' + b[3] + '" rx="3" fill="#353C4E" stroke="#4A536A" stroke-width="2"/>');
  });
  /* spawns com barreira */
  s.push('<line x1="' + (L.atk.x - 90) + '" y1="' + (L.atk.y - 46) + '" x2="' + (L.atk.x + 90) + '" y2="' + (L.atk.y - 46) + '" stroke="#FF6B5B" stroke-width="5" opacity=".75" class="barrier"/>');
  s.push('<line x1="' + (L.def.x - 90) + '" y1="' + (L.def.y + 42) + '" x2="' + (L.def.x + 90) + '" y2="' + (L.def.y + 42) + '" stroke="#3FD1B8" stroke-width="5" opacity=".75" class="barrier"/>');
  s.push('<text x="' + L.atk.x + '" y="' + (L.atk.y + 30) + '" text-anchor="middle" class="zonel">SPAWN ATAQUE</text>');
  s.push('<text x="' + L.def.x + '" y="' + (L.def.y - 20) + '" text-anchor="middle" class="zonel">SPAWN DEFESA</text>');
  callouts(L, sites).forEach(function (c) { s.push('<text x="' + c.x.toFixed(0) + '" y="' + c.y.toFixed(0) + '" text-anchor="middle" class="callout">' + esc(c.t) + "</text>"); });
  s.push('<rect width="' + L.W + '" height="' + L.H + '" fill="url(#vig)" pointer-events="none"/>');
  s.push('<g id="util"></g><g id="marks"></g><g id="dots"></g><g id="spike"></g><g id="fx"></g>');
  s.push('<text x="18" y="34" class="mapname">' + esc(map.toUpperCase()) + "</text>");
  s.push("</svg>");
  return s.join("");
}

/* posição ao longo de uma rota (0..1) */
function along(pts, t) {
  t = Math.max(0, Math.min(1, t));
  var segs = [], tot = 0;
  for (var i = 1; i < pts.length; i++) { var d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); segs.push(d); tot += d; }
  var want = t * tot;
  for (var k = 0; k < segs.length; k++) {
    if (want <= segs[k]) { var f = segs[k] ? want / segs[k] : 0; return { x:pts[k].x + (pts[k + 1].x - pts[k].x) * f, y:pts[k].y + (pts[k + 1].y - pts[k].y) * f }; }
    want -= segs[k];
  }
  return { x:pts[pts.length - 1].x, y:pts[pts.length - 1].y };
}

/* ---------------------------------------------------------------------
   Gráficos pequenos
   --------------------------------------------------------------------- */
function ring(value, max, label, color) {
  var pct = Math.max(0, Math.min(1, value / max)), R = 26, C = 2 * Math.PI * R;
  return '<div class="ring"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="' + R + '" fill="none" stroke="var(--line2)" stroke-width="6"/>' +
    '<circle cx="32" cy="32" r="' + R + '" fill="none" stroke="' + (color || "var(--win)") + '" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + (C * pct).toFixed(1) + " " + C.toFixed(1) + '" transform="rotate(-90 32 32)"/>' +
    '<text x="32" y="37" text-anchor="middle">' + Math.round(value) + "</text></svg><span>" + esc(label) + "</span></div>";
}
function radar(axes) {
  /* axes: [{label, v (0-100)}] */
  var n = axes.length, cx = 120, cy = 110, R = 80, pts = [], grid = [];
  function pt(i, rr) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; return { x:cx + Math.cos(a) * rr, y:cy + Math.sin(a) * rr }; }
  [0.25, 0.5, 0.75, 1].forEach(function (f) { grid.push('<polygon points="' + axes.map(function (_, i) { var p = pt(i, R * f); return p.x.toFixed(1) + "," + p.y.toFixed(1); }).join(" ") + '" fill="none" stroke="var(--line2)"/>'); });
  axes.forEach(function (a, i) { var p = pt(i, R * Math.max(.08, a.v / 100)); pts.push(p.x.toFixed(1) + "," + p.y.toFixed(1)); });
  var labels = axes.map(function (a, i) { var p = pt(i, R + 18); return '<text x="' + p.x.toFixed(1) + '" y="' + (p.y + 4).toFixed(1) + '" text-anchor="middle">' + esc(a.label) + "</text>"; }).join("");
  var spokes = axes.map(function (_, i) { var p = pt(i, R); return '<line x1="' + cx + '" y1="' + cy + '" x2="' + p.x.toFixed(1) + '" y2="' + p.y.toFixed(1) + '" stroke="var(--line2)"/>'; }).join("");
  return '<svg viewBox="0 0 240 220" class="radar">' + grid.join("") + spokes +
    '<polygon points="' + pts.join(" ") + '" fill="rgba(229,22,43,.28)" stroke="var(--red2)" stroke-width="2"/>' + labels + "</svg>";
}
function starsHTML(v) {
  var s = "";
  for (var i = 1; i <= 5; i++) s += '<i class="' + (v >= i ? "on" : v >= i - 0.5 ? "half" : "") + '"></i>';
  return '<span class="st5">' + s + "</span>";
}
function mapCard(map) {
  var r = rng(h32("mc:" + map)), hue = Math.floor(r() * 360);
  return "linear-gradient(135deg, hsl(" + hue + ",40%,22%), hsl(" + ((hue + 40) % 360) + ",45%,10%))";
}

/* Troféu ilustrado (menu principal). */
function trophy() {
  return '<svg viewBox="0 0 300 420" class="trophy" aria-hidden="true"><defs>' +
    '<linearGradient id="tg" x1="0" x2="1"><stop offset="0" stop-color="#7A5A12"/><stop offset=".35" stop-color="#F6D77A"/><stop offset=".5" stop-color="#FFF4C8"/><stop offset=".65" stop-color="#E4B447"/><stop offset="1" stop-color="#6B4C0E"/></linearGradient>' +
    '<linearGradient id="ts" x1="0" x2="1"><stop offset="0" stop-color="#3A3F4B"/><stop offset=".4" stop-color="#C9CED8"/><stop offset=".55" stop-color="#F4F6FA"/><stop offset=".7" stop-color="#9DA3AF"/><stop offset="1" stop-color="#2B2F38"/></linearGradient>' +
    '<linearGradient id="tb" x1="0" x2="1"><stop offset="0" stop-color="#141724"/><stop offset=".5" stop-color="#3A4166"/><stop offset="1" stop-color="#10121C"/></linearGradient>' +
    '<linearGradient id="shine" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
    '<clipPath id="cupclip"><path d="M70 60 H230 C230 150 214 220 150 246 C86 220 70 150 70 60Z M128 246 H172 L166 300 H134Z M86 316 H214 L228 392 H72Z"/></clipPath></defs>' +
    '<ellipse cx="150" cy="400" rx="120" ry="14" fill="#000" opacity=".55"/>' +
    '<path d="M72 78 C18 70 18 156 92 180" fill="none" stroke="url(#tg)" stroke-width="13" stroke-linecap="round"/>' +
    '<path d="M228 78 C282 70 282 156 208 180" fill="none" stroke="url(#tg)" stroke-width="13" stroke-linecap="round"/>' +
    '<path d="M70 60 H230 C230 150 214 220 150 246 C86 220 70 150 70 60Z" fill="url(#ts)"/>' +
    '<rect x="71" y="92" width="158" height="24" fill="url(#tg)"/>' +
    '<ellipse cx="150" cy="60" rx="80" ry="12" fill="url(#tg)"/><ellipse cx="150" cy="58" rx="66" ry="7" fill="#3A2A08" opacity=".6"/>' +
    '<path d="M150 140 L176 150 L172 184 Q166 202 150 212 Q134 202 128 184 L124 150Z" fill="url(#tg)" opacity=".95"/>' +
    '<path d="M150 152 L164 158 L162 180 Q158 192 150 198 Q142 192 138 180 L136 158Z" fill="#2A1E06" opacity=".35"/>' +
    '<path d="M134 138 L140 124 L150 133 L160 124 L166 138Z" fill="url(#tg)"/>' +
    '<path d="M128 246 H172 L166 300 H134Z" fill="url(#tg)"/>' +
    '<rect x="104" y="298" width="92" height="18" rx="4" fill="url(#tg)"/>' +
    '<path d="M86 316 H214 L228 392 H72Z" fill="url(#tb)"/><rect x="116" y="340" width="68" height="24" rx="3" fill="url(#tg)" opacity=".9"/>' +
    '<text x="150" y="357" text-anchor="middle" font-family="Saira Condensed, sans-serif" font-weight="800" font-style="italic" font-size="15" fill="#3A2A08">VCT</text>' +
    '<g clip-path="url(#cupclip)"><rect class="shinebar" x="-90" y="0" width="70" height="420" fill="url(#shine)"/></g>' +
    '<circle cx="150" cy="46" r="4" fill="#FFF7D6" class="spark"/></svg>';
}

window.ART = { setCustom:setCustom, clearCustom:clearCustom, trophy:trophy, avatar:avatar, face:face, crest:crest, teamColors:teamColors, layout:layout, mapSVG:mapSVG, along:along,
  ring:ring, radar:radar, stars:starsHTML, mapCard:mapCard };
})();
