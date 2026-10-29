// Transcribed from the user's Provider2 sample; no invented rates for other banks.
export const moneyMarketSample = `BANK: Provider2
TENOR SGD
ON 1.22%
1-Week 1.24%
2-Week 1.25%
3-Week 1.26%
1-Month 1.28%
2-Month 1.30%
3-Month 1.32%
4-Month 1.34%
5-Month 1.35%
6-Month 1.37%
7-Month 1.39%
8-Month 1.40%
9-Month 1.42%
10-Month 1.43%
11-Month 1.45%
1-Year 1.47%`;
export function sampleMoneyMarketMessage(now = Date.now()) {
  return {_receivedAt:new Date(now).toISOString(), eventData:{message:moneyMarketSample,createAt:new Date(now).toISOString()}, additionalData:{userId:'bank2@example.com',chatRoomName:'Money Market sample'}};
}
