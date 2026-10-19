(function () {
  'use strict';

  // parse(csv, allowedIds: string[] | null (dynamic IDs), baseUrl): throws on any invalid sheet.
  // Returns fresh records with numeric ordem and resolved absolute foto URLs.
  // Other fields are literal strings, never markup; render them with textContent.
  // Input limit is UTF-8 bytes; field limits use JavaScript string length.

  function readRows(csv) {
    const rows = [];
    let row = [], field = '', state = 'start';
    for (let i = csv.charCodeAt(0) === 0xFEFF ? 1 : 0; i < csv.length; i++) {
      const ch = csv[i];
      if (state === 'quoted') {
        if (ch !== '"') field += ch;
        else if (csv[i + 1] === '"') { field += '"'; i++; }
        else state = 'closed';
      } else if (ch === ',' || ch === '\r' || ch === '\n') {
        row.push(field);
        field = '';
        state = 'start';
        if (ch !== ',') {
          rows.push(row);
          row = [];
          if (ch === '\r' && csv[i + 1] === '\n') i++;
        }
      } else if (ch === '"' && state === 'start') {
        state = 'quoted';
      } else {
        if (ch === '"' || state === 'closed') throw new Error('Invalid CSV quote');
        field += ch;
        state = 'plain';
      }
    }
    if (state === 'quoted') throw new Error('Unclosed CSV quote');
    row.push(field);
    rows.push(row);
    while (rows.length) {
      const last = rows[rows.length - 1];
      if ((last.length !== 1 && last.length !== rows[0].length) || !last.every(cell => cell === '')) break;
      rows.pop();
    }
    return rows;
  }

  // URL checks are lexical: this module performs no DNS lookup or network fetch.
  function localHost(hostname) {
    const host = hostname.toLowerCase().replace(/\.+$/, '');
    if (host.startsWith('[')) {
      const address = host.slice(1, -1);
      return address.startsWith('::') || /^(fc|fd|fe[89abcdef]|ff)/i.test(address);
    }
    if (!host.includes('.') || /(^|\.)(localhost|local|internal)$/.test(host)) return true;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      const [a, b] = host.split('.').map(Number);
      return a === 0 || a === 10 || a === 127 || a >= 224 ||
        (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) ||
        (a === 198 && (b === 18 || b === 19));
    }
    return false;
  }

  function photoUrl(photo, baseUrl) {
    if (photo === '') return '';
    try {
      if (/[\u0000-\u0020\u007F\\]/.test(photo)) throw new Error();
      let url;
      if (photo.startsWith('assets/')) {
        // Reject encoded separators and traversal before WHATWG URL normalizes them.
        const pathname = photo.split(/[?#]/, 1)[0];
        if (/%2f|%5c/i.test(pathname) || decodeURIComponent(pathname).split('/').includes('..')) throw new Error();
        url = new URL(photo, baseUrl);
      } else {
        if (!/^https:\/\/[^/]/i.test(photo)) throw new Error();
        url = new URL(photo);
      }
      if (url.protocol !== 'https:' || url.username || url.password || localHost(url.hostname)) throw new Error();
      return url.href;
    } catch (_) {
      throw new Error('Unsafe or invalid foto URL');
    }
  }

  function readCsv(csv) {
    if (typeof csv !== 'string') throw new TypeError('CSV must be a string');
    const maxBytes = 256 * 1024;
    if (csv.length > maxBytes) throw new Error('CSV exceeds 256KB limit');
    let bytes = 0;
    for (const character of csv) {
      const point = character.codePointAt(0);
      bytes += point <= 0x7F ? 1 : point <= 0x7FF ? 2 : point <= 0xFFFF ? 3 : 4;
      if (bytes > maxBytes) throw new Error('CSV exceeds 256KB limit');
    }
    return readRows(csv);
  }

  function validateHeaders(headers, questions) {
    const requiredHeaders = ['id', 'ordem', 'titulo', 'texto', 'foto', ...(questions ? ['pergunta'] : [])];
    if (!headers || headers.length !== requiredHeaders.length || new Set(headers).size !== requiredHeaders.length || !requiredHeaders.every(name => headers.includes(name))) {
      throw new Error('Invalid CSV headers');
    }
  }

  function parseRows(rows, headers, allowedIds, baseUrl, questions) {
    if (allowedIds !== null && (!Array.isArray(allowedIds) || allowedIds.some(id => typeof id !== 'string' || !id.trim()) || new Set(allowedIds).size !== allowedIds.length)) {
      throw new Error('Invalid allowedIds');
    }
    const dynamic = allowedIds === null;
    if (dynamic && (rows.length < 1 || rows.length > 100)) throw new Error('Expected 1 to 100 milestones');
    const allowed = new Set(allowedIds || []), seenIds = new Set(), seenOrders = new Set();
    const result = rows.map(row => {
      if (row.length !== headers.length || row.every(cell => cell === '')) throw new Error('Invalid CSV row cells');
      const value = name => row[headers.indexOf(name)];
      const id = value('id'), order = value('ordem'), titulo = value('titulo'), texto = value('texto');
      if ((dynamic ? !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(id) : !allowed.has(id)) || seenIds.has(id)) throw new Error('Unknown or duplicate id');
      if (!/^[1-9][0-9]{0,4}$/.test(order) || Number(order) > 10000 || seenOrders.has(Number(order))) {
        throw new Error('Invalid or duplicate ordem');
      }
      if ((!questions && !titulo.trim()) || !texto.trim()) throw new Error('Empty required field');
      if (titulo.length > 180 || texto.length > 10000 || value('foto').length > 2048 || (questions && value('pergunta').length > 2000)) {
        throw new Error('Field length exceeds limit');
      }
      seenIds.add(id);
      seenOrders.add(Number(order));
      const record = {id, ordem: Number(order), titulo, texto, foto: photoUrl(value('foto'), baseUrl)};
      if (questions) record.pergunta = value('pergunta');
      return record;
    });
    if (!dynamic && seenIds.size !== allowed.size) throw new Error('Missing required id');
    return result.sort((a, b) => a.ordem - b.ordem);
  }

  function parse(csv, allowedIds, baseUrl) {
    const rows = readCsv(csv), headers = rows.shift();
    const questions = !!headers && headers.includes('pergunta');
    validateHeaders(headers, questions);
    return parseRows(rows, headers, allowedIds, baseUrl, questions);
  }

  function draftRows(rows, config, baseUrl) {
    const headers = rows[0];
    validateHeaders(headers, false);
    if (!config || !Number.isSafeInteger(config.startRow) || config.startRow < 2 ||
        !Array.isArray(config.ids) || config.ids.length < 1 || config.ids.length > 100 ||
        Array.from(config.ids).some(id => typeof id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(id)) ||
        new Set(config.ids).size !== config.ids.length || !Array.isArray(config.photos) ||
        config.photos.length !== config.ids.length || Array.from(config.photos).some(photo => typeof photo !== 'string')) {
      throw new Error('Invalid draft config');
    }
    const selected = rows.slice(config.startRow - 1).filter(row => {
      if (row.length === 1 && row[0] === '') return false;
      if (row.length !== 5) throw new Error('Invalid CSV row cells');
      return !row.every(cell => cell === '');
    });
    if (selected.length !== config.ids.length) throw new Error('Draft row count does not match configured IDs');
    const mapped = selected.map((row, index) => {
      const value = name => row[headers.indexOf(name)];
      if (value('id') !== '' || value('ordem') !== '') throw new Error('Draft id and ordem metadata must be blank');
      return [config.ids[index], String(index + 1), value('titulo'), value('texto'), config.photos[index], value('foto')];
    });
    return parseRows(mapped, ['id', 'ordem', 'titulo', 'texto', 'foto', 'pergunta'], null, baseUrl, true);
  }

  // Transitional read-only mapping: source foto cells are question text, not URLs.
  function parseDraft(csv, config, baseUrl) {
    return draftRows(readCsv(csv), config, baseUrl);
  }

  // Canonical sheets own their IDs/order; five-column sheets must use the draft adapter.
  // Never silently fall back to the superseded structured records above startRow.
  function parseContent(csv, config, baseUrl) {
    const rows = readCsv(csv), headers = rows[0];
    if (headers && headers.includes('pergunta')) {
      validateHeaders(headers, true);
      return parseRows(rows.slice(1), headers, null, baseUrl, true);
    }
    return draftRows(rows, config, baseUrl);
  }

  const api = Object.freeze({parse, parseDraft, parseContent});
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.MagnoliaSheetData = api;
}());
