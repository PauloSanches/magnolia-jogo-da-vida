const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const plain=s=>s.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/\s+/g,' ').trim();
const expected=fs.readFileSync(path.join(root,'editorial/backstage-case-approved.md'),'utf8').trim().split(/\n\s*\n/).flatMap(block=>{
 if(block.startsWith('**Ações:**'))return [];
 return block.startsWith('- ')?block.split('\n'):block.split('\n').every(line=>line.startsWith('#'))?block.split('\n'):[block];
}).map(s=>plain(s.replace(/^#{1,3} /,'').replace(/^- /,'').replace(/\*\*|`|\*/g,'')));
test('published case preserves every approved heading, paragraph and list item in order',()=>{
 const html=fs.readFileSync(path.join(root,'docs/backstage/index.html'),'utf8');
 const actual=[...html.matchAll(/<(h[123]|p|li)\b[^>]*\bdata-case-copy\b[^>]*>([\s\S]*?)<\/\1>/g)].map(m=>plain(m[2]));
 assert.deepEqual(actual,expected);
 for(const id of ['jogo','desafio','jornada','fluxo','sistema','ferramentas','engenharia','resultado','aprendizados','impacto'])assert(html.includes('id="'+id+'"'),id);
 assert(!html.includes('223.861.635'),'Do not turn mixed-session tokens into project metrics');
 assert(!html.includes('Nota editorial:'),'Do not publish chat-only editorial notes');
});
