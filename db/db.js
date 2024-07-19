const { MongoClient } = require('mongodb');
require('dotenv').config(); // Import dotenv to load environment variables

// MongoDB connection URI from environment variables
const uri = 'mongodb+srv://bhanudb:bhanudb@ecommerce.ugrcsly.mongodb.net/?retryWrites=true&w=majority'; // Replace <password> with your actual password
const dbName = 'mid-term-e-commerce'; // Your database name

let db;

async function connectToDb() {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        // Connect to MongoDB
        await client.connect();
        console.log('Connected to MongoDB Atlas');

        // Select database
        db = client.db(dbName);
    } catch (err) {
        console.error('Error connecting to MongoDB Atlas:', err);
        throw err;
    }
}

function getDb() {
    if (!db) {
        throw new Error('Database not connected');
    }
    return db;
}

module.exports = { connectToDb, getDb };
