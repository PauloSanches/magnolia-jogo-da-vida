'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const modulePath = path.resolve(__dirname, '../docs/sheet-data.js');
const headers = ['id', 'ordem', 'titulo', 'texto', 'foto'];
const base = 'https://example.org/story/';
const ids = ['casa-01', 'casa-02'];
const first = ['casa-01', '1', 'Título', 'Olá, coração!', ''];
const second = ['casa-02', '2', 'Segundo', 'Memórias', ''];
const csv = (rows, names = headers) => [names, ...rows].map(row => row.map(value => '"' + String(value).replaceAll('"', '""') + '"').join(',')).join('\r\n');
const parse = (...args) => require(modulePath).parse(...args);

test('accepts newly added milestones and removals in dynamic mode without normalizing IDs', () => {
  // Keep the legacy five-column contract independent of the current bundled story.
  const rows=Array.from({length:13},(_,i)=>({id:'casa-'+String(i+1).padStart(2,'0'),ordem:i+1,titulo:'Capítulo '+(i+1),texto:'Memória',foto:''}));
  rows.push({id:'casa14',ordem:14,titulo:'Teste',texto:'Novo marco',foto:''});
  const input=csv(rows.map(row=>headers.map(name=>row[name])));
  const result=parse(input,null,'https://paulosanches.github.io/magnolia-jogo-da-vida/');
  assert.equal(result.length,14);assert.equal(result.at(-1).id,'casa14');assert.equal(result.at(-1).titulo,'Teste');
  assert.equal(parse(csv([first]),null,base).length,1);
  assert.throws(()=>parse(csv([]),null,base));
  for(const id of ['', 'bad id', '../escape', '<script>', 'a'.repeat(65)])assert.throws(()=>parse(csv([[id,...first.slice(1)]]),null,base));
  assert.throws(()=>parse(csv(Array.from({length:101},(_,i)=>['new-'+i,String(i+1),'Title','Text',''])),null,base));
});

test('parses CSV syntax losslessly and sorts rows numerically with reordered headers', () => {
  const names = ['foto', 'texto', 'id', 'titulo', 'ordem'];
  const text = '  Ação, "coração"\r\nOutra linha\n<script>não executar</script>  ';
  const input = '\uFEFF' + csv([
    ['', 'Memórias', 'casa-02', 'Segundo', '10'],
    ['', text, 'casa-01', '  Título português  ', '2']
  ], names) + '\r\n\r\n,,,,\r\n';
  assert.deepEqual(parse(input, ids, base), [
    {id: 'casa-01', ordem: 2, titulo: '  Título português  ', texto: text, foto: ''},
    {id: 'casa-02', ordem: 10, titulo: 'Segundo', texto: 'Memórias', foto: ''}
  ]);
  assert.deepEqual(parse('id,ordem,titulo,texto,foto\ncasa-01,1,Título,Texto,', ['casa-01'], base), [
    {id: 'casa-01', ordem: 1, titulo: 'Título', texto: 'Texto', foto: ''}
  ]);
});

test('canonical six columns preserve optional titles and literal questions with dynamic IDs and order', () => {
  const names = ['pergunta', 'texto', 'foto', 'ordem', 'titulo', 'id'];
  const question = '  Quem, "sabe"?\r\n<script>globalThis.pwned=true</script>  ';
  assert.deepEqual(parse(csv([
    ['Viva meus 58 anos!', 'Final', '', '10', '', 'casa-netos'],
    [question, '  minha história\r\ncontinua  ', 'assets/a.jpg', '2', ' \t ', 'casa14'],
    ['', 'Primeira', '', '1', '', 'casa-01']
  ], names) + '\r\n,,,,,\r\n', null, base), [
    {id:'casa-01',ordem:1,titulo:'',texto:'Primeira',foto:'',pergunta:''},
    {id:'casa14',ordem:2,titulo:' \t ',texto:'  minha história\r\ncontinua  ',foto:base+'assets/a.jpg',pergunta:question},
    {id:'casa-netos',ordem:10,titulo:'',texto:'Final',foto:'',pergunta:'Viva meus 58 anos!'}
  ]);
  assert.equal(globalThis.pwned, undefined);
  const six = [...headers, 'pergunta'];
  assert.equal(parse(csv([[...first, 'q'.repeat(2000)]], six), ids.slice(0,1), base)[0].pergunta.length, 2000);
  for (const [column, value] of [[2,'t'.repeat(181)],[3,' \r\n '],[3,'t'.repeat(10001)],[4,'javascript:alert(1)'],[5,'q'.repeat(2001)]]) {
    const row = [...first, '']; row[column] = value;
    assert.throws(() => parse(csv([row], six), [first[0]], base));
  }
  assert.throws(() => parse(csv([first], six), null, base), /cell/i);
  assert.throws(() => parse(csv([[...first,'']], [...headers,'Pergunta']), null, base), /header/i);
});

