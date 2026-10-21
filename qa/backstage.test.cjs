const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'..');
test('backstage is a separate, self-contained case-study route',()=>{
 const page=path.join(root,'docs/backstage/index.html');assert(fs.existsSync(page),'Publish a dedicated /backstage/ page');const html=fs.readFileSync(page,'utf8');
 for(const text of ['Uma homenagem que virou software','Hermes Agent','MacBook Air M1','Codex','Telegram','GitHub Pages','Google Sheets','A história continua visível','12 casas'])assert(html.includes(text),text);
 assert(html.includes('href="../"'));assert(html.includes('lang="pt-BR"'));assert(!html.includes('src="../app.js'));assert(!html.includes('/Users/'));assert(!/gh[pousr]_[A-Za-z0-9]{20}/.test(html));
 for(const id of ['jogo','ferramentas','sistema','fluxo','atualizacao','engenharia'])assert(html.includes('id="'+id+'"'));
 for(const src of [...html.matchAll(/(?:src|href)="([^"?#]+)(?:[?#][^"]*)?"/g)].map(m=>m[1]).filter(s=>!s.startsWith('http')&&!s.startsWith('#')))assert(fs.existsSync(path.resolve(path.dirname(page),src)),src);
});
