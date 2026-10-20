'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const api = require('../docs/sheet-data.js');
const base = 'https://example.org/story/';
const headers = ['id', 'ordem', 'titulo', 'texto', 'foto'];
const csv = (rows, names = headers) => [names, ...rows].map(row => row.map(value => '"' + String(value).replaceAll('"', '""') + '"').join(',')).join('\r\n');
// Snapshot of the approved source: old 13, four blank rows, draft at sheet rows 19–30.
const source = "id,ordem,titulo,texto,foto\r\ncasa-01,1,Jogo da Vida - Versão Magnólia,\"Hoje eu faço 58 anos. E resolveram transformar minha vida num jogo! Quero ver quem conhece essa história tão bem quanto eu. Vem comigo: dessa vez, sou eu quem vai contar.\",\r\ncasa-02,2,Tudo começou em Alagoas.,\"Nasci em Alagoas, filha de Olívia e Agnaldo. Cresci entre Porto da Rua, Tatuamunha e Porto de Pedras.\",https://paulosanches.github.io/magnolia-jogo-da-vida/assets/alagoas.webp\r\ncasa-03,3,A terceira da turma,\"Somos cinco irmãos: Rico, Monquinha, eu, Najila e Chuchu. Fui a terceira a chegar.\",https://paulosanches.github.io/magnolia-jogo-da-vida/assets/irmaos-placeholder.jpg\r\ncasa-04,4,\"Recife, lá fui eu!\",\"Ainda adolescente, me mudei com a família para Recife, em busca de uma vida melhor. Saí de Alagoas e fui conhecer outro lugar para chamar de casa. Recife ia ganhar bastante espaço na minha história.\",https://paulosanches.github.io/magnolia-jogo-da-vida/assets/recife.webp\r\ncasa-05,5,Meu paquera da escola,\"Em Recife, teve escola e também teve um paquera que entrou na história. Sim, meninas, a mãe de vocês também teve seus namoricos!\",\r\ncasa-06,6,Meu casamento aos 17,Eu me casei aos 17 anos. Essa foi uma das primeiras grandes mudanças da minha vida. E ainda vinha tanta coisa pela frente!,\r\ncasa-07,7,Daniela me fez mãe,\"Primeiro veio Daniela. Foi com você, minha filha, que eu virei mãe. Até aqui, eu estava contando como filha e irmã. A partir da sua chegada, minha história passou a incluir a nossa.\",\r\ncasa-08,8,\"Três anos depois, Dedey\",\"Três anos depois de Daniela, chegou Dedey. Minha segunda menina! Dedey, você tem uma casa só sua aqui, porque essa chegada merece ser contada direitinho. Agora eu era mãe de duas.\",https://paulosanches.github.io/magnolia-jogo-da-vida/assets/dedey-baby.webp\r\ncasa-09,9,Com a avó e o primo,\"Daniela e Dedey ficavam com minha mãe, Olívia, junto do primo Leo. Minhas meninas cresceram com a avó e o primo fazendo parte do dia a dia. Essa lembrança também merece um lugar aqui.\",\r\ncasa-10,10,Nós três no Arruda,\"Eu e minhas meninas fomos morar no Arruda. Daniela, Dedey e eu: nós três, em mais um endereço da nossa história. Filhas, essa parte também é de vocês.\",\r\ncasa-11,11,Nossa temporada no Curado,\"Depois, fomos para o Curado, morar com minha mãe e meu irmão Chuchu. Passamos alguns anos por lá. Quando falo do Curado, lembro dessa época em família, com as meninas crescendo perto da avó e do tio.\",\r\ncasa-12,12,\"Em 1996, eu e Ruston\",\"Eu trabalhava no hospital, e Ruston era o advogado de lá. Em 1996, começamos a sair. E eu, que já tinha duas filhas, também tinha um namoro pra contar. Mãe também namora, minha gente!\",\r\ncasa-13,13,Agora vem comemorar comigo!,\"Cheguei aos 58 e quero aproveitar meu aniversário com vocês. Tenho carinho por tanta gente que faz parte da minha vida, e ainda tenho planos, viu? Quero rir mais, fazer o que gosto e continuar juntando histórias com a minha família. Agora vem comemorar comigo!\",\r\n,,,,\r\n,,,,\r\n,,,,\r\n,,,,\r\n,,Jogo da Vida,Hoje é meu aniversário. E resolveram transformar minha vida num jogo! ,\r\n,,,\"Nasci em Alagoas, filha de Olivia e Agnaldo. Cresci entre Marechal e muitas férias na usina. Segundo a minha mãe eu nasci como um espirro.\",Quem escolheu meu nome?\r\n,,,\"Somos cinco irmãos: Rico, Monquinha, eu (Mag), Najila e João. Fui a terceira a chegar.\",Quem sabe a história que da maleta de ferro?\r\n,,,\"Mudamos para o Recife, em busca de uma vida melhor. Lugar que será palco da minha história.\",Quem sabe o nome da escola onde estudamos?\r\n,,,\"Em Recife, teve escola e também teve um paquera que entrou na história. Sim, meninas, a mãe de vocês também teve seus namoricos!\",Quem sabe o nome do meu primeiro namorado?\r\n,,Que seja eterno enquanto...,Eu me casei aos 17 anos. Essa foi uma das primeiras grandes mudanças da minha vida. E ainda vinha tanta coisa pela frente!,Qual é o meu nome de casada?\r\n,,,\"Primeiro veio Daniele. Foi com você, minha filha, que eu virei mãe.Em seguida veio sua irmão Dedey.\",Quais datas de nascimentos das meninas?\r\n,,,Com o fim do casamento fomos morar com a minhã mãe e meu irmão João.,Qual história apareceu no rádio?\r\n,,,\"Depois de um tempo reencontrei o amor, meu eterno 44.\",Quem foi o nosso cupido?\r\n,,,\"Com pouco mais de 35 anos fui avó, Gabriel, meu primeiro dos 6 netos.\",Quem sabe a ordem dos meu netos?\r\n,,,\"Depois dos 40 encontrei meu proposito, entender e ajudar o desenvolvimento das crianças.\",Quem sabe o nome da minha profissão?\r\n,,,Mudar é o verdo presente da minha vida. E hoje é o recomeço parte da minha biografia.,Viva meus 58 anos!";
const approved = [["", "", "Jogo da Vida", "Hoje é meu aniversário. E resolveram transformar minha vida num jogo! ", ""], ["", "", "", "Nasci em Alagoas, filha de Olivia e Agnaldo. Cresci entre Marechal e muitas férias na usina. Segundo a minha mãe eu nasci como um espirro.", "Quem escolheu meu nome?"], ["", "", "", "Somos cinco irmãos: Rico, Monquinha, eu (Mag), Najila e João. Fui a terceira a chegar.", "Quem sabe a história que da maleta de ferro?"], ["", "", "", "Mudamos para o Recife, em busca de uma vida melhor. Lugar que será palco da minha história.", "Quem sabe o nome da escola onde estudamos?"], ["", "", "", "Em Recife, teve escola e também teve um paquera que entrou na história. Sim, meninas, a mãe de vocês também teve seus namoricos!", "Quem sabe o nome do meu primeiro namorado?"], ["", "", "Que seja eterno enquanto...", "Eu me casei aos 17 anos. Essa foi uma das primeiras grandes mudanças da minha vida. E ainda vinha tanta coisa pela frente!", "Qual é o meu nome de casada?"], ["", "", "", "Primeiro veio Daniele. Foi com você, minha filha, que eu virei mãe.Em seguida veio sua irmão Dedey.", "Quais datas de nascimentos das meninas?"], ["", "", "", "Com o fim do casamento fomos morar com a minhã mãe e meu irmão João.", "Qual história apareceu no rádio?"], ["", "", "", "Depois de um tempo reencontrei o amor, meu eterno 44.", "Quem foi o nosso cupido?"], ["", "", "", "Com pouco mais de 35 anos fui avó, Gabriel, meu primeiro dos 6 netos.", "Quem sabe a ordem dos meu netos?"], ["", "", "", "Depois dos 40 encontrei meu proposito, entender e ajudar o desenvolvimento das crianças.", "Quem sabe o nome da minha profissão?"], ["", "", "", "Mudar é o verdo presente da minha vida. E hoje é o recomeço parte da minha biografia.", "Viva meus 58 anos!"]];
const config = Object.freeze({startRow:19,
  ids:Object.freeze(['casa-01','casa-02','casa-03','casa-04','casa-05','casa-06','casa-08','casa-11','casa-12','casa-netos','casa-profissao','casa-13']),
  photos:Object.freeze(['','assets/alagoas.webp','assets/irmaos-placeholder.jpg','assets/recife.webp','','','assets/dedey-baby.webp','','','','',''])
});
const smallConfig = {startRow:2,ids:['one'],photos:['']};
const draft = (title = '', text = 'História', question = '') => ['', '', title, text, question];

