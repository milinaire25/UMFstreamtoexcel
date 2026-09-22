import assert from 'node:assert/strict';
import test from 'node:test';
import { appendUnseenRows, unseenRows } from '../src/deduplicate.js';
import { messageToRow } from '../src/message.js';

const message = (time, session = 'session-1') => ({
  _receivedAt: time, _sessionId: session, eventData: { message: 'Same text' },
});
const row = (time, session) => messageToRow(message(time, session));

test('reconnect skips saved messages despite a new local receipt timestamp', () => {
  const payload = message('2026-09-22T01:00:00Z');
  const original = messageToRow(payload, 'first connection');
  const replay = messageToRow(payload, 'second connection');
  assert.deepEqual(unseenRows([replay], [original[6]]), []);
});

test('repeated text at different times or in different sessions is preserved', () => {
  const first = row('time-1');
  const later = row('time-2');
  const otherSession = row('time-1', 'session-2');
  assert.deepEqual(unseenRows([first, later, otherSession], [first[6]]), [later, otherSession]);
});

test('duplicates within a replay batch are skipped', () => {
  const first = row('time-1');
  assert.deepEqual(unseenRows([first, first], []), [first]);
});

function workbook(initial = []) {
  const saved = [...initial];
  const table = {
    rows: {
      load() {},
      get count() { return saved.length; },
      add(index, rows) { saved.splice(index, 0, ...rows); },
    },
    columns: {
      getItem(name) {
        assert.equal(name, 'Raw JSON');
        return { getDataBodyRange() {
          assert.ok(saved.length > 0);
          return { load() {}, values: saved.map(row => [row[6]]) };
        } };
      },
    },
  };
  return { saved, table, context: { async sync() {} } };
}

test('reopening uses workbook history and inserts only new messages newest first', async () => {
  const first = row('time-1');
  const second = row('time-2');
  const third = row('time-3');
  const { saved, table, context } = workbook([first]);
  assert.equal(await appendUnseenRows(context, table, [first, second, third]), 2);
  assert.deepEqual(saved, [third, second, first]);
  assert.equal(await appendUnseenRows(context, table, [first, second, third]), 0);
  assert.equal(saved.length, 3);
});

test('empty or cleared workbook accepts the replay again', async () => {
  const { saved, table, context } = workbook();
  const first = row('time-1');
  assert.equal(await appendUnseenRows(context, table, [first]), 1);
  saved.length = 0;
  assert.equal(await appendUnseenRows(context, table, [first]), 1);
});

test('workbook read failure does not insert unchecked duplicates', async () => {
  const { saved, table } = workbook([row('time-1')]);
  const context = { async sync() { throw new Error('Excel unavailable'); } };
  await assert.rejects(appendUnseenRows(context, table, [row('time-1')]), /Excel unavailable/);
  assert.equal(saved.length, 1);
});
