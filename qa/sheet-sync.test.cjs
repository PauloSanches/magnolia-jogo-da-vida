'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

test('cached startup photos cannot overwrite a newer focus refresh',async()=>{
 const applied=[],handlers={},stored=[];
 let releaseImage,fetches=0;
 const imageReady=new Promise(resolve=>{releaseImage=resolve});
 const rows={cached:[{id:'one',ordem:1,titulo:'cached-old',texto:'old',foto:'https://example.org/photo.jpg'}],network:[{id:'one',ordem:1,titulo:'network-new',texto:'new',foto:''}]};
 const context={URL,AbortController,Date,Promise,Error,JSON,setTimeout,clearTimeout,setInterval:()=>1,clearInterval(){},
  document:{hidden:false,addEventListener(name,fn){handlers[name]=fn},removeEventListener(){}},
  addEventListener(name,fn){handlers[name]=fn},removeEventListener(){},
  localStorage:{getItem(){return 'cached'},setItem(key,value){stored.push(value)}},
  Image:class{decode(){return imageReady}},
  async fetch(){fetches++;if(fetches>1)throw Error('offline');return {ok:true,text:async()=>'network'}},
  MagnoliaSheetData:{parse(value){return rows[value]}}
 };
 context.window=context;vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../docs/sheet-sync.js'),'utf8'),context);
 const sync=context.MagnoliaSheetSync.start({source:'https://example.org/source.csv',allowedIds:null,baseUrl:'https://example.org/',initial:[{id:'one',ordem:1,titulo:'fallback',texto:'fallback',foto:''}],onRows(data){applied.push(data[0].titulo)},isMoving:()=>false});
 handlers.focus();
 await new Promise(resolve=>setImmediate(resolve));
 releaseImage();
 await sync.refresh();
 assert.deepEqual(applied,['cached-old','network-new']);
 assert.equal(applied.at(-1),'network-new');
 assert.equal(stored.at(-1),'network');
 assert.equal(context.__contentState.status,'error');
 sync.stop();
});

function harness({cached = new Map(), responses = [], data = require('../docs/sheet-data.js')} = {}) {
 const applied=[],reads=[],writes=[],requests=[];
 const context={URL,AbortController,Date,Promise,Error,JSON,setTimeout,clearTimeout,setInterval:()=>1,clearInterval(){},
  document:{hidden:false,addEventListener(){},removeEventListener(){}},addEventListener(){},removeEventListener(){},
  localStorage:{getItem(key){reads.push(key);return cached.get(key)||null},setItem(key,value){writes.push([key,value]);cached.set(key,value)}},
  Image:class{async decode(){}},
  async fetch(url,options){requests.push({url,options});const value=responses.shift();if(value instanceof Error)throw value;return {ok:true,text:async()=>value}},
  MagnoliaSheetData:data
 };
 context.window=context;vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../docs/sheet-sync.js'),'utf8'),context);
 const initial=[{id:'one',ordem:1,titulo:'Fallback',texto:'Bundled',foto:'',pergunta:''}];
 const options={source:'https://example.org/source.csv',allowedIds:null,baseUrl:'https://example.org/',initial,onRows(rows){applied.push(rows)},isMoving:()=>false};
 return {context,options,applied,reads,writes,requests};
}

test('injected content parser and cache namespace apply to cached and fetched CSV; invalid edits retain last good rows',async()=>{
 const source='https://example.org/source.csv',key='magnolia-approved-v2:'+source;
 const cached='id,ordem,titulo,texto,foto\n,,,Cached story,Who?';
 const canonical='id,ordem,titulo,texto,foto,pergunta\nnew,3,,Network story,,Viva!';
 const bad='id,ordem,titulo,texto,foto\nold,1,Old,Do not fall back,';
 const fixture=harness({cached:new Map([[key,cached],['magnolia-sheet-v1:'+source,bad]]),responses:[canonical,bad]});
 const calls=[],api=require('../docs/sheet-data.js');
 const sync=fixture.context.MagnoliaSheetSync.start({...fixture.options,cachePrefix:'magnolia-approved-v2:',
  parseRows(csv,allowedIds,baseUrl){calls.push(csv);return api.parseContent(csv,{startRow:2,ids:['one'],photos:['']},baseUrl)}
 });
 try {
  await sync.refresh();
  assert.deepEqual(fixture.reads,[key]);
  assert.deepEqual(calls,[cached,canonical,bad]);
  assert.deepEqual(fixture.applied.map(rows=>[rows[0].id,rows[0].titulo,rows[0].texto,rows[0].pergunta]),[
   ['one','','Cached story','Who?'],['new','','Network story','Viva!']
  ]);
  assert.deepEqual(fixture.writes,[[key,cached],[key,canonical]]);
  assert.equal(fixture.context.__contentState.status,'error');
  assert.match(fixture.context.__contentState.error,/metadata|blank/i);
  for(const request of fixture.requests){
   assert.equal(new URL(request.url).origin+new URL(request.url).pathname,source);
   assert.equal(request.options.credentials,'omit');assert.equal(request.options.cache,'no-store');assert.equal(request.options.referrerPolicy,'no-referrer');
  }
 } finally {sync.stop()}
});

test('default parser and cache key stay backwards compatible',async()=>{
 const input='id,ordem,titulo,texto,foto\none,1,Legacy,Story,';
 const fixture=harness({responses:[input,input]});
 const sync=fixture.context.MagnoliaSheetSync.start(fixture.options);
 try {
  await sync.refresh();
  assert.deepEqual(fixture.reads,['magnolia-sheet-v1:'+fixture.options.source]);
  assert.deepEqual(fixture.writes,[['magnolia-sheet-v1:'+fixture.options.source,input]]);
  assert.equal(fixture.applied.length,1);
  assert.equal(fixture.applied[0][0].titulo,'Legacy');
  assert.equal(Object.hasOwn(fixture.applied[0][0],'pergunta'),false);
  assert.equal(fixture.context.__contentState.status,'synced');
 } finally {sync.stop()}
});

test('injected parser preserves pending-motion and invalid-cache fallback behavior',async()=>{
 const fixture=harness({cached:new Map([['draft:https://example.org/source.csv','invalid']]),responses:['next','next']});
 let moving=true;
 const next=[{...fixture.options.initial[0],texto:'Next',pergunta:'Question'}];
 const sync=fixture.context.MagnoliaSheetSync.start({...fixture.options,cachePrefix:'draft:',isMoving:()=>moving,
  parseRows(csv){if(csv==='invalid')throw Error('Invalid cached draft');return next}
 });
 try {
  await sync.refresh();
  assert.equal(fixture.context.__contentState.status,'pending');assert.equal(fixture.applied.length,0);assert.equal(fixture.writes.length,0);
  moving=false;sync.flush();
  assert.deepEqual(fixture.applied,[next]);
  assert.deepEqual(fixture.writes,[['draft:'+fixture.options.source,'next']]);
  assert.equal(fixture.context.__contentState.status,'synced');
 } finally {sync.stop()}
});
