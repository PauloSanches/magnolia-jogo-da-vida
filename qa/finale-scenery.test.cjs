const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
test('the approved final-house scenery is a hash-verified transparent PNG, not a replacement avatar',()=>{
 const art=JSON.parse(fs.readFileSync(path.join(root,'editorial/finale-scenery.json'),'utf8'));
 const rows=JSON.parse(fs.readFileSync(path.join(root,'docs/milestones.json'),'utf8'));
 assert.equal(art.id,rows.at(-1).id);assert.equal(art.kind,'scenery');assert.equal(art.background_removal_authorized,true);assert.equal(rows.at(-1).foto,'');assert.equal(rows.at(-1).pergunta,'');
 const bytes=fs.readFileSync(path.join(root,'docs',art.asset));
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(bytes[25],6);assert.equal(bytes.readUInt32BE(16),art.width);assert.equal(bytes.readUInt32BE(20),art.height);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),art.sha256);
 const app=fs.readFileSync(path.join(root,'docs/app.js'),'utf8');assert(app.includes(art.asset));assert(app.includes('assets/character-casa-13-a09313b62126.png'));
});