test('draft mapping is bounded and rejects changed counts, nonblank metadata, and invalid configuration', () => {
  for (const rows of [approved.slice(1), [...approved, draft()], [draft()], []]) {
    assert.throws(() => api.parseDraft(csv(rows), {...config,startRow:2}, base), /count/i);
  }
  for (const column of [0, 1]) for (const value of ['old-id', '1', ' ', '\t', '\r\n']) {
    const row = draft(); row[column] = value;
    assert.throws(() => api.parseDraft(csv([row]), smallConfig, base), /metadata|blank/i);
  }
  for (const bad of [undefined, null, {}, {ids:['one'],photos:['']},
    ...[0,1,-1,2.5,'2',NaN,Infinity,Number.MAX_SAFE_INTEGER+1].map(startRow => ({...smallConfig,startRow})),
    ...[[],[''],[' one'],['bad id'],['x'.repeat(65)],['one','one'],[1],new Array(1),Array.from({length:101},(_,i)=>'id-'+i)].map(ids => ({...smallConfig,ids,photos:ids.map(()=> '')})),
    ...[[],['',''],[null],[42],new Array(1),''].map(photos => ({...smallConfig,photos}))]) {
    assert.throws(() => api.parseDraft(csv([draft()]), bad, base), /config/i);
  }
  for (const row of [draft().slice(0,4), [...draft(),'extra'], ['','','','','',''], ['','']]) {
    assert.throws(() => api.parseDraft(csv([row, draft()]), smallConfig, base), /cell/i);
  }
  for (const names of [headers.slice(1), [...headers,'pergunta'], ['id','ordem','titulo','texto','texto'], ['ID',...headers.slice(1)]]) {
    assert.throws(() => api.parseDraft(csv([draft()], names), smallConfig, base), /header/i);
  }
});

