const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8765;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache, no-store, must-revalidate' });
    res.end(content);
  } catch (e) {
    if (e.code === 'ENOENT') { res.writeHead(404); res.end('404 Not Found'); }
    else { res.writeHead(500); res.end('500 Internal Server Error'); }
  }
}

function fetchUrl(url, cb) {
  const lib = url.startsWith('https') ? https : http;
  const agent = new lib.Agent({ keepAlive: true, rejectUnauthorized: false });
  lib.get(url, { agent, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      fetchUrl(res.headers.location, cb);
      return;
    }
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => cb(null, data, res.statusCode));
  }).on('error', err => cb(err, null, 0));
}

function proxySheets(req, res, query) {
  const sheetId = query.sheetId || query.sheetid;
  const gid = query.gid || '0';
  if (!sheetId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing sheetId' }));
    return;
  }

  // Try gviz first (no redirect, simple GET)
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
  console.log('[proxy] Trying gviz:', gvizUrl);

  fetchUrl(gvizUrl, (err, data) => {
    if (!err && data && data.trim()) {
      console.log('[proxy] gviz OK —', data.length, 'bytes');
      res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end(data);
      return;
    }
    console.log('[proxy] gviz failed:', err ? err.message : 'empty');

    // Fallback: export URL (307 redirect)
    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    console.log('[proxy] Trying export:', exportUrl);
    fetchUrl(exportUrl, (err2, data2) => {
      if (!err2 && data2 && data2.trim()) {
        console.log('[proxy] export OK —', data2.length, 'bytes');
        res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
        res.end(data2);
        return;
      }
      console.log('[proxy] export failed:', err2 ? err2.message : 'empty');

      // Last: pub URL
      const pubUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/pub?output=csv&gid=${gid}`;
      console.log('[proxy] Trying pub:', pubUrl);
      fetchUrl(pubUrl, (err3, data3) => {
        if (!err3 && data3 && data3.trim()) {
          console.log('[proxy] pub OK —', data3.length, 'bytes');
          res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
          res.end(data3);
          return;
        }
        console.log('[proxy] ALL FAILED');
        res.writeHead(502, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({
          error: 'all_endpoints_failed',
          gviz: err ? err.message : 'empty',
          export: err2 ? err2.message : 'empty',
          pub: err3 ? err3.message : 'empty',
        }));
      });
    });
  });
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url, `http://${req.headers.host}`);

  if (u.pathname === '/api/sheets') {
    return proxySheets(req, res, Object.fromEntries(u.searchParams));
  }

  let filePath = path.join(ROOT, u.pathname === '/' ? 'index.html' : u.pathname.replace(/^\/+/, ''));
  serveFile(res, filePath);
});

server.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}/`);
  console.log(`Monthly orders: http://localhost:${PORT}/stores/monthly-orders.html`);
});
