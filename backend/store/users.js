'use strict';

const bcrypt = require('bcryptjs');

// In-memory user store.
// Bootstrap with an admin account; swap for a DB in production.
const _users = new Map();

async function bootstrap() {
  const adminHash = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || 'changeme',
    10
  );
  _users.set('admin', {
    username: 'admin',
    passwordHash: adminHash,
    name: 'Administrator',
    role: 'admin',
    createdAt: new Date().toISOString(),
  });
  console.log('[users] Admin account ready (username: admin)');
}

bootstrap().catch(console.error);

const userStore = {
  get:    (username) => _users.get(username),
  set:    (username, user) => _users.set(username, user),
  delete: (username) => _users.delete(username),
  all:    () => [..._users.values()].map(({ passwordHash: _, ...u }) => u),

  async verify(username, password) {
    const user = _users.get(username);
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.passwordHash);
    return ok ? user : null;
  },

  async create(username, password, name, role = 'user') {
    if (_users.has(username)) throw new Error('User already exists');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = { username, passwordHash, name, role, createdAt: new Date().toISOString() };
    _users.set(username, user);
    return { username, name, role };
  },
};

module.exports = { userStore };
