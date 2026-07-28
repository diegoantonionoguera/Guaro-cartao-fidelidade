import { spawn } from 'node:child_process';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const root = new URL('..', import.meta.url);
const port = process.env.QUALITY_PORT || '4176';
const baseUrl = `http://127.0.0.1:${port}`;
const nodeCommand = process.execPath;
const lighthouseCli = fileURLToPath(
  new URL('node_modules/@lhci/cli/src/cli.js', root)
);

function spawnProcess(command, args, options = {}) {
  return spawn(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
    ...options
  });
}

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('O servidor de qualidade não iniciou dentro de 30 segundos.');
}

async function authenticate() {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: baseUrl
    },
    body: JSON.stringify({
      username: 'quality-admin',
      password: 'Quality-Only-Password-2026!'
    })
  });
  if (!response.ok) {
    throw new Error(`Falha ao autenticar o Lighthouse: HTTP ${response.status}.`);
  }
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) throw new Error('O servidor não retornou o cookie de sessão.');
  return setCookie.split(';', 1)[0];
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', code => resolve(code ?? 1));
  });
}

const server = spawnProcess(nodeCommand, ['scripts/start-quality-server.mjs'], {
  env: { ...process.env, QUALITY_PORT: port }
});

let exitCode = 1;
try {
  await waitForServer();
  const cookie = await authenticate();
  const lighthouse = spawnProcess(
    nodeCommand,
    [lighthouseCli, 'autorun', '--config=./lighthouserc.cjs'],
    {
      env: {
        ...process.env,
        CHROME_PATH: process.env.CHROME_PATH || chromium.executablePath(),
        LHCI_AUTH_COOKIE: cookie
      }
    }
  );
  exitCode = await waitForExit(lighthouse);
} finally {
  server.kill();
}

process.exitCode = exitCode;
