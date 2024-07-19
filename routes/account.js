const express = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../db');

const router = express.Router();

// Fetch account details
router.get('/', async (req, res) => {
    const db = getDb();
    try {
        const user = await db.collection('users').findOne({ _id: new ObjectId(req.query.userId) });
        res.json({ name: user.name, email: user.email, phone: user.phone });
    } catch (err) {
        console.error('Error fetching account details:', err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
