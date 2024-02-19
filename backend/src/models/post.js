const mongoose = require('mongoose');

// Define Post Schema
const postSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    likes: [{
        user_id: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    comments: [{
        user_id: {
            type: String,
            required: true
        },
        comment: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
});

// Create Post model based on schema
const Post = mongoose.model('Post', postSchema);

module.exports = Post;