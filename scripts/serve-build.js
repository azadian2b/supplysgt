const fs = require('fs');
const http = require('http');
const path = require('path');

const args = process.argv.slice(2);
const portFlagIndex = args.indexOf('--port');
const port = Number(
  portFlagIndex >= 0 ? args[portFlagIndex + 1] : process.env.PORT || 4173
);
const host = process.env.HOST || '127.0.0.1';
const root = path.resolve(__dirname, '..', 'build');

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.error('Missing build/index.html. Run the production build before serving.');
  process.exit(1);
}

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent((request.url || '/').split('?')[0]);
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const resolvedPath = path.resolve(root, `.${requestedPath}`);

  if (!resolvedPath.startsWith(root)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  fs.readFile(resolvedPath, (error, data) => {
    if (error) {
      fs.readFile(path.join(root, 'index.html'), (fallbackError, fallbackData) => {
        if (fallbackError) {
          response.writeHead(404);
          response.end('Not found');
          return;
        }

        response.writeHead(200, { 'Content-Type': contentTypes['.html'] });
        response.end(fallbackData);
      });
      return;
    }

    const extension = path.extname(resolvedPath);
    response.writeHead(200, {
      'Content-Type': contentTypes[extension] || 'application/octet-stream'
    });
    response.end(data);
  });
});

server.listen(port, host, () => {
  console.log(`Serving ${root} at http://${host}:${port}`);
});
