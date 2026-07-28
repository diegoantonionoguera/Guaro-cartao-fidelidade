import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { test } from 'node:test';

const port = 43117;
const baseUrl = `http://127.0.0.1:${port}`;
let server;

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // O processo ainda está iniciando.
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Servidor de teste não iniciou.');
}

test.before(async () => {
  server = spawn(process.execPath, ['server.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(port),
      ADMIN_USER: 'security-admin',
      ADMIN_PASSWORD: 'correct-horse-battery-staple',
      REDEMPTION_CODE_SECRET: 'security-test-secret-with-more-than-32-characters',
      GOOGLE_SHEETS_ID: '',
      GOOGLE_SERVICE_ACCOUNT_EMAIL: '',
      GOOGLE_PRIVATE_KEY: ''
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  await waitForServer();
});

test.after(() => {
  if (server && !server.killed) server.kill();
});

test('envia cabeçalhos de segurança e protege estado sem sessão', async () => {
  const health = await fetch(`${baseUrl}/api/health`);
  assert.equal(health.status, 200);
  assert.equal(health.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(health.headers.get('x-frame-options'), 'DENY');
  const contentSecurityPolicy = health.headers.get('content-security-policy') || '';
  assert.match(contentSecurityPolicy, /frame-ancestors 'none'/);
  assert.match(contentSecurityPolicy, /object-src 'none'/);
  assert.doesNotMatch(contentSecurityPolicy, /style-src[^;]*'unsafe-inline'/);

  const state = await fetch(`${baseUrl}/api/state`);
  assert.equal(state.status, 401);
});

test('exige CSRF nas operações autenticadas', async () => {
  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'security-admin', password: 'correct-horse-battery-staple' })
  });
  assert.equal(login.status, 200);
  const data = await login.json();
  const cookie = login.headers.get('set-cookie').split(';')[0];
  assert.ok(data.csrfToken);

  const withoutToken = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { cookie }
  });
  assert.equal(withoutToken.status, 403);

  const withToken = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { cookie, 'x-csrf-token': data.csrfToken }
  });
  assert.equal(withToken.status, 204);
});

test('bloqueia força bruta após cinco tentativas', async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'security-admin', password: `wrong-${attempt}` })
    });
    assert.equal(response.status, 401);
  }
  const blocked = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'security-admin', password: 'still-wrong' })
  });
  assert.equal(blocked.status, 429);
});
