import assert from 'node:assert/strict';
import { test } from 'node:test';
import { activeWriteLocks, withWriteLock } from '../src/services/writeLock.js';

test('serializa operações concorrentes que usam a mesma chave', async () => {
  let balance = 0;
  await Promise.all(Array.from({ length: 25 }, (_, index) => (
    withWriteLock('cliente-1', async () => {
      const previous = balance;
      await new Promise(resolve => setTimeout(resolve, index % 3));
      balance = previous + 1;
    })
  )));
  assert.equal(balance, 25);
  assert.equal(activeWriteLocks(), 0);
});

test('não bloqueia chaves independentes', async () => {
  const started = [];
  let release;
  const barrier = new Promise(resolve => { release = resolve; });
  const first = withWriteLock('cliente-a', async () => {
    started.push('a');
    await barrier;
  });
  const second = withWriteLock('cliente-b', async () => {
    started.push('b');
    release();
  });
  await Promise.all([first, second]);
  assert.deepEqual(started.sort(), ['a', 'b']);
});
