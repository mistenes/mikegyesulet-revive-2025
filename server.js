import http from 'node:http';

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Render API placeholder', databaseUrlConfigured: Boolean(process.env.DATABASE_URL) }));
});

server.listen(PORT, () => {
  console.log(`Placeholder API listening on port ${PORT}`);
});
