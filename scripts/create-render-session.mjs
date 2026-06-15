#!/usr/bin/env node
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const DEFAULT_BASE_URL = 'https://umfstreamtoexcel.onrender.com';

const rl = readline.createInterface({ input, output });

async function ask(label, defaultValue = '') {
  const suffix = defaultValue ? ` (${defaultValue})` : '';
  const value = await rl.question(`${label}${suffix}: `);
  return value.trim() || defaultValue;
}

async function askSecret(label) {
  if (!input.isTTY) {
    return ask(label);
  }

  output.write(`${label}: `);
  input.setRawMode(true);
  input.resume();
  input.setEncoding('utf8');

  let value = '';
  return await new Promise((resolve, reject) => {
    const cleanup = () => {
      input.setRawMode(false);
      input.pause();
      input.removeListener('data', onData);
    };

    const onData = (char) => {
      if (char === '\u0003') {
        cleanup();
        reject(new Error('Cancelled'));
        return;
      }
      if (char === '\r' || char === '\n') {
        output.write('\n');
        cleanup();
        resolve(value);
        return;
      }
      if (char === '\u007f') {
        value = value.slice(0, -1);
        return;
      }
      value += char;
      output.write('*');
    };

    input.on('data', onData);
  });
}

async function request(baseUrl, method, path, token, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `${method} ${path} failed with HTTP ${response.status}`);
  }
  return data;
}

async function main() {
  console.log('Create and start a StreamtoExcel Render feed session');
  console.log('Passwords are not stored or printed.\n');

  const baseUrl = (await ask('Render base URL', DEFAULT_BASE_URL)).replace(/\/$/, '');
  const username = await ask('Dashboard username', 'admin');
  const adminPassword = await askSecret('Dashboard password');

  const login = await request(baseUrl, 'POST', '/api/auth/login', null, {
    username,
    password: adminPassword,
  });

  const serviceAccount = await ask('Feed service account');
  const feedPassword = await askSecret('Feed password');
  const trackMode = (await ask('Track by email or uuid', 'email')).toLowerCase();
  const trackValue = await ask(trackMode === 'uuid' ? 'Track UUID' : 'Track email');
  const env = (await ask('Environment: prod, qa, trd, dev, beta', 'prod')).toLowerCase();

  const session = await request(baseUrl, 'POST', '/api/sessions', login.token, {
    serviceAccount,
    password: feedPassword,
    env,
    trackEmail: trackMode === 'uuid' ? '' : trackValue,
    trackUUID: trackMode === 'uuid' ? trackValue : '',
  });

  console.log(`\nCreated session ${session.id} (${session.status}). Starting feed...`);

  const started = await request(baseUrl, 'POST', `/api/sessions/${session.id}/start`, login.token);
  console.log(`Session status: ${started.status}`);
  console.log(`Session id: ${started.id}`);

  if (started.status !== 'running') {
    console.log('Open the dashboard or Excel add-in logs to inspect startup output.');
  }
}

main()
  .catch((error) => {
    console.error(`\nError: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => rl.close());
