import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://fidelidade.example'
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;

const { sanitizeHtml, setSafeHtml } = await import(`../src/ui/safeHtml.js?test=${Date.now()}`);

test('remove scripts, eventos inline e elementos incorporados', () => {
  const dirty = `
    <img src="x" style="position:fixed;inset:0" onerror="globalThis.pwned=true">
    <script>globalThis.pwned=true</script>
    <iframe srcdoc="<script>alert(1)</script>"></iframe>
    <object data="/arquivo"></object>
  `;
  const clean = sanitizeHtml(dirty);
  assert.doesNotMatch(clean, /onerror|script|iframe|object|srcdoc|style=/i);
});

test('impede quebra de atributo com manipulador de evento', () => {
  const payload = `cliente" autofocus onfocus="globalThis.pwned=true`;
  const clean = sanitizeHtml(`<button data-client-id="${payload}">Abrir</button>`);
  const mount = document.createElement('div');
  mount.innerHTML = clean;
  const button = mount.querySelector('button');
  assert.ok(button);
  assert.equal(button.hasAttribute('onfocus'), false);
  assert.equal(button.getAttribute('data-client-id'), 'cliente');
});

test('preserva controles legítimos, SVG e atributos de acessibilidade', () => {
  const mount = document.createElement('div');
  setSafeHtml(mount, `
    <button id="save" data-action="save" aria-label="Salvar">
      <svg viewBox="0 0 24 24"><path d="M1 1h2"></path></svg>
      Salvar
    </button>
  `);
  const button = mount.querySelector('#save');
  assert.ok(button);
  assert.equal(button.dataset.action, 'save');
  assert.equal(button.getAttribute('aria-label'), 'Salvar');
  assert.ok(button.querySelector('svg'));
});
