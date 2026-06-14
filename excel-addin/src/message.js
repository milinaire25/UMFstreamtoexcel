export const TABLE_NAME = 'UMFFeedMessages';
export const SHEET_NAME = 'UMF Feed';

export const HEADERS = [
  'Received At',
  'Created At',
  'Room',
  'User',
  'Message',
  'Attachments',
  'Raw JSON',
];

export function messageToRow(message, receivedAt = new Date().toISOString()) {
  const eventData = message?.eventData || message || {};
  const additionalData = message?.additionalData || {};
  const attachments = Array.isArray(eventData.attachments)
    ? eventData.attachments.map((item) => item.attachmentName || item.name || '').filter(Boolean).join(', ')
    : '';

  return [
    receivedAt,
    eventData.createAt || message?._receivedAt || '',
    additionalData.chatRoomName || eventData.chatRoomId || '',
    additionalData.userId || eventData.userUuid || '',
    eventData.message || '',
    attachments,
    JSON.stringify(message || {}),
  ];
}

export function socketUrlFromBackend(backendUrl) {
  const url = new URL(normalizeUrlInput(backendUrl));
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/ws';
  url.search = '';
  url.hash = '';
  return url.toString();
}

export function normalizeBackendUrl(value) {
  const url = new URL(normalizeUrlInput(value));
  if ((url.hostname === 'localhost' || url.hostname === '127.0.0.1') && url.port === '5174') {
    url.pathname = '/render';
    url.search = '';
    url.hash = '';
  }
  return url.toString().replace(/\/$/, '');
}

export function normalizeWebSocketUrl(value) {
  const url = new URL(normalizeUrlInput(value));
  if (url.protocol === 'http:') url.protocol = 'ws:';
  if (url.protocol === 'https:') url.protocol = 'wss:';
  url.pathname = '/ws';
  url.search = '';
  url.hash = '';
  return url.toString();
}

export function normalizeUrlInput(value) {
  const text = String(value || '').trim();
  const matches = [...text.matchAll(/(?:https?|wss?):\/\//gi)];
  const lastScheme = matches.at(-1);
  return lastScheme ? text.slice(lastScheme.index).trim() : text;
}
