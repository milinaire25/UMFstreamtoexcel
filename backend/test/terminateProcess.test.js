'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter, once } = require('node:events');
const { spawn } = require('node:child_process');
const terminateProcess = require('../services/terminateProcess');
function child(kill) {
  const proc = new EventEmitter();
  proc.exitCode = null; proc.signalCode = null; proc.signals = [];
  proc.kill = signal => { proc.signals.push(signal); kill?.(signal, proc); return true; };
  return proc;
}
test('sends SIGINT and never force-kills a child that exits during grace', async () => {
  const proc = child((signal, proc) => { proc.exitCode = 0; proc.emit('exit', 0, null); });
  assert.deepEqual(await terminateProcess(proc, { graceMs: 10, platform: 'linux' }), { forced: false });
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.deepEqual(proc.signals, ['SIGINT']);
});
test('escalates only after timeout and waits for forced exit', async () => {
  const proc = child((signal, proc) => { if (signal === 'SIGKILL') setTimeout(() => proc.emit('exit', null, signal), 5); });
  assert.deepEqual(await terminateProcess(proc, { graceMs: 5, killMs: 100, platform: 'linux' }), { forced: true });
  assert.deepEqual(proc.signals, ['SIGINT', 'SIGKILL']);
});
test('reports failure if process never exits and removes listeners', async () => {
  const proc = child();
  await assert.rejects(terminateProcess(proc, { graceMs: 5, killMs: 5 }), /did not exit/);
  assert.equal(proc.listenerCount('exit'), 0);
});
test('does not signal exited processes; Windows termination is not called graceful', async () => {
  const proc = child(); proc.exitCode = 0;
  await terminateProcess(proc);
  assert.deepEqual(proc.signals, []);
  const windows = child((signal, p) => p.emit('exit', null, signal));
  assert.equal((await terminateProcess(windows, { platform: 'win32' })).forced, true);
});
test('real POSIX child executes its SIGINT cleanup before stop resolves', { skip: process.platform === 'win32' }, async t => {
  const proc = spawn(process.execPath, ['-e', "process.on('SIGINT',()=>{process.stdout.write('cleanup completed\\n');process.exit(0)});console.log('ready');setInterval(()=>{},1000)"], { stdio: ['ignore','pipe','pipe'] });
  t.after(() => { if (proc.exitCode === null && proc.signalCode === null) proc.kill('SIGKILL'); });
  let output = '';
  proc.stdout.on('data', data => { output += data; });
  await once(proc.stdout, 'data');
  const closed = once(proc, 'close');
  assert.equal((await terminateProcess(proc)).forced, false);
  await closed;
  assert.match(output, /cleanup completed/);
  assert.equal(proc.exitCode, 0);
});
