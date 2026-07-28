import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const originalFetch = globalThis.fetch;
let vite;
let store;
let renderClientList;
let renderManagerPanel;
let renderNavbar;

function documentFrom(markup) {
  return new JSDOM(`<body>${markup}</body>`).window.document;
}

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
  ({ renderClientList } = await vite.ssrLoadModule('/src/ui/clientList.js'));
  ({ renderManagerPanel } = await vite.ssrLoadModule('/src/ui/managerPanel.js'));
  ({ renderNavbar } = await vite.ssrLoadModule('/src/ui/navbar.js'));
});

test.after(async () => {
  globalThis.fetch = originalFetch;
  await vite?.close();
});

test('manager navigation preserves a complete accessible tab contract', () => {
  const snapshot = {
    currentUser: store.currentUser,
    managerSubTab: store.managerSubTab
  };
  try {
    store.currentUser = {
      id: 'manager-quality',
      nome: 'Gerente',
      perfil: 'gerente',
      cotaDiariaPontos: 1000
    };
    store.managerSubTab = 'usuarios';
    const document = documentFrom(renderManagerPanel());
    const tablist = document.querySelector('[role="tablist"]');
    const tabs = [...document.querySelectorAll('[role="tab"]')];
    const selectedTabs = tabs.filter(tab => tab.getAttribute('aria-selected') === 'true');
    const panel = document.querySelector('#manager-active-panel[role="tabpanel"]');

    assert.ok(tablist);
    assert.equal(tabs.length, 7);
    assert.equal(selectedTabs.length, 1);
    assert.equal(selectedTabs[0].dataset.managerSubtab, 'usuarios');
    assert.ok(tabs.every(tab => tab.getAttribute('aria-controls') === 'manager-active-panel'));
    assert.ok(tabs.every(tab => tab.hasAttribute('tabindex')));
    assert.ok(panel);
  } finally {
    Object.assign(store, snapshot);
  }
});

test('navbar keeps compact branding and an announced quota disclosure', () => {
  const previousUser = store.currentUser;
  try {
    store.currentUser = {
      id: 'manager-quality',
      nome: 'Gerente de Operações',
      perfil: 'gerente',
      cotaDiariaPontos: 1000
    };
    const document = documentFrom(renderNavbar());
    const quotaButton = document.querySelector('#btn-quota-toggle');

    assert.ok(document.querySelector('.brand-name-full'));
    assert.ok(document.querySelector('.brand-name-compact'));
    assert.equal(quotaButton?.getAttribute('aria-controls'), 'quota-summary');
    assert.ok(['true', 'false'].includes(quotaButton?.getAttribute('aria-expanded')));
  } finally {
    store.currentUser = previousUser;
  }
});

test('client results use the adaptive card and unframed points structure', () => {
  const snapshot = {
    clients: store.clients,
    config: store.config,
    searchQuery: store.searchQuery
  };
  try {
    store.clients = [{
      id: 'client-quality',
      nome: 'Cliente Teste',
      telefone: '11999999999',
      email: 'cliente@example.com',
      cpf: '',
      nivel: 'Ouro',
      saldoPontos: 150
    }];
    store.config = {
      ...store.config,
      valorResgatePontos: 100,
      valorResgateReais: 10
    };
    store.searchQuery = '';
    const document = documentFrom(renderClientList());

    assert.ok(document.querySelector('.client-grid'));
    assert.ok(document.querySelector('article.client-card'));
    assert.ok(document.querySelector('[data-client-card][data-client-id="client-quality"]'));
    assert.ok(document.querySelector('.client-points'));
    assert.ok(document.querySelector('.client-balance-value'));
    assert.ok(document.querySelector('.client-history-button'));
    assert.doesNotMatch(document.querySelector('.client-card').textContent, /11999999999/);
    assert.doesNotMatch(document.querySelector('.client-card').textContent, /cliente@example\.com/);
    assert.equal(document.querySelectorAll('.client-card .client-card').length, 0);
  } finally {
    Object.assign(store, snapshot);
  }
});

test('responsive CSS preserves touch, overflow and reduced-motion gates', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

    assert.match(css, /--control-height:\s*2\.75rem/);
    assert.match(css, /\.client-grid\s*\{[\s\S]*repeat\(auto-fit,/);
    assert.match(css, /\.client-card\s*\{[\s\S]*content-visibility:\s*auto/);
    assert.match(css, /::view-transition-group\(client-details\)/);
    assert.match(css, /\.edit-client-panel\s*\{[\s\S]*max-width:\s*30rem/);
    assert.match(css, /\.edit-client-modal\[data-state="entering"\][\s\S]*will-change:\s*opacity, transform/);
  assert.match(css, /\.manager-tabs::-webkit-scrollbar\s*\{[\s\S]*display:\s*none/);
  assert.match(css, /@media \(max-width: 639px\)[\s\S]*\.brand-name-full\s*\{[\s\S]*display:\s*none/);
  assert.match(css, /@media \(pointer: coarse\)[\s\S]*min-height:\s*44px/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

  test('runtime maintains modal focus, labels and keyboard tab navigation', async () => {
  const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');

  assert.match(main, /function enhanceModalAccessibility\(/);
  assert.match(main, /setAttribute\('aria-modal', 'true'\)/);
  assert.match(main, /function ensureLabelAssociations\(/);
  assert.match(main, /event\.key === 'Tab' && store\.activeModal !== 'none'/);
  assert.match(main, /\['ArrowLeft', 'ArrowRight', 'Home', 'End'\]/);
  });

  test('theme choice is persistent, accessible and initialized before paint', async () => {
    const [theme, login, html] = await Promise.all([
      readFile(new URL('../src/theme.js', import.meta.url), 'utf8'),
      readFile(new URL('../src/ui/login.js', import.meta.url), 'utf8'),
      readFile(new URL('../index.html', import.meta.url), 'utf8')
    ]);

    assert.match(theme, /localStorage\.setItem\(THEME_STORAGE_KEY/);
    assert.match(theme, /documentElement\.dataset\.theme/);
    assert.match(login, /data-theme-toggle/);
    assert.match(login, /role="switch"/);
    assert.match(login, /aria-checked=/);
    assert.match(html, /<script src="\/theme-init\.js"><\/script>/);
  });

test('skill selection rules keep the project workflow intentionally small', async () => {
  const guide = await readFile(
    new URL('../docs/skill-selection-and-verification.md', import.meta.url),
    'utf8'
  );
  const plan = await readFile(
    new URL('../docs/ui-improvement-execution-plan.md', import.meta.url),
    'utf8'
  );

  assert.match(guide, /uma habilidade principal/);
  assert.match(guide, /no máximo duas habilidades de apoio/);
  assert.match(guide, /Não combinar estilos concorrentes/);
  assert.match(guide, /ui-ux-pro-max/);
  assert.match(guide, /ui-styling/);
  assert.match(guide, /stitch-design-taste/);
  assert.match(guide, /npm\.cmd run test:security/);
  assert.match(guide, /npm\.cmd run build/);
  assert.match(plan, /UI-01/);
  assert.match(plan, /npm\.cmd run test:lighthouse/);
  assert.match(plan, /telefone\/e-mail nos cartões/);
});
