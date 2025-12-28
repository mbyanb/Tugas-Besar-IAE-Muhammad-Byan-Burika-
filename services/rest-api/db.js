// File: services/rest-api/db.js
const jsonfile = require('jsonfile');
const path = require('path');
const fs = require('fs');
const forge = require('node-forge');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'db.json');

// --- 1. ADMIN DEFAULT ---
const defaultAdmin = {
  id: 'admin-id-001',
  name: 'Super Admin',
  email: 'admin@vitaltrack.com',
  role: 'admin',
  createdAt: new Date().toISOString()
};

// --- 2. DEFAULTS (FITUR LAMA TETAP DISIMPAN) ---
const defaults = {
  users: [],
  // Kita kembalikan 'teams' agar fitur asli tidak error jika nanti dipakai
  teams: [
    { id: 't1', name: 'Frontend Engineers', members: [] },
    { id: 't2', name: 'Backend Engineers', members: [] }
  ],
  medical_history: [],
  publicKey: null,
  privateKey: null
};

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

let db;
try {
  db = jsonfile.readFileSync(dbPath);
} catch (error) {
  console.log('No db.json found, creating one with defaults...');
  jsonfile.writeFileSync(dbPath, defaults, { spaces: 2 });
  db = defaults;
}

// --- 3. PASTIKAN ADMIN ADA ---
const ensureAdmin = async () => {
    const adminExists = db.users.find(u => u.email === defaultAdmin.email);
    if (!adminExists) {
        console.log('Creating default Admin account...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        const newAdmin = { ...defaultAdmin, password: hashedPassword };
        db.users.push(newAdmin);
        
        try {
            jsonfile.writeFileSync(dbPath, db, { spaces: 2 });
            console.log('✅ Admin created: admin@vitaltrack.com / admin123');
        } catch (e) { console.error('Failed to save admin', e); }
    }
};
ensureAdmin();

// --- 4. RSA KEYS ---
if (!db.publicKey || !db.privateKey) {
  console.log('Generating RSA keys...');
  const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
  db.publicKey = forge.pki.publicKeyToPem(keypair.publicKey);
  db.privateKey = forge.pki.privateKeyToPem(keypair.privateKey);
  try { jsonfile.writeFileSync(dbPath, db, { spaces: 2 }); } catch (e) {}
}

module.exports = {
  readDb: () => { try { return jsonfile.readFileSync(dbPath); } catch (e) { return db; } },
  writeDb: (data) => { try { jsonfile.writeFileSync(dbPath, data, { spaces: 2 }); db = data; } catch (e) {} },
};