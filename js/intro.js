/* =====================================================================
   VCT MANAGER — entrada do jogo: menu, criar manager, escolher
   organização, contrato com assinatura e tela de carregamento.
   ===================================================================== */
(function () {
"use strict";
var VM = window.VM, ART = window.ART, G = window.GUI, ACT = G.ACT, esc = G.esc;
var root = document.getElementById("app");
var I = { step:"menu", mgr:null, liga:"AMER", sel:null, modal:null, signed:false, load:null };
var NACOES = ["Brasil", "Argentina", "Chile", "Colômbia", "México", "Peru", "Portugal", "Espanha", "França", "Alemanha", "Reino Unido", "Turquia", "Polônia", "Suécia", "Finlândia", "Rússia", "Estados Unidos", "Canadá", "Coreia do Sul", "Japão", "China", "Filipinas", "Tailândia", "Indonésia", "Austrália", "Outra"];
var MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
var LIGAS = ["AMER", "EMEA", "PAC", "CN", "CBR", "CNA", "CLAT", "CEMEA", "CPAC", "CCN"];
var DIF = { 5:["Fácil", "d5"], 4:["Normal", "d4"], 3:["Médio", "d3"], 2:["Difícil", "d2"], 1:["Muito difícil", "d1"] };
var BUDGET = 60, KEYS = Object.keys(VM.MGR_ATTRS);
var DICAS = [
  "Táticas por mapa mudam o resultado dos rounds — e a IA percebe se você repete sempre o mesmo site.",
  "Treine 3 mapas por vez em Treino → Treino de mapas. O domínio pesa no veto e na força do time.",
  "Saúde abaixo de 70 derruba o rendimento. Um bom fisioterapeuta recupera o elenco mais rápido.",
  "Observe jogadores antes de contratar: sem olheiro você só vê as estrelas aproximadas.",
  "A pausa tática quebra a sequência do adversário. Resistência ao estresse deixa ela mais forte.",
  "Negociação alta faz os clubes aceitarem ofertas menores pelos jogadores."
];
function S() { return VM.S; }
function tcg(tag) { var h = ART.teamColors(tag).hue; return "hsla(" + h + ",70%,45%,.35)"; }
function rint(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function rpick(a) { return a[Math.floor(Math.random() * a.length)]; }

function newMgr() {
  var m = { nick:"", nome:"", sobrenome:"", genero:"M", nacao:"Brasil", dia:rint(1, 28), mes:rint(1, 12), ano:rint(1980, 2000), seed:rint(1, 1e6), attrs:{} };
  KEYS.forEach(function (k) { m.attrs[k] = 8; });
  return m;
}
function used(m) { return KEYS.reduce(function (a, k) { return a + m.attrs[k]; }, 0); }
function mgrFace(m, cls, tag) {
  return '<span class="face ' + (cls || "") + '">' + ART.avatar("mgr:" + m.seed + m.genero, tag || "FA", { staff:true, suit:true, fem:m.genero === "F" }) + "</span>";
}
function randomizeAll() {
  var NI = ["Ronin", "Vortex", "Sombra", "Kaiser", "Nox", "Falcão", "Tempest", "Blitz", "Oráculo", "Mestre", "Lince", "Atlas"];
  var NO = { M:["Rafael", "Lucas", "Bruno", "Diego", "Mateus", "Thiago", "Gustavo", "Felipe"], F:["Ana", "Bruna", "Camila", "Júlia", "Larissa", "Marina", "Paula", "Sofia"] };
  var SO = ["Silva", "Souza", "Costa", "Oliveira", "Pereira", "Almeida", "Ribeiro", "Carvalho", "Gomes", "Martins"];
  var m = I.mgr; m.genero = Math.random() < .5 ? "M" : "F";
  m.nick = rpick(NI) + (Math.random() < .4 ? rint(1, 99) : ""); m.nome = rpick(NO[m.genero]); m.sobrenome = rpick(SO);
  m.nacao = rpick(NACOES.slice(0, -1)); m.dia = rint(1, 28); m.mes = rint(1, 12); m.ano = rint(1978, 2002); m.seed = rint(1, 1e6);
  randomAttrs();
}
function randomAttrs() {
  var m = I.mgr; KEYS.forEach(function (k) { m.attrs[k] = 5; });
  var left = BUDGET - used(m);
  while (left > 0) { var k = rpick(KEYS); if (m.attrs[k] < 20) { m.attrs[k]++; left--; } }
}

/* ---------------------------------------------------------------------
   Telas
   --------------------------------------------------------------------- */
function wall() {
  var tags = window.VALDB.times.map(function (t) { return t.tag; });
  var tiles = [];
  for (var i = 0; i < 96; i++) {
    var tag = tags[(i * 37) % tags.length], c = ART.teamColors(tag);
    tiles.push('<span class="wt" style="background:' + c.c1 + '">' + ART.crest(tag) + "</span>");
  }
  return '<div class="wall" aria-hidden="true"><div class="wallin">' + tiles.join("") + tiles.join("") + "</div></div>";
}
function brand() { return '<div class="menulogo"><span class="ml1">VCT</span><span class="ml2">MANAGER</span><b>2026</b></div>'; }

function viewMenu() {
  var has = VM.hasSave(), info = "";
  if (has) {
    try {
      var raw = JSON.parse(localStorage.getItem("vctmanager_save_v1"));
      var t = raw.teams[raw.userTeam];
      info = '<div class="savecard"><div class="k">Carreira salva</div><div class="sc">' + '<span class="cw lg">' + ART.crest(t.tag) + "</span><div><strong>" + esc(t.nome) + "</strong><small>" +
        (raw.manager ? esc(raw.manager.nick) + " · " : "") + "Temporada " + raw.temporada + "</small></div></div>" +
        '<button class="btn primary big" data-a="iContinuar">Continuar carreira</button></div>';
    } catch (e) { info = ""; }
  }
  var items = [["iNovo", "Novo jogo"], ["iModal", "Como jogar", "tutorial"], ["iModal", "Importar save", "importar"], ["iModal", "Créditos", "creditos"]];
  if (has) items.unshift(["iContinuar", "Continuar"]);
  var modal = "";
  if (I.modal === "tutorial") modal = '<h2>Como jogar</h2><ol class="howto"><li>Crie seu manager e distribua os pontos de atributo — eles têm efeito real.</li><li>Escolha uma organização: ligas VCT ou qualquer Challengers.</li><li>Assine o contrato e use <b>CONTINUAR</b> no topo pra avançar os dias. <b>»</b> vai direto pro seu próximo jogo.</li><li>Antes de cada jogo: veto, composição e plano por mapa. Durante: compra, tática por round e pausas.</li><li>Entre os jogos: treino, táticas por mapa, staff, mercado e finanças.</li></ol>';
  if (I.modal === "creditos") modal = '<h2>Créditos</h2><p>Projeto pessoal de fã, feito pra jogar por diversão.</p><p class="muted">Criado sob a política "Legal Jibber Jabber" da Riot Games usando recursos de propriedade da Riot Games. A Riot Games não endossa nem patrocina este projeto. Nomes de times e jogadores vêm dos elencos públicos (vlr.gg). Avatares, escudos, troféu e mapas são ilustrações geradas pelo jogo.</p>';
  if (I.modal === "importar") modal = '<h2>Importar save</h2><p class="muted">Cole o texto exportado em Configurações → Exportar save.</p><textarea id="impBox" rows="6"></textarea><div class="row end"><button class="btn primary" data-a="iImportar">Importar</button></div>';
  return '<div class="menu">' + wall() + '<div class="menushade"></div>' +
    '<div class="menuleft">' + brand() + '<nav class="menunav">' + items.map(function (it, i) {
      return '<button data-a="' + it[0] + '" data-v="' + (it[2] || "") + '" class="' + (i === 0 ? "first" : "") + '">' + it[1] + "</button>";
    }).join("") + "</nav></div>" +
    '<div class="menutrophy">' + ART.trophy() + "</div>" + info +
    '<button class="audiob" data-a="iAudio">' + (window.SFX && window.SFX.cfg.music ? "🔊 Música ligada" : "🔇 Música desligada") + "</button>" +
    '<p class="menufoot">Projeto de fã sob a política "Legal Jibber Jabber" da Riot Games. Não é endossado pela Riot Games.</p>' +
    (modal ? '<div class="imodal" data-a="iFechar"><div class="imbox" data-a="iStop">' + modal + '<button class="btn ghost sm iclose" data-a="iFechar">Fechar</button></div></div>' : "") + "</div>";
}

function field(label, key, val, ph) {
  return '<label class="mf"><span>' + label + '</span><input data-mgr="' + key + '" value="' + esc(val) + '" placeholder="' + esc(ph || "") + '" maxlength="18"></label>';
}
function viewManager() {
  var m = I.mgr, left = BUDGET - used(m);
  var attrs = KEYS.map(function (k) {
    var a = VM.MGR_ATTRS[k];
    return '<div class="mattr"><div class="mah"><strong>' + a[0] + '</strong><b id="mv-' + k + '">' + m.attrs[k] + '</b></div><input type="range" min="1" max="20" value="' + m.attrs[k] + '" data-mattr="' + k + '" aria-label="' + a[0] + '"><small>' + a[1] + "</small></div>";
  }).join("");
  var dias = "", anos = "";
  for (var d = 1; d <= 31; d++) dias += "<option " + (d === m.dia ? "selected" : "") + ">" + d + "</option>";
  for (var y = 2006; y >= 1965; y--) anos += "<option " + (y === m.ano ? "selected" : "") + ">" + y + "</option>";
  return '<div class="iscreen"><div class="ibg"></div><button class="btn ghost sm iback" data-a="iStep" data-v="menu">← Menu</button><h1 class="ititle">Criar manager</h1>' +
    '<div class="mgrpanel"><div class="mgrattrs"><div class="head"><h3>Atributos</h3><span class="pts">Pontos restantes: <b id="mpts">' + left + '</b></span></div>' + attrs +
    '<button class="btn sm" data-a="iRandAttr">Aleatório</button></div>' +
    '<div class="mgrform"><div class="mfgrid">' + field("Nick *", "nick", m.nick, "como vão te chamar") + field("Nome", "nome", m.nome) + field("Sobrenome", "sobrenome", m.sobrenome) +
    '<div class="mf"><span>Gênero</span><div class="cchips">' + [["M", "Masculino"], ["F", "Feminino"]].map(function (g) { return '<button class="cchip ' + (m.genero === g[0] ? "on" : "") + '" data-a="iGenero" data-v="' + g[0] + '">' + g[1] + "</button>"; }).join("") + "</div></div>" +
    '<label class="mf"><span>Nação</span><select data-mgrsel="nacao">' + NACOES.map(function (n) { return "<option " + (n === m.nacao ? "selected" : "") + ">" + n + "</option>"; }).join("") + "</select></label>" +
    '<div class="mf"><span>Data de nascimento</span><div class="dnasc"><select data-mgrsel="dia">' + dias + '</select><select data-mgrsel="mes">' + MESES.map(function (n, i) { return '<option value="' + (i + 1) + '" ' + (i + 1 === m.mes ? "selected" : "") + ">" + n + "</option>"; }).join("") + '</select><select data-mgrsel="ano">' + anos + "</select></div></div></div>" +
    '<div class="mgrav">' + mgrFace(m, "xxxl") + '<button class="btn sm" data-a="iRandAv">Aleatório</button></div></div></div>' +
    '<div class="row center ibtns"><button class="btn big" data-a="iRandAll">Aleatorizar tudo</button><button class="btn primary big" data-a="iMgrOk">Selecionar manager →</button></div></div>';
}

function viewOrgTipo() {
  return '<div class="iscreen"><div class="ibg"></div><button class="btn ghost sm iback" data-a="iStep" data-v="manager">← Manager</button><div class="orgs">' +
    '<button class="orgc" data-a="iStep" data-v="time"><span class="orgi">' + ART.trophy() + '</span><strong>Selecionar uma organização existente</strong><small>Escolha um dos ' + window.VALDB.times.length + " times das ligas VCT e dos Challengers. Gerencie o elenco e leve até as vitórias.</small></button>" +
    '<button class="orgc" data-a="iStep" data-v="criarorg"><span class="orgi">' + orgPreview() + '</span><strong>Criar organização</strong><small>Monte sua própria org do zero: nome, tag, cores e escudo. Começa num Challengers, com elenco modesto.</small></button></div></div>';
}

var ORG = { nome:"", tag:"", hue:350, c2:"#FFFFFF", shape:0, liga:"CBR", orc:"modesto" };
var ORC = { investidor:["Investidor", 320000, "Dinheiro pra montar um elenco competitivo logo."], modesto:["Modesto", 140000, "O suficiente pra alguns reforços."], garagem:["Garagem", 45000, "Quase nada. Vai ter que revelar jogadores."] };
function orgColors() { return { c1:"hsl(" + ORG.hue + ",70%,44%)", c2:ORG.c2, hue:ORG.hue, shape:ORG.shape }; }
function orgPreview(size) {
  var tag = (ORG.tag || "NEW").toUpperCase().slice(0, 4);
  return '<span class="cw ' + (size || "xl") + '">' + ART.crest(tag, null, orgColors()) + "</span>";
}
function viewCriarOrg() {
  var chal = ["CBR", "CNA", "CLAT", "CEMEA", "CPAC", "CCN"];
  var c2s = [["#FFFFFF", "Branco"], ["#111111", "Preto"], ["#F2C75C", "Dourado"], ["hsl(" + ((ORG.hue + 180) % 360) + ",70%,60%)", "Complementar"]];
  return '<div class="iscreen"><div class="ibg"></div><button class="btn ghost sm iback" data-a="iStep" data-v="orgtipo">← Voltar</button><h1 class="ititle">Criar organização</h1>' +
    '<div class="orgpanel"><div class="orgform">' +
    '<label class="mf"><span>Nome da organização *</span><input data-org="nome" value="' + esc(ORG.nome) + '" maxlength="22" placeholder="ex.: Pops Esports"></label>' +
    '<label class="mf"><span>Tag (2 a 4 letras) *</span><input data-org="tag" value="' + esc(ORG.tag) + '" maxlength="4" placeholder="POPS" style="text-transform:uppercase"></label>' +
    '<label class="mf"><span>Cor principal</span><input type="range" min="0" max="359" value="' + ORG.hue + '" data-org="hue" class="huer"></label>' +
    '<div class="mf"><span>Cor secundária</span><div class="cchips">' + c2s.map(function (c) { return '<button class="cchip ' + (ORG.c2 === c[0] ? "on" : "") + '" data-a="iOrgC2" data-v="' + esc(c[0]) + '"><i class="sw" style="background:' + c[0] + '"></i>' + c[1] + "</button>"; }).join("") + "</div></div>" +
    '<div class="mf"><span>Formato do escudo</span><div class="cchips">' + ["Clássico", "Hexágono", "Brasão", "Redondo"].map(function (n, i) { return '<button class="cchip ' + (ORG.shape === i ? "on" : "") + '" data-a="iOrgShape" data-v="' + i + '">' + n + "</button>"; }).join("") + "</div></div>" +
    '<label class="mf"><span>Liga de estreia</span><select data-orgsel="liga">' + chal.map(function (l) { return '<option value="' + l + '" ' + (ORG.liga === l ? "selected" : "") + ">" + esc(S().ligasNome[l]) + "</option>"; }).join("") + "</select></label>" +
    '<div class="mf"><span>Orçamento inicial</span><div class="orcs">' + Object.keys(ORC).map(function (k) { return '<button class="orc ' + (ORG.orc === k ? "on" : "") + '" data-a="iOrgOrc" data-v="' + k + '"><strong>' + ORC[k][0] + "</strong><b>" + VM.money(ORC[k][1]) + "</b><small>" + ORC[k][2] + "</small></button>"; }).join("") + "</div></div></div>" +
    '<div class="orgprev" id="orgprev">' + orgPreview("xxl") + '<strong id="orgname">' + esc(ORG.nome || "Sua organização") + '</strong><span class="muted">Entra no lugar do time mais fraco da liga, com 5 jogadores gerados.</span></div></div>' +
    '<div class="row center ibtns"><button class="btn primary big" data-a="iOrgOk">Fundar organização →</button></div></div>';
}
function viewTime() {
  var s = S();
  var ids = Object.keys(s.teams).filter(function (id) { return s.teams[id].liga === I.liga; })
    .sort(function (a, b) { return s.teams[b].nivel - s.teams[a].nivel || s.teams[a].nome.localeCompare(s.teams[b].nome); });
  if (!I.sel || ids.indexOf(I.sel) < 0) I.sel = ids[0];
  var t = s.teams[I.sel];
  var list = ids.map(function (id) {
    var x = s.teams[id], d = DIF[x.nivel] || DIF[3];
    return '<button class="trow ' + (id === I.sel ? "on" : "") + '" data-a="iSel" data-v="' + id + '"><span class="cw md">' + ART.crest(x.tag) + '</span><span class="tn"><strong>' + esc(x.nome) + "</strong><small>" + ART.stars(x.nivel) + ' <em class="dif ' + d[1] + '">' + d[0] + "</em></small></span></button>";
  }).join("");
  var d2 = DIF[t.nivel] || DIF[3];
  var players = VM.activeFive(t).concat(t.roster.map(VM.P).filter(function (p) { return VM.activeFive(t).indexOf(p) < 0; }));
  var staff = VM.STAFF_ROLES.map(function (r) { var st = VM.staffOf(t, r); return st ? '<div class="stm">' + G.staffFace(st, "md") + ART.stars(st.nivel) + "<small>" + VM.STAFF_NOME[r] + "</small></div>" : '<div class="stm"><span class="face md empty">?</span><small>' + VM.STAFF_NOME[r] + "</small></div>"; }).join("");
  var detail = '<div class="tdet"><div class="thead"><span class="cw xl">' + ART.crest(t.tag) + '</span><div><h2>' + esc(t.nome) + '</h2><p>' + ART.stars(t.nivel) + ' <span class="muted">Orçamento:</span> <b class="pos">' + VM.money(t.cash) + '</b> <span class="dif ' + d2[1] + '">Dificuldade: ' + d2[0] + "</span></p>" +
    '<p class="muted">' + esc(s.ligasNome[t.liga]) + " · " + esc(t.pais || "") + " · técnico " + esc(t.tecnico) + "</p></div></div>" +
    '<h4 class="sec">Elenco</h4><div class="rostrow">' + players.map(function (p) {
      return '<div class="rp">' + G.face(p, "lg round") + "<strong>" + esc(p.nick) + "</strong>" + ART.stars(VM.playerStars(p)) + G.roleTag(p.role) + "</div>";
    }).join("") + "</div>" +
    '<h4 class="sec">Equipe do time</h4><div class="rostrow">' + staff + "</div>" +
    '<div class="row end"><button class="btn primary big" data-a="iAssinarTime">Assinar time →</button></div></div>';
  return '<div class="iscreen wide"><div class="ibg" style="--tcg:' + tcg(t.tag) + '"></div><button class="btn ghost sm iback" data-a="iStep" data-v="orgtipo">← Voltar</button>' +
    '<div class="ligtabs">' + LIGAS.map(function (l) { return '<button data-a="iLiga" data-v="' + l + '" class="' + (I.liga === l ? "on" : "") + '">' + esc(s.ligasNome[l]) + "</button>"; }).join("") + "</div>" +
    '<div class="tpick"><div class="tlist">' + list + "</div>" + detail + "</div></div>";
}

function objetivo(t) {
  if (VM.isChal(t.liga)) return t.nivel >= 4 ? "Ser campeão do Challengers e ir aos Play-Ins" : t.nivel >= 3 ? "Chegar aos playoffs do Challengers" : "Fazer uma campanha digna e revelar jogadores";
  return t.nivel >= 5 ? "Ganhar a liga e disputar o Champions" : t.nivel >= 4 ? "Classificar para um Masters" : t.nivel >= 3 ? "Chegar aos playoffs do Stage" : "Evitar a lanterna e crescer na temporada";
}
function viewContrato() {
  var t = S().teams[I.sel], m = I.mgr;
  var sal = VM.isChal(t.liga) ? 45000 : 180000;
  var hoje = "12/01/" + S().temporada;
  return '<div class="iscreen"><div class="ibg" style="--tcg:' + tcg(t.tag) + '"></div><div class="crestbg">' + ART.crest(t.tag) + '</div><button class="btn ghost sm iback" data-a="iStep" data-v="time">← Voltar</button>' +
    '<div class="paper"><h2>Contrato de manager</h2><p class="pc">Termos e condições para o cargo de técnico-gerente</p>' +
    "<p>Entre <b>" + esc(m.nome || m.nick) + " " + esc(m.sobrenome) + ' ("' + esc(m.nick) + '")</b>, doravante denominado <b>Manager</b>, e a organização <b>' + esc(t.nome) + "</b>, doravante denominada <b>Organização</b>, fica acordado:</p>" +
    "<h4>1. Objeto</h4><p>O Manager assume o comando do elenco de Valorant da Organização na " + esc(S().ligasNome[t.liga]) + ", com autonomia sobre escalação, treino, táticas, staff e mercado.</p>" +
    "<h4>2. Duração e remuneração</h4><p>Duas temporadas, com salário de <b>" + VM.money(sal) + "/ano</b>. O orçamento inicial do clube é de <b>" + VM.money(t.cash) + "</b>.</p>" +
    '<h4>3. Objetivo da diretoria</h4><p class="obj">' + esc(objetivo(t)) + ".</p>" +
    "<h4>4. Responsabilidades</h4><p>Manter as contas do clube saudáveis, zelar pela saúde e moral dos jogadores e representar a Organização com profissionalismo.</p>" +
    "<h4>5. Rescisão</h4><p>Qualquer das partes pode encerrar o acordo ao fim de uma fase, mediante aviso à outra parte.</p>" +
    '<div class="sigrow"><div><small>Data</small><b>' + hoje + '</b></div><div class="sigbox"><canvas id="sig" width="320" height="90" aria-label="Área de assinatura"></canvas><span class="sigline">' + (I.signed ? "Assinado" : "Assine aqui") + '</span><button class="btn ghost sm" data-a="iSigClear">Limpar</button></div></div></div>' +
    '<div class="row center ibtns"><button class="btn primary big" id="sigok" data-a="iContrato" ' + (I.signed ? "" : "disabled") + ">" + (I.signed ? "Continuar →" : "Assine para continuar") + "</button></div></div>";
}

function viewLoading() {
  var L = I.load;
  return '<div class="loading" style="background:' + ART.mapCard(L.map) + '"><div class="lmapbg">' + ART.mapSVG(L.map, VM.SITES[L.map] || ["A", "B"]) + '</div><div class="lshade"></div>' +
    '<div class="lcontent"><div class="lcrest"><span class="cw xl">' + ART.crest(L.tag) + '</span></div><h1>' + esc(L.map.toUpperCase()) + '</h1><p class="ltip"><b>DICA</b> ' + esc(L.tip) + '</p><div class="lbar"><i id="lbar"></i></div><small id="ltxt">Carregando…</small></div></div>';
}

/* ---------------------------------------------------------------------
   Controle
   --------------------------------------------------------------------- */
function view() {
  if (I.step === "loading" && I.load) return viewLoading();
  if (I.step === "manager") return viewManager();
  if (I.step === "orgtipo") return viewOrgTipo();
  if (I.step === "time" && S()) return viewTime();
  if (I.step === "criarorg" && S()) return viewCriarOrg();
  if (I.step === "contrato" && S() && I.sel) return viewContrato();
  I.step = "menu"; return viewMenu();
}
function startLoading(tag, then) {
  I.load = { map:rpick(VM.S.mapas), tag:tag, tip:rpick(DICAS), t0:performance.now(), then:then };
  I.step = "loading"; G.render();
}
function after() {
  window.SFX_WANT_MUSIC = true; if (window.SFX) window.SFX.musicStart();
  if (I.step === "loading" && I.load) {
    var L = I.load;
    var tick = function (now) {
      if (I.step !== "loading" || I.load !== L) return;
      var f = Math.min(1, (now - L.t0) / 2400), b = document.getElementById("lbar");
      if (b) b.style.width = Math.round(f * 100) + "%";
      var tx = document.getElementById("ltxt"); if (tx) tx.textContent = f < .35 ? "Carregando elencos…" : f < .7 ? "Preparando o calendário…" : "Entrando no clube…";
      if (f < 1) requestAnimationFrame(tick);
      else { I.step = "menu"; I.load = null; L.then(); }
    };
    requestAnimationFrame(tick);
  }
  if (I.step === "contrato") setupSig();
}
function setupSig() {
  var c = document.getElementById("sig"); if (!c) return;
  var ctx = c.getContext("2d"), down = false, last = null, len = 0;
  ctx.lineWidth = 2.6; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#1B2A6B";
  if (I.sigData) { var im = new Image(); im.onload = function () { ctx.drawImage(im, 0, 0); }; im.src = I.sigData; }
  function pos(e) { var r = c.getBoundingClientRect(); return { x:(e.clientX - r.left) * c.width / r.width, y:(e.clientY - r.top) * c.height / r.height }; }
  c.addEventListener("pointerdown", function (e) { down = true; last = pos(e); c.setPointerCapture(e.pointerId); e.preventDefault(); });
  c.addEventListener("pointermove", function (e) {
    if (!down) return; var p = pos(e);
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    len += Math.hypot(p.x - last.x, p.y - last.y); last = p;
    if (!I.signed && len > 60) {
      I.signed = true;
      var b = document.getElementById("sigok"); if (b) { b.disabled = false; b.textContent = "Continuar →"; }
      var sl = document.querySelector(".sigline"); if (sl) sl.textContent = "Assinado";
    }
  });
  function up() { if (down) { down = false; I.sigData = c.toDataURL(); } }
  c.addEventListener("pointerup", up); c.addEventListener("pointerleave", up);
}
function freshWorld() {
  VM.newWorld(window.VALDB, (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0);
}

ACT.iAudio = function () { if (!window.SFX) return; window.SFX.set("music", !window.SFX.cfg.music); if (window.SFX.cfg.music) window.SFX.musicStart(); G.render(); };
ACT.iNovo = function () { I.mgr = newMgr(); I.step = "manager"; I.modal = null; G.render(); };
ACT.iModal = function (v) { I.modal = v; G.render(); };
ACT.iFechar = function () { I.modal = null; G.render(); };
ACT.iStop = function () {};
ACT.iStep = function (v) { I.step = v; G.render(); };
ACT.iContinuar = function () {
  if (!VM.load()) { G.toast("Não consegui ler o save.", false); return; }
  startLoading(VM.T(VM.S.userTeam).tag, function () { G.go("inicio"); });
};
ACT.iImportar = function () {
  var txt = (document.getElementById("impBox") || {}).value || "";
  try { VM.importSave(txt.trim()); G.persist(); I.modal = null; startLoading(VM.T(VM.S.userTeam).tag, function () { G.go("inicio"); }); }
  catch (e) { G.toast("Esse texto não é um save válido.", false); }
};
ACT.iGenero = function (v) { I.mgr.genero = v; G.render(); };
ACT.iRandAv = function () { I.mgr.seed = rint(1, 1e6); G.render(); };
ACT.iRandAttr = function () { randomAttrs(); G.render(); };
ACT.iRandAll = function () { randomizeAll(); G.render(); };
ACT.iMgrOk = function () {
  if (!I.mgr.nick.trim()) { G.toast("Escolha um nick pro seu manager.", false); var n = root.querySelector('[data-mgr="nick"]'); if (n) n.focus(); return; }
  if (!S() || S().userTeam) freshWorld();
  I.step = "orgtipo"; G.render();
};
ACT.iOrgC2 = function (v) { ORG.c2 = v; G.render(); };
ACT.iOrgShape = function (v) { ORG.shape = +v; G.render(); };
ACT.iOrgOrc = function (v) { ORG.orc = v; G.render(); };
ACT.iOrgOk = function () {
  var nome = ORG.nome.trim(), tag = ORG.tag.trim().toUpperCase();
  if (nome.length < 3) { G.toast("Dê um nome à organização (mínimo 3 letras).", false); return; }
  if (!/^[A-Z0-9]{2,4}$/.test(tag)) { G.toast("A tag precisa ter de 2 a 4 letras ou números.", false); return; }
  if (!S() || S().userTeam) freshWorld();
  var c = orgColors();
  var r = VM.createOrg({ nome:nome, tag:tag, liga:ORG.liga, cash:ORC[ORG.orc][1], c1:c.c1, c2:c.c2, hue:c.hue, shape:c.shape });
  if (!r.ok) { G.toast(r.msg, false); return; }
  ART.setCustom(tag, c);
  I.sel = r.id; I.signed = false; I.sigData = null; I.step = "contrato"; G.toast(r.msg); G.render();
};
ACT.iLiga = function (v) { I.liga = v; I.sel = null; G.render(); };
ACT.iSel = function (v) { I.sel = v; G.render(); };
ACT.iAssinarTime = function () { I.signed = false; I.sigData = null; I.step = "contrato"; G.render(); };
ACT.iSigClear = function () { I.signed = false; I.sigData = null; G.render(); };
ACT.iContrato = function () {
  if (!I.signed) return;
  var s = S(), t = s.teams[I.sel], m = I.mgr;
  s.manager = { nick:m.nick.trim(), nome:m.nome.trim(), sobrenome:m.sobrenome.trim(), genero:m.genero, nacao:m.nacao, nasc:[m.dia, m.mes, m.ano], seed:m.seed, attrs:JSON.parse(JSON.stringify(m.attrs)), objetivo:objetivo(t), assinatura:I.sigData || null };
  s.diaFase = 0; s.lidas = 0;
  startLoading(t.tag, function () {
    VM.setUserTeam(t.id);
    VM.news(s.manager.nick + " assinou como manager da " + t.nome + ". Objetivo da diretoria: " + objetivo(t).toLowerCase() + ".", "titulo");
    G.persist(); G.go("inicio");
  });
};

/* inputs do formulário (sem re-render pra não perder o foco) */
root.addEventListener("input", function (e) {
  var el = e.target;
  if (el.hasAttribute("data-mgr")) { I.mgr[el.getAttribute("data-mgr")] = el.value; return; }
  if (el.hasAttribute("data-org")) {
    var k = el.getAttribute("data-org"); ORG[k] = k === "hue" ? +el.value : el.value;
    var pv = document.getElementById("orgprev");
    if (pv) { pv.querySelector(".cw").outerHTML = orgPreview("xxl"); var nm = document.getElementById("orgname"); if (nm) nm.textContent = ORG.nome || "Sua organização"; }
    return;
  }
  if (el.hasAttribute("data-mattr")) {
    var k = el.getAttribute("data-mattr"), m = I.mgr, v = +el.value;
    var others = used(m) - m.attrs[k];
    v = Math.min(v, BUDGET - others); v = Math.max(1, v);
    m.attrs[k] = v; el.value = v;
    var lb = document.getElementById("mv-" + k); if (lb) lb.textContent = v;
    var pt = document.getElementById("mpts"); if (pt) pt.textContent = BUDGET - used(m);
  }
});
root.addEventListener("change", function (e) {
  var el = e.target;
  if (el.hasAttribute("data-orgsel")) { ORG.liga = el.value; return; }
  if (el.hasAttribute("data-mgrsel")) { var k = el.getAttribute("data-mgrsel"); I.mgr[k] = k === "nacao" ? el.value : +el.value; }
});

window.INTRO = {
  active:function () { return !VM.S || !VM.S.userTeam || I.step === "loading"; },
  view:view, after:after,
  reset:function () { I.step = "menu"; I.modal = null; I.load = null; },
  mgrFace:mgrFace
};
})();
