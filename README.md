# VCT Manager 2026

Jogo de manager de Valorant feito em HTML e JavaScript puro, sem precisar instalar nada. Projeto pessoal de fã.

## Como jogar

1. Baixe o repositório (Code → Download ZIP) ou clone com `git clone`.
2. Abra o `index.html` no navegador.
3. Crie seu manager, escolha um time, assine o contrato e use **CONTINUAR** pra avançar os dias.

O progresso fica salvo no próprio navegador. Pra fazer backup, use Configurações → Exportar save.

## O que tem

- Ligas VCT (Americas, EMEA, Pacific, China) e todos os Challengers (Brasil, NA, LATAM, EMEA, Pacific, China).
- Temporada completa: Kickoff, Masters Santiago, Stage 1, Masters London, Stage 2 (com Play-Ins) e Champions — e carreira de várias temporadas.
- 4 dificuldades (Fácil, Normal, Difícil, Pesadelo): força e inteligência da IA, dinheiro, lesões, preços e paciência da diretoria.
- Criação de manager com atributos que afetam o jogo, ou criação de uma organização própria.
- Elenco, perfil de jogador, conversas, renovação negociada (salário, anos, multa rescisória), staff, academia de jovens.
- Treino por mapa e estratégias por mapa, lado e tipo de round; scrims que revelam as tendências do adversário.
- Olheiros, mercado, transferências entre times da IA, QG com equipamentos, patrocinadores e finanças.
- Diretoria com confiança, demissão e propostas de outros clubes.
- Patches que mudam a força dos agentes, rotação do map pool, aposentadorias, novos talentos e hall da fama.
- Partida com veto, composição e mapa 2D ao vivo: cone de visão, utilitárias, tiros, spike com timer, kill feed e câmera que segue a ação.
- Sons e música gerados pelo navegador.
- Formatos do VCT 2026: Kickoff em tripla eliminação, Play-Ins de 12 times em dupla eliminação, playoffs com os diretos na chave superior.
- Economia por jogador (créditos, armas, drops, armas salvas) e pontos de ultimate, com controle Auto/Guardar/Usar agora.
- Estrutura própria em cada mapa (teleportes da Bind, meio da Split, três sites da Haven e da Lotus…) que muda o que funciona.
- Negociação com clubes: compra com contraproposta, empréstimo, multa rescisória e propostas recebidas.
- 3 espaços de save, estatísticas avançadas (ADR, KAST, FK/FD, clutches) e relatório round a round.
- Aprender agentes, funções táticas (IGL, entry, lurker, âncora, suporte), imprensa, torcida, rede de olheiros e dicas no jogo.
- Partida ao vivo ajustada pra celular.

## Estrutura

```
index.html          estrutura da página
css/
  base.css          cores, reset, botões, tabelas, avatares
  layout.css        menu lateral, topo e área principal
  telas.css         telas de gestão
  partida.css       veto, preparação e partida ao vivo
  responsivo.css    ajustes para telas menores
  entrada.css       menu inicial, criar manager, contrato
  tema-manager.css  visual estilo manager, QG, patrocínio, finanças
  carreira.css      diretoria, conversas, academia, hall da fama, meta
js/
  sfx.js            sons e música (Web Audio, sem arquivos)
  base-real.js      times e jogadores (elencos públicos do vlr.gg, set/2026)
  engine.js         simulação, competições, mercado, staff, táticas, finanças
  art.js            avatares, escudos, troféu e mapas 2D gerados em SVG
  ui.js             casca do jogo e telas de gestão
  telas.js          Início, e-mail, estratégias, transferências, QG, patrocinadores, finanças
  match.js          veto, preparação e partida ao vivo
  carreira.js       diretoria, conversas, contrato, academia, hall da fama
  intro.js          menu inicial, criação de manager/organização, escolha de time e contrato
tests/              testes automáticos do motor (e um opcional no navegador)
fotos/, escudos/    imagens opcionais suas
```

Os estilos carregam na ordem do `index.html` — os de baixo sobrescrevem os de cima, então mantenha essa ordem.

## Testes

Precisa só do Node.js (18 ou mais novo):

```
npm test
```

Roda sem navegador: duas temporadas inteiras conferindo formatos (Kickoff, Play-Ins, Champions), elencos e caixa; economia e ultimates em 150 mapas; negociação, saves e funções; e se a dificuldade fortalece só a IA.

Teste opcional no navegador (abre todas as telas e procura erros):

```
npm i -D playwright
npx playwright install chromium
npm run test:navegador
```

## Fotos e escudos próprios

Rostos e escudos são ilustrações geradas pelo jogo. Pra usar imagens suas, coloque:

- `fotos/NICK.png` → jogador
- `fotos/staff/NOME.png` → staff
- `escudos/TAG.png` → time

## Aviso

Projeto de fã sem fins lucrativos. Criado sob a política "Legal Jibber Jabber" da Riot Games usando recursos de propriedade da Riot Games. A Riot Games não endossa nem patrocina este projeto. Os atributos dos jogadores são gerados pelo jogo e não são oficiais. Patrocinadores são marcas inventadas.