test('rejects malformed quoted CSV rather than repairing edits', () => {
  for (const row of ['casa-01,1,Ti"tle,Text,', 'casa-01,1,"Title"oops,Text,', 'casa-01,1,"Title,Text,', 'casa-01,1, "Title",Text,']) {
    assert.throws(() => parse(headers.join(',') + '\n' + row, ['casa-01'], base), /CSV/i, row);
  }
});

test('requires the exact five unique headers and five cells per nonblank row', () => {
  for (const names of [headers.slice(0, 4), [...headers, 'extra'], ['id', 'ordem', 'titulo', 'texto', 'texto'], ['ID', ...headers.slice(1)], [' id', ...headers.slice(1)], ['__proto__', ...headers.slice(1)]]) {
    assert.throws(() => parse(csv([first], names), ['casa-01'], base), /header/i);
  }
  for (const row of [first.slice(0, 4), [...first, 'extra']]) {
    assert.throws(() => parse(csv([row]), ['casa-01'], base), /cell/i);
  }
  assert.throws(() => parse(csv([first]) + '\n,,,,,', ['casa-01'], base), /cell/i);
  assert.throws(() => parse(csv([first, ['', '', '', '', ''], second]), ids, base));
  for (const input of ['', '\uFEFF', '\r\n']) assert.throws(() => parse(input, ids, base), /header/i);
});

test('requires exactly the allowed IDs without normalization and unique positive orders', () => {
  const invalidRows = [[], [first], [first, first], [first, [...second.slice(0, 1), '1', ...second.slice(2)]],
    [first, ['other', ...second.slice(1)]], [first, [' casa-02', ...second.slice(1)]],
    [first, ['CASA-02', ...second.slice(1)]], [first, ['casa-02\u200b', ...second.slice(1)]]];
  for (const rows of invalidRows) assert.throws(() => parse(csv(rows), ids, base));
  for (const order of ['', ' ', '0', '-1', '1.5', '1e2', '+1', ' 1', '1 ', '01', '0x10', 'Infinity', 'NaN', '１００', '10001', '999999999999999999999']) {
    assert.throws(() => parse(csv([[first[0], order, ...first.slice(2)]]), [first[0]], base), /ordem/i, order);
  }
  assert.equal(parse(csv([[first[0], '10000', ...first.slice(2)]]), [first[0]], base)[0].ordem, 10000);
  for (let column = 0; column < 4; column++) {
    for (const empty of ['', ' \t\r\n ']) {
      const row = [...first]; row[column] = empty;
      assert.throws(() => parse(csv([row]), [first[0]], base));
    }
  }
  for (const allowed of [undefined, 'casa-01', [first[0], first[0]], [1], [''], ['   ']]) {
    assert.throws(() => parse(csv([first]), allowed, base), /allowedIds/i);
  }
  assert.deepEqual(parse(csv([]), [], base), []);
  const special = ['__proto__', 'constructor'];
  assert.deepEqual(parse(csv([[special[1], ...second.slice(1)], [special[0], ...first.slice(1)]]), special, base).map(row => row.id), special);
});

