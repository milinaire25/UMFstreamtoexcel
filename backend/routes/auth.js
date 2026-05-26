'use strict';

const router = require('express').Router();
const { userStore }  = require('../store/users');
const { verifyToken } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password)
    return res.status(400).json({ error: 'username and password required' });

  const user = await userStore.verify(username, password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const token = verifyToken.sign({ username: user.username, name: user.name, role: user.role });
  res.json({ token, user: { username: user.username, name: user.name, role: user.role } });
});

// POST /api/auth/register  (admin only)
router.post('/register', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Admin only' });

  const { username, password, name, role } = req.body || {};
  if (!username || !password || !name)
    return res.status(400).json({ error: 'username, password, name required' });

  try {
    const u = await userStore.create(username, password, name, role || 'user');
    res.status(201).json(u);
  } catch (e) {
    res.status(409).json({ error: e.message });
  }
});

// GET /api/auth/users  (admin only)
router.get('/users', verifyToken, (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Admin only' });
  res.json(userStore.all());
});

// DELETE /api/auth/users/:username  (admin only)
router.delete('/users/:username', verifyToken, (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Admin only' });
  if (req.params.username === 'admin')
    return res.status(400).json({ error: 'Cannot delete admin' });
  userStore.delete(req.params.username);
  res.json({ deleted: req.params.username });
});

// GET /api/auth/me
router.get('/me', verifyToken, (req, res) => {
  const u = userStore.get(req.user.username);
  if (!u) return res.status(404).json({ error: 'Not found' });
  res.json({ username: u.username, name: u.name, role: u.role });
});

module.exports = router;
