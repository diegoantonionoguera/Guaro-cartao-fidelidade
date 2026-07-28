import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
let vite;
let store;
let renderManagerPanel;
let renderModals;
let renderNavbar;
let renderToast;
const originalFetch = globalThis.fetch;

test.before(async () => {
  globalThis.fetch = async () => new Response('{}', {
    status: 401,
    headers: { 'content-type': 'application/json' }
  });
  vite = await createServer({
    root,
    configFile: false,
    appType: 'custom',
    logLevel: 'silent',
    optimizeDeps: { noDiscovery: true },
    server: {
      hmr: false,
      middlewareMode: true
    }
  });
  ({ store } = await vite.ssrLoadModule('/src/store.js'));
  ({ renderManagerPanel } = await vite.ssrLoadModule('/src/ui/managerPanel.js'));
  ({ renderModals } = await vite.ssrLoadModule('/src/ui/modals.js'));
  ({ renderNavbar } = await vite.ssrLoadModule('/src/ui/navbar.js'));
  ({ renderToast } = await vite.ssrLoadModule('/src/ui/toast.js'));
});

test.after(async () => {
  globalThis.fetch = originalFetch;
  await vite?.close();
});

test('renderers expose stable motion hooks without legacy loops', () => {
  const snapshot = {
    currentUser: store.currentUser,
    transactions: store.transactions,
    activeModal: store.activeModal,
    managerSubTab: store.managerSubTab
  };
  try {
    store.currentUser = { id: 'manager-1', nome: 'Gerente', perfil: 'gerente', cotaDiariaPontos: 1000 };
    store.managerSubTab = 'usuarios';
    store.transactions = [{ id: 'tx-1', status: 'pendente', dataHora: new Date().toISOString() }];

    const navbar = renderNavbar({ animatePendingBadge: true });
    assert.match(navbar, /data-status-badge="pending"[^>]*status-badge-change/);
    assert.doesNotMatch(navbar, /btn-sms-drawer-toggle|data-status-badge="messages"/);
    assert.doesNotMatch(navbar, /\banimate-pulse\b/);

    const manager = renderManagerPanel({
      animatePanelEntrance: true,
      animateTeamCardsEntrance: true
    });
    assert.match(manager, /manager-hero surface-enter/);

    store.activeModal = 'new-client';
    const modal = renderModals();
    assert.match(modal, /data-modal-layer/);
    assert.match(modal, /data-modal-panel/);

    const toast = renderToast({ id: 7, message: 'Teste', type: 'success' });
    assert.match(toast, /data-toast-id="7"/);
    assert.match(toast, /data-state="entering"/);
  } finally {
    Object.assign(store, snapshot);
  }
});

test('toast identity is monotonic and stale timers cannot clear replacements', () => {
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  const callbacks = new Map();
  let sequence = 0;
  globalThis.setTimeout = callback => {
    const id = ++sequence;
    callbacks.set(id, callback);
    return id;
  };
  globalThis.clearTimeout = id => callbacks.delete(id);
  const previousToast = store.toast;
  const previousTimer = store.toastDismissTimer;
  try {
    store.toast = null;
    store.toastDismissTimer = null;
    store.showToast('Primeiro', 'info');
    const firstId = store.toast.id;
    const firstTimer = store.toastDismissTimer;
    store.showToast('Segundo', 'success');
    const secondId = store.toast.id;
    const secondTimer = store.toastDismissTimer;

    assert.ok(secondId > firstId);
    assert.equal(callbacks.has(firstTimer), false);
    assert.equal(callbacks.has(secondTimer), true);

    callbacks.get(secondTimer)();
    assert.equal(store.toast, null);
  } finally {
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
    store.toast = previousToast;
    store.toastDismissTimer = previousTimer;
  }
});

test('motion CSS uses explicit properties and accessible reduced motion', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /transition\s*:\s*all|\btransition-all\b/);
  assert.doesNotMatch(css, /animation-duration:\s*0\.01ms/);
  assert.match(css, /\.surface-enter\s*\{[\s\S]*220ms var\(--ease-out\)/);
  assert.match(css, /\.status-badge-change\s*\{[\s\S]*240ms var\(--ease-out\)/);
  assert.match(css, /\.responsive-actions\s*\{[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /touch-action:\s*manipulation/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.busy-spinner\s*\{[\s\S]*animation:\s*none/);
});

test('main reconciles overlay nodes instead of replacing them on every notification', async () => {
  const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.match(main, /function syncModal\(/);
  assert.match(main, /function syncToast\(/);
  assert.match(main, /document\.startViewTransition/);
  assert.match(main, /prefers-reduced-motion: reduce/);
  assert.match(main, /event\.target === layer && event\.propertyName === 'opacity'/);
  assert.match(main, /event\.target === node && event\.propertyName === 'opacity'/);
  assert.match(main, /requestAnimationFrame/);
});

test('SMS simulator is absent from the frontend surface', async () => {
  const files = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../src/main.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/store.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/ui/navbar.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/index.css', import.meta.url), 'utf8')
  ]);
  const frontend = files.join('\n');
  assert.doesNotMatch(frontend, /sms-drawer|SmsDrawer|isSmsDrawerOpen|toggleSmsDrawer|Simulador de SMS/);
});
