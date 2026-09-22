// The backend replays the same payload, including its session and receipt time.
// Use the saved payload, not message text or the add-in's new receipt timestamp.
export function unseenRows(rows, savedPayloads) {
  const seen = new Set(savedPayloads);
  return rows.filter(row => {
    const payload = row[6];
    if (seen.has(payload)) return false;
    seen.add(payload);
    return true;
  });
}

export async function appendUnseenRows(context, table, rows) {
  table.rows.load('count');
  await context.sync();
  let savedPayloads = [];
  if (table.rows.count > 0) {
    const saved = table.columns.getItem('Raw JSON').getDataBodyRange();
    saved.load('values');
    await context.sync();
    savedPayloads = saved.values.map(row => row[0]);
  }
  const fresh = unseenRows(rows, savedPayloads);
  if (fresh.length) {
    table.rows.add(0, [...fresh].reverse());
    await context.sync();
  }
  return fresh.length;
}
