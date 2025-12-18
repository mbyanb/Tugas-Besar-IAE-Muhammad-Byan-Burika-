// File: api-gateway/server.js

const express = require('express');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1. Konfigurasi URL Service (DISESUAIKAN UNTUK DOCKER) ---
// Kita ubah default-nya agar mengarah ke nama container docker, bukan localhost
const USER_SERVICE_URL = process.env.REST_API_URL || 'http://rest-api:4000';
const TASK_SERVICE_URL = process.env.GRAPHQL_API_URL || 'http://graphql-api:4000';

// --- 2. Penyimpanan Public Key ---
let PUBLIC_KEY = null; 

// Fungsi mengambil public key dari Backend untuk verifikasi token
const fetchPublicKey = async () => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/api/auth/public-key`);
    PUBLIC_KEY = response.data.publicKey;
    console.log('🔑 Public key fetched successfully from User Service.');
  } catch (error) {
    console.error('❌ Failed to fetch public key. Retrying in 5 seconds...');
    setTimeout(fetchPublicKey, 5000); 
  }
};

// --- 3. Middleware Security ---
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3002', 
    'http://frontend-app:3002'
  ],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);
app.use(express.json());

// --- 4. Middleware Verifikasi JWT ---
const checkJwt = (req, res, next) => {
  // Lewati cek jika public key belum ada (sedang startup)
  if (!PUBLIC_KEY) {
    return res.status(503).json({ error: 'Service unavailable. Public key not yet fetched.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; 
  if (!token) {
    return res.status(401).json({ error: 'Malformed token' });
  }

  jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = decoded;
    next();
  });
};

const forwardUser = (proxyReq, req, res) => {
  if (req.user) {
    proxyReq.setHeader('x-user-id', req.user.id);
    proxyReq.setHeader('x-user-email', req.user.email);
    proxyReq.setHeader('x-user-name', req.user.name);
  }
};

// --- 5. Proxy Routes (DIPERBARUI) ---

// A. Auth (Public)
app.use('/api/auth', createProxyMiddleware({
  target: USER_SERVICE_URL,
  changeOrigin: true,
  onProxyReq: fixRequestBody, 
  onError: (err, req, res) => res.status(502).json({ error: 'Auth service down' })
}));

// B. Users (Protected)
app.use('/api/users', checkJwt, createProxyMiddleware({
  target: USER_SERVICE_URL,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    forwardUser(proxyReq, req, res);
    fixRequestBody(proxyReq, req, res);
  },
}));

// C. Medical History (BARU - Protected)
// Menggantikan route /api/teams yang lama
app.use('/api/medical-history', checkJwt, createProxyMiddleware({
  target: USER_SERVICE_URL,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    forwardUser(proxyReq, req, res);
    fixRequestBody(proxyReq, req, res);
  },
}));

// D. GraphQL (Protected)
app.use('/graphql', checkJwt, createProxyMiddleware({
  target: TASK_SERVICE_URL,
  changeOrigin: true,
  ws: true,
  onProxyReq: (proxyReq, req, res) => {
    forwardUser(proxyReq, req, res);
    fixRequestBody(proxyReq, req, res);
  },
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    services: { user: USER_SERVICE_URL, task: TASK_SERVICE_URL },
    publicKeyReady: !!PUBLIC_KEY
  });
});

// Start
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  fetchPublicKey(); // Panggil fungsi fetch saat start
});