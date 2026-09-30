/* =====================================================================
   VCT MANAGER — motor do jogo
   Mundo, jogadores, simulação de partida, competições e temporada.
   Nada aqui mexe na tela; a interface fica em ui.js.
   ===================================================================== */
(function () {
"use strict";

/* ---------------------------------------------------------------------
   Utilidades
   --------------------------------------------------------------------- */
function hashStr(s) {
  var h = 2166136261 >>> 0;
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var rng = Math.random; // trocado por RNG com semente em novo jogo
function R() { return rng(); }
function ri(a, b) { return a + Math.floor(R() * (b - a + 1)); }
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function pick(arr) { return arr[Math.floor(R() * arr.length)]; }
function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(R() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
function sum(arr) { var s = 0; for (var i = 0; i < arr.length; i++) s += arr[i]; return s; }

/* ---------------------------------------------------------------------
   Constantes do jogo
   --------------------------------------------------------------------- */
var AGENT_ROLE = {
  Jett:"D", Raze:"D", Phoenix:"D", Reyna:"D", Neon:"D", Yoru:"D", Iso:"D", Waylay:"D",
  Sova:"I", Fade:"I", Skye:"I", Breach:"I", "KAY/O":"I", Gekko:"I", Tejo:"I",
  Omen:"C", Viper:"C", Astra:"C", Harbor:"C", Brimstone:"C", Clove:"C", Miks:"C",
  Cypher:"S", Killjoy:"S", Sage:"S", Chamber:"S", Deadlock:"S", Vyse:"S", Veto:"S"
};
var AGENTS = Object.keys(AGENT_ROLE).sort();
var ROLE_NAME = { D:"Duelista", I:"Iniciador", C:"Controlador", S:"Sentinela", F:"Flex" };

/* Chance base de o ATAQUE vencer um round em cada mapa (valores do jogo). */
var MAP_ATK = { Ascent:.47, Abyss:.49, Haven:.50, Lotus:.48, Split:.45, Sunset:.48, Summit:.50, Bind:.48, Breeze:.51, Icebox:.50, Fracture:.49, Pearl:.47, Corrode:.49 };

/* Peso de cada atributo por função, para calcular o geral (OVR). */
var ROLE_W = {
  D: { aim:.40, util:.10, sense:.25, clutch:.15, comms:.10 },
  I: { aim:.20, util:.35, sense:.25, clutch:.05, comms:.15 },
  C: { aim:.15, util:.30, sense:.30, clutch:.05, comms:.20 },
  S: { aim:.20, util:.25, sense:.30, clutch:.15, comms:.10 },
  F: { aim:.22, util:.22, sense:.22, clutch:.17, comms:.17 }
};

/* Jogadores com ajuste de destaque na geração de atributos.
   É uma opinião de design do jogo, não um dado oficial. */
var STARS = {
  aspas:6, Derke:6, Jinggg:5, something:6, mada:5, zekken:5, ZmjjKK:6, "f0rsakeN":5,
  kiNgg:4, Chronicle:5, Demon1:5, Asuna:4, Cryocells:4, leaf:4, jawgemo:4, LewN:4,
  kamo:4, Wo0t:4, Dambi:4, t3xture:4, BuZz:4, Meteor:4, tkzin:3, UdoTan:4, invy:4,
  "d4v41":4, N4RRATE:4, Avez:3, SUYGETSU:4, Less:3, Boaster:2, nAts:4, Timotino:3,
  valyn:3, trent:3, Ethan:3, skuba:3, Rb:4, Francis:3, Xross:3, crownfisher:3, jkuro:4,
  splash:4, slowly:3, spike:3, Sato:3, blowz:3, Neon:3, Mazino:3, Verno:2
};

var CHAL = ["CBR", "CNA", "CLAT", "CEMEA", "CPAC", "CCN"];
function isChal(l) { return CHAL.indexOf(l) >= 0; }
var NAT_POOL = {
  AMER:["US","US","US","CA","BR","BR","CL","AR","MX","CO"],
  EMEA:["TR","TR","FR","GB","PL","RU","ES","DE","FI","SE"],
  PAC: ["KR","KR","JP","JP","PH","SG","ID","TH","AU","IN"],
  CN:  ["CN","CN","CN","CN","CN","HK","TW"],
  CBR: ["BR"],
  CNA: ["US","US","CA"],
  CLAT:["CL","AR","MX","CO","PE"],
  CEMEA:["TR","FR","DE","PL","ES","GB"],
  CPAC:["KR","JP","TH","PH","VN"],
  CCN: ["CN"]
};
var SYL = ["ka","zu","ri","no","ve","xi","lo","ta","mi","ra","do","ne","vy","ko","sa","fe","lu","ga","ph","tr"];
function fakeNick() {
  var n = pick(SYL) + pick(SYL) + (R() < .5 ? pick(SYL) : "");
  if (R() < .25) n += ri(1, 99);
  if (R() < .35) n = n.charAt(0).toUpperCase() + n.slice(1);
  return n;
}

/* Premiação em US$. Champions = valores reais de 2026 no topo; o resto é
   aproximado para o jogo. */
var PRIZE = {
  CHAMPIONS: [1000000, 400000, 250000, 130000, 80000, 80000, 60000, 60000, 40000, 40000, 40000, 40000, 30000, 30000, 30000, 30000],
  MASTERS:   [500000, 250000, 150000, 100000, 60000, 60000, 40000, 40000, 25000, 25000, 25000, 25000],
  STAGE:     [100000, 60000, 40000, 25000, 15000, 15000, 10000, 10000],
  KICKOFF:   [60000, 40000, 25000, 15000],
  CBR:       [30000, 15000, 10000, 6000, 3000, 3000, 2000, 2000]
};
/* Pontos de campeonato (CP) — tabela de 2026. */
var CP = {
  KICKOFF: [4, 3, 2, 1],
  STAGE1:  [6, 4, 3, 2],
  STAGE2:  [8, 6, 5, 4],
  SANTIAGO:[6, 4, 3, 2, 1, 1],
  LONDON:  [8, 6, 5, 4, 3, 3]
};

/* ---------------------------------------------------------------------
   Estado global
   --------------------------------------------------------------------- */
var S = null; // estado do jogo (serializável)

function P(id) { return S.players[id]; }
function T(id) { return S.teams[id]; }

/* ---------------------------------------------------------------------
   Jogadores
   --------------------------------------------------------------------- */
function ovr(p) {
  var w = ROLE_W[p.role] || ROLE_W.F;
  return Math.round(p.aim * w.aim + p.util * w.util + p.sense * w.sense + p.clutch * w.clutch + p.comms * w.comms);
}
function salaryFor(o) { return Math.max(8000, Math.round(Math.pow(Math.max(0, o - 50), 2) * 160 / 1000) * 1000); }
function valueFor(p) {
  var o = ovr(p);
  var ageF = p.age <= 21 ? 1.35 : p.age <= 24 ? 1.15 : p.age <= 27 ? 1.0 : 0.75;
  return Math.round(salaryFor(o) * 1.6 * ageF * (0.6 + 0.4 * p.contract) / 1000) * 1000;
}

function genAttrs(base, role, star, seedKey) {
  var r = mulberry(hashStr(seedKey));
  function v(bias) { return clamp(Math.round(base + bias + (r() * 10 - 5) + star), 35, 97); }
  var b = { D:{aim:4,util:-4,sense:0,clutch:2,comms:-2}, I:{aim:-2,util:4,sense:1,clutch:-1,comms:2},
            C:{aim:-3,util:3,sense:2,clutch:-2,comms:4}, S:{aim:-1,util:1,sense:3,clutch:2,comms:0},
            F:{aim:1,util:1,sense:1,clutch:1,comms:1} }[role] || {};
  return { aim:v(b.aim||0), util:v(b.util||0), sense:v(b.sense||0), clutch:v(b.clutch||0), comms:v(b.comms||0) };
}

/* Atributos de exibição/efeito além dos 5 centrais (mira, util, leitura, clutch, comunicação). */
var EXTRA = ["mov", "op", "lead", "team", "cons", "comp", "reflex", "perc", "stam"];
function genExtra(p) {
  var r = mulberry(hashStr("x:" + p.nick + ":" + p.age));
  function v(base, spread) { return clamp(Math.round(base + (r() * 2 - 1) * spread), 30, 97); }
  var opFav = p.agents.indexOf("Jett") >= 0 || p.agents.indexOf("Chamber") >= 0 ? 8 : -10;
  p.mov = v(p.aim - 2 + (p.role === "D" ? 4 : 0), 6);
  p.op = v(p.aim + opFav, 7);
  p.lead = v(55 + (p.role === "C" ? 10 : p.role === "I" ? 4 : 0) + (p.age - 20) * 1.2 + (p.comms - 70) * 0.4, 9);
  p.team = v(p.comms - 2, 7);
  p.cons = v(p.sense - 4, 8);
  p.comp = v(p.clutch - 3, 8);
  p.reflex = v(p.aim + 2 - Math.max(0, p.age - 25) * 1.5, 6);
  p.perc = v(p.sense, 6);
  p.stam = v(72, 12);
  var pot = ovr(p) + Math.max(0, 24 - p.age) * 1.4 + r() * 6;
  p.pot = clamp(Math.round(pot), ovr(p), 95);
  if (p.saude == null) p.saude = 100;
}
function stars5(v, lo, hi) { return clamp(Math.round(((v - lo) / (hi - lo)) * 10) / 2, 0.5, 5); }
function playerStars(p) { return stars5(ovr(p), 55, 88); }
function potStars(p) { return stars5(Math.max(p.pot || 0, ovr(p)), 55, 90); }

function newPlayer(o) {
  var id = "p" + (S.nextId++);
  var p = {
    id:id, nick:o.nick, nat:o.nat || "??", role:o.role || "F", agents:o.agents || [],
    age:o.age, aim:o.aim, util:o.util, sense:o.sense, clutch:o.clutch, comms:o.comms,
    form:0, morale:70, contract:o.contract || ri(1, 3), teamId:o.teamId || null,
    gerado:!!o.gerado, salary:0, stats:{ mapas:0, k:0, d:0, a:0, acsSum:0 }
  };
  p.salary = salaryFor(ovr(p));
  genExtra(p);
  S.players[id] = p;
  return p;
}

function baseForTier(liga, nivel) {
  if (isChal(liga)) return [0, 60, 63, 66, 69, 72][nivel];
  if (liga === "DESAF") return 64;
  return [0, 68, 72, 76, 80, 84][nivel];
}

function genFiller(liga, base, teamId, needRole) {
  var role = needRole || pick(["D", "I", "C", "S", "F"]);
  var nick = fakeNick();
  var at = genAttrs(base - 3, role, 0, nick + ri(1, 1e6));
  var ag = AGENTS.filter(function (a) { return AGENT_ROLE[a] === role; });
  if (role === "F") ag = AGENTS.slice();
  ag = shuffle(ag).slice(0, 3);
  return newPlayer({ nick:nick, nat:pick(NAT_POOL[liga] || NAT_POOL.AMER), role:role, agents:ag,
    age:ri(17, 25), teamId:teamId, gerado:true,
    aim:at.aim, util:at.util, sense:at.sense, clutch:at.clutch, comms:at.comms });
}

/* ---------------------------------------------------------------------
   Staff (nomes gerados; técnico usa o nome real do banco de dados)
   --------------------------------------------------------------------- */
var STAFF_ROLES = ["tecnico", "analista", "psicologo", "fisio", "olheiro"];
var STAFF_NOME = { tecnico:"Técnico", analista:"Analista", psicologo:"Psicólogo", fisio:"Fisioterapeuta", olheiro:"Olheiro" };
var STAFF_EFEITO = {
  tecnico:"Acelera a evolução no treino e dá um pequeno bônus de força ao time.",
  analista:"Prepara o time pro adversário: bônus por mapa e leitura melhor da defesa rival.",
  psicologo:"Segura a moral e deixa a pausa tática mais eficiente.",
  fisio:"Recupera a saúde dos jogadores mais rápido entre os jogos.",
  olheiro:"Permite observar mais jogadores de outros times por fase."
};
var FIRST = ["Lucas","Rafael","Bruno","Diego","Mateo","Tomás","Noah","Liam","Jonas","Emil","Hugo","Kaan","Emre","Yuki","Kenji","Min","Jae","Arif","Nico","Samir","Leo","Ivan","Marek","Oskar","Felix","Tiago","Caio","Enzo","Theo","Ravi"];
var LAST = ["Moreira","Silva","Castro","Weber","Novak","Kaya","Tanaka","Park","Lee","Santos","Ferreira","Duarte","Lindqvist","Kowal","Petrov","Ortega","Rossi","Nakamura","Choi","Aydin","Brandt","Lopes","Keller","Varga","Reyes"];
function staffSalary(nivel, chal) { return Math.max(2000, Math.round((chal ? 1500 : 5000) * nivel * nivel / 1000) * 1000); }
/* Atributos do manager (1-20, 10 = neutro). Só valem para o time do usuário. */
var MGR_ATTRS = {
  financas:["Educação financeira", "Mais receita de patrocínio a cada fase."],
  negociacao:["Negociação", "Clubes aceitam ofertas mais baixas pelos jogadores."],
  motivacao:["Motivação", "Moral cai menos nas derrotas e sobe mais nas vitórias."],
  tatica:["Leitura tática", "Pequeno bônus nos rounds, maior quando o plano encaixa."],
  desenvolvimento:["Desenvolvimento", "Jogadores evoluem mais rápido no treino."],
  estresse:["Resistência ao estresse", "Pausas táticas mais eficientes."]
};
function mgr(k) { return S && S.manager && S.manager.attrs && S.manager.attrs[k] != null ? S.manager.attrs[k] : 10; }
function baseIncome(t) { return isChal(t.liga) ? 45000 : 150000; }
function incomeFor(t) { var base = baseIncome(t) + sponsorIncome(t); return t.id === S.userTeam ? Math.round(base * dif().money * (S.spPerf || 1) * (1 + (mgr("financas") - 10) * 0.015) / 1000) * 1000 : base; }
function salaryCap(t) { return (isChal(t.liga) ? 560000 : 1750000) * (S.dif === "pesadelo" ? 0.9 : S.dif === "facil" ? 1.2 : 1); }
function payroll(t) { return sum(t.roster.map(function (pid) { return P(pid).salary; })) + staffPayroll(t); }
function newStaff(role, nivel, nome, teamId, chal) {
  var id = "s" + (S.nextId++);
  var st = { id:id, role:role, nivel:clamp(nivel, 1, 5), teamId:teamId || null,
    nome:nome || (pick(FIRST) + " " + pick(LAST)), nat:"??", salario:0 };
  st.salario = staffSalary(st.nivel, chal);
  S.staff[id] = st;
  return st;
}
function staffOf(team, role) { var id = team.staff && team.staff[role]; return id ? S.staff[id] : null; }
function staffLvl(team, role) { var s = staffOf(team, role); return s ? s.nivel : 0; }

/* ---------------------------------------------------------------------
   Táticas por mapa e lado
   --------------------------------------------------------------------- */
var SITES = { Ascent:["A","B"], Abyss:["A","B"], Haven:["A","B","C"], Lotus:["A","B","C"], Split:["A","B"], Sunset:["A","B"], Summit:["A","B"], Bind:["A","B"], Breeze:["A","B"], Icebox:["A","B"], Fracture:["A","B"], Pearl:["A","B"], Corrode:["A","B"] };
var ATK_PLANOS = { padrao:"Padrão (espalha e decide no meio)", exec:"Execução no site", split:"Dividir o site", rush:"Rush", fake:"Fake e rotação", lurk:"Lurk + contato" };
var DEF_SETUPS = { padrao:"Padrão (2-1-2)", stack:"Stack num site", agressivo:"Agressivo (pegar espaço)", retake:"Ceder e retomar" };
function defaultTactic(map) {
  return { estilo:{ atk:"padrao", def:"padrao" }, atk:{ plano:"padrao", site:"variar", ritmo:"medio", eco:"rush", compra:{ pistol:"igual", full:"igual", force:"igual", eco:"rush" } },
           def:{ setup:"padrao", site:SITES[map] ? SITES[map][0] : "A", rotacao:"media" } };
}
function ensureTactics(team) {
  team.taticas = team.taticas || {};
  S.mapas.forEach(function (m) {
    var t = team.taticas[m];
    if (!t) { team.taticas[m] = defaultTactic(m); return; }
    if (!t.estilo) t.estilo = { atk:"padrao", def:"padrao" };
    if (!t.atk.compra) t.atk.compra = { pistol:"igual", full:"igual", force:"igual", eco:t.atk.eco || "rush" };
  });
}

/* Interação ataque × defesa: retorna termo (logit) a favor do ATAQUE. */
function tacticTerm(a, d) {
  var hitStack = d.setup === "stack" && d.site === a.site;
  var otherStack = d.setup === "stack" && d.site !== a.site;
  var fakeSite = a.fakeSite;
  var t = 0;
  switch (a.plano) {
    case "exec":  t = hitStack ? -0.30 : otherStack ? 0.30 : d.setup === "agressivo" ? 0.10 : d.setup === "retake" ? -0.06 : 0.05; break;
    case "rush":  t = hitStack ? -0.40 : otherStack ? 0.35 : d.setup === "agressivo" ? -0.20 : d.setup === "retake" ? -0.05 : 0.10; break;
    case "split": t = hitStack ? -0.15 : otherStack ? 0.20 : d.setup === "agressivo" ? -0.05 : 0.10; break;
    case "fake":  t = (d.setup === "stack" && d.site === fakeSite) ? 0.35 : hitStack ? -0.25 : 0.02; break;
    case "lurk":  t = d.setup === "agressivo" ? 0.10 : d.setup === "retake" ? -0.10 : 0.05; break;
    default:      t = d.setup === "stack" ? 0.05 : 0;
  }
  if (d.rotacao === "rapida") t += a.plano === "fake" ? 0.12 : -0.05;
  if (d.rotacao === "lenta") t += a.plano === "fake" ? -0.06 : 0.05;
  return t;
}

/* ---------------------------------------------------------------------
   Criação do mundo
   --------------------------------------------------------------------- */
function newWorld(db, seed) {
  rng = mulberry(seed >>> 0);
  S = {
    versao: 3, seed: seed, nextId: 1, staff: {}, staffLivre: [], scout: {}, scoutUsados: 0, treinoMapas: [], temporada: db.temporada, mapas: db.mapas.slice(),
    ligasNome: db.ligas, teams: {}, players: {}, freeAgents: [], userTeam: null,
    fase: 0, eventos: [], noticias: [], historico: [], cp: {}, treino: "equilibrado", treinoMapa: db.mapas[0],
    janela: true, ultimoRelatorio: null, conquistas: []
  };

  db.times.forEach(function (t) {
    var id = t.tag;
    var team = {
      id:id, tag:t.tag, nome:t.nome, liga:t.liga, pais:t.pais, nivel:t.nivel, tecnico:t.tecnico || "—",
      incerto:!!t.incerto, roster:[], cash:0, mapProf:{}, desafiante:false
    };
    var base = baseForTier(t.liga, t.nivel);
    t.jogadores.forEach(function (row) {
      var nick = row[0], nat = row[1], role = row[2], agents = row.slice(3);
      var star = STARS[nick] || 0;
      var at = genAttrs(base, role, star, db.temporada + ":" + nick);
      var r = mulberry(hashStr("age:" + nick));
      var p = newPlayer({ nick:nick, nat:nat, role:role, agents:agents, age:18 + Math.floor(r() * 10),
        teamId:id, aim:at.aim, util:at.util, sense:at.sense, clutch:at.clutch, comms:at.comms });
      team.roster.push(p.id);
    });
    while (team.roster.length < 5) {
      var need = missingRole(team.roster.map(P));
      team.roster.push(genFiller(t.liga, base, id, need).id);
    }
    S.mapas.forEach(function (m) {
      var r = mulberry(hashStr(id + ":" + m));
      team.mapProf[m] = clamp(Math.round(50 + t.nivel * 4 + (r() * 24 - 12)), 35, 92);
    });
    team.cash = isChal(t.liga) ? 60000 + t.nivel * 15000 : 500000 + t.nivel * 60000;
    team.staff = {};
    var chal = isChal(t.liga);
    STAFF_ROLES.forEach(function (role) {
      var lvl = clamp(Math.round(t.nivel * 0.7 + (chal ? 0.4 : 1.4) + (R() * 1.6 - 0.8)), 1, 5);
      if (role !== "tecnico" && chal && R() < 0.45) return; /* tier 2 muitas vezes não tem staff completo */
      var nome = role === "tecnico" && t.tecnico && t.tecnico !== "—" ? t.tecnico : null;
      team.staff[role] = newStaff(role, lvl, nome, id, chal).id;
    });
    S.teams[id] = team;
    ensureTactics(team);
  });

  /* Agentes livres fictícios. */
  ["AMER", "AMER", "EMEA", "PAC", "CN", "CBR", "CBR", "CNA", "CLAT", "CEMEA", "CPAC"].forEach(function (liga) {
    for (var i = 0; i < 6; i++) {
      var p = genFiller(liga, ri(60, 74), null);
      p.contract = 0;
      S.freeAgents.push(p.id);
    }
  });

  STAFF_ROLES.forEach(function (role) {
    for (var i = 0; i < 6; i++) S.staffLivre.push(newStaff(role, ri(1, 5), null, null, R() < .4).id);
  });
  Object.keys(S.teams).forEach(function (id) { S.cp[id] = 0; });
  S.treinoMapas = S.mapas.slice(0, 3);
  S.transacoes = []; S.transfers = []; S.finHist = []; S.finAcc = { receita:0, despesa:0 };
  eloInit(); metaInit(); S.academia = []; S.academiaNivel = 1; S.hof = { temporadas:[], lendas:[] };
  buildPhase(0);
  return S;
}

function missingRole(players) {
  var have = {};
  players.forEach(function (p) { have[p.role] = (have[p.role] || 0) + 1; });
  var order = ["C", "I", "S", "D", "F"];
  for (var i = 0; i < order.length; i++) if (!have[order[i]]) return order[i];
  return "F";
}

/* ---------------------------------------------------------------------
   Composição e força
   --------------------------------------------------------------------- */
function autoComp(team, map) {
  var players = activeFive(team);
  var used = {}, comp = {};
  var needOrder = ["C", "I", "S", "D"];
  var remaining = players.slice();

  needOrder.forEach(function (need) {
    var best = null, bestScore = -1e9, bestAgent = null;
    remaining.forEach(function (p) {
      var cand = p.agents.filter(function (a) { return AGENT_ROLE[a] === need && !used[a]; });
      if (!cand.length && p.agents.length === 0 && (p.role === need || p.role === "F")) {
        cand = AGENTS.filter(function (a) { return AGENT_ROLE[a] === need && !used[a]; }).slice(0, 1);
      }
      if (!cand.length) return;
      cand.sort(function (a, b) { return metaBonus(b) - metaBonus(a); });
      var sc = (p.role === need ? 3 : 0) + (p.agents.indexOf(cand[0]) === 0 ? 1 : 0) + metaBonus(cand[0]) * 0.4 + ovr(p) / 100;
      if (sc > bestScore) { bestScore = sc; best = p; bestAgent = cand[0]; }
    });
    if (best) {
      comp[best.id] = bestAgent; used[bestAgent] = 1;
      remaining = remaining.filter(function (p) { return p !== best; });
    }
  });
  remaining.forEach(function (p) {
    var a = p.agents.filter(function (x) { return !used[x]; })[0];
    if (!a) a = AGENTS.filter(function (x) { return !used[x] && (p.role === "F" || AGENT_ROLE[x] === p.role); })[0];
    if (!a) a = AGENTS.filter(function (x) { return !used[x]; })[0];
    comp[p.id] = a; used[a] = 1;
  });
  return comp;
}

function healthy(p) { return !(p.lesao && p.lesao.dias > 0); }
function activeFive(team) {
  var list = team.roster.map(P);
  var five;
  if (team.lineup && team.lineup.length === 5 && team.lineup.every(function (id) { return team.roster.indexOf(id) >= 0; })) five = team.lineup.map(P);
  else { list.sort(function (a, b) { return ovr(b) - ovr(a); }); five = list.slice(0, 5); }
  if (five.every(healthy)) return five;
  var bench = list.filter(function (p) { return five.indexOf(p) < 0 && healthy(p); }).sort(function (a, b) { return ovr(b) - ovr(a); });
  return five.map(function (p) { return healthy(p) || !bench.length ? p : bench.shift(); });
}

function compAnalysis(team, comp) {
  var five = activeFive(team);
  var cnt = { D:0, I:0, C:0, S:0 }, notes = [], perPlayer = {};
  five.forEach(function (p) {
    var a = comp[p.id];
    var role = AGENT_ROLE[a];
    if (role) cnt[role]++;
    var pen = 0;
    if (p.agents.length) {
      if (p.agents.indexOf(a) < 0) { pen -= (p.role === "F" || p.role === role) ? 2.5 : 4.5; }
    } else if (!(p.role === "F" || p.role === role)) pen -= 2;
    pen += metaBonus(a) * 0.6;
    perPlayer[p.id] = pen;
    if (pen <= -4) notes.push(p.nick + " fora da função (" + a + ")");
    else if (pen < 0) notes.push(p.nick + " fora do pool (" + a + ")");
  });
  var cov = 0;
  if (cnt.C === 0) { cov -= 3; notes.push("sem controlador"); }
  if (cnt.I === 0) { cov -= 1.5; notes.push("sem iniciador"); }
  if (cnt.S === 0) { cov -= 1; notes.push("sem sentinela"); }
  if (cnt.D === 0) { cov -= 1; notes.push("sem duelista"); }
  if (cnt.D >= 3) { cov -= 1.5; notes.push("duelistas demais"); }
  if (cnt.C >= 3) { cov -= 1; notes.push("controladores demais"); }
  return { cnt:cnt, cov:cov, notes:notes, perPlayer:perPlayer };
}

function teamEff(team, map, comp) {
  var five = activeFive(team);
  var an = compAnalysis(team, comp);
  var base = sum(five.map(function (p) {
    var sa = p.saude == null ? 100 : p.saude;
    return ovr(p) + p.form * 0.8 * (1.2 - (p.cons || 70) / 250) + (p.morale - 70) * 0.04 + an.perPlayer[p.id] - Math.max(0, 75 - sa) * 0.09 - (healthy(p) ? 0 : 6);
  })) / 5;
  var lead = Math.max.apply(null, five.map(function (p) { return p.lead || 60; }));
  var tw = sum(five.map(function (p) { return p.team || 65; })) / 5;
  var staffB = (staffLvl(team, "tecnico") - 3) * 0.35 + (staffLvl(team, "analista") - 2.5) * 0.2;
  var quim = ((team.quimica == null ? 75 : team.quimica) - 75) * 0.05;
  var aiB = S.userTeam && team.id !== S.userTeam ? dif().ai : 0;
  return base + an.cov + qgEff(team) + quim + aiB + ((team.mapProf[map] || 60) - 60) * 0.06 + (lead - 65) * 0.03 + (tw - 65) * 0.02 + staffB;
}

/* ---------------------------------------------------------------------
   Simulação de mapa (round a round)
   --------------------------------------------------------------------- */
var BUY = { pistol:{ cost:800, str:1.0 }, eco:{ cost:400, str:0.45 }, force:{ cost:2400, str:0.76 }, full:{ cost:3900, str:1.0 } };
var BUY_NAME = { pistol:"Pistol", eco:"Eco", force:"Force", full:"Full buy" };

function newMapSim(A, B, map, opts) {
  /* opts: { atkFirst: "A"|"B", compA, compB, styleA, styleB, userSide: "A"|"B"|null } */
  var s = {
    A:A.id, B:B.id, map:map, atkFirst:opts.atkFirst || "A",
    compA:opts.compA || autoComp(A, map), compB:opts.compB || autoComp(B, map),
    styleA:opts.styleA || "padrao", styleB:opts.styleB || "padrao",
    sa:0, sb:0, round:0, credA:800, credB:800, lossA:0, lossB:0, streakA:0, streakB:0,
    toA:2, toB:2, toBoostA:0, toBoostB:0, callA:"auto", callB:"auto",
    rounds:[], stats:{}, done:false, winner:null, userSide:opts.userSide || null,
    effA:0, effB:0, histA:[], histB:[], tacA:opts.tacA || null, tacB:opts.tacB || null
  };
  s.effA = teamEff(A, map, s.compA);
  s.effB = teamEff(B, map, s.compB);
  if (opts.pressao) {
    var pr = function (t) { return sum(activeFive(t).map(function (p) { return ((p.comp || 70) - 70) * 0.05 + ((p.clutch || 70) - 70) * 0.02; })) / 5; };
    s.effA += pr(A); s.effB += pr(B); s.pressao = true;
  }
  activeFive(A).concat(activeFive(B)).forEach(function (p) { s.stats[p.id] = { k:0, d:0, a:0, fk:0, dmg:0 }; });
  return s;
}

function sideOf(s, who, rnd) {
  /* rnd = índice do round (0-based). 0-11 primeira metade, 12-23 segunda, 24+ prorrogação alterna. */
  var firstAtk = s.atkFirst === who;
  if (rnd < 12) return firstAtk ? "atk" : "def";
  if (rnd < 24) return firstAtk ? "def" : "atk";
  var ot = rnd - 24;
  var atkThisOt = (ot % 2 === 0) ? !firstAtk : firstAtk;
  return atkThisOt ? "atk" : "def";
}

function decideBuy(cred, lossStreak, rnd, call, myScore, oppScore, oppCred) {
  if (rnd === 0 || rnd === 12) return "pistol";
  if (rnd >= 24) return "full";
  var lastOfHalf = (rnd === 11 || rnd === 23);
  var can = function (t) { return cred >= BUY[t].cost; };
  if (call === "full") return can("full") ? "full" : (can("force") ? "force" : "eco");
  if (call === "force") return can("force") ? "force" : "eco";
  if (call === "eco") return "eco";
  if (can("full")) return "full";
  if (lastOfHalf && can("force")) return "force";
  if (oppScore >= 11 && can("force")) return "force";
  var nextCred = cred - BUY.eco.cost + 1900 + 500 * Math.min(lossStreak, 2);
  if (can("force") && (nextCred < BUY.full.cost || oppCred < 2000)) return "force";
  return "eco";
}

var AI_ATK = [["padrao", 30], ["exec", 25], ["split", 15], ["rush", 10], ["fake", 10], ["lurk", 10]];
function wpick(list) { var tot = sum(list.map(function (x) { return x[1]; })), r = R() * tot;
  for (var i = 0; i < list.length; i++) { r -= list[i][1]; if (r <= 0) return list[i][0]; } return list[0][0]; }

function resolveAtk(s, who, buy) {
  var team = T(who === "A" ? s.A : s.B), sites = SITES[s.map] || ["A", "B"];
  var tac = (who === "A" ? s.tacA : s.tacB);
  var plano, site;
  if (tac && s.userSide === who) {
    var pc = tac.atk.compra && tac.atk.compra[buy];
    plano = pc && pc !== "igual" ? pc : (buy === "eco" && tac.atk.eco && tac.atk.eco !== "igual") ? tac.atk.eco : tac.atk.plano;
    site = tac.atk.site === "variar" ? pick(sites) : tac.atk.site;
  } else {
    var pf = teamProfile(team);
    plano = buy === "eco" ? (R() < .55 ? "rush" : "padrao") : wpickObj(pf.planos);
    /* IA evita repetir site que acabou de tomar stack */
    var hist = who === "A" ? s.histA : s.histB, last = hist[hist.length - 1];
    site = wpickObj(pf.sites, sites);
    if (last && last.stacked && last.site === site && R() < .7) site = pick(sites.filter(function (x) { return x !== site; }));
    var hd = ((who === "A" ? s.hdB : s.hdA) || []).slice(-4);
    if (hd.length >= 3 && buy !== "eco") {
      var dc = {}; hd.forEach(function (h) { dc[h.setup] = (dc[h.setup] || 0) + 1; });
      var topD = Object.keys(dc).sort(function (a, b) { return dc[b] - dc[a]; })[0];
      var rp = (0.25 + 0.06 * (staffLvl(team, "analista") - 2.5)) * dif().read;
      if (dc[topD] >= 3 && R() < rp) {
        if (topD === "stack") { var stS = hd[hd.length - 1].site; plano = "exec"; site = pick(sites.filter(function (x) { return x !== stS; })) || site; }
        else plano = { agressivo:"exec", retake:"split", padrao:"split" }[topD] || plano;
      }
    }
  }
  if (sites.indexOf(site) < 0) site = sites[0];
  var fakeSite = plano === "fake" ? pick(sites.filter(function (x) { return x !== site; })) : null;
  return { plano:plano, site:site, fakeSite:fakeSite, ritmo:tac && s.userSide === who ? tac.atk.ritmo : pick(["rapido", "medio", "medio", "lento"]) };
}
function resolveDef(s, who, atkWho) {
  var team = T(who === "A" ? s.A : s.B), sites = SITES[s.map] || ["A", "B"];
  var tac = (who === "A" ? s.tacA : s.tacB);
  if (tac && s.userSide === who) return { setup:tac.def.setup, site:tac.def.site, rotacao:tac.def.rotacao };
  /* IA lê a tendência do ataque adversário */
  var hist = (atkWho === "A" ? s.histA : s.histB).slice(-4);
  var cnt = {}; hist.forEach(function (h) { cnt[h.site] = (cnt[h.site] || 0) + 1; });
  var top = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; })[0];
  var sense = sum(activeFive(team).map(function (p) { return p.sense; })) / 5;
  var readP = (0.22 + 0.08 * (staffLvl(team, "analista") - 2.5) + (sense - 72) * 0.01) * dif().read;
  var pc = {}; hist.forEach(function (h) { pc[h.plano] = (pc[h.plano] || 0) + 1; });
  var topP = Object.keys(pc).sort(function (a, b) { return pc[b] - pc[a]; })[0];
  if (topP && pc[topP] >= 3 && R() < readP * 1.1) {
    var COUNTER = { exec:"stack", padrao:"stack", rush:"agressivo", split:"retake", fake:"padrao", lurk:"retake" };
    var cs = COUNTER[topP] || "padrao";
    return { setup:cs, site:top || pick(sites), rotacao:topP === "fake" ? "lenta" : "media" };
  }
  if (top && cnt[top] / Math.max(1, hist.length) >= 0.5 && R() < readP) return { setup:"stack", site:top, rotacao:"media" };
  var setup = wpickObj(teamProfile(team).def);
  return { setup:setup, site:pick(sites), rotacao:pick(["rapida", "media", "media", "lenta"]) };
}

function styleOf(s, who, side) {
  var tac = who === "A" ? s.tacA : s.tacB;
  if (tac && s.userSide === who && tac.estilo && tac.estilo[side]) return tac.estilo[side];
  var st = who === "A" ? s.styleA : s.styleB;
  if (st && st !== "padrao") return st;
  var pf = teamProfile(T(who === "A" ? s.A : s.B));
  return side === "atk" ? pf.estAtk : pf.estDef;
}
function styleTerm(style, side, buy) {
  return style === "agressivo" && (buy === "eco" || buy === "force") ? 0.06 : style === "defensivo" && buy === "full" && side === "def" ? 0.02 : 0;
}
/* termo a favor do ATAQUE conforme o estilo de cada lado e o plano/setup escolhidos */
function styleMatch(ea, ed, a, d) {
  var t = 0;
  if (ea === "agressivo") t += (d.setup === "retake" || d.setup === "padrao") ? 0.10 : (d.setup === "agressivo" || (d.setup === "stack" && d.site === a.site)) ? -0.14 : 0;
  if (ea === "defensivo") t += d.setup === "agressivo" ? 0.09 : d.setup === "retake" ? -0.10 : -0.02;
  if (ed === "agressivo") t -= (a.plano === "lurk" || a.plano === "fake" || a.plano === "padrao") ? 0.11 : (a.plano === "exec" || a.plano === "rush") ? -0.13 : 0;
  if (ed === "defensivo") t -= (a.plano === "rush" || a.plano === "exec") ? 0.10 : (a.plano === "fake" || a.plano === "lurk" || a.plano === "split") ? -0.11 : 0;
  return t;
}

function stepRound(s) {
  if (s.done) return null;
  var A = T(s.A), B = T(s.B), rnd = s.round;
  if (rnd === 12) { s.credA = 800; s.credB = 800; s.lossA = 0; s.lossB = 0; }
  if (rnd >= 24 && (rnd - 24) % 2 === 0) { s.credA = 5000; s.credB = 5000; }

  var sideA = sideOf(s, "A", rnd), sideB = sideA === "atk" ? "def" : "atk";
  var buyA = decideBuy(s.credA, s.lossA, rnd, s.callA, s.sa, s.sb, s.credB);
  var buyB = decideBuy(s.credB, s.lossB, rnd, s.callB, s.sb, s.sa, s.credA);
  if (rnd >= 24) { buyA = "full"; buyB = "full"; }

  var atkBias = MAP_ATK[s.map] || 0.49;
  var sideT = Math.log(atkBias / (1 - atkBias));
  var x = (s.effA - s.effB) * 0.028;
  x += Math.log(BUY[buyA].str / BUY[buyB].str) * 1.6;
  x += sideA === "atk" ? sideT : -sideT;
  x += styleTerm(styleOf(s, "A", sideA), sideA, buyA) - styleTerm(styleOf(s, "B", sideB), sideB, buyB);
  x += 0.04 * Math.min(s.streakA, 4) - 0.04 * Math.min(s.streakB, 4);
  if (s.toBoostA > 0) { x += 0.15 + 0.03 * (staffLvl(A, "psicologo") - 3) + (s.A === S.userTeam ? (mgr("estresse") - 10) * 0.008 : 0); s.toBoostA--; }
  if (s.toBoostB > 0) { x -= 0.15 + 0.03 * (staffLvl(B, "psicologo") - 3) + (s.B === S.userTeam ? (mgr("estresse") - 10) * 0.008 : 0); s.toBoostB--; }
  if (s.A === S.userTeam) x += (mgr("tatica") - 10) * 0.004;
  if (s.B === S.userTeam) x -= (mgr("tatica") - 10) * 0.004;
  var atkWho = sideA === "atk" ? "A" : "B", defWho = atkWho === "A" ? "B" : "A";
  var aTac = resolveAtk(s, atkWho, atkWho === "A" ? buyA : buyB);
  var dTac = resolveDef(s, defWho, atkWho);
  var tt = tacticTerm(aTac, dTac) + styleMatch(styleOf(s, atkWho, "atk"), styleOf(s, defWho, "def"), aTac, dTac);
  x += atkWho === "A" ? tt : -tt;
  (defWho === "A" ? (s.hdA = s.hdA || []) : (s.hdB = s.hdB || [])).push({ setup:dTac.setup, site:dTac.site });
  var pA = sigmoid(x);
  var aWins = R() < pA;
  (atkWho === "A" ? s.histA : s.histB).push({ site:aTac.site, plano:aTac.plano, stacked:dTac.setup === "stack" && dTac.site === aTac.site,
    won:(atkWho === "A") === aWins });

  s.credA = Math.max(0, s.credA - BUY[buyA].cost);
  s.credB = Math.max(0, s.credB - BUY[buyB].cost);
  if (aWins) {
    s.sa++; s.streakA++; s.streakB = 0; s.lossB++; s.lossA = 0;
    s.credA = Math.min(9000, s.credA + 3000);
    s.credB = Math.min(9000, s.credB + 1900 + 500 * Math.min(s.lossB - 1, 2));
  } else {
    s.sb++; s.streakB++; s.streakA = 0; s.lossA++; s.lossB = 0;
    s.credB = Math.min(9000, s.credB + 3000);
    s.credA = Math.min(9000, s.credA + 1900 + 500 * Math.min(s.lossA - 1, 2));
  }

  var winTeam = aWins ? A : B, loseTeam = aWins ? B : A;
  var winSide = aWins ? sideA : sideB;
  var ev = narrate(s, winTeam, loseTeam, winSide, aWins ? buyA : buyB, aWins ? buyB : buyA, aTac.site, aWins ? "A" : "B");
  var r = { n:rnd + 1, w:aWins ? "A" : "B", sideA:sideA, buyA:buyA, buyB:buyB, pA:pA, txt:ev.txt, tipo:ev.tipo, ev:ev.ev,
    atk:aTac, def:dTac, credA:s.credA, credB:s.credB,
    upset: (BUY[aWins ? buyA : buyB].str / BUY[aWins ? buyB : buyA].str) < 0.6 };
  s.rounds.push(r);
  s.round++;

  var target = 13;
  if (s.sa >= 12 && s.sb >= 12) {
    if (Math.abs(s.sa - s.sb) >= 2) { s.done = true; }
  } else if (s.sa >= target || s.sb >= target) { s.done = true; }
  if (s.done) s.winner = s.sa > s.sb ? "A" : "B";
  return r;
}

var KILL_W = { D:1.45, F:1.1, S:0.9, I:0.9, C:0.8 };
function weightedPick(players) {
  var ws = players.map(function (p) { return Math.max(1, (p.aim - 40)) * (KILL_W[p.role] || 1); });
  var tot = sum(ws), x = R() * tot;
  for (var i = 0; i < players.length; i++) { x -= ws[i]; if (x <= 0) return players[i]; }
  return players[players.length - 1];
}

function narrate(s, W, L, winSide, wBuy, lBuy, site, wKey) {
  var wp = activeFive(W), lp = activeFive(L);
  var lKey = wKey === "A" ? "B" : "A";
  var tipo;
  if (winSide === "atk") tipo = R() < .62 ? "spike" : "elim";
  else { var q = R(); tipo = q < .25 ? "defuse" : (q < .82 ? "elim" : "tempo"); }
  var wk = (tipo === "elim" || tipo === "defuse") ? 5 : ri(2, 4);
  var lk = ri(0, 4);
  if (tipo === "defuse" && lk > 3) lk = 3;
  /* sequência de abates: o time vencedor nunca zera; em eliminação a última morte é do perdedor */
  var seq = shuffle(Array(wk).fill("W").concat(Array(lk).fill("L")));
  if (tipo === "elim" || tipo === "defuse") { var li = seq.lastIndexOf("W"); seq.splice(li, 1); seq.push("W"); }
  var aliveW = wp.slice(), aliveL = lp.slice(), kills = [], minW = 5, clutchVs = 0;
  var times = seq.map(function () { return 0.22 + R() * 0.66; }).sort();
  seq.forEach(function (x, i) {
    var killers = x === "W" ? aliveW : aliveL, victims = x === "W" ? aliveL : aliveW;
    if (!killers.length || !victims.length) return;
    var k = weightedPick(killers), v = pick(victims);
    victims.splice(victims.indexOf(v), 1);
    kills.push({ t:times[i], k:k.id, v:v.id, kt:x === "W" ? wKey : lKey });
    s.stats[k.id].k++; s.stats[k.id].dmg += 150; s.stats[v.id].d++;
    if (aliveW.length === 1 && minW > 1) clutchVs = aliveL.length;
    minW = Math.min(minW, aliveW.length);
  });
  wp.forEach(function (p) { if (R() < .35) s.stats[p.id].a++; s.stats[p.id].dmg += ri(20, 90); });
  lp.forEach(function (p) { if (R() < .2) s.stats[p.id].a++; s.stats[p.id].dmg += ri(10, 60); });
  if (kills.length) s.stats[kills[0].k].fk++;

  var planted = tipo === "spike" || tipo === "defuse" || (winSide === "def" && tipo === "elim" && R() < .35);
  var plantT = planted ? 0.45 + R() * 0.15 : null;
  if (tipo === "spike") kills.forEach(function (k) { if (k.t > 0.9) k.t = 0.9; });

  var by = {}; kills.forEach(function (k) { if (k.kt === wKey) by[k.k] = (by[k.k] || 0) + 1; });
  var top = Object.keys(by).sort(function (a, b) { return by[b] - by[a]; })[0];
  var topP = top ? P(top) : wp[0], n = top ? by[top] : 0;
  var how = { spike:"explode a spike", elim:"elimina o time", defuse:"desarma a spike", tempo:"segura até o fim do tempo" }[tipo];
  var txt = W.tag + " " + how + (site ? " no " + site : "");
  if (clutchVs >= 2) txt += " — clutch 1v" + clutchVs + " do " + (aliveW[0] ? aliveW[0].nick : topP.nick);
  else if (n >= 3) txt += " — " + topP.nick + " " + n + "K";
  else if (n) txt += " — " + topP.nick + " abre o round";
  if (BUY[wBuy].str / BUY[lBuy].str < 0.6) txt += " (vitória no " + BUY_NAME[wBuy].toLowerCase() + "!)";
  return { txt:txt, tipo:tipo, ev:{ kills:kills, site:site, plant:planted ? { t:plantT } : null, defuse:tipo === "defuse" } };
}

function useTimeout(s, who) {
  if (who === "A" && s.toA > 0) { s.toA--; s.toBoostA = 2; s.streakB = 0; return true; }
  if (who === "B" && s.toB > 0) { s.toB--; s.toBoostB = 2; s.streakA = 0; return true; }
  return false;
}

function finishMap(s) {
  while (!s.done) {
    /* IA pede timeout quando toma 3 seguidos */
    if (s.userSide !== "A" && s.streakB >= 3 && s.toA > 0 && R() < .7) useTimeout(s, "A");
    if (s.userSide !== "B" && s.streakA >= 3 && s.toB > 0 && R() < .7) useTimeout(s, "B");
    stepRound(s);
  }
  return s;
}

/* ---------------------------------------------------------------------
   Veto e série
   --------------------------------------------------------------------- */
function vetoSteps(bo) {
  if (bo === 5) return [
    { who:"A", act:"ban" }, { who:"B", act:"ban" },
    { who:"A", act:"pick" }, { who:"B", act:"pick" }, { who:"A", act:"pick" }, { who:"B", act:"pick" },
    { who:"-", act:"decider" }];
  return [
    { who:"A", act:"ban" }, { who:"B", act:"ban" },
    { who:"A", act:"pick" }, { who:"B", act:"pick" },
    { who:"A", act:"ban" }, { who:"B", act:"ban" },
    { who:"-", act:"decider" }];
}
/* Quem escolhe o lado em cada mapa escolhido: o oposto de quem escolheu o mapa.
   Decider: Bo3 lado do time A; Bo5 lado do time B. */

function aiVetoChoice(me, opp, pool, act) {
  var noise = Math.max(1, 4 - staffLvl(me, "analista") * 0.6);
  var scored = pool.map(function (m) {
    return { m:m, v:(me.mapProf[m] || 60) - (opp.mapProf[m] || 60) + (R() * 2 * noise - noise) };
  });
  scored.sort(function (a, b) { return act === "ban" ? a.v - b.v : b.v - a.v; });
  return scored[0].m;
}
function aiSideChoice(me, map) {
  var atk = MAP_ATK[map] || .49;
  return (atk > .495 && R() < .6) ? "atk" : (R() < .25 ? "atk" : "def");
}

/* Veto automático completo. Retorna lista de { map, pickedBy, sideChooser, sideChoice } */
function autoVeto(A, B, bo, userSide, userChoices) {
  var pool = S.mapas.slice(), maps = [], steps = vetoSteps(bo), log = [];
  steps.forEach(function (st, i) {
    if (st.act === "decider") {
      var m = pool[0];
      var chooser = bo === 5 ? "B" : "A";
      var side = aiSideChoice(chooser === "A" ? A : B, m);
      maps.push({ map:m, pickedBy:"-", sideChooser:chooser, side:side });
      log.push("Decider: " + m);
      return;
    }
    var me = st.who === "A" ? A : B, opp = st.who === "A" ? B : A;
    var m = aiVetoChoice(me, opp, pool, st.act);
    pool.splice(pool.indexOf(m), 1);
    if (st.act === "pick") {
      var chooser = st.who === "A" ? "B" : "A";
      var side = aiSideChoice(chooser === "A" ? A : B, m);
      maps.push({ map:m, pickedBy:st.who, sideChooser:chooser, side:side });
    }
    log.push(me.tag + (st.act === "ban" ? " bane " : " escolhe ") + m);
  });
  return { maps:maps, log:log };
}

/* atkFirst a partir da escolha de lado. */
function atkFirstFrom(entry) {
  var chooserAtk = entry.side === "atk";
  if (entry.sideChooser === "A") return chooserAtk ? "A" : "B";
  return chooserAtk ? "B" : "A";
}

/* Simula a série inteira sem interação. */
function simSeries(aId, bId, bo) {
  var A = T(aId), B = T(bId);
  var veto = autoVeto(A, B, bo);
  var need = Math.ceil(bo / 2), wa = 0, wb = 0, maps = [];
  for (var i = 0; i < veto.maps.length && wa < need && wb < need; i++) {
    var e = veto.maps[i];
    var s = newMapSim(A, B, e.map, { atkFirst:atkFirstFrom(e), pressao:bo >= 5 });
    finishMap(s);
    maps.push(mapSummary(s));
    if (s.winner === "A") wa++; else wb++;
  }
  return seriesResult(aId, bId, bo, maps, wa, wb, veto.log);
}

function mapSummary(s) {
  return { map:s.map, sa:s.sa, sb:s.sb, winner:s.winner, rounds:s.rounds.map(function (r) {
      return { w:r.w, buyA:r.buyA, buyB:r.buyB, upset:r.upset, sideA:r.sideA };
    }), stats:s.stats };
}

function seriesResult(aId, bId, bo, maps, wa, wb, vetoLog) {
  var res = { a:aId, b:bId, bo:bo, maps:maps, wa:wa, wb:wb, winner:wa > wb ? aId : bId, loser:wa > wb ? bId : aId, veto:vetoLog || [] };
  applySeriesEffects(res);
  return res;
}

function applySeriesEffects(res) {
  eloUpdate(res);
  if (S.userTeam && (res.a === S.userTeam || res.b === S.userTeam)) boardDelta(res.winner === S.userTeam ? 0.8 : -2 * dif().board, (res.winner === S.userTeam ? "Vitória" : "Derrota") + " contra " + T(res.winner === S.userTeam ? res.loser : res.winner).tag);
  [res.a, res.b].forEach(function (tid) {
    var won = res.winner === tid;
    var psi = staffLvl(T(tid), "psicologo");
    activeFive(T(tid)).forEach(function (p) {
      p.form = clamp(p.form + (won ? 0.6 : -0.6), -3, 3);
      var mo = tid === S.userTeam ? (mgr("motivacao") - 10) * 0.15 : 0;
      p.morale = clamp(p.morale + (won ? 3 + mo : -3 + psi * 0.4 + mo), 30 + psi * 3, 99);
      p.saude = clamp((p.saude == null ? 100 : p.saude) - res.maps.length * ri(3, 6) * (1.25 - (p.stam || 70) / 250) * (tid === S.userTeam ? dif().fad : 1), 35, 100);
      var ich = 0.012 * (tid === S.userTeam ? dif().inj : 1) * (p.saude < 60 ? 3 : 1);
      if (healthy(p) && R() < ich) {
        var L = pick([["tendinite no punho", 4, 9], ["dor nas costas", 3, 6], ["burnout", 5, 10], ["gripe", 2, 4]]);
        p.lesao = { tipo:L[0], dias:ri(L[1], L[2]) };
        if (tid === S.userTeam) news(p.nick + " está fora por " + p.lesao.dias + " dias (" + L[0] + ").", "ruim");
      }
    });
  });
  res.maps.forEach(function (m) {
    [res.a, res.b].forEach(function (tid) {
      var t = T(tid);
      t.mapProf[m.map] = clamp((t.mapProf[m.map] || 60) + 0.5, 30, 95);
    });
    Object.keys(m.stats).forEach(function (pid) {
      var p = P(pid); if (!p) return;
      var st = m.stats[pid], rounds = m.sa + m.sb;
      p.stats.mapas++; p.stats.k += st.k; p.stats.d += st.d; p.stats.a += st.a;
      p.stats.acsSum += Math.round((st.dmg + st.k * 50 + st.fk * 30) / Math.max(1, rounds));
    });
  });
}

/* Chance pré-jogo (Monte Carlo rápido) de A vencer um mapa médio. */
function preMatchOdds(aId, bId, n) {
  n = n || 120;
  var A = T(aId), B = T(bId), w = 0;
  var saved = rng; rng = mulberry(hashStr(aId + bId + S.fase));
  for (var i = 0; i < n; i++) {
    var m = S.mapas[i % S.mapas.length];
    var s = newMapSim(A, B, m, { atkFirst:i % 2 ? "A" : "B" });
    finishMap(s);
    if (s.winner === "A") w++;
  }
  rng = saved;
  return w / n;
}

/* ---------------------------------------------------------------------
   Estruturas de competição
   --------------------------------------------------------------------- */
function rrSchedule(ids) {
  var t = ids.slice();
  if (t.length % 2) t.push(null);
  var n = t.length, rounds = [];
  for (var r = 0; r < n - 1; r++) {
    var pairs = [];
    for (var i = 0; i < n / 2; i++) {
      var a = t[i], b = t[n - 1 - i];
      if (a && b) pairs.push(r % 2 ? [b, a] : [a, b]);
    }
    rounds.push(pairs);
    t.splice(1, 0, t.pop());
  }
  return rounds;
}

function newGroups(groupsIds, bo, label) {
  return { kind:"groups", label:label || "Fase de grupos", bo:bo, day:0,
    groups:groupsIds.map(function (ids, gi) {
      var st = {}; ids.forEach(function (id) { st[id] = { w:0, l:0, md:0, rd:0 }; });
      return { nome:"Grupo " + String.fromCharCode(65 + gi), teams:ids, sched:rrSchedule(ids), st:st, jogos:[] };
    }) };
}

function standings(g) {
  return g.teams.slice().sort(function (a, b) {
    var A = g.st[a], B = g.st[b];
    return (B.w - A.w) || (B.md - A.md) || (B.rd - A.rd) || (a < b ? -1 : 1);
  });
}

/* Chaves: nós com origem { s:seedIndex } | { w:nodeId } | { l:nodeId } */
var TEMPLATES = {
  DE8: [
    { id:"UQ1", a:{s:0}, b:{s:7}, d:0, nome:"Quartas (superior)" },
    { id:"UQ2", a:{s:3}, b:{s:4}, d:0, nome:"Quartas (superior)" },
    { id:"UQ3", a:{s:1}, b:{s:6}, d:0, nome:"Quartas (superior)" },
    { id:"UQ4", a:{s:2}, b:{s:5}, d:0, nome:"Quartas (superior)" },
    { id:"US1", a:{w:"UQ1"}, b:{w:"UQ2"}, d:1, nome:"Semi (superior)" },
    { id:"US2", a:{w:"UQ3"}, b:{w:"UQ4"}, d:1, nome:"Semi (superior)" },
    { id:"L1a", a:{l:"UQ1"}, b:{l:"UQ2"}, d:1, nome:"Inferior R1", elim:[7, 8] },
    { id:"L1b", a:{l:"UQ3"}, b:{l:"UQ4"}, d:1, nome:"Inferior R1", elim:[7, 8] },
    { id:"L2a", a:{w:"L1a"}, b:{l:"US2"}, d:2, nome:"Inferior R2", elim:[5, 6] },
    { id:"L2b", a:{w:"L1b"}, b:{l:"US1"}, d:2, nome:"Inferior R2", elim:[5, 6] },
    { id:"UF",  a:{w:"US1"}, b:{w:"US2"}, d:3, nome:"Final superior" },
    { id:"L3",  a:{w:"L2a"}, b:{w:"L2b"}, d:3, nome:"Inferior R3", elim:[4] },
    { id:"LF",  a:{w:"L3"},  b:{l:"UF"},  d:4, nome:"Final inferior", elim:[3], bo5:true },
    { id:"GF",  a:{w:"UF"},  b:{w:"LF"},  d:5, nome:"Grande final", elim:[2], final:true, bo5:true }
  ],
  DE4: [
    { id:"SA", a:{s:0}, b:{s:3}, d:0, nome:"Semi (superior)" },
    { id:"SB", a:{s:1}, b:{s:2}, d:0, nome:"Semi (superior)" },
    { id:"UF", a:{w:"SA"}, b:{w:"SB"}, d:1, nome:"Final superior" },
    { id:"LS", a:{l:"SA"}, b:{l:"SB"}, d:1, nome:"Semi inferior", elim:[4] },
    { id:"LF", a:{w:"LS"}, b:{l:"UF"}, d:2, nome:"Final inferior", elim:[3], bo5:true },
    { id:"GF", a:{w:"UF"}, b:{w:"LF"}, d:3, nome:"Grande final", elim:[2], final:true, bo5:true }
  ],
  GSL: [
    { id:"O1", a:{s:0}, b:{s:3}, d:0, nome:"Abertura" },
    { id:"O2", a:{s:1}, b:{s:2}, d:0, nome:"Abertura" },
    { id:"WM", a:{w:"O1"}, b:{w:"O2"}, d:1, nome:"Jogo dos vencedores", qual:1 },
    { id:"EM", a:{l:"O1"}, b:{l:"O2"}, d:1, nome:"Eliminação", elim:[4] },
    { id:"DM", a:{l:"WM"}, b:{w:"EM"}, d:2, nome:"Decisivo", elim:[3], qual:2 }
  ]
};

function newBracket(template, seeds, bo, label) {
  var nodes = {};
  TEMPLATES[template].forEach(function (n) { nodes[n.id] = { id:n.id, res:null }; });
  return { kind:"bracket", template:template, label:label || "Playoffs", seeds:seeds.slice(), bo:bo, day:0, nodes:nodes, place:{} };
}
function nodeTeam(br, src) {
  if (src.s !== undefined) return br.seeds[src.s];
  var n = br.nodes[src.w || src.l];
  if (!n.res) return undefined;
  return src.w ? n.res.winner : n.res.loser;
}

function newSwiss(ids, bo, label) {
  var rec = {}; ids.forEach(function (id) { rec[id] = { w:0, l:0, opp:[] }; });
  return { kind:"swiss", label:label || "Fase suíça", bo:bo, day:0, teams:ids.slice(), rec:rec, round:0, pairs:null, adv:[], out:[] };
}

/* Retorna as partidas do dia de um estágio. Cada item: { key, a, b, bo } */
function stageMatchesToday(st) {
  var out = [];
  if (st.kind === "groups") {
    st.groups.forEach(function (g, gi) {
      var r = g.sched[st.day];
      if (!r) return;
      r.forEach(function (pr, pi) { out.push({ key:"g" + gi + "r" + st.day + "m" + pi, a:pr[0], b:pr[1], bo:st.bo, gi:gi }); });
    });
  } else if (st.kind === "bracket") {
    TEMPLATES[st.template].forEach(function (n) {
      if (n.d !== st.day) return;
      var node = st.nodes[n.id];
      if (node.res) return;
      var a = nodeTeam(st, n.a), b = nodeTeam(st, n.b);
      if (a && b) out.push({ key:n.id, a:a, b:b, bo:(n.bo5 ? 5 : st.bo), nome:n.nome });
    });
  } else if (st.kind === "swiss") {
    if (!st.pairs) st.pairs = swissPairs(st);
    st.pairs.forEach(function (pr, i) { out.push({ key:"s" + st.round + "m" + i, a:pr[0], b:pr[1], bo:st.bo }); });
  }
  return out;
}

function swissPairs(st) {
  var active = st.teams.filter(function (id) { return st.adv.indexOf(id) < 0 && st.out.indexOf(id) < 0; });
  var buckets = {};
  active.forEach(function (id) { var k = st.rec[id].w + "-" + st.rec[id].l; (buckets[k] = buckets[k] || []).push(id); });
  var pairs = [];
  Object.keys(buckets).forEach(function (k) {
    var b = st.round === 0 ? buckets[k].slice() : shuffle(buckets[k]);
    if (st.round === 0) {
      /* 1ª rodada: evita time da mesma liga, alternando metade de cima × metade de baixo */
      var half = b.length / 2;
      for (var i = 0; i < half; i++) pairs.push([b[i], b[b.length - 1 - i]]);
    } else {
      while (b.length >= 2) {
        var x = b.shift(), j = 0;
        while (j < b.length - 1 && st.rec[x].opp.indexOf(b[j]) >= 0) j++;
        pairs.push([x, b.splice(j, 1)[0]]);
      }
    }
  });
  return pairs;
}

function stageRecord(st, m, res) {
  if (st.kind === "groups") {
    var g = st.groups[m.gi];
    var A = g.st[res.a], B = g.st[res.b];
    var rdA = sum(res.maps.map(function (x) { return x.sa - x.sb; }));
    if (res.winner === res.a) { A.w++; B.l++; } else { B.w++; A.l++; }
    A.md += res.wa - res.wb; B.md += res.wb - res.wa; A.rd += rdA; B.rd -= rdA;
    g.jogos.push({ a:res.a, b:res.b, wa:res.wa, wb:res.wb, day:st.day });
  } else if (st.kind === "bracket") {
    st.nodes[m.key].res = { winner:res.winner, loser:res.loser, wa:res.wa, wb:res.wb, a:res.a, b:res.b };
    var def = TEMPLATES[st.template].filter(function (n) { return n.id === m.key; })[0];
    if (def.elim) st.place[res.loser] = def.elim[0];
    if (def.final) st.place[res.winner] = 1;
  } else if (st.kind === "swiss") {
    st.rec[res.winner].w++; st.rec[res.loser].l++;
    st.rec[res.a].opp.push(res.b); st.rec[res.b].opp.push(res.a);
  }
}

function stageEndDay(st) {
  if (st.kind === "groups") { st.day++; return; }
  if (st.kind === "bracket") { st.day++; return; }
  if (st.kind === "swiss") {
    st.teams.forEach(function (id) {
      if (st.rec[id].w >= 2 && st.adv.indexOf(id) < 0) st.adv.push(id);
      if (st.rec[id].l >= 2 && st.out.indexOf(id) < 0) st.out.push(id);
    });
    st.round++; st.day++; st.pairs = null;
  }
}

function stageDone(st) {
  if (st.kind === "groups") return st.groups.every(function (g) { return st.day >= g.sched.length; });
  if (st.kind === "bracket") return TEMPLATES[st.template].every(function (n) { return st.nodes[n.id].res; });
  if (st.kind === "swiss") return st.adv.length + st.out.length >= st.teams.length;
  return true;
}

/* ---------------------------------------------------------------------
   Eventos (sequência de estágios) e a temporada
   --------------------------------------------------------------------- */
/* Cada evento tem: id, nome, tipo, liga, stages[], si, done, colocacao{} e um
   "plano" que define como montar o próximo estágio a partir do anterior. */

function leagueTeams(liga) {
  return Object.keys(S.teams).filter(function (id) { return S.teams[id].liga === liga; });
}
function byStrength(ids) {
  return ids.slice().sort(function (a, b) { return strength(b) - strength(a); });
}
function strength(id) {
  var t = T(id);
  return sum(activeFive(t).map(ovr)) / 5 + (S.cp[id] || 0) * 0.05;
}
function snakeGroups(ids, n) {
  var groups = []; for (var i = 0; i < n; i++) groups.push([]);
  ids.forEach(function (id, i) {
    var row = Math.floor(i / n), col = i % n;
    groups[row % 2 ? n - 1 - col : col].push(id);
  });
  return groups;
}

function newEvent(o) {
  return { id:o.id, nome:o.nome, tipo:o.tipo, liga:o.liga || null, plano:o.plano, stages:[], si:0, done:false,
    colocacao:{}, cpTab:o.cpTab || null, premio:o.premio || null, participantes:o.participantes || [], extra:o.extra || {} };
}

var LIGAS_VCT = ["AMER", "EMEA", "PAC", "CN"];

var FASES = [
  { id:"KICKOFF",  nome:"Kickoff" },
  { id:"SANTIAGO", nome:"Masters Santiago" },
  { id:"STAGE1",   nome:"Stage 1" },
  { id:"LONDON",   nome:"Masters London" },
  { id:"STAGE2G",  nome:"Stage 2 — Grupos" },
  { id:"PLAYINS",  nome:"Stage 2 — Play-Ins" },
  { id:"STAGE2P",  nome:"Stage 2 — Playoffs" },
  { id:"CHAMPIONS",nome:"Champions" },
  { id:"OFF",      nome:"Pré-temporada" }
];

function buildPhase(idx) {
  S.fase = idx;
  S.scoutUsados = 0;
  S.eventos = [];
  S.janela = true;
  var F = FASES[idx].id;

  if (F === "KICKOFF") {
    LIGAS_VCT.forEach(function (lg) {
      var ev = newEvent({ id:"KO-" + lg, nome:"Kickoff — " + S.ligasNome[lg], tipo:"KICKOFF", liga:lg,
        plano:"KICKOFF", cpTab:CP.KICKOFF, premio:PRIZE.KICKOFF });
      ev.stages.push(newGroups(snakeGroups(byStrength(leagueTeams(lg)), 2), 3));
      S.eventos.push(ev);
    });
  }
  if (F === "SANTIAGO" || F === "LONDON") {
    var q = S.qualMasters || {};
    var direct = [], swiss = [];
    LIGAS_VCT.forEach(function (lg) {
      var list = q[lg] || byStrength(leagueTeams(lg)).slice(0, 3);
      direct.push(list[0]); swiss.push(list[1], list[2]);
    });
    /* ordena os 8 do suíço: seeds 2 (metade de cima) × seeds 3 (metade de baixo) */
    var sw = [swiss[0], swiss[2], swiss[4], swiss[6], swiss[7], swiss[5], swiss[3], swiss[1]];
    var ev = newEvent({ id:F, nome:FASES[idx].nome, tipo:"MASTERS", plano:"MASTERS",
      cpTab:F === "SANTIAGO" ? CP.SANTIAGO : CP.LONDON, premio:PRIZE.MASTERS, extra:{ direct:direct } });
    ev.stages.push(newSwiss(sw, 3));
    S.eventos.push(ev);
    if (F === "LONDON") CHAL.forEach(function (lg) { S.eventos.push(newChalEvent(lg, 2)); });
  }
  if (F === "STAGE1") {
    LIGAS_VCT.forEach(function (lg) {
      var ev = newEvent({ id:"S1-" + lg, nome:"Stage 1 — " + S.ligasNome[lg], tipo:"STAGE", liga:lg,
        plano:"STAGE1", cpTab:CP.STAGE1, premio:PRIZE.STAGE });
      ev.stages.push(newGroups(snakeGroups(shuffle(leagueTeams(lg)), 2), 3));
      S.eventos.push(ev);
    });
    CHAL.forEach(function (lg) { S.eventos.push(newChalEvent(lg, 1)); });
  }
  if (F === "STAGE2G") {
    LIGAS_VCT.forEach(function (lg) {
      var ev = newEvent({ id:"S2G-" + lg, nome:"Stage 2 — " + S.ligasNome[lg] + " (grupos)", tipo:"STAGE2G", liga:lg,
        plano:"STAGE2G" });
      ev.stages.push(newGroups(snakeGroups(shuffle(leagueTeams(lg)), 2), 3));
      S.eventos.push(ev);
    });
  }
  if (F === "PLAYINS") {
    LIGAS_VCT.forEach(function (lg) {
      var s2 = S.stage2 && S.stage2[lg];
      var third = s2.pot3, low = s2.pot5, chal = challengersFor(lg);
      /* 4 grupos de 3: um de cada pote */
      var pa = shuffle(third), pb = shuffle(low), pc = shuffle(chal);
      var groups = [0, 1, 2, 3].map(function (i) { return [pa[i], pb[i], pc[i]]; });
      var ev = newEvent({ id:"PI-" + lg, nome:"Play-Ins — " + S.ligasNome[lg], tipo:"PLAYINS", liga:lg, plano:"PLAYINS" });
      ev.stages.push(newGroups(groups, 3, "Play-Ins (grupos de 3)"));
      S.eventos.push(ev);
    });
  }
  if (F === "STAGE2P") {
    LIGAS_VCT.forEach(function (lg) {
      var s2 = S.stage2[lg];
      var seeds = s2.top4.concat(s2.playin);
      var ev = newEvent({ id:"S2P-" + lg, nome:"Stage 2 — " + S.ligasNome[lg] + " (playoffs)", tipo:"STAGE", liga:lg,
        plano:"STAGE2P", cpTab:CP.STAGE2, premio:PRIZE.STAGE });
      ev.stages.push(newBracket("DE8", seeds, 3));
      S.eventos.push(ev);
    });
  }
  if (F === "CHAMPIONS") {
    var groups = [[], [], [], []];
    LIGAS_VCT.forEach(function (lg, li) {
      var list = S.qualChampions[lg];
      list.forEach(function (id, k) { groups[(k + li) % 4].push(id); });
    });
    groups = groups.map(function (g) { return byStrength(g); });
    var ev = newEvent({ id:"CHAMPIONS", nome:"Champions", tipo:"CHAMPIONS", plano:"CHAMPIONS", premio:PRIZE.CHAMPIONS });
    ev.extra.groups = groups;
    ev.extra.gi = 0;
    ev.stages.push({ kind:"multi", label:"Fase de grupos (GSL)", day:0,
      subs:groups.map(function (g, i) { var b = newBracket("GSL", g, 3, "Grupo " + String.fromCharCode(65 + i)); return b; }) });
    S.eventos.push(ev);
  }
  if (F === "OFF") {
    S.janela = true;
  }
  if ((F === "STAGE2P" || F === "CHAMPIONS") && S.userTeam) {
    var venc = T(S.userTeam).roster.map(P).filter(function (p) { return p.contract <= 1; });
    if (venc.length) news("Contrato terminando no fim da temporada: " + venc.map(function (p) { return p.nick; }).join(", ") + ". Renove no Elenco se quiser manter.", "ruim");
  }
}

function newChalEvent(liga, n) {
  var ids = leagueTeams(liga);
  var big = ids.length > 8;
  var ev = newEvent({ id:"CH-" + liga + n, nome:S.ligasNome[liga] + " — Stage " + n, tipo:"CHAL", liga:liga,
    plano:big ? "CHAL8" : "CHAL4", premio:PRIZE.CBR, extra:{ n:n } });
  var order = n === 1 ? byStrength(ids) : shuffle(ids);
  ev.stages.push(newGroups(big ? snakeGroups(order, 2) : [order], 3));
  return ev;
}

/* Vagas dos Challengers nos Play-Ins de cada liga, a partir do Stage 2 de cada Challengers. */
function chalRank(liga) {
  var r = (S.chalRank && S.chalRank[liga]) || [];
  var rest = byStrength(leagueTeams(liga)).filter(function (id) { return r.indexOf(id) < 0; });
  return r.concat(rest);
}
function challengersFor(lg) {
  var out;
  if (lg === "AMER") {
    var na = chalRank("CNA"), br = chalRank("CBR"), la = chalRank("CLAT");
    out = [na[0], br[0], la[0]];
    /* LCQ das Americas: o melhor entre os vices das três regiões */
    var lcq = byStrength([na[1], br[1], la[1]].filter(Boolean))[0];
    out.push(lcq);
  } else {
    var src = { EMEA:"CEMEA", PAC:"CPAC", CN:"CCN" }[lg];
    out = chalRank(src).slice(0, 4);
  }
  return out.filter(Boolean).slice(0, 4);
}

/* Partidas de um estágio "multi" (vários subestágios em paralelo). */
function evMatchesToday(ev) {
  if (ev.done) return [];
  var st = ev.stages[ev.si];
  if (st.kind === "multi") {
    var out = [];
    st.subs.forEach(function (sub, i) {
      if (stageDone(sub)) return;
      stageMatchesToday(sub).forEach(function (m) { m.sub = i; out.push(m); });
    });
    return out;
  }
  return stageMatchesToday(st);
}
function evRecord(ev, m, res) {
  var st = ev.stages[ev.si];
  if (st.kind === "multi") stageRecord(st.subs[m.sub], m, res);
  else stageRecord(st, m, res);
}
function evEndDay(ev) {
  if (ev.done) return;
  var st = ev.stages[ev.si];
  if (st.kind === "multi") {
    st.subs.forEach(function (sub) { if (!stageDone(sub)) stageEndDay(sub); });
    st.day++;
    if (st.subs.every(stageDone)) advanceEvent(ev);
  } else {
    stageEndDay(st);
    if (stageDone(st)) advanceEvent(ev);
  }
}

function groupRanks(st) { return st.groups.map(standings); }

function advanceEvent(ev) {
  var st = ev.stages[ev.si];
  var plano = ev.plano;

  if (plano === "KICKOFF" && ev.si === 0) {
    var g = groupRanks(st);
    ev.stages.push(newBracket("DE4", [g[0][0], g[1][0], g[1][1], g[0][1]], 3, "Final four"));
    g.forEach(function (rank) { rank.slice(2).forEach(function (id, i) { ev.colocacao[id] = 5 + i * 2; }); });
    ev.si++; return;
  }
  if (plano === "CHAL4" && ev.si === 0) {
    var g0 = groupRanks(st)[0];
    ev.stages.push(newBracket("DE4", g0.slice(0, 4), 3, "Playoffs"));
    g0.slice(4).forEach(function (id, i) { ev.colocacao[id] = 5 + i; });
    ev.si++; return;
  }
  if ((plano === "STAGE1" || plano === "CHAL8") && ev.si === 0) {
    var g1 = groupRanks(st);
    if (plano === "STAGE1") {
      g1.forEach(function (rank) { rank.forEach(function (id, i) { S.cp[id] = (S.cp[id] || 0); }); });
      st.groups.forEach(function (gr) { gr.teams.forEach(function (id) { S.cp[id] += gr.st[id].w; }); });
    }
    var seeds = [g1[0][0], g1[1][0], g1[0][1], g1[1][1], g1[0][2], g1[1][2], g1[0][3], g1[1][3]];
    g1.forEach(function (rank) { rank.slice(4).forEach(function (id) { ev.colocacao[id] = 9; }); });
    ev.stages.push(newBracket("DE8", seeds, 3));
    ev.si++; return;
  }
  if (plano === "STAGE2G") {
    var g2 = groupRanks(st);
    st.groups.forEach(function (gr) { gr.teams.forEach(function (id) { S.cp[id] += gr.st[id].w; }); });
    S.stage2 = S.stage2 || {};
    S.stage2[ev.liga] = { top4:[g2[0][0], g2[1][0], g2[0][1], g2[1][1]],
      pot3:[g2[0][2], g2[1][2], g2[0][3], g2[1][3]], pot5:[g2[0][4], g2[1][4], g2[0][5], g2[1][5]], playin:[] };
    ev.done = true; return;
  }
  if (plano === "PLAYINS") {
    var g3 = groupRanks(st);
    S.stage2[ev.liga].playin = g3.map(function (r) { return r[0]; });
    g3.forEach(function (r) { r.slice(1).forEach(function (id) { ev.colocacao[id] = 9; }); });
    ev.done = true; return;
  }
  if (plano === "MASTERS" && ev.si === 0) {
    var adv = st.adv.slice(0, 4);
    st.out.forEach(function (id) { ev.colocacao[id] = 9; });
    var d = ev.extra.direct;
    ev.stages.push(newBracket("DE8", [d[0], d[1], d[2], d[3], adv[0], adv[1], adv[2], adv[3]], 3));
    ev.si++; return;
  }
  if (plano === "CHAMPIONS" && ev.si === 0) {
    var firsts = [], seconds = [];
    st.subs.forEach(function (sub) {
      var w1 = sub.nodes.WM.res.winner, w2 = sub.nodes.DM.res.winner;
      firsts.push(w1); seconds.push(w2);
      ev.colocacao[sub.nodes.DM.res.loser] = 9;
      ev.colocacao[sub.nodes.EM.res.loser] = 13;
    });
    /* A1 B1 C1 D1 | s5=C2 s6=D2 s7=A2 s8=B2 → cruzamentos A1×B2, D1×C2, B1×A2, C1×D2 */
    ev.stages.push(newBracket("DE8", [firsts[0], firsts[1], firsts[2], firsts[3], seconds[2], seconds[3], seconds[0], seconds[1]], 3));
    ev.si++; return;
  }

  /* último estágio do evento: chave final */
  if (st.kind === "bracket") {
    Object.keys(st.place).forEach(function (id) { ev.colocacao[id] = st.place[id]; });
  }
  ev.done = true;
  finalizeEvent(ev);
}

function finalizeEvent(ev) {
  var ranking = Object.keys(ev.colocacao).sort(function (a, b) { return ev.colocacao[a] - ev.colocacao[b]; });
  ranking.forEach(function (id) {
    var pos = ev.colocacao[id];
    if (ev.cpTab && pos <= ev.cpTab.length) S.cp[id] = (S.cp[id] || 0) + ev.cpTab[pos - 1];
    if (ev.premio && pos <= ev.premio.length) { T(id).cash += ev.premio[pos - 1]; ledger(id, "Premiação", ev.premio[pos - 1], ev.nome + " — " + posLabel(pos)); }
  });
  var champ = ranking.filter(function (id) { return ev.colocacao[id] === 1; })[0];
  if (champ) {
    news(T(champ).nome + " é campeão do " + ev.nome + "!", "titulo");
    S.historico.push({ temporada:S.temporada, evento:ev.nome, campeao:champ,
      vice:ranking.filter(function (id) { return ev.colocacao[id] === 2; })[0] });
    if (champ === S.userTeam) S.conquistas.push(S.temporada + " — " + ev.nome);
    activeFive(T(champ)).forEach(function (p) { p.titulos = (p.titulos || 0) + 1; });
  }
  var top3 = ranking.filter(function (id) { return ev.colocacao[id] <= 3; })
    .sort(function (a, b) { return ev.colocacao[a] - ev.colocacao[b]; });

  if (ev.tipo === "KICKOFF" || (ev.tipo === "STAGE" && ev.plano === "STAGE1")) {
    S.qualMasters = S.qualMasters || {};
    S.qualMasters[ev.liga] = top3;
  }
  if (ev.tipo === "CHAL" && ev.extra.n === 2) {
    S.chalRank = S.chalRank || {};
    S.chalRank[ev.liga] = ranking.slice();
  }
  if (ev.plano === "STAGE2P") {
    S.qualChampions = S.qualChampions || {};
    var two = top3.slice(0, 2);
    var rest = leagueTeams(ev.liga).filter(function (id) { return two.indexOf(id) < 0; })
      .sort(function (a, b) { return (S.cp[b] || 0) - (S.cp[a] || 0) || strength(b) - strength(a); });
    S.qualChampions[ev.liga] = two.concat(rest.slice(0, 2));
  }
  if (S.userTeam && ev.colocacao[S.userTeam]) {
    boardEvent(ev);
    var pos = ev.colocacao[S.userTeam];
    news("Você terminou o " + ev.nome + " em " + posLabel(pos) + ".", pos <= 2 ? "bom" : "info");
  }
}

function posLabel(p) {
  if (p === 1) return "1º lugar";
  if (p === 2) return "2º lugar";
  if (p === 3) return "3º lugar";
  if (p === 4) return "4º lugar";
  if (p <= 6) return "5º–6º";
  if (p <= 8) return "7º–8º";
  if (p <= 12) return "9º–12º";
  return "13º–16º";
}

function news(txt, tipo) {
  S.noticias.unshift({ t:txt, tipo:tipo || "info", fase:FASES[S.fase].nome, fi:S.fase, dia:S.diaFase || 0, temp:S.temporada });
  if (S.noticias.length > 80) S.noticias.length = 80;
}

/* ---------------------------------------------------------------------
   Dia de jogo
   --------------------------------------------------------------------- */
function todayMatches() {
  var out = [];
  S.eventos.forEach(function (ev, ei) {
    evMatchesToday(ev).forEach(function (m) { m.ei = ei; m.evNome = ev.nome; out.push(m); });
  });
  return out;
}
function userMatchToday() {
  var u = S.userTeam;
  return todayMatches().filter(function (m) { return m.a === u || m.b === u; })[0] || null;
}
function phaseOver() { return S.eventos.every(function (e) { return e.done; }); }

/* Joga o dia; userResult (opcional) é o resultado da partida do usuário já jogada ao vivo. */
function playDay(userResult) {
  var ms = todayMatches();
  S.janela = false;
  var results = [];
  ms.forEach(function (m) {
    var res;
    var isUser = (m.a === S.userTeam || m.b === S.userTeam);
    if (isUser && userResult) res = userResult;
    else res = simSeries(m.a, m.b, m.bo);
    evRecord(S.eventos[m.ei], m, res);
    results.push({ m:m, res:res });
    if (isUser) {
      var won = res.winner === S.userTeam;
      S.meusJogos = S.meusJogos || [];
      S.meusJogos.unshift({ temp:S.temporada, fase:S.fase, dia:S.diaFase || 0, opp:won ? res.loser : res.winner, wa:res.a === S.userTeam ? res.wa : res.wb, wb:res.a === S.userTeam ? res.wb : res.wa, won:won, ev:m.evNome, maps:res.maps.map(function (x) { return x.map; }) });
      if (S.meusJogos.length > 60) S.meusJogos.length = 60;
      news((won ? "Vitória" : "Derrota") + " contra " + T(won ? res.loser : res.winner).nome + " por " +
        Math.max(res.wa, res.wb) + "–" + Math.min(res.wa, res.wb) + " (" + m.evNome + ").", won ? "bom" : "ruim");
    }
  });
  S.eventos.forEach(function (ev) { evEndDay(ev); });
  Object.keys(S.players).forEach(function (id) { var p = S.players[id]; if (p.lesao && p.lesao.dias > 0) { p.lesao.dias--; if (p.lesao.dias <= 0) { if (p.teamId === S.userTeam) news(p.nick + " voltou a treinar normalmente.", "bom"); p.lesao = null; } } });
  Object.keys(S.teams).forEach(function (id) { var t = S.teams[id]; t.quimica = clamp((t.quimica == null ? 75 : t.quimica) + (id === S.userTeam ? 0.25 + ((S.qg && S.qg.bootcamp) || 1) * 0.06 : 0.3), 30, 95); });
  trainingTick();
  decayForm();
  recoverHealth();
  S.ultimosResultados = results.map(function (x) { return { a:x.res.a, b:x.res.b, wa:x.res.wa, wb:x.res.wb, ev:x.m.evNome }; });
  return results;
}

function nextPhase() {
  if (FASES[S.fase].id === "CHAMPIONS") {
    buildPhase(FASES.length - 1); /* OFF */
    offseason();
    return;
  }
  if (FASES[S.fase].id === "OFF") {
    newSeason();
    return;
  }
  chargePayroll();
  boardPhaseEnd();
  squadMood(); youthTick(); clauseRaids();
  buildPhase(S.fase + 1);
  aiMarket(ri(3, 7));
  if (R() < 0.5) newPatch();
  news("Começa: " + FASES[S.fase].nome + ".", "info");
}

function staffPayroll(t) { return sum(STAFF_ROLES.map(function (r) { var s = staffOf(t, r); return s ? s.salario : 0; })); }
function chargePayroll() {
  Object.keys(S.teams).forEach(function (id) {
    var t = S.teams[id];
    var pay = (sum(t.roster.map(function (pid) { return P(pid).salary; })) + staffPayroll(t)) / 7;
    var income = incomeFor(t);
    if (id === S.userTeam) pay *= dif().salary;
    t.cash = Math.round(t.cash - pay + income);
    if (id === S.userTeam) {
      ledger(id, "Salários", -pay, "Folha de jogadores e staff — " + FASES[S.fase].nome);
      ledger(id, "Receita", income, "Liga e patrocínios — " + FASES[S.fase].nome);
      S.finHist = S.finHist || [];
      S.finHist.push({ temp:S.temporada, fase:FASES[S.fase].nome, receita:Math.round(S.finAcc ? S.finAcc.receita : income), despesa:Math.round(S.finAcc ? S.finAcc.despesa : pay) });
      if (S.finHist.length > 21) S.finHist.shift();
      S.finAcc = { receita:0, despesa:0 };
    }
  });
}

/* ---------------------------------------------------------------------
   Treino, forma, pré-temporada
   --------------------------------------------------------------------- */
var TREINOS = {
  equilibrado:{ nome:"Equilibrado", attrs:["aim", "util", "sense", "comms"] },
  mira:{ nome:"Mira", attrs:["aim", "clutch"] },
  utilitaria:{ nome:"Utilitária", attrs:["util"] },
  tatica:{ nome:"Tática", attrs:["sense", "comms"] },
  descanso:{ nome:"Descanso", attrs:[] }
};
function trainingTick() {
  var u = T(S.userTeam); if (!u) return;
  var tr = TREINOS[S.treino] || TREINOS.equilibrado;
  u.roster.map(P).forEach(function (p) {
    if (S.treino === "descanso") { p.morale = clamp(p.morale + 2, 30, 99); p.form = clamp(p.form + 0.2, -3, 3); return; }
    var chance = (p.age <= 21 ? 0.22 : p.age <= 25 ? 0.14 : 0.07) * (tr.attrs.length <= 2 ? 1.3 : 0.8) * (0.7 + 0.15 * staffLvl(u, "tecnico")) * (1 + (mgr("desenvolvimento") - 10) * 0.03) * (1 + ((S.qg && S.qg.bootcamp) || 1) * 0.06 - 0.06);
    tr.attrs.forEach(function (a) { if (R() < chance) p[a] = Math.min(97, p[a] + 1); });
    p.morale = clamp(p.morale - 0.3, 30, 99);
    p.salaryNext = salaryFor(ovr(p));
  });
  var g = mapGain(u);
  S.mapas.forEach(function (m) {
    var on = (S.treinoMapas || []).indexOf(m) >= 0;
    u.mapProf[m] = clamp(u.mapProf[m] + (on ? g : -0.08), 30, 95);
  });
}
function mapGain(u) { return 0.35 + 0.12 * staffLvl(u || T(S.userTeam), "tecnico") + (S.treino === "tatica" ? 0.3 : 0); }
function recoverHealth() {
  Object.keys(S.teams).forEach(function (tid) {
    var t = S.teams[tid], f = staffLvl(t, "fisio");
    var cad = (qgLevels(t).cadeira || 1) - 1;
    t.roster.forEach(function (pid) { var p = P(pid); p.saude = clamp((p.saude == null ? 100 : p.saude) + 5 + f * 1.3 + cad * 0.5, 0, 100); });
  });
}
function decayForm() {
  Object.keys(S.players).forEach(function (id) { var p = S.players[id]; p.form *= 0.85; });
}

function offseason() {
  hofSeason();
  news("Fim da temporada " + S.temporada + ". Janela de transferências aberta.", "titulo");
  boardPhaseEnd();
  Object.keys(S.players).forEach(function (id) {
    var p = S.players[id];
    if (p.aposentado) return;
    var gap = (p.pot || ovr(p)) - ovr(p);
    var d = p.age <= 21 ? ri(1, 3) : p.age <= 24 ? ri(0, 2) : p.age <= 27 ? ri(-1, 1) : ri(-2, 0);
    if (p.age <= 24 && gap > 6) d += 1; if (gap <= 0 && d > 0) d = 0;
    ["aim", "util", "sense", "clutch", "comms"].forEach(function (a) { p[a] = clamp(p[a] + d + ri(-1, 1), 35, 97); });
    p.age++;
    if (p.teamId) p.contract--;
  });
  /* contratos vencidos */
  Object.keys(S.teams).forEach(function (tid) {
    var t = S.teams[tid];
    t.roster.slice().forEach(function (pid) {
      var p = P(pid);
      if (p.contract > 0) return;
      if (tid !== S.userTeam && R() < 0.7) { p.contract = ri(1, 3); p.salary = salaryFor(ovr(p)); return; }
      if (tid === S.userTeam) { news(p.nick + " terminou contrato e está livre no mercado.", "ruim"); }
      releasePlayer(p);
    });
    while (t.roster.length < 5) {
      var np = aiSignFreeAgent(t);
      if (tid === S.userTeam) news("Pra completar o elenco, a diretoria contratou o agente livre " + np.nick + ".", "info");
    }
  });
  S.qualMasters = {}; S.qualChampions = {}; S.stage2 = {}; S.chalRank = {};
  retirements(); regens(); raiseDemands();
  aiMarket(ri(10, 18));
  if (S.userTeam) genYouth(ri(2, 3));
  rotateMaps();
}
function newSeason() {
  S.temporada++; S.sf = {};
  Object.keys(S.cp).forEach(function (id) { S.cp[id] = 0; });
  Object.keys(S.players).forEach(function (id) { S.players[id].stats = { mapas:0, k:0, d:0, a:0, acsSum:0 }; });
  buildPhase(0);
  news("Temporada " + S.temporada + " começou. Kickoff em todas as ligas.", "titulo");
}

/* ---------------------------------------------------------------------
   Mercado
   --------------------------------------------------------------------- */
function releasePlayer(p) {
  var t = p.teamId ? T(p.teamId) : null;
  if (t) tlog(p, t.id, null, 0, "Liberado");
  if (t) {
    t.roster = t.roster.filter(function (id) { return id !== p.id; });
    if (t.lineup) t.lineup = t.lineup.filter(function (id) { return id !== p.id; });
  }
  p.teamId = null; p.contract = 0;
  if (S.freeAgents.indexOf(p.id) < 0) S.freeAgents.push(p.id);
}
function aiSignFreeAgent(t) {
  var need = missingRole(t.roster.map(P));
  var pool = S.freeAgents.map(P).filter(function (p) { return p.role === need || need === "F"; });
  if (!pool.length) pool = S.freeAgents.map(P);
  var p;
  if (pool.length) {
    pool.sort(function (a, b) { return ovr(b) - ovr(a); });
    p = pool[Math.min(pool.length - 1, ri(0, 2))];
    S.freeAgents = S.freeAgents.filter(function (id) { return id !== p.id; });
  } else {
    p = genFiller(t.liga === "DESAF" ? t.regiao : t.liga, baseForTier(t.liga, t.nivel || 2), null, need);
  }
  p.teamId = t.id; p.contract = ri(1, 2); p.salary = salaryFor(ovr(p));
  tlog(p, null, t.id, 0, "Agente livre");
  t.roster.push(p.id);
  return p;
}

function marketOpen() { return S.janela || FASES[S.fase].id === "OFF"; }

function buyPlayer(pid, offer) {
  var p = P(pid), buyer = T(S.userTeam), seller = T(p.teamId);
  if (!marketOpen()) return { ok:false, msg:"A janela está fechada. Ela abre no início de cada fase." };
  if (buyer.roster.length >= 7) return { ok:false, msg:"Elenco cheio (máximo de 7). Libere alguém antes." };
  var price = Math.round(valueFor(p) * dif().price * (1 - (mgr("negociacao") - 10) * 0.012) / 1000) * 1000;
  if (offer > buyer.cash) return { ok:false, msg:"Caixa insuficiente." };
  if (offer < price * 0.9) return { ok:false, msg:seller.nome + " recusou. Pedem pelo menos " + money(Math.round(price * 0.9 / 1000) * 1000) + "." };
  if (offer < price && R() < 0.5) return { ok:false, msg:seller.nome + " recusou essa oferta. Tente chegar mais perto de " + money(price) + "." };
  buyer.cash -= offer; seller.cash += offer;
  buyer.quimica = clamp((buyer.quimica == null ? 72 : buyer.quimica) - 10, 30, 95);
  ledger(buyer.id, "Transferência", -offer, "Compra de " + p.nick + " (" + seller.tag + ")"); tlog(p, seller.id, buyer.id, offer, "Transferência");
  seller.roster = seller.roster.filter(function (id) { return id !== pid; });
  if (seller.lineup) seller.lineup = seller.lineup.filter(function (id) { return id !== pid; });
  p.teamId = buyer.id; p.contract = 2; p.salary = salaryFor(ovr(p));
  buyer.roster.push(pid);
  while (seller.roster.length < 5) aiSignFreeAgent(seller);
  news("Você contratou " + p.nick + " junto à " + seller.nome + " por " + money(offer) + ".", "bom");
  return { ok:true, msg:p.nick + " é seu!" };
}
function signFree(pid) {
  var p = P(pid), buyer = T(S.userTeam);
  if (!marketOpen()) return { ok:false, msg:"A janela está fechada. Ela abre no início de cada fase." };
  if (buyer.roster.length >= 7) return { ok:false, msg:"Elenco cheio (máximo de 7)." };
  var luvas = Math.round(p.salary * 0.25 / 1000) * 1000;
  if (luvas > buyer.cash) return { ok:false, msg:"Caixa insuficiente para as luvas (" + money(luvas) + ")." };
  buyer.quimica = clamp((buyer.quimica == null ? 72 : buyer.quimica) - 8, 30, 95);
  buyer.cash -= luvas; ledger(buyer.id, "Luvas", -luvas, "Contratação de " + p.nick); tlog(p, null, buyer.id, 0, "Agente livre");
  S.freeAgents = S.freeAgents.filter(function (id) { return id !== pid; });
  p.teamId = buyer.id; p.contract = 2; p.salary = salaryFor(ovr(p));
  buyer.roster.push(pid);
  news("Você contratou o agente livre " + p.nick + ".", "bom");
  return { ok:true, msg:p.nick + " assinou com você." };
}
function sellOffer(pid) {
  var p = P(pid);
  var buyers = Object.keys(S.teams).filter(function (id) {
    var t = S.teams[id]; return id !== S.userTeam && !t.desafiante && t.cash > valueFor(p) && t.roster.length < 7;
  });
  if (!buyers.length) return null;
  buyers.sort(function (a, b) { return strength(a) - strength(b); });
  var t = T(buyers[Math.floor(buyers.length / 2)]);
  return { team:t.id, valor:Math.round(valueFor(p) * (0.75 + R() * 0.2) / 1000) * 1000 };
}
function sellPlayer(pid, offer) {
  var p = P(pid), me = T(S.userTeam), t = T(offer.team);
  if (me.roster.length <= 5) return { ok:false, msg:"Você precisa de pelo menos 5 jogadores." };
  me.roster = me.roster.filter(function (id) { return id !== pid; });
  if (me.lineup) me.lineup = me.lineup.filter(function (id) { return id !== pid; });
  me.cash += offer.valor; t.cash -= offer.valor;
  ledger(me.id, "Transferência", offer.valor, "Venda de " + p.nick + " (" + t.tag + ")"); tlog(p, me.id, t.id, offer.valor, "Transferência");
  p.teamId = t.id; p.contract = 2; t.roster.push(pid);
  news(p.nick + " foi vendido para a " + t.nome + " por " + money(offer.valor) + ".", "info");
  return { ok:true, msg:"Venda concluída." };
}
function renewPlayer(pid) {
  var p = P(pid), me = T(S.userTeam);
  var nova = Math.round(salaryFor(ovr(p)) * 1.1 / 1000) * 1000;
  p.salary = nova; p.contract = 3; p.morale = clamp(p.morale + 5, 30, 99);
  return { ok:true, msg:p.nick + " renovou por 3 temporadas (" + money(nova) + "/ano)." };
}
function releaseUser(pid) {
  var me = T(S.userTeam);
  if (me.roster.length <= 5) return { ok:false, msg:"Você precisa de pelo menos 5 jogadores." };
  var p = P(pid);
  var multa = Math.round(p.salary * 0.3 * Math.max(1, p.contract) / 1000) * 1000;
  if (multa > me.cash) return { ok:false, msg:"Caixa insuficiente para a rescisão (" + money(multa) + ")." };
  me.cash -= multa; ledger(me.id, "Rescisão", -multa, "Rescisão de " + p.nick);
  releasePlayer(p);
  return { ok:true, msg:p.nick + " foi liberado (rescisão de " + money(multa) + ")." };
}

function scoutLimit() { return 3 + staffLvl(T(S.userTeam), "olheiro") * 3; }
function isScouted(pid) {
  var p = P(pid); if (!p) return false;
  return p.teamId === S.userTeam || p.academia === S.userTeam || !!S.scout[pid];
}
function observe(pid) {
  if (isScouted(pid)) return { ok:true, msg:"Já observado." };
  if (S.scoutUsados >= scoutLimit()) return { ok:false, msg:"Seu olheiro já usou todas as observações desta fase (" + scoutLimit() + "). Um olheiro melhor observa mais." };
  S.scout[pid] = true; S.scoutUsados++;
  return { ok:true, msg:P(pid).nick + " observado. Atributos exatos liberados." };
}
function hireStaff(sid) {
  var st = S.staff[sid], me = T(S.userTeam);
  var luvas = Math.round(st.salario * 0.25 / 1000) * 1000;
  if (luvas > me.cash) return { ok:false, msg:"Caixa insuficiente para as luvas (" + money(luvas) + ")." };
  var old = staffOf(me, st.role);
  if (old) { old.teamId = null; S.staffLivre.push(old.id); }
  me.cash -= luvas; ledger(me.id, "Staff", -luvas, "Luvas de " + st.nome);
  S.staffLivre = S.staffLivre.filter(function (x) { return x !== sid; });
  st.teamId = me.id; me.staff[st.role] = sid;
  news("Você contratou " + st.nome + " como " + STAFF_NOME[st.role].toLowerCase() + ".", "bom");
  return { ok:true, msg:st.nome + " é o novo " + STAFF_NOME[st.role].toLowerCase() + "." };
}
function fireStaff(role) {
  var me = T(S.userTeam), st = staffOf(me, role);
  if (!st) return { ok:false, msg:"Não há ninguém nessa função." };
  var multa = Math.round(st.salario * 0.3 / 1000) * 1000;
  if (multa > me.cash) return { ok:false, msg:"Caixa insuficiente para a multa (" + money(multa) + ")." };
  me.cash -= multa; ledger(me.id, "Staff", -multa, "Multa de " + st.nome); st.teamId = null; delete me.staff[role]; S.staffLivre.push(st.id);
  return { ok:true, msg:st.nome + " foi desligado (multa de " + money(multa) + ")." };
}

function migrate() {
  if (!S) return;
  S.staff = S.staff || {}; S.staffLivre = S.staffLivre || []; S.scout = S.scout || {};
  if (S.scoutUsados == null) S.scoutUsados = 0;
  if (!S.treinoMapas || !S.treinoMapas.length) S.treinoMapas = S.mapas.slice(0, 3);
  Object.keys(S.players).forEach(function (id) { var p = S.players[id]; if (p.lead == null) genExtra(p); if (p.saude == null) p.saude = 100; });
  Object.keys(S.teams).forEach(function (id) {
    var t = S.teams[id];
    if (!t.staff) {
      t.staff = {};
      var chal = isChal(t.liga);
      STAFF_ROLES.forEach(function (role) {
        var nome = role === "tecnico" && t.tecnico && t.tecnico !== "—" ? t.tecnico : null;
        t.staff[role] = newStaff(role, clamp(Math.round((t.nivel || 2) * 0.7 + 1), 1, 5), nome, id, chal).id;
      });
    }
    ensureTactics(t);
  });
  if (!S.staffLivre.length) STAFF_ROLES.forEach(function (role) { for (var i = 0; i < 6; i++) S.staffLivre.push(newStaff(role, ri(1, 5), null, null, R() < .4).id); });
  if ((S.versao || 1) < 3) {
    Object.keys(S.staff).forEach(function (id) {
      var st = S.staff[id], chal = st.teamId && T(st.teamId) ? isChal(T(st.teamId).liga) : st.salario < 18000 * st.nivel * st.nivel * 0.9;
      st.salario = staffSalary(st.nivel, chal);
    });
  }
  if (!S.elo) eloInit();
  S.transacoes = S.transacoes || []; S.transfers = S.transfers || []; S.finHist = S.finHist || []; S.finAcc = S.finAcc || { receita:0, despesa:0 };
  if (S.userTeam) { if (!S.qg) initQG(); if (!S.patrocinio) autoSponsors(T(S.userTeam)); }
  if (!S.meta) metaInit();
  if (S.userTeam && !S.board) boardInit();
  S.academia = S.academia || []; if (!S.academiaNivel) S.academiaNivel = 1;
  S.hof = S.hof || { temporadas:[], lendas:[] };
  S.mapas.forEach(function (m) { ensureMap(m); });
  if (!S.dif) S.dif = "normal";
  S.versao = 6;
}
function setLineupChem() { var t = userTeam(); if (t) t.quimica = clamp((t.quimica == null ? 72 : t.quimica) - 3, 30, 95); }
function initQG() { var l = qgLevels(T(S.userTeam)); S.qg = {}; Object.keys(QG_ITEMS).forEach(function (k) { S.qg[k] = l[k]; }); }
function setUserTeam(id) { S.userTeam = id; T(id).quimica = 66; S.qg = null; initQG(); autoSponsors(T(id)); if (!S.board) boardInit(); if (!S.academia || !S.academia.length) { S.academiaNivel = S.academiaNivel || 1; genYouth(3); } }

/* ---------------------------------------------------------------------
   Clube: livro-caixa, transferências, QG, patrocínio, ranking
   --------------------------------------------------------------------- */
function ledger(tid, tipo, valor, desc) {
  if (!S || tid !== S.userTeam || !valor) return;
  S.transacoes = S.transacoes || [];
  S.transacoes.unshift({ temp:S.temporada, fase:S.fase, dia:S.diaFase || 0, tipo:tipo, valor:Math.round(valor), desc:desc });
  if (S.transacoes.length > 250) S.transacoes.length = 250;
  S.finAcc = S.finAcc || { receita:0, despesa:0 };
  if (valor > 0) S.finAcc.receita += valor; else S.finAcc.despesa -= valor;
}
function tlog(p, from, to, valor, tipo) {
  S.transfers = S.transfers || [];
  S.transfers.unshift({ temp:S.temporada, fase:S.fase, dia:S.diaFase || 0, pid:p.id, nick:p.nick, role:p.role, age:p.age, nat:p.nat, ovr:ovr(p), from:from || null, to:to || null, valor:valor || 0, tipo:tipo });
  if (S.transfers.length > 400) S.transfers.length = 400;
}

var QG_ITEMS = {
  bootcamp:{ nome:"Bootcamp", base:30000, bonus:{ team:.2 }, extra:"Treino rende 6% a mais por nível." },
  pc:{ nome:"PC", base:12000, bonus:{ reflex:.15, cons:.15 } },
  monitor:{ nome:"Monitor", base:8000, bonus:{ reflex:.3 } },
  mouse:{ nome:"Mouse", base:4000, bonus:{ aim:.3, reflex:.1 } },
  mousepad:{ nome:"Mousepad", base:2000, bonus:{ aim:.15, mov:.15 } },
  teclado:{ nome:"Teclado", base:4000, bonus:{ mov:.3 } },
  fone:{ nome:"Fones", base:5000, bonus:{ perc:.3, comms:.1 } },
  cadeira:{ nome:"Cadeira", base:6000, bonus:{ stam:.3 }, extra:"Recupera +0,5 de saúde por dia por nível." },
  mesa:{ nome:"Mesa", base:5000, bonus:{ stam:.15, comp:.15 } },
  bebida:{ nome:"Bebidas", base:2000, bonus:{ reflex:.1, stam:.2 } }
};
function qgLevels(t) {
  if (t.id === S.userTeam && S.qg) return S.qg;
  var l = clamp(Math.round((t.nivel || 2) * 0.7 + (isChal(t.liga) ? 0 : 0.6)), 1, 5), o = {};
  Object.keys(QG_ITEMS).forEach(function (k) { o[k] = l; });
  return o;
}
function qgBonus(t) {
  var lv = qgLevels(t), b = {};
  Object.keys(QG_ITEMS).forEach(function (k) {
    var it = QG_ITEMS[k];
    Object.keys(it.bonus).forEach(function (a) { b[a] = (b[a] || 0) + it.bonus[a] * (lv[k] - 1); });
  });
  return b;
}
function qgEff(t) { var b = qgBonus(t); return sum(Object.keys(b).map(function (k) { return b[k]; })) * 0.25; }
function qgCost(k, lvl) { return Math.round(QG_ITEMS[k].base * lvl * lvl * dif().price / 1000) * 1000; }
function qgUpgrade(k) {
  var me = T(S.userTeam), lv = S.qg[k];
  if (lv >= 5) return { ok:false, msg:QG_ITEMS[k].nome + " já está no nível máximo." };
  var c = qgCost(k, lv);
  if (c > me.cash) return { ok:false, msg:"Caixa insuficiente (" + money(c) + ")." };
  me.cash -= c; S.qg[k] = lv + 1;
  ledger(me.id, "QG", -c, QG_ITEMS[k].nome + " nível " + (lv + 1));
  return { ok:true, msg:QG_ITEMS[k].nome + " subiu pro nível " + (lv + 1) + "." };
}

var SPONSOR_TIER = { S:{ pay:90000 }, A:{ pay:55000 }, B:{ pay:30000 }, C:{ pay:15000 }, D:{ pay:6000 } };
var SPONSORS = [
  ["aurion", "Aurion Tech", "Hardware", "S", 5], ["vexa", "Vexa Motors", "Automotivo", "S", 5], ["orbital", "Orbital Bank", "Financeiro", "S", 4],
  ["pulsar", "Pulsar Energy", "Bebidas", "A", 4], ["nexo", "Nexo Telecom", "Telecom", "A", 4], ["kairo", "Kairo Periféricos", "Periféricos", "A", 5], ["lumen", "Lumen Cloud", "Infraestrutura", "A", 3],
  ["rapto", "Rapto Delivery", "Logística", "B", 4], ["zenith", "Zenith Cadeiras", "Móveis", "B", 3], ["byte", "Byte Burger", "Alimentação", "B", 3], ["onda", "Onda Fibra", "Telecom", "B", 4], ["faisca", "Faísca Energético", "Bebidas", "B", 3],
  ["grao", "Grão Café", "Alimentação", "C", 3], ["norte", "Norte Seguros", "Seguros", "C", 2], ["pixel", "PixelPrint", "Gráfica", "C", 3], ["cria", "Cria Moda", "Vestuário", "C", 3], ["vertice", "Vértice Academia", "Academia", "C", 2],
  ["bompreco", "Mercadinho Bom Preço", "Varejo", "D", 2], ["acai", "Açaí da Praça", "Alimentação", "D", 3], ["turbo", "Lava Rápido Turbo", "Serviços", "D", 1], ["estrela", "Padaria Estrela", "Alimentação", "D", 2], ["gamecenter", "Game Center", "Varejo", "D", 2]
].map(function (x) { return { id:x[0], nome:x[1], cat:x[2], tier:x[3], stars:x[4], pay:SPONSOR_TIER[x[3]].pay }; });
function sponsorById(id) { return SPONSORS.filter(function (s) { return s.id === id; })[0] || null; }
function sponsorReq(tier, t) {
  var vct = !isChal(t.liga), titles = (S.historico || []).filter(function (h) { return h.campeao === t.id; }).length;
  if (tier === "S") return { ok:vct && (t.nivel >= 5 || titles > 0), txt:"Liga VCT e time de ponta (ou um título)" };
  if (tier === "A") return { ok:vct && t.nivel >= 3, txt:"Liga VCT e time médio pra cima" };
  if (tier === "B") return { ok:vct || t.nivel >= 4 || titles > 0, txt:"Liga VCT ou time forte do Challengers" };
  if (tier === "C") return { ok:vct || t.nivel >= 2, txt:"Qualquer time estabelecido" };
  return { ok:true, txt:"Sem exigência" };
}
function sponsorIncome(t) {
  if (t.id === S.userTeam && S.patrocinio) {
    var p = sponsorById(S.patrocinio.principal), s1 = sponsorById(S.patrocinio.sec[0]), s2 = sponsorById(S.patrocinio.sec[1]);
    return (p ? p.pay : 0) + (s1 ? s1.pay * 0.35 : 0) + (s2 ? s2.pay * 0.35 : 0);
  }
  var vct = !isChal(t.liga);
  return vct ? [0, 30000, 45000, 60000, 75000, 90000][t.nivel || 2] : [0, 6000, 10000, 15000, 20000, 26000][t.nivel || 2];
}
function autoSponsors(t) {
  var ok = SPONSORS.filter(function (s) { return sponsorReq(s.tier, t).ok; }).sort(function (a, b) { return b.pay - a.pay || b.stars - a.stars; });
  S.patrocinio = { principal:ok[0] ? ok[0].id : null, sec:[ok[1] ? ok[1].id : null, ok[2] ? ok[2].id : null] };
}
function setSponsor(slot, id) {
  var t = T(S.userTeam), sp = sponsorById(id);
  if (!marketOpen()) return { ok:false, msg:"Contratos de patrocínio só mudam com a janela aberta (início de cada fase)." };
  if (sp && !sponsorReq(sp.tier, t).ok) return { ok:false, msg:sp.nome + " não fecha com o clube: " + sponsorReq(sp.tier, t).txt.toLowerCase() + "." };
  var P2 = S.patrocinio;
  if (slot === "principal") { P2.sec = P2.sec.map(function (x) { return x === id ? P2.principal : x; }); P2.principal = id; }
  else { var i = +slot; if (P2.principal === id) P2.principal = P2.sec[i]; var j = 1 - i; if (P2.sec[j] === id) P2.sec[j] = P2.sec[i]; P2.sec[i] = id; }
  news("Novo acordo de patrocínio com " + (sp ? sp.nome : "—") + ".", "bom");
  return { ok:true, msg:(sp ? sp.nome : "Espaço") + " agora " + (slot === "principal" ? "é o patrocinador principal." : "está na manga da camisa.") };
}

var FEEDER = { AMER:["AMER", "CBR", "CNA", "CLAT"], EMEA:["EMEA", "CEMEA"], PAC:["PAC", "CPAC"], CN:["CN", "CCN"] };
function regionOf(liga) { for (var k in FEEDER) if (FEEDER[k].indexOf(liga) >= 0) return k; return liga; }
function aiMarket(n) {
  var ids = Object.keys(S.teams).filter(function (id) { return id !== S.userTeam; }), done = 0, tries = 0;
  while (done < n && tries++ < n * 30) {
    var buyer = T(pick(ids));
    var pool = ids.filter(function (id) { var x = T(id); return id !== buyer.id && regionOf(x.liga) === regionOf(buyer.liga) && (x.nivel || 2) <= (buyer.nivel || 2); });
    if (!pool.length) continue;
    var seller = T(pick(pool));
    var worst = activeFive(buyer).sort(function (a, b) { return ovr(a) - ovr(b); })[0];
    var cand = seller.roster.map(P).filter(function (p) { return ovr(p) >= ovr(worst) + 2 && (p.role === worst.role || p.role === "F" || worst.role === "F"); })
      .sort(function (a, b) { return ovr(b) - ovr(a); })[0];
    if (!cand) continue;
    var price = valueFor(cand);
    if (buyer.cash < price * 1.15) continue;
    buyer.cash -= price; seller.cash += price;
    seller.roster = seller.roster.filter(function (id) { return id !== cand.id; });
    if (seller.lineup) seller.lineup = null;
    cand.teamId = buyer.id; cand.contract = ri(1, 3); cand.salary = salaryFor(ovr(cand));
    buyer.roster.push(cand.id); if (buyer.lineup) buyer.lineup = null;
    buyer.quimica = clamp((buyer.quimica == null ? 75 : buyer.quimica) - 8, 30, 95);
    tlog(cand, seller.id, buyer.id, price, "Transferência");
    if (buyer.roster.length > 6) releasePlayer(buyer.roster.map(P).sort(function (a, b) { return ovr(a) - ovr(b); })[0]);
    while (seller.roster.length < 5) aiSignFreeAgent(seller);
    if (ovr(cand) >= 80) news("Mercado: " + cand.nick + " deixa a " + seller.nome + " e assina com a " + buyer.nome + " (" + money(price) + ").", "info");
    done++;
  }
}
function eloInit() {
  S.elo = {};
  Object.keys(S.teams).forEach(function (id) { S.elo[id] = Math.round(1000 + (strength(id) - 68) * 22 + (isChal(S.teams[id].liga) ? -60 : 60)); });
}
function eloUpdate(res) {
  if (!S.elo) eloInit();
  var a = res.a, b = res.b, ea = 1 / (1 + Math.pow(10, (S.elo[b] - S.elo[a]) / 400));
  var sa = res.winner === a ? 1 : 0, k = 20 + 4 * Math.abs(res.wa - res.wb);
  S.elo[a] = Math.round(S.elo[a] + k * (sa - ea)); S.elo[b] = Math.round(S.elo[b] - k * (sa - ea));
}

/* ---------------------------------------------------------------------
   Diretoria, conversas, negociação, academia, perfis da IA, meta,
   rotação de mapas, aposentadoria, novos talentos e hall da fama
   --------------------------------------------------------------------- */
var DIF = {
  facil:    { nome:"Fácil",    ai:-1.5, read:0.6, inj:0.5, fad:0.8, money:1.15, price:0.9,  fire:10, board:0.7, salary:0.9 },
  normal:   { nome:"Normal",   ai:0,    read:1.0, inj:1.0, fad:1.0, money:1.0,  price:1.0,  fire:15, board:1.0, salary:1.0 },
  dificil:  { nome:"Difícil",  ai:2.5,  read:1.5, inj:1.3, fad:1.25, money:0.85, price:1.15, fire:22, board:1.3, salary:1.12 },
  pesadelo: { nome:"Pesadelo", ai:4.0,  read:1.9, inj:1.6, fad:1.45, money:0.72, price:1.3,  fire:30, board:1.6, salary:1.25 }
};
function dif() { return DIF[(S && S.dif) || "normal"] || DIF.normal; }
function setDif(k) { if (DIF[k]) S.dif = k; }
function userTeam() { return S && S.userTeam ? T(S.userTeam) : null; }
function boardInit() { S.board = { conf:55, hist:[], avisado:false }; S.propostas = []; S.demitido = false; }
function expectedPos(t, ev) {
  var n = Object.keys(ev.colocacao).length || 12, lv = t.nivel || 2;
  var frac = { 5:.17, 4:.34, 3:.5, 2:.67, 1:.8 }[lv] || .5;
  if (ev.tipo === "MASTERS" || ev.tipo === "CHAMPIONS") frac = Math.min(.85, frac + .25);
  return Math.max(1, Math.round(n * frac));
}
function boardDelta(d, motivo) {
  if (!S.board) boardInit();
  var b = S.board, antes = b.conf;
  b.conf = clamp(Math.round(b.conf + d), 0, 100);
  b.hist.unshift({ temp:S.temporada, fase:S.fase, dia:S.diaFase || 0, d:Math.round(d), motivo:motivo, conf:b.conf });
  if (b.hist.length > 40) b.hist.length = 40;
  if (b.conf < 35 && antes >= 35) news("O Conselho está preocupado com os resultados. Sua posição começa a ficar em risco (confiança " + b.conf + "%).", "ruim");
  if (b.conf >= 80 && antes < 80) news("O Conselho está muito satisfeito com o seu trabalho (confiança " + b.conf + "%).", "bom");
}
function n0(ev) { return Object.keys(ev.colocacao).length || 10; }
function objetivoCheck(t) {
  var f = S.sf || {}, lv = t.nivel || 2;
  if (isChal(t.liga)) return lv >= 4 ? !!(f.chalTitulo || f.playins) : lv >= 3 ? !!f.chalPlayoffs : !!f.chalDigno;
  return lv >= 5 ? !!f.champions : lv >= 4 ? !!(f.masters || f.champions) : lv >= 3 ? !!f.playoffs : !!f.naoLanterna;
}
function boardEvent(ev) {
  var u = S.userTeam; if (!u || !ev.colocacao[u]) return;
  var pos = ev.colocacao[u], exp = expectedPos(T(u), ev);
  var d = clamp((exp - pos) * 4, -18, 16); if (d < 0) d *= dif().board;
  S.sf = S.sf || {};
  if (ev.tipo === "MASTERS") S.sf.masters = true;
  if (ev.tipo === "CHAMPIONS") S.sf.champions = true;
  if (ev.tipo === "PLAYINS") S.sf.playins = true;
  if ((ev.tipo === "STAGE" || ev.tipo === "KICKOFF") && pos <= 8) S.sf.playoffs = true;
  if (ev.tipo === "STAGE" && pos <= 10) S.sf.naoLanterna = true;
  if (ev.tipo === "CHAL" && pos === 1) S.sf.chalTitulo = true;
  if (ev.tipo === "CHAL" && pos <= 8) S.sf.chalPlayoffs = true;
  if (ev.tipo === "CHAL" && pos <= Math.max(2, n0(ev) - 2)) S.sf.chalDigno = true;
  if (pos === 1) d += 12;
  boardDelta(d, ev.nome + ": " + posLabel(pos) + " (esperado: até " + exp + "º)");
}
function boardPhaseEnd() {
  var t = userTeam(); if (!t) return;
  var js = (S.meusJogos || []).filter(function (j) { return j.temp === S.temporada && j.fase === S.fase; });
  if (js.length) { var wr = js.filter(function (j) { return j.won; }).length / js.length; S.spPerf = 0.85 + wr * 0.3; } else S.spPerf = 1;
  t.roster.map(P).forEach(function (p) { if (p.querAumento) { if (salaryFor(ovr(p)) * dif().salary <= p.salary * 1.2) p.querAumento = false; else p.morale = clamp(p.morale - 4, 20, 99); } });
  if (!S.board) boardInit();
  if (t.cash < 0) boardDelta(-6 * dif().board, "Caixa negativo");
  if (payroll(t) > salaryCap(t)) boardDelta(-4 * dif().board, "Folha acima do teto salarial");
  if (FASES[S.fase].id === "CHAMPIONS" || FASES[S.fase].id === "OFF") {
    if (!S.sf || !S.sf.avaliado) {
      var ok = objetivoCheck(t);
      boardDelta(ok ? 20 : -28 * dif().board, (ok ? "Objetivo da temporada cumprido: " : "Objetivo da temporada NÃO cumprido: ") + objetivoPara(t).toLowerCase());
      S.sf = S.sf || {}; S.sf.avaliado = true;
    }
  }
  if (S.board.conf < dif().fire) {
    S.demitido = true;
    news("Você foi demitido da " + t.nome + ". O Conselho decidiu mudar o comando.", "ruim");
    S.propostas = genOffers(true);
    return;
  }
  S.propostas = (S.propostas || []).filter(function (o) { return o.ate >= S.temporada * 10 + S.fase; });
  if (S.board.conf >= 55 && R() < 0.35 + (S.board.conf - 55) / 120) {
    var nov = genOffers(false);
    nov.forEach(function (o) { news("Proposta: a " + T(o.team).nome + " quer você como manager. Veja em Diretoria.", "bom"); });
    S.propostas = (S.propostas || []).concat(nov).slice(-3);
  }
}
function genOffers(demitido) {
  var me = userTeam(), lv = me.nivel || 2;
  var pool = Object.keys(S.teams).filter(function (id) {
    var t = S.teams[id]; if (id === me.id) return false;
    return demitido ? (t.nivel || 2) <= Math.max(2, lv - 1) : (t.nivel || 2) >= lv && (t.nivel || 2) <= lv + 1;
  });
  shuffle(pool);
  return pool.slice(0, demitido ? 3 : ri(1, 2)).map(function (id) {
    var t = T(id); return { team:id, sal:isChal(t.liga) ? 40000 + (t.nivel || 2) * 6000 : 140000 + (t.nivel || 2) * 25000, ate:S.temporada * 10 + S.fase + 1 };
  });
}
function acceptOffer(i) {
  var o = (S.propostas || [])[i]; if (!o) return { ok:false, msg:"Proposta expirou." };
  var old = userTeam(), t = T(o.team);
  setUserTeam(t.id);
  S.demitido = false; S.propostas = []; S.board = { conf:60, hist:[], avisado:false };
  (S.academia || []).forEach(function (id) { var y = P(id); if (y) { y.academia = null; y.aposentado = true; } });
  S.academia = []; S.academiaNivel = 1;
  if (S.manager) S.manager.objetivo = objetivoPara(t);
  news("Você deixou a " + (old ? old.nome : "—") + " e assinou com a " + t.nome + ". Objetivo: " + objetivoPara(t).toLowerCase() + ".", "titulo");
  genYouth(3);
  return { ok:true, msg:"Bem-vindo à " + t.nome + "!" };
}
function rejectOffer(i) { (S.propostas || []).splice(i, 1); return { ok:true, msg:"Proposta recusada." }; }
function objetivoPara(t) {
  if (isChal(t.liga)) return t.nivel >= 4 ? "Ser campeão do Challengers e ir aos Play-Ins" : t.nivel >= 3 ? "Chegar aos playoffs do Challengers" : "Fazer uma campanha digna e revelar jogadores";
  return t.nivel >= 5 ? "Ganhar a liga e disputar o Champions" : t.nivel >= 4 ? "Classificar para um Masters" : t.nivel >= 3 ? "Chegar aos playoffs do Stage" : "Evitar a lanterna e crescer na temporada";
}

/* conversas */
function talkKey() { return S.temporada + ":" + S.fase + ":" + (S.diaFase || 0); }
function talk(pid, tipo) {
  var p = P(pid); if (!p || p.teamId !== S.userTeam) return { ok:false, msg:"Só dá pra conversar com jogadores do seu elenco." };
  if (p.conversa === talkKey()) return { ok:false, msg:p.nick + " já conversou com você hoje." };
  p.conversa = talkKey();
  var five = activeFive(T(S.userTeam)).map(function (x) { return x.id; }), tit = five.indexOf(pid) >= 0, mot = (mgr("motivacao") - 10) * 0.3;
  var r;
  if (tipo === "elogiar") {
    if (p.form >= 0) { p.morale = clamp(p.morale + 6 + mot, 20, 99); r = p.nick + " gostou do elogio. Moral subiu."; }
    else { p.morale = clamp(p.morale + 1, 20, 99); r = p.nick + " agradeceu, mas sabe que não está bem."; }
  } else if (tipo === "cobrar") {
    if (p.form < 0) { p.form = clamp(p.form + 0.7, -3, 3); p.morale = clamp(p.morale - 3, 20, 99); r = p.nick + " aceitou a cobrança e vai treinar mais. Forma subiu um pouco."; }
    else { p.morale = clamp(p.morale - 9, 20, 99); r = p.nick + " achou a cobrança injusta. Moral caiu."; }
  } else if (tipo === "motivar") {
    p.form = clamp(p.form + 0.35, -3, 3); p.morale = clamp(p.morale + 2 + mot, 20, 99); r = p.nick + " está pilhado pro próximo jogo.";
  } else if (tipo === "prometer") {
    if (tit) return { ok:false, msg:p.nick + " já é titular." };
    p.promessa = { tipo:"titular", ate:S.fase + 1, temp:S.temporada }; p.pedidoSaida = false;
    p.morale = clamp(p.morale + 12, 20, 99); r = "Você prometeu vaga de titular a " + p.nick + " até a próxima fase. Não esqueça de cumprir.";
  } else if (tipo === "acalmar") {
    if (!p.pedidoSaida) return { ok:false, msg:p.nick + " não pediu pra sair." };
    if (R() < 0.45 + (mgr("motivacao") - 10) * 0.03) { p.pedidoSaida = false; p.morale = clamp(p.morale + 8, 20, 99); r = p.nick + " aceitou ficar por enquanto."; }
    else { p.morale = clamp(p.morale - 4, 20, 99); r = p.nick + " continua querendo sair."; }
  }
  return { ok:true, msg:r };
}
function squadMood() {
  var t = userTeam(); if (!t) return;
  var five = activeFive(t).map(function (x) { return x.id; });
  t.roster.map(P).forEach(function (p) {
    var tit = five.indexOf(p.id) >= 0;
    if (p.promessa && p.promessa.ate <= S.fase && p.promessa.temp === S.temporada) {
      if (tit) { p.morale = clamp(p.morale + 5, 20, 99); news(p.nick + " ficou feliz: você cumpriu a promessa de titularidade.", "bom"); }
      else { p.morale = clamp(p.morale - 22, 20, 99); p.pedidoSaida = true; news(p.nick + " ficou revoltado: a promessa de titularidade não foi cumprida. Ele pediu pra sair.", "ruim"); }
      p.promessa = null;
    }
    if (!tit && !p.promessa && p.age >= 20 && ovr(p) >= 68) {
      p.morale = clamp(p.morale - 7, 20, 99);
      if (p.morale < 42 && !p.pedidoSaida) { p.pedidoSaida = true; news(p.nick + " está insatisfeito no banco e pediu pra ser negociado.", "ruim"); }
    }
    if (tit && p.pedidoSaida && p.morale > 60) p.pedidoSaida = false;
  });
}

/* negociação de contrato */
function contractAsk(p) {
  var base = salaryFor(ovr(p));
  var f = (1.08 + (70 - p.morale) / 220 + (p.pedidoSaida ? 0.15 : 0)) * dif().salary;
  return Math.round(base * f / 1000) * 1000;
}
function negotiate(pid, sal, anos, multa) {
  var p = P(pid), me = userTeam();
  if (!p || p.teamId !== me.id) return { ok:false, msg:"Jogador não é seu." };
  p.negTent = p.negKey === talkKey() ? (p.negTent || 0) : 0; p.negKey = talkKey();
  if (p.negTent >= 3) return { ok:false, msg:p.nick + " cansou de negociar hoje. Tente outro dia." };
  p.negTent++;
  var ask = contractAsk(p);
  var pref = p.age >= 27 ? 3 : p.age <= 21 ? 2 : 2;
  var need = ask * (anos === pref ? 0.96 : 1.02) * (multa >= valueFor(p) * 2.5 ? 1.06 : multa < valueFor(p) * 1.2 ? 0.97 : 1);
  need *= 1 - (mgr("negociacao") - 10) * 0.012;
  if (p.pedidoSaida) need *= 1.08;
  if (sal >= need) {
    p.salary = Math.round(sal / 1000) * 1000; p.contract = anos; p.multa = Math.round(multa / 1000) * 1000;
    p.morale = clamp(p.morale + 6, 20, 99); p.pedidoSaida = false; p.negTent = 0;
    news(p.nick + " renovou por " + anos + " temporada(s): " + money(p.salary) + "/ano, multa " + money(p.multa) + ".", "bom");
    return { ok:true, msg:p.nick + " assinou a renovação!" };
  }
  if (p.negTent >= 3) p.morale = clamp(p.morale - 5, 20, 99);
  return { ok:false, msg:p.nick + " recusou. O empresário dele pede algo perto de " + money(Math.round(need / 1000) * 1000) + "/ano.", ask:Math.round(need / 1000) * 1000 };
}
function clauseRaids() {
  var me = userTeam(); if (!me || me.roster.length <= 5) return;
  me.roster.map(P).forEach(function (p) {
    if (me.roster.length <= 5 || ovr(p) < 76) return;
    var clause = p.multa || valueFor(p) * 2;
    if (clause > valueFor(p) * 1.4 || R() > 0.22) return;
    var buyers = Object.keys(S.teams).filter(function (id) { var t = S.teams[id]; return id !== me.id && !isChal(t.liga) && t.cash > clause * 1.2 && t.roster.length < 7; });
    if (!buyers.length) return;
    var b = T(pick(buyers));
    b.cash -= clause; me.cash += clause;
    me.roster = me.roster.filter(function (id) { return id !== p.id; }); if (me.lineup) me.lineup = me.lineup.filter(function (id) { return id !== p.id; });
    p.teamId = b.id; p.contract = 2; b.roster.push(p.id);
    ledger(me.id, "Multa rescisória", clause, "Saída de " + p.nick + " para a " + b.tag);
    tlog(p, me.id, b.id, clause, "Multa rescisória");
    news("A " + b.nome + " pagou a multa rescisória de " + p.nick + " (" + money(clause) + ") e levou o jogador.", "ruim");
  });
}

/* academia */
function genYouth(n) {
  var me = userTeam(); if (!me) return;
  S.academia = S.academia || [];
  var lv = S.academiaNivel || 1;
  n = Math.min(n, 8 - S.academia.length);
  for (var i = 0; i < n; i++) {
    var p = genFiller(me.liga, ri(50, 58), null);
    p.age = ri(16, 18); p.academia = me.id; p.contract = 0;
    p.pot = clamp(Math.round(68 + lv * 4 + R() * 18), ovr(p) + 8, 95);
    p.salary = 3000;
    S.academia.push(p.id);
  }
}
function youthTick() {
  var lv = S.academiaNivel || 1;
  (S.academia || []).forEach(function (id) {
    var p = P(id); if (!p) return;
    var gap = (p.pot || 70) - ovr(p); if (gap <= 0) return;
    var ch = 0.12 + lv * 0.05 + (mgr("desenvolvimento") - 10) * 0.01;
    ["aim", "util", "sense", "clutch", "comms"].forEach(function (a) { if (R() < ch) p[a] = Math.min(97, p[a] + 1); });
  });
}
function academyCost() { return [0, 60000, 150000, 0][S.academiaNivel || 1]; }
function upgradeAcademy() {
  var me = userTeam(), lv = S.academiaNivel || 1; if (lv >= 3) return { ok:false, msg:"Academia já está no nível máximo." };
  var c = academyCost(); if (me.cash < c) return { ok:false, msg:"Caixa insuficiente (" + money(c) + ")." };
  me.cash -= c; S.academiaNivel = lv + 1; ledger(me.id, "Academia", -c, "Academia nível " + (lv + 1));
  return { ok:true, msg:"Academia subiu pro nível " + (lv + 1) + ". Jovens evoluem mais rápido e chegam melhores." };
}
function promoteYouth(pid) {
  var me = userTeam(), p = P(pid);
  if (me.roster.length >= 7) return { ok:false, msg:"Elenco cheio (máximo de 7)." };
  S.academia = S.academia.filter(function (x) { return x !== pid; });
  p.academia = null; p.teamId = me.id; p.contract = 3; p.salary = Math.max(8000, Math.round(salaryFor(ovr(p)) * 0.6 / 1000) * 1000);
  me.roster.push(pid); tlog(p, null, me.id, 0, "Academia");
  me.quimica = clamp((me.quimica == null ? 72 : me.quimica) - 5, 30, 95);
  news(p.nick + " subiu da academia pro elenco principal.", "bom");
  return { ok:true, msg:p.nick + " agora faz parte do elenco." };
}
function releaseYouth(pid) { S.academia = (S.academia || []).filter(function (x) { return x !== pid; }); var p = P(pid); if (p) { p.academia = null; p.aposentado = true; } return { ok:true, msg:"Jovem dispensado da academia." }; }

/* perfis táticos da IA e scrims */
function teamProfile(t) {
  if (t.perfil && t.perfil.estAtk) return t.perfil;
  var r = mulberry(hashStr("perfil:" + t.id));
  var pl = {}; ["padrao", "exec", "split", "rush", "fake", "lurk"].forEach(function (k) { pl[k] = 5 + Math.floor(r() * 30); });
  var fav = ["padrao", "exec", "split", "rush", "fake", "lurk"][Math.floor(r() * 6)]; pl[fav] += 35;
  var siteW = { A:0.5 + r() * 1.5, B:0.5 + r() * 1.5, C:0.5 + r() * 1.5 };
  var df = { padrao:40 + r() * 20, stack:5 + r() * 25, agressivo:5 + r() * 25, retake:5 + r() * 20 };
  var ests = ["padrao", "padrao", "agressivo", "defensivo"];
  t.perfil = { planos:pl, sites:siteW, def:df, fav:fav, estAtk:ests[Math.floor(r() * 4)], estDef:ests[Math.floor(r() * 4)] };
  return t.perfil;
}
function wpickObj(o, keys) { var ks = keys || Object.keys(o), tot = sum(ks.map(function (k) { return o[k]; })), x = R() * tot; for (var i = 0; i < ks.length; i++) { x -= o[ks[i]]; if (x <= 0) return ks[i]; } return ks[0]; }
function doScrim(oppId) {
  var me = userTeam();
  if (S.scrimDia === talkKey()) return { ok:false, msg:"Vocês já fizeram scrim hoje." };
  S.scrimDia = talkKey(); S.scrimFeito = S.scrimFeito || {}; S.scrimFeito[oppId] = S.temporada + ":" + S.fase;
  me.roster.map(P).forEach(function (p) { p.saude = clamp((p.saude == null ? 100 : p.saude) - 4, 30, 100); });
  var o = T(oppId), best = S.mapas.slice().sort(function (a, b) { return o.mapProf[b] - o.mapProf[a]; })[0];
  me.mapProf[best] = clamp(me.mapProf[best] + 0.6, 30, 95);
  return { ok:true, msg:"Scrim contra a " + o.tag + " feito. Relatório liberado na preparação da partida." };
}
function scrimReport(oppId) {
  if (!S.scrimFeito || S.scrimFeito[oppId] !== S.temporada + ":" + S.fase) return null;
  var t = T(oppId), pf = teamProfile(t);
  var tp = sum(Object.keys(pf.planos).map(function (k) { return pf.planos[k]; }));
  var planos = Object.keys(pf.planos).sort(function (a, b) { return pf.planos[b] - pf.planos[a]; }).slice(0, 3).map(function (k) { return { k:k, pct:Math.round(pf.planos[k] / tp * 100) }; });
  var ts = pf.sites.A + pf.sites.B, sites = [{ k:"A", pct:Math.round(pf.sites.A / ts * 100) }, { k:"B", pct:Math.round(pf.sites.B / ts * 100) }];
  var td = sum(Object.keys(pf.def).map(function (k) { return pf.def[k]; }));
  var def = Object.keys(pf.def).sort(function (a, b) { return pf.def[b] - pf.def[a]; }).slice(0, 2).map(function (k) { return { k:k, pct:Math.round(pf.def[k] / td * 100) }; });
  var mapas = S.mapas.slice().sort(function (a, b) { return t.mapProf[b] - t.mapProf[a]; });
  return { planos:planos, sites:sites, def:def, fortes:mapas.slice(0, 2), fracos:mapas.slice(-2) };
}

/* meta de agentes */
function metaInit() { S.meta = {}; AGENTS.forEach(function (a) { S.meta[a] = 0; }); S.patch = { v:"12.00", buff:[], nerf:[] }; }
function metaBonus(agent) { return S.meta ? (S.meta[agent] || 0) : 0; }
function newPatch() {
  if (!S.meta) metaInit();
  var n = ri(2, 3), buff = [], nerf = [], pool = shuffle(AGENTS.slice());
  pool.slice(0, n).forEach(function (a) { S.meta[a] = clamp(S.meta[a] + 1, -2, 2); buff.push(a); });
  pool.slice(n, n * 2).forEach(function (a) { S.meta[a] = clamp(S.meta[a] - 1, -2, 2); nerf.push(a); });
  var parts = S.patch.v.split("."), v = (+parts[0]) + "." + ("0" + ((+parts[1]) + 1)).slice(-2);
  if (+parts[1] >= 10) v = (+parts[0] + 1) + ".00";
  S.patch = { v:v, buff:buff, nerf:nerf };
  news("Patch " + v + ": buffs em " + buff.join(", ") + "; nerfs em " + nerf.join(", ") + ".", "titulo");
}

/* rotação de mapas */
var MAP_BENCH = ["Bind", "Breeze", "Icebox", "Fracture", "Pearl", "Corrode"];
function ensureMap(m) {
  Object.keys(S.teams).forEach(function (id) {
    var t = S.teams[id];
    if (t.mapProf[m] == null) { var r = mulberry(hashStr(id + ":" + m)); t.mapProf[m] = clamp(Math.round(46 + (t.nivel || 2) * 4 + (r() * 20 - 10)), 30, 88); }
    ensureTactics(t);
  });
}
function rotateMaps() {
  var out = pick(S.mapas), bench = MAP_BENCH.concat(["Ascent", "Abyss", "Haven", "Lotus", "Split", "Sunset", "Summit"]).filter(function (m) { return S.mapas.indexOf(m) < 0 && m !== out; });
  var inn = pick(bench);
  S.mapas = S.mapas.map(function (m) { return m === out ? inn : m; });
  ensureMap(inn);
  S.treinoMapas = (S.treinoMapas || []).filter(function (m) { return S.mapas.indexOf(m) >= 0; });
  while (S.treinoMapas.length < 3) { var c = S.mapas.filter(function (m) { return S.treinoMapas.indexOf(m) < 0; })[0]; if (!c) break; S.treinoMapas.push(c); }
  if (S.mapas.indexOf(S.treinoMapa) < 0) S.treinoMapa = S.mapas[0];
  news("Rotação de mapas: " + out + " sai e " + inn + " entra no map pool da temporada " + (S.temporada + 1) + ".", "titulo");
}

/* aposentadoria, novos talentos e hall da fama */
function hofSeason() {
  S.hof = S.hof || { temporadas:[], lendas:[] };
  var ps = Object.keys(S.players).map(P).filter(function (p) { return p.stats && p.stats.mapas >= 8 && p.teamId && !isChal(T(p.teamId).liga); });
  ps.sort(function (a, b) { return b.stats.acsSum / b.stats.mapas - a.stats.acsSum / a.stats.mapas; });
  var mvp = ps[0];
  var camp = (S.historico || []).filter(function (h) { return h.temporada === S.temporada; });
  var champ = camp.filter(function (h) { return /Champions/.test(h.evento); })[0];
  var u = userTeam();
  S.hof.temporadas.unshift({ temp:S.temporada, champ:champ ? champ.campeao : null, mvp:mvp ? { pid:mvp.id, nick:mvp.nick, team:mvp.teamId, acs:Math.round(mvp.stats.acsSum / mvp.stats.mapas) } : null,
    titulos:camp.map(function (h) { return { ev:h.evento, t:h.campeao }; }), user:u ? { team:u.id, conquistas:(S.conquistas || []).filter(function (c) { return c.indexOf(String(S.temporada)) === 0; }), elo:(S.elo || {})[u.id] || 0 } : null });
}
function raiseDemands() {
  var t = userTeam(); if (!t) return;
  t.roster.map(P).forEach(function (p) {
    var fair = salaryFor(ovr(p)) * dif().salary;
    if (fair > p.salary * 1.2) { p.morale = clamp(p.morale - 12, 20, 99); p.querAumento = true; news(p.nick + " evoluiu e quer aumento: pede cerca de " + money(Math.round(fair / 1000) * 1000) + "/ano. Renegocie ou a moral cai.", "ruim"); }
  });
}
function retirements() {
  var feitos = [];
  Object.keys(S.players).forEach(function (id) {
    var p = S.players[id];
    if (p.aposentado || p.academia) return;
    var ch = p.age >= 30 ? (p.age - 29) * 0.18 : (p.age >= 28 && ovr(p) < 62 ? 0.22 : 0);
    if (!ch || R() > ch) return;
    var team = p.teamId ? T(p.teamId) : null;
    if (team) releasePlayer(p);
    S.freeAgents = S.freeAgents.filter(function (x) { return x !== id; });
    p.aposentado = true; p.teamId = null;
    if (!p.gerado || ovr(p) >= 76) feitos.push(p);
    S.hof = S.hof || { temporadas:[], lendas:[] };
    if (ovr(p) >= 80 || (p.titulos || 0) > 0) S.hof.lendas.unshift({ nick:p.nick, nat:p.nat, role:p.role, idade:p.age, ovr:ovr(p), time:team ? team.nome : "—", temp:S.temporada });
  });
  feitos.slice(0, 5).forEach(function (p) { news(p.nick + " anunciou a aposentadoria aos " + p.age + " anos.", "info"); });
  Object.keys(S.teams).forEach(function (tid) { var t = S.teams[tid]; while (t.roster.length < 5) aiSignFreeAgent(t); });
}
function regens() {
  var ligas = ["AMER", "AMER", "EMEA", "EMEA", "PAC", "PAC", "CN", "CBR", "CNA", "CLAT", "CEMEA", "CPAC", "CCN"];
  for (var i = 0; i < 26; i++) {
    var p = genFiller(pick(ligas), ri(58, 72), null);
    p.age = ri(17, 19); p.contract = 0; p.pot = clamp(Math.round(ovr(p) + 8 + R() * 18), ovr(p), 95);
    S.freeAgents.push(p.id);
  }
  S.freeAgents = S.freeAgents.filter(function (id) { var p = P(id); if (p.age >= 27 && ovr(p) < 66) { p.aposentado = true; return false; } return true; });
  news("Nova safra: 26 jovens talentos entraram no mercado de agentes livres.", "info");
}

function createOrg(o) {
  var ids = Object.keys(S.teams).filter(function (id) { return S.teams[id].liga === o.liga; });
  if (!ids.length) return { ok:false, msg:"Liga inválida." };
  var tagUp = o.tag.toUpperCase();
  if (Object.keys(S.teams).some(function (id) { return S.teams[id].tag.toUpperCase() === tagUp; })) return { ok:false, msg:"Já existe um time com a tag " + tagUp + "." };
  ids.sort(function (a, b) { return (S.teams[a].nivel || 2) - (S.teams[b].nivel || 2) || strength(a) - strength(b); });
  var t = S.teams[ids[0]], antigo = t.nome;
  t.roster.slice().forEach(function (pid) { releasePlayer(P(pid)); });
  t.lineup = null; t.nome = o.nome; t.tag = tagUp; t.nivel = 1; t.tecnico = S.manager ? S.manager.nick : "—"; t.cash = o.cash; t.incerto = false; t.custom = true;
  var base = baseForTier(t.liga, 1);
  ["C", "I", "S", "D", "F"].forEach(function (role) { var p = genFiller(t.liga, base + ri(-1, 2), t.id, role); p.contract = 2; t.roster.push(p.id); });
  S.mapas.forEach(function (m) { t.mapProf[m] = ri(44, 54); });
  t.perfil = null; t.taticas = null; ensureTactics(t);
  var tec = staffOf(t, "tecnico"); if (tec) tec.nome = pick(FIRST) + " " + pick(LAST);
  if (S.elo) S.elo[t.id] = 900;
  S.customOrg = { id:t.id, tag:tagUp, c1:o.c1, c2:o.c2, hue:o.hue, shape:o.shape, substituiu:antigo };
  return { ok:true, id:t.id, msg:o.nome + " foi fundada e entra no lugar da " + antigo + "." };
}
function money(v) {
  var neg = v < 0; v = Math.abs(v);
  var s = v >= 1e6 ? (v / 1e6).toFixed(2).replace(/\.?0+$/, "") + " mi" : v >= 1e3 ? Math.round(v / 1e3) + " mil" : String(v);
  return (neg ? "−" : "") + "US$ " + s;
}

/* ---------------------------------------------------------------------
   Salvar / carregar
   --------------------------------------------------------------------- */
var SAVE_KEY = "vctmanager_save_v1";
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); return true; } catch (e) { return false; }
}
function load() {
  try {
    var raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    S = JSON.parse(raw);
    rng = mulberry((S.seed + S.nextId * 7919 + S.fase * 31) >>> 0);
    migrate();
    return S;
  } catch (e) { return null; }
}
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
function wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} S = null; }
function exportSave() { return JSON.stringify(S); }
function importSave(txt) { S = JSON.parse(txt); rng = mulberry((S.seed + S.nextId) >>> 0); migrate(); return S; }

