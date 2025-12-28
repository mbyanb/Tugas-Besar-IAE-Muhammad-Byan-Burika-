const express = require('express');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readDb, writeDb } = require('../db'); 

const router = express.Router();

// --- AUTH ---
router.get('/auth/public-key', (req, res) => res.json({ publicKey: readDb().publicKey }));

router.post('/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  const db = readDb();
  if (db.users.find(u => u.email === email)) return res.status(409).json({ message: 'Email exists' });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  const newUser = { id: uuidv4(), name, email, password: hashedPassword, role: 'user', createdAt: new Date().toISOString() };
  db.users.push(newUser);
  writeDb(db);
  res.status(201).json({ id: newUser.id });
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const db = readDb();
  const user = db.users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role || 'user' }, 
    db.privateKey, { algorithm: 'RS256', expiresIn: '1h' }
  );
  res.json({ message: 'Logged in', token });
});

// --- USER MANAGEMENT ---

// 1. GET ALL (Untuk Admin)
router.get('/users', (req, res) => {
  const db = readDb();
  res.json(db.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role || 'user', createdAt: u.createdAt })));
});

// 2. GET SINGLE USER (Untuk Profile) - BARU
router.get('/users/:id', (req, res) => {
  const db = readDb();
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'Not found' });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt });
});

// 3. UPDATE USER (Edit Profile) - BARU
router.put('/users/:id', async (req, res) => {
    const { name, email, password } = req.body;
    const db = readDb();
    const index = db.users.findIndex(u => u.id === req.params.id);
    
    if (index === -1) return res.status(404).json({ message: 'User not found' });

    // Cek email duplikat jika email diubah
    if (email && email !== db.users[index].email) {
        if (db.users.find(u => u.email === email)) return res.status(409).json({ message: 'Email already taken' });
        db.users[index].email = email;
    }

    if (name) db.users[index].name = name;
    
    // Hash password baru jika ada
    if (password) {
        const salt = await bcrypt.genSalt(10);
        db.users[index].password = await bcrypt.hash(password, salt);
    }

    writeDb(db);
    res.json({ message: 'Profile updated', user: { id: db.users[index].id, name: db.users[index].name, email: db.users[index].email } });
});

// 4. DELETE USER (Admin)
router.delete('/users/:id', (req, res) => {
    const db = readDb();
    const index = db.users.findIndex(u => u.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Not found' });
    if (db.users[index].role === 'admin') return res.status(403).json({ message: 'Cannot delete admin' });

    const deleted = db.users.splice(index, 1)[0];
    writeDb(db);
    res.json({ message: 'Deleted', user: deleted });
});

// 5. UPDATE ROLE (Admin)
router.patch('/users/:id/role', (req, res) => {
    const { role } = req.body;
    const db = readDb();
    const user = db.users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    if (user.email === 'admin@vitaltrack.com') return res.status(403).json({ message: 'Cannot change Super Admin' });
    
    user.role = role;
    writeDb(db);
    res.json({ message: 'Role updated' });
});

// --- MEDICAL HISTORY ---
router.get('/medical-history', (req, res) => res.json(readDb().medical_history || []));
router.post('/medical-history', (req, res) => {
  const db = readDb();
  if (!db.medical_history) db.medical_history = [];
  const rec = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
  db.medical_history.push(rec);
  writeDb(db);
  res.status(201).json(rec);
});
router.delete('/medical-history/:id', (req, res) => {
  const db = readDb();
  const idx = db.medical_history?.findIndex(r => r.id === req.params.id);
  if (idx === -1 || idx === undefined) return res.status(404).json({ message: 'Not found' });
  const del = db.medical_history.splice(idx, 1)[0];
  writeDb(db);
  res.json({ message: 'Deleted', record: del });
});

module.exports = router;