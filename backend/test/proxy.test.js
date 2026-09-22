'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const configureProxy = require('../configureProxy');

function request(env, forwarded) {
  const app = express();
  configureProxy(app, env);
  const req = Object.create(app.request);
  req.socket = { remoteAddress: '10.0.0.1' };
  req.headers = forwarded ? { 'x-forwarded-for': forwarded } : {};
  return req;
}

test('Render requests identify distinct clients behind the same proxy', () => {
  assert.equal(request({ RENDER: 'true' }, '203.0.113.1').ip, '203.0.113.1');
  assert.equal(request({ RENDER: 'true' }, '203.0.113.2').ip, '203.0.113.2');
});

test('untrusted earlier forwarded entries cannot override the nearest client', () => {
  assert.equal(request({ RENDER: 'true' }, '198.51.100.9, 203.0.113.1').ip, '203.0.113.1');
});

test('direct local deployments ignore supplied forwarding headers', () => {
  assert.equal(request({}, '198.51.100.9').ip, '10.0.0.1');
  assert.equal(request({ RENDER: 'false' }, '198.51.100.9').ip, '10.0.0.1');
  assert.equal(request({ RENDER: 'true' }).ip, '10.0.0.1');
});
