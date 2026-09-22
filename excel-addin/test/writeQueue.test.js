import assert from 'node:assert/strict';
import test from 'node:test';
import { createWriteQueue } from '../src/writeQueue.js';

test('history burst and live arrivals never overlap workbook writes or lose order', async () => {
  const batches = [];
  let active = 0;
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const queue = createWriteQueue(async rows => {
    assert.equal(++active, 1);
    if (!batches.length) await gate;
    batches.push(rows);
    active--;
  }, error => { throw error; });
  for (let i = 0; i < 500; i++) queue.add(i);
  await Promise.resolve();
  queue.add(500); // A live message while the initial workbook sync is in flight.
  release();
  await queue.idle();
  assert.deepEqual(batches.flat(), Array.from({ length: 501 }, (_, i) => i));
  assert.ok(batches.every(batch => batch.length <= 100));
});

test('write failure is reported and subsequent live messages still write', async () => {
  const errors = [];
  const written = [];
  const queue = createWriteQueue(async rows => {
    if (rows.includes('bad')) throw new Error('Workbook busy');
    written.push(...rows);
  }, (error, count) => errors.push([error.message, count]));
  queue.add('bad');
  await queue.idle();
  queue.add('live');
  await queue.idle();
  assert.deepEqual(errors, [['Workbook busy', 1]]);
  assert.deepEqual(written, ['live']);
});

test('other workbook operations wait for an active write', async () => {
  const operations = [];
  const queue = createWriteQueue(async () => { operations.push('write'); }, () => {});
  queue.add('message');
  await queue.run(async () => { operations.push('clear'); });
  assert.deepEqual(operations, ['write', 'clear']);
});
