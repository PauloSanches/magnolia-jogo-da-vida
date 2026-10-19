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
      if ((last.length !== 1 && last.length !== 5) || !last.every(cell => cell === '')) break;
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

  function parse(csv, allowedIds, baseUrl) {
    if (typeof csv !== 'string') throw new TypeError('CSV must be a string');
    const maxBytes = 256 * 1024;
    if (csv.length > maxBytes) throw new Error('CSV exceeds 256KB limit');
    let bytes = 0;
    for (const character of csv) {
      const point = character.codePointAt(0);
      bytes += point <= 0x7F ? 1 : point <= 0x7FF ? 2 : point <= 0xFFFF ? 3 : 4;
      if (bytes > maxBytes) throw new Error('CSV exceeds 256KB limit');
    }
    const rows = readRows(csv);
    const headers = rows.shift();
    const requiredHeaders = ['id', 'ordem', 'titulo', 'texto', 'foto'];
    if (!headers || headers.length !== 5 || new Set(headers).size !== 5 || !requiredHeaders.every(name => headers.includes(name))) {
      throw new Error('Invalid CSV headers');
    }
    if (allowedIds !== null && (!Array.isArray(allowedIds) || allowedIds.some(id => typeof id !== 'string' || !id.trim()) || new Set(allowedIds).size !== allowedIds.length)) {
      throw new Error('Invalid allowedIds');
    }
    const dynamic = allowedIds === null;
    if (dynamic && (rows.length < 1 || rows.length > 100)) throw new Error('Expected 1 to 100 milestones');
    const allowed = new Set(allowedIds || []), seenIds = new Set(), seenOrders = new Set();
    const result = rows.map(row => {
      if (row.length !== 5 || row.every(cell => cell === '')) throw new Error('Invalid CSV row cells');
      const value = name => row[headers.indexOf(name)];
      const id = value('id'), order = value('ordem'), titulo = value('titulo'), texto = value('texto');
      if ((dynamic ? !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(id) : !allowed.has(id)) || seenIds.has(id)) throw new Error('Unknown or duplicate id');
      if (!/^[1-9][0-9]{0,4}$/.test(order) || Number(order) > 10000 || seenOrders.has(Number(order))) {
        throw new Error('Invalid or duplicate ordem');
      }
      if (!titulo.trim() || !texto.trim()) throw new Error('Empty required field');
      if (titulo.length > 180 || texto.length > 10000 || value('foto').length > 2048) {
        throw new Error('Field length exceeds limit');
      }
      seenIds.add(id);
      seenOrders.add(Number(order));
      return {id, ordem: Number(order), titulo, texto, foto: photoUrl(value('foto'), baseUrl)};
    });
    if (!dynamic && seenIds.size !== allowed.size) throw new Error('Missing required id');
    return result.sort((a, b) => a.ordem - b.ordem);
  }

  const api = Object.freeze({parse});
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.MagnoliaSheetData = api;
}());
