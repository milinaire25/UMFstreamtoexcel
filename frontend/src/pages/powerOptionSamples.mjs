export const powerOptionSamples = [
  'Cal 27 NSW 90/100 CS: ... /1.95 in block x 7 at 87.25',
  'Q426 QLD 95/105 1x2 Ratio CS /0.50 in 25:50',
  'Q426 QLD 60/55 PS 1.70/1.90 in 25 (naked bid / x 3 at 68.28)',
  'fy28 QLD: 76.50/ 3',
  'Q 127 qld 75/65 ps 3.25/ blk',
  'Q 127 qld 75/65 ps 3.40/ blk',
];
export function sampleOptionMessages(now = Date.now()) {
  return powerOptionSamples.map((message, index) => ({
    _receivedAt: new Date(now - (powerOptionSamples.length - index) * 1000).toISOString(),
    eventData: {message, createAt: new Date(now - (powerOptionSamples.length - index) * 1000).toISOString()},
    additionalData: {userId: index % 2 ? 'sam@broker.example' : 'alex@broker.example', chatRoomName: 'Power options · Sample data'},
  }));
}
