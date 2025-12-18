const express = require('express');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readDb, writeDb } = require('../db'); 

const router = express.Router();

// --- AUTH ---
router.get('/auth/public-key', (req, res) => {
  const db = readDb();
  res.json({ publicKey: db.publicKey });
});

router.post('/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  const db = readDb();

  if (db.users.find(u => u.email === email)) {
    return res.status(409).json({ message: 'Email already exists' });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = {
    id: uuidv4(),
    name,
    email,
    password: hashedPassword,
    createdAt: new Date().toISOString()
  };
  
  db.users.push(newUser);
  writeDb(db);
  
  res.status(201).json({ id: newUser.id, email: newUser.email });
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const db = readDb();
  const user = db.users.find(u => u.email === email);
  
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name }, 
    db.privateKey, 
    { algorithm: 'RS256', expiresIn: '1h' }
  );
  
  res.json({ message: 'Logged in', token });
});

router.get('/users', (req, res) => {
  const db = readDb();
  res.json(db.users.map(u => ({ id: u.id, name: u.name, email: u.email })));
});

// --- MEDICAL HISTORY ---
router.get('/medical-history', (req, res) => {
  const db = readDb();
  res.json(db.medical_history || []);
});

router.post('/medical-history', (req, res) => {
  const { condition, diagnosedDate, notes } = req.body;
  const db = readDb();
  
  if (!db.medical_history) db.medical_history = [];

  const newRecord = {
    id: uuidv4(),
    condition,
    diagnosedDate,
    notes: notes || '',
    createdAt: new Date().toISOString()
  };
  
  db.medical_history.push(newRecord);
  writeDb(db);
  
  res.status(201).json(newRecord);
});

router.delete('/medical-history/:id', (req, res) => {
  const db = readDb();
  if (!db.medical_history) return res.status(404).json({ message: 'Not found' });
  
  const index = db.medical_history.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Not found' });
  
  const deleted = db.medical_history.splice(index, 1)[0];
  writeDb(db);
  
  res.json({ message: 'Deleted', record: deleted });
});

module.exports = router;