test('draft row selection counts CSV records, skips only blank rows, and preserves multiline literal fields', () => {
  const literal = '  <img src=x onerror="globalThis.pwned=true">\r\n=HYPERLINK("x"), minhã  ';
  const names = ['foto','texto','ordem','id','titulo'];
  const input = '\uFEFF' + csv([
    ['legacy', 'a multiline\r\nstory before the start row', '1', 'old', 'Old'],
    [literal, literal, '', '', ' \t '],
    ['', '', '', '', ''],
    ['', 'Second', '', '', '']
  ], names) + '\r\n\r\n,,,,\r\n';
  const rows = api.parseDraft(input, {startRow:3,ids:['casa14','casa-14'],photos:['','']}, base);
  assert.deepEqual(rows, [
    {id:'casa14',ordem:1,titulo:' \t ',texto:literal,foto:'',pergunta:literal},
    {id:'casa-14',ordem:2,titulo:'',texto:'Second',foto:'',pergunta:''}
  ]);
  assert.equal(globalThis.pwned, undefined);
  assert.throws(() => api.parseDraft(csv([draft(),['','','',' ','']]), smallConfig, base));
  const rows100 = Array.from({length:100}, () => draft());
  assert.equal(api.parseDraft(csv(rows100), {startRow:2,ids:rows100.map((_,i)=>'id-'+i),photos:rows100.map(()=> '')}, base).length, 100);
});

test('draft fields and actual configured photos retain the shared limits and safety checks', () => {
  for (const [column,limit] of [[2,180],[3,10000],[4,2000]]) {
    const row = draft(); row[column] = 'a'.repeat(limit);
    assert.equal(api.parseDraft(csv([row]), smallConfig, base)[0][{2:'titulo',3:'texto',4:'pergunta'}[column]].length, limit);
    row[column] += 'a';
    assert.throws(() => api.parseDraft(csv([row]), smallConfig, base), /length|limit/i);
  }
  for (const text of ['', ' \t\r\n']) assert.throws(() => api.parseDraft(csv([draft('',text)]), smallConfig, base));
  for (const foto of ['javascript:alert(1)','http://example.org/a','https://localhost/a','https://127.1/a','https://u:p@example.org/a','assets/%2e%2e/a','assets/../a','https://example.org/'+'a'.repeat(2048)]) {
    assert.throws(() => api.parseDraft(csv([draft()]), {...smallConfig,photos:[foto]}, base), /foto|length|limit/i);
  }
  assert.equal(api.parseDraft(csv([draft('','Text','javascript:alert(1)')]), smallConfig, base)[0].pergunta, 'javascript:alert(1)');
  const small = csv([draft()]);
  const exact = small + '\n'.repeat(256*1024 - Buffer.byteLength(small));
  assert.equal(api.parseDraft(exact, smallConfig, base).length, 1);
  assert.throws(() => api.parseDraft(exact+'\n', smallConfig, base), /256KB/);
  const unicode = csv(Array.from({length:30},()=>draft('', '界'.repeat(4000))));
  assert.ok(unicode.length < 256*1024 && Buffer.byteLength(unicode) > 256*1024);
  assert.throws(() => api.parseDraft(unicode, config, base), /256KB/);
  for (const value of [null,{},1]) assert.throws(() => api.parseDraft(value, config, base), /string/i);
  assert.throws(() => api.parseDraft('id,ordem,titulo,texto,foto\n,,,"unclosed,', smallConfig, base), /CSV/i);
});

