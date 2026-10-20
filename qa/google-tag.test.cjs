'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../docs/index.html'),'utf8');
test('the supplied Google tag occurs once in head and loads asynchronously',()=>{
 const head=html.match(/<head>([\s\S]*?)<\/head>/)[1];
 const loaders=[...html.matchAll(/<script\b[^>]*src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-HTS7E9BXDD"[^>]*>/g)];
 assert.equal(loaders.length,1);assert.match(loaders[0][0],/\basync\b/);assert(head.includes(loaders[0][0]));
 const inline=[...head.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(s=>s.includes("gtag('config', 'G-HTS7E9BXDD')"));
 assert.equal(inline.length,1);
 const context={};context.window=context;vm.runInNewContext(inline[0],context);
 assert.equal(typeof context.gtag,'function');assert.equal(context.dataLayer.length,2);
 assert.equal(context.dataLayer[0][0],'js');assert.equal(Object.prototype.toString.call(context.dataLayer[0][1]),'[object Date]');
 assert.deepEqual(Array.from(context.dataLayer[1]),['config','G-HTS7E9BXDD']);
});
