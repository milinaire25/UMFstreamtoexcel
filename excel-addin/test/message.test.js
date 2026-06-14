import assert from 'node:assert/strict';
import test from 'node:test';
import {
  messageToRow,
  normalizeBackendUrl,
  normalizeUrlInput,
  normalizeWebSocketUrl,
  socketUrlFromBackend,
} from '../src/message.js';

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

test('normalizeUrlInput keeps the last valid URL when Excel appends typed text', () => {
  assert.equal(
    normalizeUrlInput('http://localhost:3001https://umfstreamtoexcel.onrender.com'),
    'https://umfstreamtoexcel.onrender.com',
  );
  assert.equal(
    normalizeUrlInput('ws://localhost:3001/wswss://umfstreamtoexcel.onrender.com/ws'),
    'wss://umfstreamtoexcel.onrender.com/ws',
  );
});

test('normalizeBackendUrl keeps the local Render proxy stable', () => {
  assert.equal(
    normalizeBackendUrl('http://127.0.0.1:5174/http://localhost:5174/renderrender'),
    'http://localhost:5174/render',
  );
});

test('normalizeWebSocketUrl keeps the backend WebSocket path stable', () => {
  assert.equal(
    normalizeWebSocketUrl('ws://127.0.0.1:5174/wwss://umfstreamtoexcel.onrender.com/wss'),
    'wss://umfstreamtoexcel.onrender.com/ws',
  );
});
