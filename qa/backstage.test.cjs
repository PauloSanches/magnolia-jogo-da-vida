const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'..');
test('backstage is a separate, self-contained case-study route',()=>{
 const page=path.join(root,'docs/backstage/index.html');assert(fs.existsSync(page),'Publish a dedicated /backstage/ page');const html=fs.readFileSync(page,'utf8');
 for(const text of ['Uma homenagem que virou software','Hermes Agent','MacBook Air M1','Codex','Telegram','GitHub Pages','Google Sheets','A história continua visível','12 casas'])assert(html.includes(text),text);
 assert(html.includes('href="../"'));assert(html.includes('lang="pt-BR"'));assert(!html.includes('src="../app.js'));assert(!html.includes('/Users/'));assert(!/gh[pousr]_[A-Za-z0-9]{20}/.test(html));
 for(const id of ['jogo','ferramentas','sistema','fluxo','atualizacao','engenharia'])assert(html.includes('id="'+id+'"'));
 for(const src of [...html.matchAll(/(?:src|href)="([^"?#]+)(?:[?#][^"]*)?"/g)].map(m=>m[1]).filter(s=>!s.startsWith('http')&&!s.startsWith('#')))assert(fs.existsSync(path.resolve(path.dirname(page),src)),src);
});

test('backstage has an engineering layout distinct from the illustrated game',()=>{
 const html=fs.readFileSync(path.join(root,'docs/backstage/index.html'),'utf8'),css=fs.readFileSync(path.join(root,'docs/backstage/backstage.css'),'utf8');
 assert(html.includes('class="contents"'),'Provide section navigation for the technical case');
 assert(!css.includes('DynaPuff'),'Keep playful game display type out of the technical page');
 assert(css.includes('--surface:#ffffff'),'Use a neutral reading surface');assert(css.includes('position:sticky'),'Keep desktop section navigation available');
 assert(!css.includes('50% 50%'),'Remove the organic screenshot surround');
});

test('credits ChatGPT for photo-based character creation with approved copy',()=>{
 const html=fs.readFileSync(path.join(root,'docs/backstage/index.html'),'utf8');
 assert(html.includes('<dt>ChatGPT</dt><dd>Foi utilizado pelo criador do projeto para gerar os personagens ilustrados a partir de fotografias. As imagens resultantes foram depois preparadas e integradas ao tabuleiro com o Hermes Agent.</dd>'));
});