test('content dispatch uses canonical dynamic IDs or only the configured draft, never old structured rows', () => {
  assert.deepEqual(api.parseContent(source, config, base), api.parseDraft(source, config, base));
  const canonical = csv([
    ['new-id','10','','  New story  ','','Viva!'],
    ['casa14','2','Title','Second','assets/a.jpg','']
  ], [...headers, 'pergunta']);
  assert.deepEqual(api.parseContent(canonical, config, base), api.parse(canonical, null, base));
  assert.deepEqual(api.parseContent(canonical, undefined, base).map(row=>row.id), ['casa14','new-id']);
  const reordered = csv([['','Story','','','1','new']], ['pergunta','texto','foto','titulo','ordem','id']);
  assert.equal(api.parseContent(reordered, config, base)[0].id, 'new');
  const oldOnly = csv(Array.from({length:13},(_,i)=>['old-'+i,String(i+1),'Title','Story','']));
  assert.throws(() => api.parseContent(oldOnly, config, base), /count/i);
  assert.throws(() => api.parseContent(oldOnly, {startRow:2,ids:Array.from({length:13},(_,i)=>'old-'+i),photos:Array(13).fill('')}, base), /metadata|blank/i);
  assert.throws(() => api.parseContent(csv([draft()]), undefined, base), /config/i);
  assert.throws(() => api.parseContent(csv([['new','1','','Story','','q']], [...headers,'pergunta','extra']), config, base), /header/i);
  assert.throws(() => api.parseContent(csv([['new','1','','Story','','q'.repeat(2001)]], [...headers,'pergunta']), config, base), /limit/i);
  assert.throws(() => api.parseContent(csv([draft()], [...headers,'Pergunta']), config, base), /header/i);
});

test('all three frozen exports produce identical Node and browser records', () => {
  const context = {window:{},URL};
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../docs/sheet-data.js'),'utf8'), context);
  const browser = context.window.MagnoliaSheetData;
  for (const exported of [api,browser]) {
    assert.ok(Object.isFrozen(exported));
    assert.deepEqual(Object.keys(exported).sort(), ['parse','parseContent','parseDraft']);
    for (const name of ['parseDraft','parseContent']) {
      assert.equal(typeof exported[name], 'function');
      assert.deepEqual(JSON.parse(JSON.stringify(exported[name](source,config,base))), api.parseDraft(source,config,base));
    }
  }
});

test('approved row-19 adapter returns only the exact 12 literal stories and question cards', () => {
  const rows = api.parseDraft(source, config, base);
  assert.equal(rows.length, 12);
  assert.deepEqual(rows, approved.map((row, i) => ({id:config.ids[i], ordem:i+1,
    titulo:row[2], texto:row[3], pergunta:row[4], foto:config.photos[i] ? base+config.photos[i] : ''})));
  assert.equal(rows[0].texto, 'Hoje é meu aniversário. E resolveram transformar minha vida num jogo! ');
  assert.equal(rows[0].pergunta, '');
  assert.equal(rows.filter(row => row.titulo === '').length, 10);
  assert.equal(rows[2].pergunta, 'Quem sabe a história que da maleta de ferro?');
  assert.equal(rows[6].texto, 'Primeiro veio Daniele. Foi com você, minha filha, que eu virei mãe.Em seguida veio sua irmão Dedey.');
  assert.equal(rows[7].texto, 'Com o fim do casamento fomos morar com a minhã mãe e meu irmão João.');
  assert.equal(rows.at(-1).pergunta, 'Viva meus 58 anos!');
  assert.equal(rows.at(-1).texto, 'Mudar é o verdo presente da minha vida. E hoje é o recomeço parte da minha biografia.');
});

test('explicit sequential-order compatibility preserves positional IDs without accepting reorders', () => {
  const numbered=approved.map((row,i)=>row.map((cell,j)=>j===1?String(i+1):cell));
  const input=csv(numbered), opted={...config,startRow:2,allowSequentialOrder:true};
  assert.deepEqual(api.parseDraft(input,opted,base),api.parseDraft(csv(approved),{...config,startRow:2},base));
  assert.throws(()=>api.parseDraft(input,{...config,startRow:2},base),/metadata|blank/i);
  for(const order of ['', '0','2','01',' 1','1 ', 'abc']){
    const changed=numbered.map(row=>row.slice());changed[0][1]=order;
    assert.throws(()=>api.parseDraft(csv(changed),opted,base),/metadata|blank/i);
  }
  const withId=numbered.map(row=>row.slice());withId[0][0]='unexpected-id';
  assert.throws(()=>api.parseDraft(csv(withId),opted,base),/metadata|blank/i);
  assert.throws(()=>api.parseDraft(input,{...opted,allowSequentialOrder:'true'},base),/config/i);
});
