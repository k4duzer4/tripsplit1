import http from 'node:http';
import handler from './app.js';

const server = http.createServer(handler);
server.listen(Number(process.env.PORT || 3001), () => {
  console.log(`Trip Split API running at http://localhost:${server.address().port}`);
});
