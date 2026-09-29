# VCT Manager 2026

Jogo de manager de Valorant feito em HTML e JavaScript puro, sem precisar instalar nada. Projeto pessoal de fã.

## Como jogar

1. Baixe o repositório (Code → Download ZIP) ou clone com `git clone`.
2. Abra o `index.html` no navegador.
3. Crie seu manager, escolha um time, assine o contrato e use **CONTINUAR** pra avançar os dias.

O progresso fica salvo no próprio navegador. Pra fazer backup, use Configurações → Exportar save.

## O que tem

- Ligas VCT (Americas, EMEA, Pacific, China) e todos os Challengers (Brasil, NA, LATAM, EMEA, Pacific, China).
- Temporada completa: Kickoff, Masters Santiago, Stage 1, Masters London, Stage 2 (com Play-Ins) e Champions.
- Criação de manager com atributos que afetam o jogo.
- Elenco, perfil de jogador, staff, treino por mapa e táticas por mapa, lado e tipo de round.
- Olheiros, mercado, transferências entre times da IA, QG com equipamentos, patrocinadores e finanças.
- Partida com veto, composição e mapa 2D ao vivo com placar de transmissão.

## Arquivos

| Arquivo | Função |
|---|---|
| `index.html` | abre o jogo (estilos e ordem dos scripts) |
| `base-real.js` | times e jogadores (elencos públicos do vlr.gg, set/2026) |
| `engine.js` | simulação, competições, mercado, staff, táticas, finanças |
| `art.js` | avatares, escudos, troféu e mapas 2D gerados em SVG |
| `ui.js` | casca do jogo e telas de gestão |
| `telas.js` | Início, e-mail, estratégias, transferências, QG, patrocinadores, finanças |
| `match.js` | veto, preparação e partida ao vivo |
| `intro.js` | menu inicial, criação de manager, escolha de time e contrato |

## Fotos e escudos próprios

Rostos e escudos são ilustrações geradas pelo jogo. Pra usar imagens suas, coloque:

- `fotos/NICK.png` → jogador
- `fotos/staff/NOME.png` → staff
- `escudos/TAG.png` → time

## Aviso

Projeto de fã sem fins lucrativos. Criado sob a política "Legal Jibber Jabber" da Riot Games usando recursos de propriedade da Riot Games. A Riot Games não endossa nem patrocina este projeto. Os atributos dos jogadores são gerados pelo jogo e não são oficiais. Patrocinadores são marcas inventadas.
