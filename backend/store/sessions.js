'use strict';

// In-memory session store.
// In production, swap this Map for Redis or a database.
const _sessions = new Map();

const sessionStore = {
  get:    (id)          => _sessions.get(id),
  set:    (id, session) => _sessions.set(id, session),
  delete: (id)          => _sessions.delete(id),
  all:    ()            => [..._sessions.values()],
  byUser: (username)    => [..._sessions.values()].filter(s => s.ownerUsername === username),
};

module.exports = { sessionStore };