/* ---------------------------------------------------------------------
   API exposta
   --------------------------------------------------------------------- */
window.VM = {
  get S() { return S; },
  CHAL:CHAL, isChal:isChal, EXTRA:EXTRA, SITES:SITES, ATK_PLANOS:ATK_PLANOS, DEF_SETUPS:DEF_SETUPS,
  STAFF_ROLES:STAFF_ROLES, STAFF_NOME:STAFF_NOME, STAFF_EFEITO:STAFF_EFEITO, staffOf:staffOf, staffLvl:staffLvl, staffPayroll:staffPayroll, incomeFor:incomeFor, DIF:DIF, dif:dif, setDif:setDif, healthy:healthy, salaryCap:salaryCap, payroll:payroll, objetivoCheck:objetivoCheck, setLineupChem:setLineupChem, createOrg:createOrg, boardDelta:boardDelta, expectedPos:expectedPos, acceptOffer:acceptOffer, rejectOffer:rejectOffer, talk:talk, contractAsk:contractAsk, negotiate:negotiate, genYouth:genYouth, academyCost:academyCost, upgradeAcademy:upgradeAcademy, promoteYouth:promoteYouth, releaseYouth:releaseYouth, doScrim:doScrim, scrimReport:scrimReport, metaBonus:metaBonus, teamProfile:teamProfile, MAP_BENCH:MAP_BENCH, objetivoPara:objetivoPara, talkKey:talkKey, baseIncome:baseIncome, sponsorIncome:sponsorIncome, SPONSORS:SPONSORS, sponsorById:sponsorById, sponsorReq:sponsorReq, setSponsor:setSponsor, QG_ITEMS:QG_ITEMS, qgBonus:qgBonus, qgCost:qgCost, qgUpgrade:qgUpgrade, qgEff:qgEff, setUserTeam:setUserTeam, eloInit:eloInit, MGR_ATTRS:MGR_ATTRS, mgr:mgr,
  hireStaff:hireStaff, fireStaff:fireStaff, observe:observe, isScouted:isScouted, scoutLimit:scoutLimit, mapGain:mapGain,
  playerStars:playerStars, potStars:potStars, ensureTactics:ensureTactics, defaultTactic:defaultTactic, tacticTerm:tacticTerm, AGENTS:AGENTS, AGENT_ROLE:AGENT_ROLE, ROLE_NAME:ROLE_NAME, MAP_ATK:MAP_ATK, BUY_NAME:BUY_NAME, FASES:FASES, TREINOS:TREINOS,
  P:P, T:T, ovr:ovr, valueFor:valueFor, salaryFor:salaryFor, money:money, posLabel:posLabel,
  newWorld:newWorld, activeFive:activeFive, autoComp:autoComp, compAnalysis:compAnalysis, teamEff:teamEff,
  newMapSim:newMapSim, stepRound:stepRound, finishMap:finishMap, useTimeout:useTimeout, mapSummary:mapSummary,
  vetoSteps:vetoSteps, aiVetoChoice:aiVetoChoice, aiSideChoice:aiSideChoice, atkFirstFrom:atkFirstFrom,
  seriesResult:seriesResult, preMatchOdds:preMatchOdds,
  todayMatches:todayMatches, userMatchToday:userMatchToday, playDay:playDay, phaseOver:phaseOver, nextPhase:nextPhase,
  standings:standings, TEMPLATES:TEMPLATES, nodeTeam:nodeTeam, stageDone:stageDone,
  buyPlayer:buyPlayer, signFree:signFree, sellOffer:sellOffer, sellPlayer:sellPlayer, renewPlayer:renewPlayer,
  releaseUser:releaseUser, marketOpen:marketOpen, strength:strength,
  save:save, load:load, hasSave:hasSave, wipe:wipe, exportSave:exportSave, importSave:importSave, news:news
};
})();
