import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';

test('production server serves browser modules with a JavaScript MIME type', { timeout: 10000 }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'expotec-server-test-'));
  let server;
  try {
    await mkdir(join(directory, 'out'));
    await writeFile(join(directory, 'out/index.html'), '<!doctype html>');
    for (const extension of ['js', 'mjs']) {
      await writeFile(join(directory, `out/module.${extension}`), 'export const ready = true;');
    }
    server = spawn(process.execPath, [fileURLToPath(new URL('../scripts/serve.mjs', import.meta.url))], {
      cwd: directory, env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'],
    });
    const url = await new Promise((resolve, reject) => {
      let output = '';
      server.on('error', reject);
      server.on('exit', code => reject(new Error(`Server exited: ${code}`)));
      server.stdout.on('data', chunk => {
        output += chunk;
        const match = output.match(/Local: (http:\/\/localhost:\d+)/);
        if (match) resolve(match[1]);
      });
    });
    for (const extension of ['js', 'mjs']) {
      const response = await fetch(`${url}/module.${extension}`);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /^text\/javascript\b/);
      assert.equal(await response.text(), 'export const ready = true;');
    }
  } finally {
    if (server && server.exitCode === null) {
      const stopped = once(server, 'exit');
      server.kill();
      await stopped;
    }
    await rm(directory, { recursive: true, force: true });
  }
});
