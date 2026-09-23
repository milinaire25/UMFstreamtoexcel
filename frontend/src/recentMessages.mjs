export const MESSAGE_VISIBLE_MS = 3 * 60 * 1000;

export function recentMessages(messages, now) {
  return messages.filter(message => {
    // Server receipt time survives reconnects; replay must not restart the clock.
    const received = Date.parse(message._receivedAt);
    const created = Date.parse((message.eventData || message).createAt);
    const timestamp = Number.isFinite(received) ? received : created;
    return Number.isFinite(timestamp) && now - timestamp < MESSAGE_VISIBLE_MS;
  });
}