test('enforces UTF-8 input byte and field length limits at their boundaries', () => {
  for (const [column, limit] of [[2, 180], [3, 10000], [4, 2048]]) {
    const row = [...first];
    const prefix = column === 4 ? 'https://example.org/' : '';
    row[column] = prefix + 'a'.repeat(limit - prefix.length);
    assert.equal(parse(csv([row]), [first[0]], base)[0][headers[column]].length, limit);
    row[column] += 'a';
    assert.throws(() => parse(csv([row]), [first[0]], base), /length|long|limit/i);
  }
  const small = csv([first]);
  const exact = small + '\n'.repeat(256 * 1024 - Buffer.byteLength(small));
  assert.equal(Buffer.byteLength(exact), 256 * 1024);
  assert.equal(parse(exact, [first[0]], base).length, 1);
  assert.throws(() => parse(exact + '\n', [first[0]], base), /256|large|limit/i);
  const many = Array.from({length: 20}, (_, i) => ['casa-' + i, String(i + 1), 'Título', 'é'.repeat(9000), '']);
  const unicode = csv(many);
  assert.ok(unicode.length < 256 * 1024);
  assert.ok(Buffer.byteLength(unicode) > 256 * 1024);
  assert.throws(() => parse(unicode, many.map(row => row[0]), base), /256|large|limit/i);
  for (const input of [null, undefined, 123, {}, ['id,ordem,titulo,texto,foto']]) {
    assert.throws(() => parse(input, ids, base), /string/i);
  }
});

test('resolves asset photos against baseUrl and accepts safe public HTTPS photos', () => {
  for (const [photo, expected] of [
    ['', ''], ['assets/casa.jpg', base + 'assets/casa.jpg'],
    ['assets/sub/coração.jpg?v=2#foto', base + 'assets/sub/cora%C3%A7%C3%A3o.jpg?v=2#foto'],
    ['https://cdn.example.org/foto.jpg?q=1&x=2', 'https://cdn.example.org/foto.jpg?q=1&x=2'],
    ['https://8.8.8.8/photo.jpg', 'https://8.8.8.8/photo.jpg'],
    ['https://[2606:4700:4700::1111]/photo.jpg', 'https://[2606:4700:4700::1111]/photo.jpg']
  ]) {
    assert.equal(parse(csv([[...first.slice(0, 4), photo]]), [first[0]], base)[0].foto, expected);
  }
  assert.equal(parse(csv([[...first.slice(0, 4), 'assets/a.jpg']]), [first[0]], base + 'index.html')[0].foto, base + 'assets/a.jpg');
});

test('rejects unsafe photo schemes, credentials, authorities and local destinations', () => {
  const unsafe = [
    'javascript:alert(1)', 'data:image/png;base64,AA', 'http://example.org/a.jpg', '//example.org/a.jpg',
    'file:///etc/passwd', 'blob:https://example.org/id', 'https:example.org/a', 'https:///example.org/a',
    'https://user:pass@example.org/a', 'https://user@example.org/a', 'https://:pass@example.org/a',
    'https://localhost/a', 'https://LOCALHOST./a', 'https://foo.localhost/a', 'https://printer.local/a',
    'https://intranet/a', 'https://127.0.0.1/a', 'https://127.1/a', 'https://2130706433/a', 'https://0x7f000001/a',
    'https://10.0.0.1/a', 'https://172.16.0.1/a', 'https://172.31.255.255/a', 'https://192.168.1.1/a',
    'https://169.254.169.254/a', 'https://0.0.0.0/a', 'https://100.64.0.1/a', 'https://224.0.0.1/a',
    'https://[::1]/a', 'https://[::]/a', 'https://[fc00::1]/a', 'https://[fd12::1]/a', 'https://[fe80::1]/a',
    'https://[::ffff:127.0.0.1]/a', 'https://[::ffff:192.168.1.1]/a',
    'https://example.org\\@127.0.0.1/a', 'https://exa\nmple.org/a', ' https://example.org/a',
    'https://example.org/a\u0000', 'https://', 'https://[broken/a', '   ',
    '/assets/a.jpg', './assets/a.jpg', '../assets/a.jpg', 'images/a.jpg', 'assets/../private.jpg',
    'assets/%2e%2e/private.jpg', 'assets/%2F%2Fexample.org/a', 'assets/..\\private.jpg'
  ];
  for (const photo of unsafe) {
    assert.throws(() => parse(csv([[...first.slice(0, 4), photo]]), [first[0]], base), /foto|photo/i, photo);
  }
  for (const badBase of ['http://example.org/', 'https://localhost/', 'https://u:p@example.org/', 'not a URL', undefined]) {
    assert.throws(() => parse(csv([[...first.slice(0, 4), 'assets/a.jpg']]), [first[0]], badBase), /foto|photo/i);
  }
});

