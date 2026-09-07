import type { IncomingMessage } from 'node:http';
import { AppError } from '../errors/app-error.ts';

const maxBodyBytes = 1024 * 1024;

export async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const contentType = request.headers['content-type']?.split(';')[0]?.trim().toLowerCase();
  if (contentType !== 'application/json') {
    throw new AppError('Utilize Content-Type: application/json.', 415);
  }

  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    length += buffer.length;
    if (length > maxBodyBytes) {
      request.resume();
      throw new AppError('O corpo da requisição excede 1 MiB.', 413);
    }
    chunks.push(buffer);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw new AppError('JSON inválido.', 400);
  }
}
