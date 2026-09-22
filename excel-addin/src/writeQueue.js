// Serialize workbook operations and coalesce feed bursts into bounded batches.
export function createWriteQueue(write, onError, batchSize = 100) {
  let tail = Promise.resolve();
  let pending = [];
  let scheduled = false;

  function run(operation) {
    const result = tail.then(operation);
    tail = result.catch(() => {});
    return result;
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    run(async () => {
      const rows = pending.splice(0, batchSize);
      try {
        await write(rows);
      } catch (error) {
        // Do not blindly retry: Excel may have committed before reporting failure.
        onError(error, rows.length);
      } finally {
        scheduled = false;
        if (pending.length) schedule();
      }
    });
  }

  return {
    add(row) { pending.push(row); schedule(); },
    run,
    async idle() {
      do { await tail; } while (scheduled || pending.length);
    },
  };
}
