import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import type { TestProject } from 'vitest/node';

const execute = promisify(execFile);

declare module 'vitest' {
  export interface ProvidedContext {
    mysqlPort: number;
  }
}

export default async function setup(project: TestProject) {
  const projectName = `receitas-e2e-${process.pid}-${randomUUID().slice(0, 8)}`;
  const composeFile = fileURLToPath(new URL('../../../compose.e2e.yaml', import.meta.url));
  const args = ['compose', '-p', projectName, '-f', composeFile];
  const cleanup = async () => {
    await execute('docker', [...args, 'down', '--volumes'], { timeout: 30_000 });
  };

  try {
    await execute('docker', [...args, 'up', '-d', '--wait', '--wait-timeout', '120', 'mysql'], {
      timeout: 150_000,
    });
    const { stdout } = await execute('docker', [...args, 'port', 'mysql', '3306']);
    const port = Number(stdout.trim().split(':').at(-1));
    if (!Number.isInteger(port) || port < 1) throw new Error('Porta do MySQL de teste não encontrada.');
    project.provide('mysqlPort', port);
  } catch (error) {
    const logs = await execute('docker', [...args, 'logs', '--tail', '60', 'mysql']).catch(() => null);
    if (logs) console.error(logs.stdout);
    await cleanup();
    throw error;
  }

  return cleanup;
}
