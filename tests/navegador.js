/* Teste opcional no navegador: npm i -D playwright && npx playwright install chromium && node tests/navegador.js */
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { console.log('Playwright não instalado — pulando teste de navegador.'); process.exit(0); }
const path = require('path'); const URL = 'file://' + path.join(__dirname, '..', 'index.html');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1366,height:900} });
  const errs=[]; p.on('pageerror', e=>errs.push('PAGEERR '+e.message+' | '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  await p.goto(URL); await p.waitForTimeout(400);
  await p.click('[data-a=iNovoSlot]'); await p.fill('[data-mgr=nick]','popssg'); await p.click('[data-a=iMgrOk]');
  await p.click('.orgc[data-a=iStep]'); await p.click('[data-a=iSel][data-v=LOUD]'); await p.click('[data-a=iAssinarTime]');
  { const bx = await p.locator('#sig').boundingBox(); await p.mouse.move(bx.x+10,bx.y+40); await p.mouse.down(); for (let i=0;i<20;i++) await p.mouse.move(bx.x+10+i*12,bx.y+40+(i%2)*20); await p.mouse.up(); }
  await p.click('#sigok'); await p.waitForTimeout(2900);
  const TABS=['perfilAba','elencoModo','treinoAba','mAba','trAba','cAba','tacAba','statOrd','ligaSel','statLiga'];
  async function tabs(tag){
    for (const a of TABS){ const vs = await p.$$eval(`[data-a=${a}]`, els=>els.map(e=>e.dataset.v)); for (const v of [...new Set(vs)]) { await p.click(`[data-a=${a}][data-v="${v}"]`).catch(()=>{}); await p.waitForTimeout(60); } }
  }
  const views = await p.$$eval('[data-a=nav]', els=>[...new Set(els.map(e=>e.dataset.v))]);
  for (const v of views){ await p.click(`[data-a=nav][data-v=${v}]`).catch(e=>errs.push('nav '+v)); await p.waitForTimeout(100); await tabs(v); }
  // funções
  await p.click('[data-a=nav][data-v=elenco]'); await p.click('[data-a=elencoModo][data-v=funcoes]');
  const sel = await p.$('select[data-c=setFuncao]'); if (sel) { const o = await sel.$$eval('option', os=>os.map(x=>x.value)); await sel.selectOption(o[o.length-1]); } else errs.push('no setFuncao select');
  // aprender agente
  await p.click('[data-a=nav][data-v=treino]'); await p.click('[data-a=treinoAba][data-v=agentes]').catch(()=>errs.push('no agentes tab'));
  const al = await p.$('select[data-c=aprenderAgente]'); if (al) { const o = await al.$$eval('option', os=>os.map(x=>x.value).filter(Boolean)); await al.selectOption(o[0]); } else errs.push('no aprenderAgente');
  
  // rede de olheiros
  await p.click('[data-a=nav][data-v=mercado]'); await p.click('[data-a=mAba][data-v=rede]').catch(()=>errs.push('no rede'));
  const sr = await p.$('[data-c=scoutReg]'); if (sr) { const tag = await sr.evaluate(e=>e.tagName); if (tag==='SELECT'){ const o=await sr.$$eval('option',os=>os.map(x=>x.value).filter(Boolean)); await sr.selectOption(o[0]); } else await sr.click(); } else errs.push('no scoutReg');
  
  // negociação com outro clube
  const pid = await p.evaluate(()=>{ const t=Object.values(VM.S.teams).find(t=>t.id!==VM.S.userTeam && t.liga===VM.T(VM.S.userTeam).liga); return t.roster[0]; });
  await p.evaluate(pid=>GUI.ACT.perfil(pid), pid); await p.waitForTimeout(100);
  const pabas = await p.$$eval('[data-a=perfilAba]', els=>els.map(e=>e.dataset.v));
  for (const v of pabas){ await p.click(`[data-a=perfilAba][data-v=${v}]`); await p.waitForTimeout(60); }
  await p.click('[data-a=perfilAba][data-v=contrato]').catch(()=>errs.push('no contrato tab'));
  const tipos = await p.$$eval('[data-a=cnTipo]', els=>els.map(e=>e.dataset.v));
  for (const t of tipos){ await p.click(`[data-a=cnTipo][data-v=${t}]`); await p.click('[data-a=cnEnviar]').catch(()=>{}); await p.waitForTimeout(80); }
  const negRes = await p.evaluate(()=>JSON.stringify(GUI.UI.cneg||null));
  // próprio jogador: conversa
  const own = await p.evaluate(()=>VM.T(VM.S.userTeam).roster[0]);
  await p.evaluate(pid=>GUI.ACT.perfil(pid), own);
  for (const v of await p.$$eval('[data-a=perfilAba]', els=>els.map(e=>e.dataset.v))){ await p.click(`[data-a=perfilAba][data-v=${v}]`); await p.waitForTimeout(60); }
  const falar = await p.$$('[data-a=falar]'); if (falar.length) await falar[0].click();
  // dicas
  const dica = await p.$('[data-a=dicaOk]');
  console.log(errs.length ? '✗ navegador\n' + errs.join('\n') : '✓ navegador — todas as telas abriram sem erro'); if (errs.length) process.exitCode = 1;
  await b.close();
})();
