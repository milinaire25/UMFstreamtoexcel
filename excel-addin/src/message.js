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
  const url = new URL(backendUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/ws';
  url.search = '';
  url.hash = '';
  return url.toString();
}
