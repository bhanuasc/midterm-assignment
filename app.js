const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { connectToDb, getDb } = require('./db');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

require('dotenv').config();

// MongoDB session store
const mongoStore = MongoStore.create({
    mongoUrl: process.env.MONGO_URI, // Use environment variable for MongoDB URI
    collectionName: 'sessions'
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: mongoStore,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Middleware to protect routes
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};

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

// Protect routes
app.get('/products', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'products.html'));
});

app.get('/add-product', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'add-product.html'));
});

app.get('/manage-products', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'manage-products.html'));
});

app.get('/account', isAuthenticated, (req, res) => {
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
            return res.redirect('/signup?message=User does not exist, please sign up');
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Invalid credentials');
        }

        // Store user ID in session
        req.session.userId = user._id;
        res.redirect('/products');
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).send('Server Error');
    }
});

// Endpoint to fetch all products
app.get('/api/products', isAuthenticated, async (req, res) => {
    const db = getDb();

    try {
        const products = await db.collection('products').find().toArray();
        res.json(products);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).send('Server Error');
    }
});

app.post('/api/products', async (req, res) => {
    const { name, description, quantity, imageUrl, category, price } = req.body;

    // Validate input fields (consider using a validation library like joi)
    if (!name || !description || !quantity || !imageUrl || !category || !price) {
        return res.status(400).send('Please enter all required fields');
    }

    // Connect to database
    const db = getDb();
    const collection = db.collection('products'); // Use collection name from environment variable

    try {
        // Parse quantity and price as numbers
        const parsedQuantity = parseInt(quantity, 10);
        if (isNaN(parsedQuantity)) {
            return res.status(400).send('Invalid quantity format');
        }

        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice)) {
            return res.status(400).send('Invalid price format');
        }

        const newProduct = {
            name,
            description,
            quantity: parsedQuantity,
            imageUrl,
            category,
            price: parsedPrice,
        };

        // Insert the new product into the database
        const result = await collection.insertOne(newProduct);
        res.status(201).send('Product added successfully'); // Specific success message
    } catch (err) {
        console.error('Error adding product:', err.message);
        res.status(500).send('Server Error'); // More specific error message for client
    }
});

// Endpoint to update an existing product
app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, quantity, imageUrl, category, price } = req.body;

    if (!name || !description || !quantity || !imageUrl || !category || !price) {
        return res.status(400).send('Please enter all fields');
    }

    const db = getDb();

    try {
        const result = await db.collection('products').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    name,
                    description,
                    quantity: parseInt(quantity, 10),
                    imageUrl,
                    category,
                    price: parseFloat(price)
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).send('Product not found');
        }

        const updatedProduct = await db.collection('products').findOne({ _id: new ObjectId(id) });
        res.json(updatedProduct);
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).send('Server Error');
    }
});

// Endpoint to delete a product
app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;

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

// API to get account details
app.get('/api/account', isAuthenticated, async (req, res) => {
    const userId = req.session.userId;

    if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
        return res.status(400).send('Invalid user ID');
    }

    const db = getDb();

    try {
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        if (!user) {
            return res.status(404).send('User not found');
        }

        res.json(user);
    } catch (err) {
        console.error('Error fetching account details:', err);
        res.status(500).send('Server Error');
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Failed to logout');
        }
        res.redirect('/login');
    });
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
