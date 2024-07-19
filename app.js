const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { connectToDb, getDb } = require('./db'); // Import getDb here
const authRoutes = require('./routes/auth'); // Authentication routes

const app = express();
const PORT = 4084;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // To handle form submissions
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' directory

// Serve static HTML pages
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html')); // Serve home page
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Handle form submission from /signup
app.post('/signup', async (req, res) => {
    const { name, email, phone, password, confirmPassword, gender } = req.body;

    // Simple validation
    if (!name || !email || !password || !confirmPassword || !gender) {
        return res.status(400).send('Please enter all fields');
    }

    if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { // Simple email validation
        return res.status(400).send('Invalid email format');
    }

    const db = getDb();

    try {
        // Check if user already exists
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(400).send('User already exists');
        }

        // Hash password
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user into database
        await db.collection('users').insertOne({
            name,
            email,
            phone,
            password: hashedPassword,
            gender,
            createdAt: new Date()
        });

        res.status(201).send('User registered successfully');
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).send('Server Error');
    }
});

// Handle form submission from /login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Simple validation
    if (!email || !password) {
        return res.status(400).send('Please enter all fields');
    }

    const db = getDb();

    try {
        // Check if user exists
        const user = await db.collection('users').findOne({ email });
        if (!user) {
            return res.status(400).send('User does not exist');
        }

        // Validate password
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Invalid credentials');
        }

        res.send('Login successful');
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).send('Server Error');
    }
});

// Connect to MongoDB and start server
connectToDb()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Failed to connect to database:', err);
    });

module.exports = app;
