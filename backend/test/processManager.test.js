'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');
function setup() {
  const sessions = new Map();
  const children = [];
  const timers = new Map();
  let tick = 0;
  let finishStop;
  let stopCalls = 0;
  const filename = path.join(__dirname, '../services/processManager.js');
  const context = {
    module: { exports: {} }, __dirname: path.dirname(filename), process: { env: {} },
    console: { log() {}, warn() {}, error() {} },
    setTimeout(callback) { const id = ++tick; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); },
    require(name) {
      if (name === 'child_process') return { spawn() {
        const proc = new EventEmitter(); proc.stdout = new EventEmitter(); proc.stderr = new EventEmitter(); proc.pid = children.length + 1;
        children.push(proc); return proc;
      } };
      if (name === '../store/sessions') return { sessionStore: { get: id => sessions.get(id), set: (id, s) => sessions.set(id, s) } };
      if (name === './terminateProcess') return proc => {
        stopCalls++;
        return new Promise(resolve => { finishStop = forced => { proc.emit('exit', 0, forced ? 'SIGKILL' : 'SIGINT'); resolve({ forced }); }; });
      };
      if (name === 'fs') return { existsSync: () => false };
      return require(name);
    },
  };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), context, { filename });
  function session(id, account = 'account') { sessions.set(id, { id, serviceAccount: account, env: 'prod', messages: [], errorLog: [], status: 'stopped' }); }
  return { manager: context.module.exports, sessions, children, timers, session, finish: forced => finishStop(forced), calls: () => stopCalls };
}
test('concurrent stop is shared; same account cannot start until exit, including another session ID', async () => {
  const h = setup(); h.session('one'); h.session('two');
  await h.manager.start('one');
  const stopping = h.manager.stop('one');
  assert.equal(h.manager.stop('one'), stopping);
  await Promise.resolve();
  assert.equal(h.sessions.get('one').status, 'stopping');
  await assert.rejects(h.manager.start('one'), /still stopping/);
  await assert.rejects(h.manager.start('two'), /active or stopping/);
  assert.equal(h.calls(), 1);
  h.finish(false); await stopping;
  assert.equal(h.sessions.get('one').status, 'stopped');
  await h.manager.start('two');
  assert.equal(h.children.length, 2);
});
test('blocks concurrent service-account connections but allows independent accounts', async () => {
  const h = setup(); h.session('one'); h.session('two'); h.session('three','other');
  await h.manager.start('one');
  await assert.rejects(h.manager.start('two'), /already has/);
  await h.manager.start('three');
  assert.equal(h.children.length, 2);
});
test('forced stop cooldown survives Stop again, deletion, and a new session ID', async () => {
  const h = setup(); h.session('one'); h.session('two');
  await h.manager.start('one'); const stopped = h.manager.stop('one'); await Promise.resolve();
  h.finish(true); await stopped;
  assert.match(h.sessions.get('one').stopWarning, /cooldown/);
  await h.manager.stop('one'); h.sessions.delete('one');
  await assert.rejects(h.manager.start('two'), /cooldown/);
});
test('upstream session lock persists after Stop even if no Java process remains', async () => {
  const h = setup(); h.session('one'); h.session('two');
  await h.manager.start('one');
  h.children[0].stderr.emit('data', Buffer.from('Session already exists'));
  h.children[0].emit('exit', 1, null);
  await h.manager.stop('one');
  await assert.rejects(h.manager.start('one'), /cooldown/);
  await assert.rejects(h.manager.start('two'), /cooldown/);
});
test('stop cancels pending auto restart; stopAll blocks future starts', async () => {
  const h = setup(); h.session('one');
  await h.manager.start('one');
  h.children[0].stdout.emit('data', Buffer.from('__CONNECTED__\n'));
  h.children[0].emit('exit', 1, null);
  assert.equal(h.timers.size, 1);
  await h.manager.stop('one');
  assert.equal(h.timers.size, 0);
  await h.manager.stopAll();
  await assert.rejects(h.manager.start('one'), /shutting down/);
});
