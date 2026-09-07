import { createServer } from 'node:http';
import { createApp } from './app.ts';

const app = createApp();
const server = createServer(app.handler);
server.listen(app.port, '0.0.0.0', () => {
  console.log(`API disponível em http://localhost:${app.port}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => server.close(() => void app.close()));
}
