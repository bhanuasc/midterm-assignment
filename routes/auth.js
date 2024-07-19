const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const validator = require('validator');
const { getDb } = require('../db'); // Adjust path as necessary

// Signup route
router.post('/signup', async (req, res) => {
    const { name, email, phone, password, confirmPassword, gender } = req.body;

    // Simple validation
    if (!name || !email || !password || !confirmPassword || !gender) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    const db = getDb();

    try {
        // Check if user already exists
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user into database
        const result = await db.collection('users').insertOne({
            name,
            email,
            phone,
            password: hashedPassword,
            
            createdAt: new Date()
        });

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Simple validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    const db = getDb();

    try {
        // Check if user exists
        const user = await db.collection('users').findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User does not exist' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        res.json({ message: 'Login successful' });
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
