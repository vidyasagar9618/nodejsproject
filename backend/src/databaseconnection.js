require('dotenv').config();
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const mongooseUri=process.env.uri

const connectToMongoose = async () => {
    try {
        await mongoose.connect(mongooseUri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB using Mongoose');
    } catch (error) {
        console.error('Error connecting to MongoDB using Mongoose:', error);
    }
};

module.exports = connectToMongoose;
