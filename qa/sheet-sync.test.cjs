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
