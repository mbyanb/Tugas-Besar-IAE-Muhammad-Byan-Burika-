const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = 5002;

app.use(cors());
app.use(express.json());

// URL Notification Service (untuk kirim notif setelah beli)
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:5001';

// Data Dummy Produk
let products = [
    { id: 'p1', name: 'CDR (Calcium-D-Redoxon)', price: 65000, stock: 50, category: 'Vitamin' },
    { id: 'p2', name: 'Sanmol Tablet (Strip)', price: 4000, stock: 100, category: 'Demam' },
    { id: 'p3', name: 'Mefinal 500mg', price: 18000, stock: 30, category: 'Nyeri' },
    { id: 'p4', name: 'Tolak Angin (Box)', price: 45000, stock: 40, category: 'Herbal' },
    { id: 'p5', name: 'Minyak Kayu Putih Cap Lang', price: 28000, stock: 25, category: 'Topikal' },
    { id: 'p6', name: 'Promag (Blister)', price: 9000, stock: 60, category: 'Lambung' }
];

let orders = [];

// 1. GET Products (Katalog)
app.get('/products', (req, res) => {
    res.json(products);
});

// 2. POST Order (Beli Barang)
app.post('/orders', async (req, res) => {
    const { userId, productId, quantity } = req.body;
    
    const product = products.find(p => p.id === productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.stock < quantity) return res.status(400).json({ message: 'Out of stock' });

    // Kurangi Stok
    product.stock -= quantity;

    const newOrder = {
        id: `ord-${Date.now()}`,
        userId,
        productName: product.name,
        qty: quantity,
        total: product.price * quantity,
        date: new Date()
    };
    orders.push(newOrder);

    // --- INTEGRASI: Panggil Notification Service ---
    // Agar user dapat notifikasi "Pesanan Berhasil" di Dashboard
    try {
        await axios.post(`${NOTIFICATION_SERVICE_URL}/reminders`, {
            userId,
            title: `Order Confirmed: ${product.name}`,
            time: new Date().toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'}), // Set ke waktu sekarang
            type: 'general'
        });
        console.log("✅ Notification sent to user");
    } catch (err) {
        console.log("⚠️ Order success, but failed to send notification.");
    }

    res.status(201).json(newOrder);
});

// 3. GET My Orders (History Belanja)
app.get('/orders', (req, res) => {
    const userId = req.headers['x-user-id'] || req.query.userId;
    const myOrders = orders.filter(o => o.userId === userId);
    res.json(myOrders);
});

app.listen(PORT, () => {
    console.log(`🛒 Order Service running on port ${PORT}`);
});