const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { connectToDb, getDb } = require('./db');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 4084;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve static HTML pages
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'products.html'));
});

app.get('/add-product', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'add-product.html'));
});

app.get('/manage-products', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'manage-products.html'));
});

app.get('/account', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'account.html'));
});

// Handle form submission from /signup
app.post('/signup', async (req, res) => {
    const { name, email, phone, password, confirmPassword } = req.body;

    // Simple validation
    if (!name || !email || !password || !confirmPassword) {
        return res.status(400).send('Please enter all fields');
    }

    if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).send('Invalid email format');
    }

    const db = getDb();

    try {
        // Check if user already exists
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return res.redirect('/login');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user into database
        await db.collection('users').insertOne({
            name,
            email,
            phone,
            password: hashedPassword,
            createdAt: new Date()
        });

        res.redirect('/login?message=Registered successfully');
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
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Invalid credentials');
        }

        res.redirect('/products');
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).send('Server Error');
    }
});

// API to get products
app.get('/api/products', async (req, res) => {
    const db = getDb();
    try {
        const products = await db.collection('products').find().toArray();
        res.json(products);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).send('Server Error');
    }
});

// API to add a new product
app.post('/api/products', async (req, res) => {
    const { name, description, quantity, imageUrl } = req.body;

    if (!name || !description || !quantity || !imageUrl) {
        return res.status(400).send('Please enter all fields');
    }

    const db = getDb();

    try {
        await db.collection('products').insertOne({
            name,
            description,
            quantity: parseInt(quantity, 10),
            imageUrl,
            createdAt: new Date()
        });

        res.status(201).send('Product added successfully');
    } catch (err) {
        console.error('Error adding product:', err);
        res.status(500).send('Server Error');
    }
});

// API to update a product
app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, quantity, imageUrl } = req.body;

    if (!name || !description || !quantity || !imageUrl) {
        return res.status(400).send('Please enter all fields');
    }

    const db = getDb();
    const { ObjectId } = require('mongodb');

    try {
        const result = await db.collection('products').updateOne(
            { _id: new ObjectId(id) },
            { $set: { name, description, quantity: parseInt(quantity, 10), imageUrl } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).send('Product not found');
        }

        res.send('Product updated successfully');
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).send('Server Error');
    }
});

// API to delete a product
app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { ObjectId } = require('mongodb');

    if (!ObjectId.isValid(id)) {
        return res.status(400).send('Invalid product ID');
    }

    const db = getDb();

    try {
        const result = await db.collection('products').deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).send('Product not found');
        }

        res.send('Product deleted successfully');
    } catch (err) {
        console.error('Error deleting product:', err);
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
