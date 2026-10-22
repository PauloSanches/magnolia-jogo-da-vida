const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'..');
test('backstage is a separate, self-contained case-study route',()=>{
 const page=path.join(root,'docs/backstage/index.html');assert(fs.existsSync(page),'Publish a dedicated /backstage/ page');const html=fs.readFileSync(page,'utf8');
 for(const text of ['Jogo da Vida versão Magnólia','Hermes Agent','MacBook Air M1','Codex','Telegram','GitHub Pages','Google Sheets','A história permanece visível','12 casas'])assert(html.includes(text),text);
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
 assert(html.includes('<strong>ChatGPT:</strong> utilizado pelo criador do projeto para gerar os personagens ilustrados a partir de fotografias. As imagens foram depois preparadas e integradas com o Hermes Agent.'));
});

test('workflow ships the approved script and pinned local Hairline dependency',()=>{
 const html=fs.readFileSync(path.join(root,'docs/backstage/index.html'),'utf8');
 const approved=JSON.parse(fs.readFileSync(path.join(root,'editorial/backstage-approval.json'),'utf8')).workflow_animation;
 for(const step of approved.steps)assert(html.includes('<h3>'+step.title+'</h3><p>'+step.text+'</p>'));
 assert(html.includes('type="module" src="flow-tour.js?v='));assert(html.includes('class="workflow-static"'));assert(html.includes('class="flow-interactive" hidden'));
 const dependency=JSON.parse(fs.readFileSync(path.join(root,'editorial/hairline-dependency.json'),'utf8'));
 assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,dependency.file))).digest('hex'),dependency.sha256);
 assert(fs.readFileSync(path.join(root,dependency.license_file),'utf8').includes('MIT License'));
});
