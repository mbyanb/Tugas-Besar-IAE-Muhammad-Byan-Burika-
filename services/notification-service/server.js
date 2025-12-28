const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// In-Memory Database untuk Pengingat
let reminders = [];

// 1. GET Reminders (Filter by User)
app.get('/reminders', (req, res) => {
    const userId = req.headers['x-user-id'] || req.query.userId;
    const userReminders = userId ? reminders.filter(r => r.userId === userId) : reminders;
    res.json(userReminders);
});

// 2. CREATE Reminder
app.post('/reminders', (req, res) => {
    const { userId, title, time, type } = req.body;
    
    if (!title || !time) return res.status(400).json({ message: 'Title and time required' });

    const newReminder = {
        id: uuidv4(),
        userId,
        title,
        time, // Format "14:30"
        type: type || 'general',
        active: true,
        createdAt: new Date()
    };

    reminders.push(newReminder);
    console.log(`✅ [SET] Reminder set for user ${userId} at ${time}: ${title}`);
    res.status(201).json(newReminder);
});

// 3. DELETE Reminder
app.delete('/reminders/:id', (req, res) => {
    reminders = reminders.filter(r => r.id !== req.params.id);
    res.json({ message: 'Reminder deleted' });
});

// --- WORKER: CRON JOB (Cek setiap menit) ---
cron.schedule('* * * * *', () => {
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHours}:${currentMinutes}`;

    console.log(`⏰ Checking reminders for time: ${currentTime}...`);

    reminders.forEach(r => {
        if (r.active && r.time === currentTime) {
            sendNotification(r);
        }
    });
});

function sendNotification(reminder) {
    // Simulasi Log Notifikasi ke Terminal
    console.log(`\n=================================================`);
    console.log(`🔔 RING RING! NOTIFICATION FOR USER ${reminder.userId}`);
    console.log(`📝 Message: ${reminder.title}`);
    console.log(`🕒 Time: ${reminder.time}`);
    console.log(`=================================================\n`);
}

app.listen(PORT, () => {
    console.log(`🔔 Notification Service running on port ${PORT}`);
});