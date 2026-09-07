import type { ServerResponse } from 'node:http';
import { ZodError } from 'zod';
import { sendJson } from '../http/response.ts';
import { AppError } from './app-error.ts';

export function handleError(error: unknown, response: ServerResponse): void {
  if (response.destroyed || response.writableEnded) return;
  if (response.headersSent) {
    response.destroy();
    return;
  }
  if (error instanceof AppError) {
    sendJson(response, error.statusCode, { message: error.message });
    return;
  }
  if (error instanceof ZodError) {
    sendJson(response, 400, {
      message: 'Dados inválidos.',
      errors: error.issues.map(({ path, message }) => ({ field: path.join('.'), message })),
    });
    return;
  }
  console.error('Erro inesperado na requisição:', error);
  sendJson(response, 500, { message: 'Erro interno do servidor.' });
}
