import { chmod, mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', env: process.env });
    const stop = (signal) => child.kill(signal);
    process.once('SIGTERM', stop);
    process.once('SIGINT', stop);
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      process.removeListener('SIGTERM', stop);
      process.removeListener('SIGINT', stop);
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with ${code ?? signal}`));
    });
  });
}

await run('npm', ['run', 'db:local:migrate']);

const secretFile = new URL('../dist/server/.dev.vars', import.meta.url);
await mkdir(new URL('../dist/server/', import.meta.url), { recursive: true });
const bindings = [
  'RESEND_API_KEY',
  'JFCARS_FROM_EMAIL',
  'JFCARS_REPLY_TO_EMAIL',
  'JFCARS_CONTACT_EMAIL',
  'JFCARS_SALES_EMAIL',
  'JFCARS_ADMIN_EMAIL',
  'JFCARS_INFO_EMAIL',
  'JFCARS_PUBLIC_URL',
]
  .filter((key) => process.env[key])
  .map((key) => `${key}=${JSON.stringify(process.env[key])}`)
  .join('\n');
await writeFile(secretFile, `${bindings}\n`, { mode: 0o600 });
await chmod(secretFile, 0o600);

await run('wrangler', [
  'dev',
  '--config',
  'dist/server/wrangler.json',
  '--persist-to',
  '/app/.wrangler/state',
  '--ip',
  '0.0.0.0',
  '--port',
  '3000',
]);
