import assert from 'node:assert/strict';
import test from 'node:test';
import { messageToRow, socketUrlFromBackend } from '../src/message.js';

test('messageToRow flattens UMF event messages into one Excel row', () => {
  const row = messageToRow({
    _receivedAt: '2026-06-14T10:00:00.000Z',
    additionalData: {
      chatRoomName: 'Rates Desk',
      userId: 'user-123',
    },
    eventData: {
      createAt: '2026-06-14T09:59:59.000Z',
      message: 'Hello from UMF',
      attachments: [{ attachmentName: 'quote.pdf' }],
    },
  }, '2026-06-14T10:00:01.000Z');

  assert.equal(row[0], '2026-06-14T10:00:01.000Z');
  assert.equal(row[1], '2026-06-14T09:59:59.000Z');
  assert.equal(row[2], 'Rates Desk');
  assert.equal(row[3], 'user-123');
  assert.equal(row[4], 'Hello from UMF');
  assert.equal(row[5], 'quote.pdf');
  assert.match(row[6], /Hello from UMF/);
});

test('socketUrlFromBackend derives the existing backend WebSocket endpoint', () => {
  assert.equal(socketUrlFromBackend('http://localhost:3001'), 'ws://localhost:3001/ws');
  assert.equal(socketUrlFromBackend('https://feed.example.com/app'), 'wss://feed.example.com/ws');
});
