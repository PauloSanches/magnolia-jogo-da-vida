'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const artwork=JSON.parse(fs.readFileSync(path.join(root,'editorial/character-artwork.json'),'utf8'));
const source=fs.readFileSync(path.join(root,'docs/app.js'),'utf8');
const data=JSON.parse(source.match(/const DATA=(\[.*?\]),map=/s)[1]);

test('each supplied character is assigned only to its approved stable house ID',()=>{
 assert.deepEqual(artwork.map(row=>row.id),['casa-05','casa-06','casa-07','casa-08','casa-12','casa-netos','casa-11','casa-13','casa-03']);
 for(const row of artwork)assert.equal(data.find(d=>d.id===row.id).avatar,row.asset,row.id);
 assert.equal(data.find(d=>d.id==='casa-04').avatar,'assets/magzinha.webp');
 assert.equal(data.find(d=>d.id==='casa-09').avatar,'assets/mag.webp');
});
test('all delivered assets are hashed transparent PNGs with verified dimensions',()=>{
 for(const row of artwork){
  const bytes=fs.readFileSync(path.join(root,'docs',row.asset));
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(bytes[25],6,'PNG must contain an alpha channel');
  assert.equal(bytes.readUInt32BE(16),row.width);assert.equal(bytes.readUInt32BE(20),row.height);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),row.asset_sha256);
 }
});

test('ninth ordered house uses the supplied couple, not a scenic photograph',()=>{
 const rows=JSON.parse(fs.readFileSync(path.join(root,'docs/milestones.json'),'utf8'));
 assert.equal(rows[8].id,'casa-12');
 assert.equal(rows[8].foto,'');
 assert.match(data.find(d=>d.id===rows[8].id).avatar,/^assets\/character-casa-12-[a-f0-9]+\.png$/);
});

test('tenth ordered house uses the supplied group as its character',()=>{
 const rows=JSON.parse(fs.readFileSync(path.join(root,'docs/milestones.json'),'utf8'));
 assert.equal(rows[9].id,'casa-netos');
 assert.equal(rows[9].foto,'');
 assert.match(data.find(d=>d.id===rows[9].id)?.avatar||'',/^assets\/character-casa-netos-[a-f0-9]+\.png$/);
});

test('eighth ordered house keeps its supplied character beside its photo',()=>{
 const rows=JSON.parse(fs.readFileSync(path.join(root,'docs/milestones.json'),'utf8'));
 assert.equal(rows[7].id,'casa-11');
 assert.equal(rows[7].foto,"https://paulosanches.github.io/magnolia-jogo-da-vida/assets/photo-casa-11-landscape-695b72657f4e.jpg");
 assert.match(data.find(d=>d.id===rows[7].id).avatar,/^assets\/character-casa-11-[a-f0-9]+\.png$/);
});

test('final ordered house uses the supplied celebration character',()=>{
 const rows=JSON.parse(fs.readFileSync(path.join(root,'docs/milestones.json'),'utf8'));
 assert.equal(rows.at(-1).id,'casa-13');assert.equal(rows.at(-1).foto,'');
 assert.match(data.find(d=>d.id==='casa-13').avatar,/^assets\/character-casa-13-[a-f0-9]+\.png$/);
});

test('third ordered house uses supplied family while preserving its side photograph',()=>{
 const rows=JSON.parse(fs.readFileSync(path.join(root,'docs/milestones.json'),'utf8'));
 assert.equal(rows[2].id,'casa-03');assert.equal(rows[2].foto,'https://paulosanches.github.io/magnolia-jogo-da-vida/assets/irmaos-placeholder.jpg');
 assert.match(data.find(d=>d.id==='casa-03').avatar,/^assets\/character-casa-03-[a-f0-9]+\.png$/);
 assert.equal(data.find(d=>d.id==='casa-02').avatar,'assets/littlemag.webp');
});