test('rejects multicast and deprecated site-local IPv6 photos', () => {
  for (const photo of ['https://[ff02::1]/a', 'https://[fec0::1]/a']) {
    assert.throws(() => parse(csv([[...first.slice(0, 4), photo]]), [first[0]], base), /foto/i, photo);
  }
});

test('all header permutations and rotated 13-row sheets produce identical Node/browser data', () => {
  const allowed = Object.freeze(Array.from({length: 13}, (_, i) => 'casa-' + String(i + 1).padStart(2, '0')));
  const records = allowed.map((id, i) => [id, String(i + 1), 'Capítulo ' + (i + 1), 'Memória "viva",\nPortuguês ' + i, 'assets/' + id + '.jpg']);
  const expected = records.map(row => ({id: row[0], ordem: Number(row[1]), titulo: row[2], texto: row[3], foto: base + row[4]}));
  const permutations = values => values.length === 0 ? [[]] : values.flatMap((value, index) => permutations(values.filter((_, i) => i !== index)).map(tail => [value, ...tail]));
  const context = {window: {}, URL};
  vm.runInNewContext(fs.readFileSync(modulePath, 'utf8'), context);
  const allHeaders = permutations(headers);
  assert.equal(allHeaders.length, 120);
  for (const [index, names] of allHeaders.entries()) {
    const offset = index % records.length;
    const shuffled = [...records.slice(offset), ...records.slice(0, offset)].reverse();
    const input = csv(shuffled.map(row => names.map(name => row[headers.indexOf(name)])), names);
    assert.deepEqual(parse(input, allowed, base), expected);
    assert.deepEqual(JSON.parse(JSON.stringify(context.window.MagnoliaSheetData.parse(input, allowed, base))), expected);
  }
});

test('keeps untrusted markup, formulas, Unicode and quotes as inert literal strings', () => {
  const literals = ['"', '""', ',', '\r\nlinha', 'ação e maçã', '🪻🧡', '=HYPERLINK("https://example.org")', '<img src=x onerror="globalThis.pwned=true">', '__proto__', ' null\u0000 fim '];
  for (const literal of literals) {
    const result = parse(csv([[first[0], '1', literal, literal, '']]), [first[0]], base);
    assert.equal(result[0].titulo, literal);
    assert.equal(result[0].texto, literal);
  }
  assert.equal(globalThis.pwned, undefined);
});

test('failed edits never leak partial results or change later parses', () => {
  const input = csv([second, first]);
  const original = parse(input, ids, base);
  assert.throws(() => parse(csv([first, [...second.slice(0, 4), 'javascript:alert(1)']]), ids, base));
  const again = parse(input, ids, base);
  assert.deepEqual(again, original);
  assert.notEqual(again, original);
  assert.notEqual(again[0], original[0]);
});

test('counts three- and four-byte characters toward the input byte budget', () => {
  for (const character of ['界', '😀']) {
    const rows = Array.from({length: 30}, (_, i) => ['id-' + i, String(i + 1), 'Título', character.repeat(4000), '']);
    const input = csv(rows);
    assert.ok(input.length < 256 * 1024);
    assert.ok(Buffer.byteLength(input) > 256 * 1024);
    assert.throws(() => parse(input, rows.map(row => row[0]), base), /256KB/);
    assert.equal(parse(csv(rows.slice(0, 1)), ['id-0'], base)[0].texto, rows[0][3]);
  }
});

test('exports a frozen parse API to Node and browser without dependencies', () => {
  assert.ok(fs.existsSync(modulePath), 'CSV validation module must exist');
  const api = require(modulePath);
  assert.equal(typeof api.parse, 'function');
  assert.ok(Object.isFrozen(api));
  const context = {window: {}, URL};
  vm.runInNewContext(fs.readFileSync(modulePath, 'utf8'), context);
  assert.equal(typeof context.window.MagnoliaSheetData.parse, 'function');
  assert.ok(Object.isFrozen(context.window.MagnoliaSheetData));
});
