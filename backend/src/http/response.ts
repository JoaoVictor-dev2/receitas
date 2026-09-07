import type { ServerResponse } from 'node:http';

export function sendJson(response: ServerResponse, statusCode: number, data: unknown): void {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(data));
}

export function sendNoContent(response: ServerResponse): void {
  response.writeHead(204);
  response.end();
}
