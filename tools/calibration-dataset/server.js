// Local-only HTTP server for exporting/importing the detection-calibration
// dataset to/from real files on disk, instead of leaving it trapped in the
// browser's localStorage/IndexedDB (see this folder's README.md for the
// full workflow). Not part of the shipped app - a dev tool, run manually
// with `node server.js` (or via .claude/launch.json's
// "calibration-dataset-server" config).
//
// Photos are stored extensionless (photos/<id>) with no assumption about
// format - each manifest entry carries its own photoContentType, and the
// browser-side import script reconstructs a Blob with that exact type
// rather than guessing from a file extension.
const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'calibration-data');
const PHOTOS_DIR = path.join(DATA_DIR, 'photos');
const MANIFEST_PATH = path.join(DATA_DIR, 'manifest.json');
const PORT = 5680;

fs.mkdirSync(PHOTOS_DIR, { recursive: true });

const sendJson = (res, status, body) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

http
  .createServer(async (req, res) => {
    // CORS preflight - the app runs on a different origin/port.
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    try {
      if (req.method === 'GET' && req.url === '/manifest.json') {
        if (!fs.existsSync(MANIFEST_PATH)) {
          sendJson(res, 200, []);
          return;
        }
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(fs.readFileSync(MANIFEST_PATH));
        return;
      }

      if (req.method === 'POST' && req.url === '/manifest') {
        const body = await readBody(req);
        fs.writeFileSync(MANIFEST_PATH, body);
        sendJson(res, 200, { ok: true });
        return;
      }

      const photoMatch = req.url.match(/^\/photos\/([^/]+)$/);
      if (photoMatch) {
        const id = decodeURIComponent(photoMatch[1]);
        const filePath = path.join(PHOTOS_DIR, id);

        if (req.method === 'GET') {
          if (!fs.existsSync(filePath)) {
            res.writeHead(404);
            res.end('not found');
            return;
          }
          res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Access-Control-Allow-Origin': '*',
          });
          res.end(fs.readFileSync(filePath));
          return;
        }

        if (req.method === 'POST') {
          const body = await readBody(req);
          fs.writeFileSync(filePath, body);
          sendJson(res, 200, { ok: true });
          return;
        }
      }

      res.writeHead(404);
      res.end('not found');
    } catch (error) {
      sendJson(res, 500, { error: String(error) });
    }
  })
  .listen(PORT, () =>
    console.log(`Calibration dataset server on http://localhost:${PORT}`)
  );
