const express = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../db');

const router = express.Router();

// Fetch all products
router.get('/', async (req, res) => {
    const db = getDb();
    try {
        const products = await db.collection('products').find().toArray();
        res.json(products);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).send('Server Error');
    }
});

// Add a new product
router.post('/', async (req, res) => {
    const { name, description, quantity, imageUrl } = req.body;
    const db = getDb();
    try {
        await db.collection('products').insertOne({ name, description, quantity, imageUrl });
        res.status(201).send('Product added successfully');
    } catch (err) {
        console.error('Error adding product:', err);
        res.status(500).send('Server Error');
    }
});

// Update a product
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, quantity, imageUrl } = req.body;
    const db = getDb();
    try {
        await db.collection('products').updateOne(
            { _id: new ObjectId(id) },
            { $set: { name, description, quantity, imageUrl } }
        );
        res.send('Product updated successfully');
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).send('Server Error');
    }
});

// Delete a product
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const db = getDb();
    try {
        await db.collection('products').deleteOne({ _id: new ObjectId(id) });
        res.send('Product deleted successfully');
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
