/* =====================================================================
   BASE DE DADOS — VCT 2026 (elencos reais, uso pessoal)
   ---------------------------------------------------------------------
   Elencos levantados em 28/09/2026 a partir do vlr.gg (108 times: 4 ligas VCT + 6 Challengers).
   Times marcados com incerto:true estavam em reformulação — o elenco é o
   último conhecido (Stage 2, ago/2026).
   Atributos de jogo (mira, utilitária etc.) NÃO estão aqui: o jogo os gera
   a partir do nível do time. Nenhum número aqui é "oficial".

   Formato de jogador: [nick, nacionalidade, função, agentes...]
   Função: D = Duelista, I = Iniciador, C = Controlador, S = Sentinela,
           F = Flex. Agentes vazios = pool desconhecido.

   Para trocar por nomes fictícios, crie base-ficticia.js no mesmo formato
   e troque o <script src> no index.html.
   ===================================================================== */
window.VALDB = {
  temporada: 2026,
  fonte: "vlr.gg, 28/09/2026",
  mapas: ["Ascent", "Abyss", "Haven", "Lotus", "Split", "Sunset", "Summit"],

  ligas: {
    AMER: "VCT Americas",
    EMEA: "VCT EMEA",
    PAC:  "VCT Pacific",
    CN:   "VCT China",
    CBR:  "Challengers Brasil",
    CNA:  "Challengers North America",
    CLAT: "Challengers LATAM",
    CEMEA:"Challengers EMEA",
    CPAC: "Challengers Pacific",
    CCN:  "Challengers China"
  },

  times: [
  /* ============================ AMERICAS ============================ */
  { liga:"AMER", tag:"100T", nome:"100 Thieves", pais:"US", nivel:5, tecnico:"Nbs", jogadores:[
    ["vora","CA","I","Sova","Fade","Skye"],["Cryocells","US","S","Cypher","Viper","Chamber"],
    ["Asuna","US","D","Phoenix","Omen","Sage"],["Timotino","CA","D","Neon","Jett"],
    ["bang","US","C","Omen","Harbor","Viper"]]},
  { liga:"AMER", tag:"NRG", nome:"NRG", pais:"US", nivel:5, tecnico:"bonkar", jogadores:[
    ["Ethan","US","I","KAY/O","Omen","Fade"],["keiko","GB","F","Jett","Chamber","Omen"],
    ["brawk","US","I","Sova","Vyse","Fade"],["mada","CA","D","Neon","Phoenix","Raze"],
    ["skuba","US","C","Viper","Omen","Cypher"]]},
  { liga:"AMER", tag:"G2", nome:"G2 Esports", pais:"US", nivel:5, tecnico:"JoshRT", jogadores:[
    ["valyn","US","C","Omen","Harbor","Astra"],["jawgemo","KH","D","Neon","Raze","Yoru"],
    ["BABYBAY","US","S","Chamber","Vyse","Waylay"],["trent","US","I","Sova","Skye","Fade"],
    ["leaf","US","F","Viper","Sage","Yoru"]]},
  { liga:"AMER", tag:"LOUD", nome:"LOUD", pais:"BR", nivel:4, tecnico:"Romanilly", jogadores:[
    ["erde","CL","F","Omen","Sage","Astra"],["lukxo","BR","S","Chamber","Yoru","Viper"],
    ["DaviH","PT","I","Sova","Fade"],["Darker","CO","C","Omen","Viper","Phoenix"],
    ["tkzin","BR","D","Neon","Waylay","Raze"]]},
  { liga:"AMER", tag:"LEV", nome:"LEVIATÁN", pais:"AR", nivel:4, tecnico:"Onur", jogadores:[
    ["kiNgg","CL","C","Viper","Astra","Omen"],["spike","BR","D","Neon","Omen"],
    ["blowz","BR","I","Fade","Sova","Skye"],["Neon","AR","S","Chamber","Omen","Jett"],
    ["Sato","BR","D","Phoenix","Omen","Yoru"]]},
  { liga:"AMER", tag:"MIBR", nome:"MIBR", pais:"BR", nivel:3, tecnico:"fRoD", jogadores:[
    ["zekken","US","D","Phoenix","Omen","Raze"],["Mazino","CL","C","Omen","Harbor","Vyse"],
    ["Verno","US","I","Sova","Fade","Omen"],["aspas","BR","D","Neon","Jett","Raze"],
    ["tex","DE","S","Cypher","Viper","Vyse"]]},
  { liga:"AMER", tag:"FUR", nome:"FURIA", pais:"BR", nivel:3, tecnico:"shaW", jogadores:[
    ["artzin","BR","C","Omen","Astra","Harbor"],["basic","BR","F","Phoenix","Harbor","KAY/O"],
    ["Shyy","CL","S","Cypher","Killjoy","Viper"],["C0M","US","I","Sova","Fade"],
    ["koalanoob","CA","D","Jett","Neon","Raze"]]},
  { liga:"AMER", tag:"EG", nome:"Evil Geniuses", pais:"US", nivel:2, tecnico:"potter", jogadores:[
    ["Paincakes","US","I","Sova","Fade","Skye"],["supamen","US","C","Omen","Viper"],
    ["bao","VN","S","Cypher","Omen","Vyse"],["dgzin","BR","D","Neon","Jett","Raze"],
    ["zerona","US","D","Phoenix","Yoru","Viper"]]},
  { liga:"AMER", tag:"C9", nome:"Cloud9", pais:"US", nivel:2, tecnico:"Veer", jogadores:[
    ["Zellsis","US","C","Viper","KAY/O","Sage"],["FireBallOps","US","S","Cypher","Vyse","Viper"],
    ["Jackk","US","I","Sova","Skye","Fade"],["OXY","US","D","Neon","Raze","Yoru"],
    ["v1c","US","C","Omen","Harbor","Brimstone"]]},
  { liga:"AMER", tag:"KRÜ", nome:"KRÜ Esports", pais:"AR", nivel:2, tecnico:"ZONYK", incerto:true, jogadores:[
    ["Less","BR","C","Omen","Viper","Cypher"],["heat","BR","F","Chamber","Phoenix","Raze"],
    ["saadhak","AR","I","KAY/O","Omen","Harbor"],["Dantedeu5","AR","D","Neon","Phoenix","Waylay"],
    ["mwzera","BR","I","Fade","Sova"]]},
  { liga:"AMER", tag:"SEN", nome:"Sentinels", pais:"US", nivel:1, tecnico:"Ewok", incerto:true, jogadores:[
    ["johnqt","MA","F","Harbor","Cypher","Phoenix"],["Reduxx","US","F","Phoenix","Omen","Jett"],
    ["cortezia","BR","S","Viper","Cypher","Vyse"],["JonahP","CA","I","Sova","Fade","Skye"],
    ["Jerrwin","IN","D","Waylay","Neon","Raze"]]},
  { liga:"AMER", tag:"ENVY", nome:"ENVY", pais:"US", nivel:1, tecnico:"Stunner", incerto:true, jogadores:[
    ["Rossy","US","C","Omen","Viper","Astra"],["nightz","US","F","Omen","Phoenix","Harbor"],
    ["Demon1","US","S","Chamber","Omen","Killjoy"],["GLYPH","PH","I","Sova","Fade","KAY/O"],
    ["keznit","CL","D","Neon","Jett","Waylay"]]},

  /* ============================== EMEA ============================== */
  { liga:"EMEA", tag:"KC", nome:"Karmine Corp", pais:"FR", nivel:5, tecnico:"ZE1SH", jogadores:[
    ["Avez","EG","I","Fade","Sova"],["dos9","KZ","C","Omen","Harbor"],
    ["LewN","TR","D","Neon","Raze"],["SUYGETSU","RU","F","Viper","Cypher","Astra"],
    ["N4RRATE","US","F","Chamber","Phoenix","Sage"]]},
  { liga:"EMEA", tag:"TL", nome:"Team Liquid", pais:"EU", nivel:4, tecnico:"LohaN", jogadores:[
    ["nAts","RU","S","Cypher","Viper","Vyse"],["kamo","PL","D","Phoenix","Raze","Yoru"],
    ["trexx","RU","I","Sova","Fade","Skye"],["Kicks","EE","C","Omen","Harbor","Tejo"],
    ["GSR","??","F"]]},
  { liga:"EMEA", tag:"FUT", nome:"FUT Esports", pais:"TR", nivel:4, tecnico:"Vlad", jogadores:[
    ["sociablEE","TR","F","Omen","Breach","Phoenix"],["s0pp","TR","D","Neon","Jett"],
    ["xeus","TR","D","Waylay","Raze","Phoenix"],["yetujey","TR","S","Cypher","Viper","Astra"],
    ["KROSTALY","TR","I","Sova","Skye","Fade"]]},
  { liga:"EMEA", tag:"VIT", nome:"Team Vitality", pais:"FR", nivel:4, tecnico:"PAL", jogadores:[
    ["Jamppi","FI","F","Phoenix","Yoru","Fade"],["PROFEK","PL","C","Omen","Astra","Harbor"],
    ["Derke","FI","D","Jett","Neon","Raze"],["Chronicle","RU","S","Chamber","Vyse","Viper"],
    ["Sayonara","??","I","Sova","Fade","Viper"]]},
  { liga:"EMEA", tag:"TH", nome:"Team Heretics", pais:"ES", nivel:3, tecnico:"neilzinho", incerto:true, jogadores:[
    ["Wo0t","TR","F","Chamber","Jett","Yoru"],["RieNs","TR","I","Sova","Fade","Viper"],
    ["benjyfishy","GB","S","Cypher","Vyse","Sage"],["Boo","LT","C","Omen","Astra","Fade"],
    ["koshmaras","LT","F","Neon","Phoenix","Omen"]]},
  { liga:"EMEA", tag:"BBL", nome:"BBL Esports", pais:"TR", nivel:3, tecnico:"KEY", incerto:true, jogadores:[
    ["Lar0k","TR","F","Waylay","Deadlock","Raze"],["Loita","TR","C","Omen","Astra"],
    ["lovers rock","TR","D","Yoru","Neon"],["Crewen","TR","S","Cypher","Vyse","Viper"],
    ["Rosé","TR","I","Sova","Fade"]]},
  { liga:"EMEA", tag:"EF", nome:"Eternal Fire", pais:"TR", nivel:3, tecnico:"afr0nfire", jogadores:[
    ["nekky","TR","I","Fade","Sova"],["Spear","TR","D","Neon","Phoenix","Jett"],
    ["audaz","TR","C","Omen","Astra"],["Favian","TR","F","Neon","Veto","Waylay"],
    ["echo","TR","S","Viper","Cypher","Vyse"]]},
  { liga:"EMEA", tag:"FNC", nome:"FNATIC", pais:"GB", nivel:2, tecnico:"—", incerto:true, jogadores:[
    ["crashies","US","F","Fade","Viper","Cypher"],["kaajak","PL","D","Neon","Yoru","Raze"],
    ["Cloud","RU","I","Sova","Fade","Skye"],["Alfajer","TR","F","Neon","Chamber","Waylay"],
    ["Boaster","GB","C","Omen"]]},
  { liga:"EMEA", tag:"M8", nome:"Gentle Mates", pais:"FR", nivel:2, tecnico:"KUNDIKUNDI", incerto:true, jogadores:[
    ["marteen","CZ","D","Phoenix","Raze","Yoru"],["Proxh","TR","C","Omen"],
    ["Minny","CZ","D","Jett"],["H1ber","??","S","Cypher","Viper"],
    ["starxo","PL","I","Sova","Fade"]]},
  { liga:"EMEA", tag:"NAVI", nome:"Natus Vincere", pais:"UA", nivel:2, tecnico:"ANGE1", incerto:true, jogadores:[
    ["Ruxic","TR","C","Omen","Astra","Harbor"],["hiro","TR","S","Cypher","Viper","Chamber"],
    ["chloric","??","I","Sova","Skye","Fade"],["CyvOph","FR","F","Sage","Phoenix","KAY/O"],
    ["ExiT","SA","D","Neon","Waylay","Phoenix"]]},
  { liga:"EMEA", tag:"GX", nome:"GIANTX", pais:"ES", nivel:1, tecnico:"pipsoN", jogadores:[
    ["Flickless","BE","F","Phoenix","Viper"],["westside","PL","S","Cypher","Phoenix"],
    ["ara","RO","D","Neon","Jett","Raze"],["Jesse","??","C","Omen"],
    ["neT","??","I","Sova","Fade"]]},
  { liga:"EMEA", tag:"PCF", nome:"PCIFIC Esports", pais:"TR", nivel:1, tecnico:"thinkii", incerto:true, jogadores:[
    ["qpert","RS","C","Omen","Harbor"],["seven","??","D","Phoenix","Raze"],
    ["NINJA","??","S","Chamber","Deadlock","Sage"],["al0rante","??","C","Viper","Cypher"],
    ["waddle","??","I","Fade","Sova"]]},

  /* ============================= PACIFIC ============================ */
  { liga:"PAC", tag:"PRX", nome:"Paper Rex", pais:"SG", nivel:5, tecnico:"alecks", jogadores:[
    ["invy","PH","I","Sova","Fade","Harbor"],["Jinggg","SG","D","Raze","Waylay","Harbor"],
    ["f0rsakeN","ID","C","Omen","Harbor","Miks"],["d4v41","MY","S","Viper","Chamber","Sage"],
    ["something","RU","F","Yoru","Sage","Viper"]]},
  { liga:"PAC", tag:"NS", nome:"Nongshim RedForce", pais:"KR", nivel:5, tecnico:"SilKanoN", jogadores:[
    ["Rb","KR","C","Omen","Harbor","Yoru"],["Xross","KR","I","Sova","Fade","Phoenix"],
    ["Francis","KR","F","Yoru","Sova","Omen"],["Dambi","KR","D","Neon","Waylay","Jett"],
    ["Ivy","KR","S","Cypher","Viper","Killjoy"]]},
  { liga:"PAC", tag:"GE", nome:"Global Esports", pais:"IN", nivel:4, tecnico:"Platoon", jogadores:[
    ["xavi8k","??","C","Astra","Omen","Sova"],["PatMen","??","F","Omen","Viper","Skye"],
    ["UdoTan","KR","D","Raze","Neon","Waylay"],["Kr1stal","RU","I","Sova","Tejo","Killjoy"],
    ["Autumn","AU","F","Yoru","Veto","Chamber"]]},
  { liga:"PAC", tag:"T1", nome:"T1", pais:"KR", nivel:4, tecnico:"KDG", jogadores:[
    ["Munchkin","KR","F","Viper","Cypher","Sova"],["stax","KR","C","Omen","Harbor"],
    ["Meteor","KR","F","Yoru","Chamber","Jett"],["BuZz","KR","D","Neon","Phoenix","Raze"],
    ["iZu","KR","I","Sova","Fade","Neon"]]},
  { liga:"PAC", tag:"GEN", nome:"Gen.G", pais:"KR", nivel:3, tecnico:"solo", incerto:true, jogadores:[
    ["t3xture","KR","D","Chamber","Raze","Phoenix"],["Raxcal","KR","S","Sage","Vyse","Phoenix"],
    ["Ash","KR","D","Neon"],["Karon","KR","C","Omen","Astra","Harbor"],
    ["Efina","KR","I","Fade"]]},
  { liga:"PAC", tag:"VL", nome:"VARREL", pais:"JP", nivel:3, tecnico:"TK9", jogadores:[
    ["Foxy9","KR","S","Viper","Cypher","Chamber"],["XuNa","KR","I","Fade","Sova","Tejo"],
    ["Klaus","KR","C","Omen","Raze"],["oonzmlp","KR","F","Sage","Phoenix","Vyse"],
    ["C1ndeR","KR","F"]]},
  { liga:"PAC", tag:"FS", nome:"FULL SENSE", pais:"TH", nivel:3, tecnico:"FrosT", jogadores:[
    ["primmie","TH","D","Jett","Waylay","Deadlock"],["Killua","TH","I","Skye","Sova","Fade"],
    ["JitBoyS","TH","D","Neon","Raze","Phoenix"],["Crws","TH","F"],
    ["seph1roth","TH","F"]]},
  { liga:"PAC", tag:"DFM", nome:"DetonatioN FocusMe", pais:"JP", nivel:2, tecnico:"Vorz", jogadores:[
    ["SSeeS","JP","C","Omen","Viper","Vyse"],["Meiy","JP","D","Jett","Neon","Waylay"],
    ["yatsuka","JP","D","Neon","Raze","Phoenix"],["Caedye","JP","F","Cypher","Omen"],
    ["Akame","KR","I","Sova","Skye","Fade"]]},
  { liga:"PAC", tag:"RRQ", nome:"Rex Regum Qeon", pais:"ID", nivel:2, tecnico:"—", jogadores:[
    ["crazyguy","VN","I","Sova","Fade","Sage"],["Monyet","ID","C","Omen","Astra","Harbor"],
    ["xffero","ID","S","Cypher","Sage","Veto"],["Jemkin","RU","D","Yoru","Waylay","Chamber"],
    ["Kushy","ID","F"]]},
  { liga:"PAC", tag:"DRX", nome:"KIWOOM DRX", pais:"KR", nivel:2, tecnico:"termi", jogadores:[
    ["BeYN","KR","I","Sova","Fade","Skye"],["MaKo","KR","C","Omen","Viper"],
    ["free1ng","KR","F","Neon","Chamber","Cypher"],["HYUNMIN","KR","D","Phoenix","Raze","Yoru"],
    ["Flicker","KR","F"]]},
  { liga:"PAC", tag:"ZETA", nome:"ZETA DIVISION", pais:"JP", nivel:1, tecnico:"ryota-", incerto:true, jogadores:[
    ["eKo","KR","F","Yoru","Fade","Sova"],["Absol","JP","D","Neon","Waylay","Yoru"],
    ["SugarZ3ro","JP","C","Omen"],["SyouTa","JP","S","Cypher","Viper","Vyse"],
    ["Xdll","JP","I","Sova","Sage"]]},
  { liga:"PAC", tag:"TS", nome:"Team Secret", pais:"PH", nivel:1, tecnico:"—", incerto:true, jogadores:[
    ["Sylvan","KR","C","Omen","Astra","Brimstone"],["natz","PH","S","Cypher","Vyse"],
    ["STYRON","PH","I","Sova","Fade","Skye"],["Zeus","PH","D","Neon","Jett","Raze"],
    ["kellyS","PH","F","Deadlock","Viper"]]},

  /* ============================== CHINA ============================= */
  { liga:"CN", tag:"TYL", nome:"TYLOO", pais:"CN", nivel:5, tecnico:"hypnotizing", jogadores:[
    ["SiuFatBB","??","I","Fade","Sova","Skye"],["splash","??","D","Raze","Neon","Phoenix"],
    ["Scales","CN","S","Cypher","Viper","Sage"],["Erv","CN","C","Omen","KAY/O","Waylay"],
    ["slowly","CN","F","Waylay","Jett","Chamber"]]},
  { liga:"CN", tag:"JDG", nome:"JD Gaming", pais:"CN", nivel:4, tecnico:"bail", jogadores:[
    ["jkuro","CN","D","Raze","Jett","Waylay"],["zhe","CN","F","Neon","Chamber","Phoenix"],
    ["Yuicaw","CN","S","Cypher","Viper","Vyse"],["crownfisher","CN","C","Omen","Harbor","Jett"],
    ["BerLIN","CN","I","Sova","Fade","Skye"]]},
  { liga:"CN", tag:"EDG", nome:"EDward Gaming", pais:"CN", nivel:4, tecnico:"Autumn", jogadores:[
    ["nobody","CN","I","Sova","Skye","Fade"],["ZmjjKK","CN","D","Jett","Neon","Chamber"],
    ["CHICHOO","CN","S","Cypher","Viper","Phoenix"],["Smoggy","CN","C","Omen","Harbor","Raze"],
    ["Jieni7","CN","F","KAY/O","Omen","Vyse"]]},
  { liga:"CN", tag:"XLG", nome:"Xi Lai Gaming", pais:"CN", nivel:4, tecnico:"hvoya", jogadores:[
    ["WsLeo","CN","I","Fade","Sova","Skye"],["Lysoar","CN","C","Omen","Harbor","Vyse"],
    ["happywei","CN","F","Viper","Omen","Cypher"],["Rarga","??","D","Neon","Phoenix","Jett"],
    ["NoMan","??","D","Waylay","Raze","Jett"]]},
  { liga:"CN", tag:"BLG", nome:"Bilibili Gaming", pais:"CN", nivel:3, tecnico:"Anaks", jogadores:[
    ["whzy","CN","D","Raze","Yoru","Chamber"],["rushia","CN","S","Cypher","Neon","Viper"],
    ["nephh","??","F","Omen","Fade","Skye"],["Knight","CN","F","Omen","Fade","Sova"],
    ["FT","CN","F","Waylay","Omen","Phoenix"]]},
  { liga:"CN", tag:"NOVA", nome:"Nova Esports", pais:"CN", nivel:3, tecnico:"24K", jogadores:[
    ["qiutiaN","??","I","Fade","Sova","Deadlock"],["cb","CN","F","Phoenix","Skye","Killjoy"],
    ["Ezeir","CN","C","Omen","Astra","Harbor"],["GuanG","CN","S","Viper","Cypher","Chamber"],
    ["swagzor","??","D","Neon","Raze","Waylay"]]},
  { liga:"CN", tag:"AG", nome:"All Gamers", pais:"CN", nivel:3, tecnico:"ED101", jogadores:[
    ["Shr1mp","CN","I","Sova","Fade","Skye"],["K1ra","CN","F","Omen","Raze","Phoenix"],
    ["Bai","CN","S","Cypher","Viper","Neon"],["f4ngeer","RU","D","Neon","Jett","Chamber"],
    ["iamgrq","CN","C","Omen","Phoenix","KAY/O"]]},
  { liga:"CN", tag:"DRG", nome:"Dragon Ranger Gaming", pais:"CN", nivel:3, tecnico:"NaThanD", jogadores:[
    ["Nicc","??","I","Skye","Fade","Sova"],["Life","??","D","Neon","Jett","Waylay"],
    ["vo0kashu","??","S","Cypher","Viper"],["Verse","??","C","Omen","Harbor"],
    ["SpiritZ1","??","D","Waylay","Yoru","Jett"]]},
  { liga:"CN", tag:"TEC", nome:"Titan Esports Club", pais:"CN", nivel:2, tecnico:"AfteR", jogadores:[
    ["Haodong","CN","S","Cypher","Omen"],["lucas","CN","I","Sova","Fade","Tejo"],
    ["Dynamite","CN","D","Phoenix","Neon","Waylay"],["ra1ny","CN","D","Neon","Raze"],
    ["Coco","CN","C","Omen","Viper","Astra"]]},
  { liga:"CN", tag:"TE", nome:"Trace Esports", pais:"CN", nivel:2, tecnico:"destroyeR", jogadores:[
    ["LuoK1ng","CN","C","Omen","Harbor"],["Kai","CN","D","Jett","Waylay","Neon"],
    ["FengF","CN","F","Sova","Raze","Neon"],["FKEY","CN","I","Fade","KAY/O","Sage"],
    ["deLb","ID","S","Cypher","Viper","Vyse"]]},
  { liga:"CN", tag:"FPX", nome:"FunPlus Phoenix", pais:"CN", nivel:2, tecnico:"LEGIJA", incerto:true, jogadores:[
    ["AAAAY","CN","S","Cypher","Viper","Clove"],["coconut","CN","I","Sova","Fade","Tejo"],
    ["Xlele","CN","D","Neon","Jett","Raze"],["Setrod","CN","F","Neon","Chamber","Vyse"],
    ["KovaQ","??","C","Omen","Harbor","Astra"]]},
  { liga:"CN", tag:"WOL", nome:"Wolves Esports", pais:"CN", nivel:1, tecnico:"alexRr", jogadores:[
    ["glacier","CN","D","Neon","Raze","Jett"],["yosemite","CN","S","Vyse","Cypher","Killjoy"],
    ["Spring","CN","C","Viper","Omen"],["Deryeon","??","F","Omen","KAY/O","Raze"],
    ["aluba","CN","I","Sova","Fade","Skye"]]},

  /* ======================= CHALLENGERS BRASIL ======================= */
  /* Elencos com menos de 5 são completados pelo jogo com jogadores gerados. */
  { liga:"CBR", tag:"FXW7M", nome:"Fluxo W7M", pais:"BR", nivel:5, tecnico:"stkJ", incerto:true, jogadores:[
    ["mazin","BR","I","KAY/O","Fade","Skye"],["jzz","BR","S","Vyse","Cypher","Viper"],
    ["tuyz","BR","C","Omen","Harbor","Astra"],["Palla","BR","D","Jett","Waylay","Neon"]]},
  { liga:"CBR", tag:"2G", nome:"2Game Esports", pais:"BR", nivel:5, tecnico:"gaabxx", incerto:true, jogadores:[
    ["gobera","BR","D","Neon","Jett","Raze"],["xenom","BR","C","Viper","Omen","Brimstone"],
    ["frz","BR","I","Sova","Skye","Fade"]]},
  { liga:"CBR", tag:"TSS", nome:"Team Solid", pais:"BR", nivel:4, tecnico:"peu", jogadores:[
    ["raafa","BR","I","Sova","Fade","Skye"],["havoc","BR","D","Neon","Jett","Raze"],
    ["liazzi","BR","F","Raze","Phoenix","KAY/O"],["nevoy","BR","S","Vyse","Cypher","Killjoy"],
    ["GuhRVN","BR","C","Omen","Harbor","Brimstone"]]},
  { liga:"CBR", tag:"RED", nome:"RED Canids", pais:"BR", nivel:3, tecnico:"DRAGziKW", jogadores:[
    ["prozin","BR","F","Phoenix","KAY/O","Viper"],["forbanz","BR","D","Jett","Neon","Waylay"],
    ["sw","BR","S","Viper","Cypher","Vyse"],["Urango","BR","I","Sova","Fade","Tejo"],
    ["RgLMeister","BR","C","Omen","Harbor","Astra"]]},
  { liga:"CBR", tag:"ELV", nome:"ELEVATE", pais:"BR", nivel:3, tecnico:"eternal", incerto:true, jogadores:[
    ["Zap","BR","I","Fade","Breach","Skye"],["Tiezzi","BR","D","Raze","Neon","Waylay"],
    ["maestr0","BR","F","Omen","Neon","Phoenix"],["kon4n","BR","F","Viper","Sova","Tejo"],
    ["dth","BR","C","Omen","Astra","Brimstone"]]},
  { liga:"CBR", tag:"FUR.AC", nome:"FURIA Academy", pais:"BR", nivel:3, tecnico:"ryotzz", incerto:true, jogadores:[
    ["Bruxo","BR","F","Neon","Viper","Sova"],["Stwz1","BR","I","Fade","Tejo","Vyse"]]},
  { liga:"CBR", tag:"MIBR.AC", nome:"MIBR Academy", pais:"BR", nivel:3, tecnico:"Biscoit1n", incerto:true, jogadores:[
    ["turkish","BR","S","Cypher","Viper","Omen"],["Kring","BR","I","Fade","Sova","Skye"],
    ["Luid","BR","D","Phoenix","Jett","Raze"],["taka","BR","S","Vyse","Viper","Chamber"],
    ["peixeh","BR","C","Omen","Astra","Brimstone"]]},
  { liga:"CBR", tag:"TBK", nome:"TBK Esports", pais:"BR", nivel:2, tecnico:"gtn", incerto:true, jogadores:[
    ["snw","BR","D","Raze","Jett","Brimstone"],["murizzz","BR","S","Vyse","Cypher","Astra"]]},
  { liga:"CBR", tag:"INTZ", nome:"INTZ", pais:"BR", nivel:2, tecnico:"—", incerto:true, jogadores:[
    ["Askia","BR","C","Omen","Astra","Harbor"],["Siduzord","BR","I","Fade","Sova","Skye"],
    ["guuih","BR","S","Vyse","Viper","Killjoy"],["PxS","BR","F","Viper","Phoenix","Raze"],
    ["Tisora","BR","D","Jett","Raze","Neon"]]},
  { liga:"CBR", tag:"F4T", nome:"F4TALITY", pais:"BR", nivel:2, tecnico:"—", jogadores:[
    ["duhT","BR","C","Omen","Astra","Brimstone"],["Loweed","BR","D","Raze","Phoenix","Neon"],
    ["znajder","BR","F","Vyse","Neon","Waylay"],["pollo","BR","S","Viper","Chamber","Killjoy"],
    ["shion","BR","I","Fade","Sova","Skye"]]},
  { liga:"CBR", tag:"EGO", nome:"TEAM EGO", pais:"BR", nivel:1, tecnico:"—", incerto:true, jogadores:[
    ["gbz","BR","F","Phoenix","Viper"],["pryze","BR","I","Fade","Sova"],
    ["PKX","BR","S","Cypher","Vyse","Viper"],["raised","BR","D","Neon","Raze"],
    ["lz","BR","C","Omen","Astra","Brimstone"]]},
  { liga:"CBR", tag:"PEEK", nome:"PEEK", pais:"BR", nivel:1, tecnico:"InTLekt", jogadores:[
    ["desire","BR","S","Cypher","Phoenix","Breach"],["lowz","BR","D","Jett","Phoenix","Chamber"],
    ["lilo","BR","D","Neon","Clove","Jett"],["HiiiK","BR","C","Omen","Harbor","Astra"],
    ["mxnor","BR","I","Sova","Fade","Gekko"]]},
  { liga:"CBR", tag:"TLV", nome:"Team Liquid Brazil", pais:"BR", nivel:1, tecnico:"napz", jogadores:[
    ["daiki","BR","I","KAY/O","Skye","Fade"],["Jelly","BR","D","Neon","Jett","Raze"],
    ["Bizerra","BR","F","Sova","Raze","Vyse"],["Joojina","BR","F"],
    ["isaa","BR","S","Viper","Cypher","Killjoy"]]},
  { liga:"CBR", tag:"TRI", nome:"TRIBE", pais:"BR", nivel:1, tecnico:"—", incerto:true, jogadores:[
    ["spm","BR","S","Cypher","Chamber","Viper"]]},

  /* ======================= CHALLENGERS NORTH AMERICA ======================= */
  { liga:"CNA", tag:"M80", nome:"M80", pais:"US", nivel:5, tecnico:"kaplan", jogadores:[
    ["NiSMO","LB","F","KAY/O","Omen","Raze"],["Boni","PH","D","Neon","Raze","Waylay"],["alvinboy","CN","S","Cypher","Vyse","Chamber"],
    ["Spaz","US","C","Viper","Brimstone","Astra"],["Kyu","CA","I","Fade","Sova","Breach"]]},
  { liga:"CNA", tag:"SRB", nome:"Shopify Rebellion Black", pais:"US", nivel:5, tecnico:"effys", incerto:true, jogadores:[
    ["Smoke","US","D","Jett","Chamber"],["satellite","CN","D","Phoenix","Raze","Tejo"],["zander","CA","C","Astra","Omen","Harbor"],
    ["exa","KR","S","Viper","Cypher","Harbor"],["NaturE","US","I","Fade","Sova","Skye"]]},
  { liga:"CNA", tag:"SAD", nome:"SaD Esports", pais:"US", nivel:4, tecnico:"mikey", incerto:true, jogadores:[
    ["welyy","NO","I","Fade","Sova","Skye"],["payne","US","C","Omen","Brimstone","Astra"],["Pa1nt","US","D","Phoenix","Raze","Neon"],
    ["vita","US","D","Neon","Jett","Chamber"],["zaj","??","S","Cypher","Viper","Yoru"]]},
  { liga:"CNA", tag:"NBG", nome:"Nightblood Gaming", pais:"US", nivel:4, tecnico:"monSi", jogadores:[
    ["sonofcar","US","D","Jett","Raze","Neon"],["toozy","US","C","Omen","Viper","Cypher"],["stellar","US","S","Cypher","Vyse","Breach"],
    ["zeek","CA","I","Sova","Fade","Viper"],["stunna","US","F","Phoenix","Omen","Brimstone"]]},
  { liga:"CNA", tag:"NRGA", nome:"NRG Academy", pais:"US", nivel:3, tecnico:"mCe", incerto:true, jogadores:[
    ["haeyoday","CN","D","Jett","Waylay","Raze"],["renz","DE","I","Fade","Phoenix","Neon"],["Ange","CA","C","Omen","Astra","Brimstone"],
    ["Shondex","TR","F","Viper","Chamber","Phoenix"],["geeza","US","F"]]},
  { liga:"CNA", tag:"QOR", nome:"QoR", pais:"US", nivel:3, tecnico:"—", incerto:true, jogadores:[
    ["Derrek","US","I","Fade","Sova"],["moose","CA","C","Viper","Cypher"],["kumi","US","F","Phoenix","Vyse","Chamber"],
    ["infiltrator","VN","D","Waylay","Raze","Jett"],["flyuh","US","C","Omen","Sova","Fade"]]},
  { liga:"CNA", tag:"YFT", nome:"YFT", pais:"US", nivel:2, tecnico:"—", incerto:true, jogadores:[
    ["Muddy","LA","D","Jett","Raze","Neon"],["XXiF","CA","S","Vyse","Killjoy","Cypher"],["atlas","US","F","Phoenix","Omen","KAY/O"],
    ["stallion","CA","C","Harbor","Omen","Brimstone"],["devy","US","I","Sova","Fade","Viper"]]},
  { liga:"CNA", tag:"EGA", nome:"Evil Geniuses Academy", pais:"US", nivel:2, tecnico:"Daeda", incerto:true, jogadores:[
    ["jakee","US","C","Omen","Astra","Clove"],["bdog","US","D","Jett","Raze","Neon"],["ahm4xx","IQ","D","Phoenix","Waylay","Neon"],
    ["zanks","US","D","Neon","Jett","Waylay"],["wedid","PL","I","Sova","Omen","Viper"]]},

  /* ======================= CHALLENGERS LATAM (Norte e Sul) ======================= */
  { liga:"CLAT", tag:"BST", nome:"BESTIA", pais:"CL", nivel:5, tecnico:"phonics", incerto:true, jogadores:[
    ["Melser","CL","F","Sova","Omen","Fade"],["david","CL","S","Cypher","Killjoy","Viper"],["Tacolilla","CL","D","Neon","Raze","Viper"],
    ["Loss","BR","D","Phoenix","Neon","Jett"]]},
  { liga:"CLAT", tag:"BBB", nome:"Contra", pais:"CO", nivel:4, tecnico:"Swish", jogadores:[
    ["CRUNCH","US","D","Jett","Raze","Chamber"],["paganus","MX","D","Neon","Phoenix","Waylay"],["Peloncito","MX","I","Sova","Skye","Omen"],
    ["dedmos","MX","C","Omen","Astra","Harbor"],["theory","CO","I","Sova","Fade","Vyse"]]},
  { liga:"CLAT", tag:"FUE", nome:"FUEGO", pais:"CO", nivel:4, tecnico:"FR1X", jogadores:[
    ["ezznap","CO","C","Astra","Omen","Brimstone"],["Hada","MX","S","Chamber","Vyse","Harbor"],["Rei","CO","D","Phoenix","Iso","Raze"],
    ["Sabortzz","MX","D","Waylay","Jett"],["GeneralSteak","GT","I","Fade","Sova"],["Javiierh","MX","S","Vyse","Chamber","Sova"]]},
  { liga:"CLAT", tag:"KRUS", nome:"KRÜ SPARK", pais:"AR", nivel:4, tecnico:"joman", incerto:true, jogadores:[
    ["mont1","CL","S","Chamber","Killjoy","Vyse"],["phc","BR","C","Omen","Viper","Astra"],["NagZ","CL","F","Jett","Viper","Cypher"],
    ["benG","CL","F","Omen","Phoenix","Sage"],["jotinha","AR","I","Fade","Sova","Skye"]]},
  { liga:"CLAT", tag:"9ZG", nome:"9z Globant", pais:"CL", nivel:3, tecnico:"Pule", jogadores:[
    ["MiradaNinja","CL","S","Cypher","Harbor","Omen"],["Kimbo","AR","C","Viper","KAY/O","Omen"],["skyppervz","CL","I","Sova","Fade","Skye"],
    ["Tuli","CL","D","Phoenix","Raze","Jett"],["M1key","AR","D","Jett","Astra","Neon"]]},
  { liga:"CLAT", tag:"UW", nome:"University War", pais:"CL", nivel:3, tecnico:"goodlike", jogadores:[
    ["KNZY","CL","C","Harbor","Breach","Omen"],["alca","CL","I","Sova","Fade","Tejo"],["Mathi","UY","D","Phoenix","Chamber","Raze"],
    ["ruso","AR","D","Neon"],["Mystizip","CL","C","Viper","Omen","Vyse"]]},
  { liga:"CLAT", tag:"LYN", nome:"LYON", pais:"MX", nivel:3, tecnico:"—", incerto:true, jogadores:[
    ["Mephisto","MX","D","Waylay","Phoenix","Omen"],["Feniz","CR","S","Vyse","Cypher","Viper"],["Dragon","??","D","Raze","Phoenix","Jett"],
    ["Kess","KR","I","Sova","Fade","Skye"],["Jow","CO","C","Omen","Astra","Viper"]]},
  { liga:"CLAT", tag:"STA", nome:"STREAMER ARENA", pais:"VE", nivel:2, tecnico:"Juanma", jogadores:[
    ["Levi","VE","C","Omen","Breach","Brimstone"],["Yarwiz","??","S","Chamber","Cypher","Brimstone"],["Snapss","CR","I","Sova","Tejo","Fade"],
    ["Matkazeta","CR","D","Neon","Jett","Waylay"],["Dlasqx1","VE","D","Phoenix","Waylay","Raze"]]},

  /* ======================= CHALLENGERS EMEA ======================= */
  { liga:"CEMEA", tag:"EP", nome:"Enterprise Esports", pais:"CZ", nivel:5, tecnico:"Itopata", incerto:true, jogadores:[
    ["iluri","FI","I","Sova","Skye","Fade"],["Lime","GB","D","Neon","Phoenix","Raze"],["paTiTek","PL","C","Omen","Brimstone","Astra"],
    ["kozzy","RO","D","Phoenix","Jett","Raze"],["MAGNUM","BG","S","Killjoy","Cypher","Vyse"]]},
  { liga:"CEMEA", tag:"FF", nome:"Fire Flux Esports", pais:"TR", nivel:5, tecnico:"Lev", incerto:true, jogadores:[
    ["hezacoil","TR","C","Omen","Astra","Brimstone"],["Kachoww","TR","D","Neon","Yoru"],["DeadInk","TR","D","Waylay","Chamber","Raze"],
    ["batujnax","TR","I","Fade","Sova","Skye"],["reazy","TR","F","Viper","Omen","Sova"],["b1squw1","TR","F"]]},
  { liga:"CEMEA", tag:"JL", nome:"Joblife", pais:"FR", nivel:4, tecnico:"Larsson", jogadores:[
    ["UNFAKE","PL","I","Sova","Fade","Skye"],["kamyk","PL","C","Omen","Viper","Astra"],["doma","HR","F","Omen","Phoenix","Cypher"],
    ["chiwa","RU","S","Cypher","Viper","Vyse"],["runneR","MK","D","Jett","Raze","Neon"]]},
  { liga:"CEMEA", tag:"SGE", nome:"Eintracht Frankfurt", pais:"DE", nivel:4, tecnico:"TonY", incerto:true, jogadores:[
    ["musashi","DE","I","Sova","Fade","Raze"],["azury","DE","C","Viper","Omen","Fade"],["Jamelinho213","DE","D","Neon","Raze","Jett"],
    ["Fizzy","PT","C","Astra","Omen","Brimstone"],["MONSTEERR","CZ","S","Vyse","Cypher","Viper"]]},
  { liga:"CEMEA", tag:"NVJ", nome:"Natus Vincere Junior", pais:"UA", nivel:4, tecnico:"Johnta", jogadores:[
    ["Javelin","UA","I","Sova","Skye","Fade"],["Kolosha","UA","D","Phoenix","Neon","Sage"],["avey","LV","C","Omen","Astra"],
    ["Darxcioo","BE","D","Neon","Jett","Raze"],["sizo","PL","F","Viper","Cypher","Veto"]]},
  { liga:"CEMEA", tag:"CGN", nome:"CGN Esports", pais:"DE", nivel:3, tecnico:"Kapio", incerto:true, jogadores:[
    ["samed","AT","D","Neon","Jett","Waylay"],["Vince","DE","C","Omen","Brimstone","Astra"],["Wolfen","BG","S","Cypher","Viper","Vyse"],
    ["Jady","RU","I","Sova","Phoenix","Fade"],["Zyppan","SE","D","Phoenix","Breach","Raze"]]},
  { liga:"CEMEA", tag:"UCAM", nome:"UCAM Esports Club", pais:"ES", nivel:3, tecnico:"Bromas", incerto:true, jogadores:[
    ["Buld","PL","F","Sage","Viper","Fade"],["B1SK","RU","D","Raze","Yoru","Jett"],["Famsii","FI","I","Fade","Phoenix","Sova"],
    ["OLIZERA","PT","S","Viper","Cypher","Vyse"]]},
  { liga:"CEMEA", tag:"MIR", nome:"MIR", pais:"RU", nivel:3, tecnico:"pops", incerto:true, jogadores:[
    ["Redgar","RU","I","Sova","Fade","Skye"],["kospa1n","RU","D","Phoenix","Jett","Raze"],["Raz","RU","D","Neon","Yoru","Jett"],
    ["reblyik","UA","S","Vyse","Cypher","Viper"],["Bishepss","RU","C","Omen","Astra","Brimstone"]]},
  { liga:"CEMEA", tag:"CLK", nome:"Çilekler", pais:"TR", nivel:3, tecnico:"rêveur", incerto:true, jogadores:[
    ["wtex","TR","D","Jett","Raze","Phoenix"],["Slaughter","TR","C","Harbor","Omen","Astra"],["kabzi","TR","F","Viper","Cypher","Astra"],
    ["mepeezy","TR","F","Phoenix","Viper","Waylay"],["ibonata","TR","I","Sova","Omen","Skye"]]},
  { liga:"CEMEA", tag:"MISA", nome:"Misa Esports", pais:"TR", nivel:2, tecnico:"Draken", incerto:true, jogadores:[
    ["Tiyosta","TR","F","Neon","Cypher","Sage"],["Fortres","TR","D","Phoenix","Neon","Raze"],["pAwn1","TR","I","Sova","Omen"],
    ["Ronniee","TR","D","Jett","Phoenix","Neon"],["MERZ","TR","F","Omen","Sova"]]},
  { liga:"CEMEA", tag:"QAD", nome:"AlQadsiah Esports", pais:"SA", nivel:2, tecnico:"—", incerto:true, jogadores:[
    ["SpYzera","LB","C","Omen","Phoenix"],["sickrey","RU","I","Sova","Fade","Cypher"],["Zimo","SA","C","Omen","Viper"],
    ["SimonD4rk","BY","D","Jett","Raze","Neon"],["Yassien","EG","F","Sova","Phoenix","Viper"]]},
  { liga:"CEMEA", tag:"BJK", nome:"Beşiktaş Esports", pais:"TR", nivel:2, tecnico:"—", incerto:true, jogadores:[
    ["MerSa","TR","I","KAY/O","Fade"],["Docent","TR","C","Omen","Astra"],["wezzy","TR","F","Jett","Omen","Cypher"],
    ["influx","TR","D","Raze","Neon","Jett"],["oroni","TR","F","Sova","Phoenix","Vyse"]]},

  /* ======================= CHALLENGERS PACIFIC ======================= */
  { liga:"CPAC", tag:"ONG", nome:"ONSIDE GAMING", pais:"KR", nivel:5, tecnico:"Hype", jogadores:[
    ["Xiesta","KR","D","Neon","Phoenix","Jett"],["Ray","KR","C","Omen","Waylay","Brimstone"],["Cloudy","KR","I","Sova","Fade","Skye"],
    ["Wolverine","KR","S","Cypher","Viper","Raze"],["Hermes","KR","F","Cypher","Omen","Yoru"],["Faither","KR","F"]]},
  { liga:"CPAC", tag:"SP", nome:"Sharper Esports", pais:"TH", nivel:5, tecnico:"Leaf", jogadores:[
    ["Kadoom","TH","D","Neon","Jett","Raze"],["PTC","TH","C","Omen","Astra","Harbor"],["NIZ","TH","I","Sova","Omen","Fade"],
    ["Apinya","TH","F","Sage","Sova","Skye"],["Laz","TH","S","Killjoy","Cypher","Viper"]]},
  { liga:"CPAC", tag:"XIP", nome:"Xipto Esports", pais:"TH", nivel:4, tecnico:"ASI", jogadores:[
    ["endoist","TH","D","Phoenix","Raze","Neon"],["doffy","TH","D","Jett","Waylay","Neon"],["aLerT","TH","C","Omen","Astra","Brimstone"],
    ["canady","TH","I","Sova","Fade","Skye"],["Surf","TH","S","Killjoy","Cypher","Viper"]]},
  { liga:"CPAC", tag:"QTD", nome:"QT DIG∞", pais:"JP", nivel:4, tecnico:"Relife", jogadores:[
    ["Kippei","??","C","Omen","Astra","Harbor"],["Misaya","??","I","Fade","Sova"],["yuran","JP","D","Phoenix","Yoru","Raze"],
    ["Pkm","KR","D","Neon","Jett"],["margaret","KR","S","Cypher","Chamber","Viper"]]},
  { liga:"CPAC", tag:"ART", nome:"ARETE", pais:"KR", nivel:4, tecnico:"—", jogadores:[
    ["ANNYEON","KR","D","Raze","Waylay","Neon"],["Rico","KR","C","Omen","Viper","Astra"],["JaebiN","KR","F","Chamber","Jett","Skye"],
    ["XIV","KR","F","Phoenix","Cypher","Killjoy"],["RedLight","KR","I","Fade","Sova","Skye"]]},
  { liga:"CPAC", tag:"RC", nome:"REJECT", pais:"JP", nivel:4, tecnico:"Egi", incerto:true, jogadores:[
    ["Dep","JP","D","Neon"],["Jremy","??","D","Phoenix","Jett"],["BRIAN","??","I","Sova","Fade","Skye"],
    ["Yoshiii","??","S","Chamber","Cypher","Viper"],["Persia","??","C","Omen","Harbor"]]},
  { liga:"CPAC", tag:"FCY", nome:"Fancy United Esports", pais:"VN", nivel:4, tecnico:"Kawa", jogadores:[
    ["Nia","??","D","Neon"],["f1cio","VN","C","Astra","Harbor","Brimstone"],["YESicaN","VN","I","Breach","KAY/O","Tejo"],
    ["bucute","??","F","Viper","Omen","Phoenix"],["twilight","??","F","Tejo","Cypher","KAY/O"],["deviceHP","VN","F"]]},
  { liga:"CPAC", tag:"DK", nome:"Dplus Esports", pais:"KR", nivel:3, tecnico:"frizz", jogadores:[
    ["Ramgi","KR","D","Raze","Jett","Waylay"],["shu","KR","C","Omen","Harbor","Astra"],["Kally","KR","I","Sova","KAY/O","Skye"],
    ["JaXe","KR","F","Sova","Jett","Skye"],["CabezA","KR","S","Viper","Cypher","Vyse"]]},
  { liga:"CPAC", tag:"FL", nome:"FENNEL", pais:"JP", nivel:3, tecnico:"Euler", jogadores:[
    ["Hals","??","D","Jett","Raze","Neon"],["GangPin","??","C","Omen","Harbor"],["Anthem","JP","I","KAY/O","Fade","Sova"],
    ["Aace","JP","F","Sova","Sage","Phoenix"],["CLZ","JP","S","Cypher","Viper"]]},
  { liga:"CPAC", tag:"XC", nome:"X-CAST", pais:"KR", nivel:3, tecnico:"—", jogadores:[
    ["Beom","KR","D","Neon","Raze","Jett"],["Taegeuk","KR","C","Omen","Harbor","Astra"],["YJ","KR","F","Phoenix","Viper","Waylay"],
    ["rsd","KR","S","Chamber","Vyse","Viper"],["INPA","KR","F"]]},
  { liga:"CPAC", tag:"IGZ", nome:"IGZIST", pais:"JP", nivel:3, tecnico:"gainpe", incerto:true, jogadores:[
    ["kAyle","KR","C","Omen","Fade","Sova"],["oitaN","JP","C","Viper","Astra","Omen"],["Frxeez","??","S","Killjoy","Cypher","Deadlock"],
    ["SID","KR","F"],["popogachi","??","I","Sova","Phoenix"]]},
  { liga:"CPAC", tag:"JADE", nome:"Jade Lions", pais:"PH", nivel:3, tecnico:"—", incerto:true, jogadores:[
    ["kkoruna","??","D","Jett","Neon"],["2GE","PH","C","Omen","Viper"],["Nexi","PH","S","Viper","Chamber","Killjoy"],
    ["Georggyyy","PH","F","Sage","Phoenix","Raze"],["Papi","PH","F"]]},

  /* ======================= CHALLENGERS CHINA (VCNT / EVO) ======================= */
  { liga:"CCN", tag:"KBG", nome:"KeepBest Gaming", pais:"CN", nivel:5, tecnico:"Naint", jogadores:[
    ["Akeman","CN","D","Neon","Jett"],["Ying","CN","F","Phoenix","Viper","Breach"],["sibeastw0w","??","I","Sova","Fade","KAY/O"],
    ["Tonk","??","S","Cypher","Viper"],["Krst1Ng","??","C","Omen","Astra"],["coldfish","CN","F"]]},
  { liga:"CCN", tag:"AQG", nome:"Any Questions Gaming", pais:"CN", nivel:4, tecnico:"—", jogadores:[
    ["Juicy","??","D","Yoru","Raze","Veto"],["5CM","CN","D","Neon","Waylay"],["S1Mon","??","I","Fade","Astra"],
    ["Dannyy","??","S","Cypher","Vyse"],["Youjun","??","C","Omen","Sova"]]},
  { liga:"CCN", tag:"UR", nome:"Unsettled Resentment", pais:"CN", nivel:4, tecnico:"—", jogadores:[
    ["Ninebody","??","D","Neon","Waylay","Raze"],["Hopedawn","??","C","Omen","Astra"],["waituu","??","I","Fade","Sova","Skye"],
    ["CXIX666","??","S","Cypher","Viper","Vyse"],["QiuYe","??","F","Waylay","Sage","Viper"]]},
  { liga:"CCN", tag:"AT", nome:"A Team", pais:"CN", nivel:3, tecnico:"Malix", jogadores:[
    ["Folykiki","??","D","Neon"],["monk","CN","C","Omen"],["Dingwei","CN","I","Fade","Sova","Skye"],
    ["Eren","CN","F","Cypher","Viper","Phoenix"],["Layla","VN","S","Sage","Vyse","Chamber"]]},
  { liga:"CCN", tag:"RA", nome:"Rare Atom", pais:"CN", nivel:2, tecnico:"mikiya", incerto:true, jogadores:[
    ["Guran","CN","F"],["Potter","TH","F"],["nnono","??","F"],["Croudy","??","F"],["Ben1Ley","CN","F"]]},
  { liga:"CCN", tag:"WBG", nome:"Weibo Gaming", pais:"CN", nivel:2, tecnico:"Milan de Meij", incerto:true, jogadores:[
    ["AcMe","KR","F"],["Yoyo","CN","F"],["Satoshi","CN","F"],["heybay","CN","F"],["Leav3u","CN","F"]]}

  ]
};
