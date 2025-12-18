// File: services/rest-api/db.js

const jsonfile = require('jsonfile');
const path = require('path');
const fs = require('fs');
const forge = require('node-forge'); // Import library crypto

// Path ke folder data (yang akan kita mount)
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'db.json');

// Data default jika file tidak ada
const defaults = {
  users: [],
  teams: [
    { id: 't1', name: 'Frontend Engineers', members: [] },
    { id: 't2', name: 'Backend Engineers', members: [] }
  ],
  publicKey: null,
  privateKey: null
};

// Pastikan folder 'data' ada
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Inisialisasi DB
let db;
try {
  // Coba baca file
  db = jsonfile.readFileSync(dbPath);
} catch (error) {
  // Jika file tidak ada (atau error), buat file dengan data default
  console.log('No db.json found, creating one with defaults...');
  jsonfile.writeFileSync(dbPath, defaults, { spaces: 2 });
  db = defaults;
}

// === LOGIKA GENERATE KUNCI ===
// Cek apakah kunci perlu dibuat
if (!db.publicKey || !db.privateKey) {
  console.log('Generating new 2048-bit RSA key pair...');
  
  // Buat kunci RSA 2048-bit
  const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
  const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
  const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);

  // Simpan kunci ke objek 'db'
  db.publicKey = publicKeyPem;
  db.privateKey = privateKeyPem;

  // Tulis kembali ke file db.json
  try {
    jsonfile.writeFileSync(dbPath, db, { spaces: 2 });
    console.log('✅ New RSA keys generated and saved to /app/data/db.json');
  } catch (e) {
    console.error('CRITICAL: Failed to save generated keys!', e);
  }
} else {
  console.log('Keys loaded from existing db.json.');
}

// Ekspor fungsi untuk membaca dan menulis
module.exports = {
  readDb: () => {
    try {
      // Selalu baca versi terbaru dari file
      return jsonfile.readFileSync(dbPath);
    } catch (e) {
      console.error('Error reading db.json:', e);
      return db; // Kembalikan dari memori jika gagal baca
    }
  },
  writeDb: (data) => {
    try {
      jsonfile.writeFileSync(dbPath, data, { spaces: 2 });
      // Perbarui juga 'db' di memori
      db = data;
    } catch (e) {
      console.error('Error writing to db.json:', e);
    }
  },
};