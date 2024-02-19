require('dotenv').config();
const { storage,admin } = require("../config/foirebaseconfig");
const connectToMongoose = require('../databaseconnection');
const { Storage } = require('@google-cloud/storage');
const { v4: uuidv4 } = require('uuid');

const User=require("../models/user")
const Post=require("../models/post")
const axios = require('axios');


const projectId=process.env.cloud_project_id
const keyFilename='cloudstorage.json'
// console.log(keyFilename)
const st = new Storage({projectId,keyFilename});
const bucketName=process.env.bucket_name


const creationOfPost=async(req,res)=>{
   
    try {
        const { user_id, user_name } = req.user;
    
        if (!user_id || !user_name) {
            return res.status(400).send("User ID or username is missing");
        }
    
        const image = req.file;
    
        if (!image) {
            return res.status(400).send("Image file is missing");
        }
    
        const bucket = st.bucket(bucketName);
        const uniqueId = uuidv4();
        const remoteFileName = `image_user_id_${user_id}_post_images_${uniqueId}.jpg`;
    
        await bucket.file(remoteFileName).save(image.buffer, {
            contentType: image.mimetype,
        });
    
        const [signedUrl] = await bucket.file(remoteFileName).getSignedUrl({
            action: 'read',
            expires: '2030-12-31', // Adjust expiration date as needed
        });
    
        const imageUrl = signedUrl;
    
        const newPost = {
            "user_id": user_id,
            "username": user_name,
            "created_at": new Date(),
            "imageUrl": imageUrl,
            "likes": [],
            "comments": []
        };
    
        await Post.insertMany(newPost);
        return res.status(200).send("Post created successfully");
    } catch (error) {
        console.error("Error uploading post image or creating post:", error);
        return res.status(500).send("Internal server error");
    }
    
    
}
const addLike=async(req,res)=>{
    try {
        const { user_id } = req.user;
        const post_Id = req.params.imageId;
    
        if (!user_id || !post_Id) {
            return res.status(400).send("User ID or post ID is missing");
        }
    
        const posted_user = await Post.findOne({ _id: post_Id, 'likes.user_id': user_id });
    
        if (posted_user) {
            // User already liked the post, so remove the like
            const post = await Post.findOne({ _id: post_Id });
            post.likes = post.likes.filter(like => like.user_id !== user_id);
            await post.save();
            return res.status(200).send("Successfully disliked");
        } else {
            
            await Post.findOneAndUpdate(
                { _id: post_Id },
                { $push: { likes: { user_id: user_id, createdAt: new Date() } } },
                { new: true }
            );
            return res.status(200).send("Successfully liked");
        }
    } catch (error) {
        console.error("Error liking/disliking post:", error);
        return res.status(500).send("Internal server error");
    }
    

}

const addComment=async(req,res)=>{


    const { user_id } = req.user;
const post_Id = req.params.imageId;
const data = req.body;
const { comment } = data;

try {
    if (!comment) {
        return res.status(400).send("Please provide a comment");
    }

    const posted_user = await Post.findOne({ _id: post_Id });

    if (posted_user) {
        await Post.findOneAndUpdate(
            { _id: post_Id },
            { $push: { comments: { user_id: user_id, createdAt: new Date(), comment: comment } } },
            { new: true }
        );
        return res.status(200).send("Successfully added comment");
    } else {
        console.log("Post not found with ID:", post_Id);
        return res.status(404).send("Post not found");
    }
} catch (error) {
    console.error("Error adding comment:", error);
    return res.status(500).send("Internal server error");
}


    
}

const deletepost=async(req,res)=>{
    
    const post_Id = req.params.imageId;

    try {
        const posted_user = await Post.findOne({ _id: post_Id });
    
        if (!posted_user) {
            return res.status(404).json({ message: 'Post not found' });
        }
    
        const fileName = posted_user.imageUrl.split("/").pop().split("?")[0];
        console.log(fileName);
    
        const deletedPost = await Post.findOneAndDelete({ _id: post_Id });
    
        if (!deletedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }
    
        const bucket = st.bucket(bucketName);
        const file = bucket.file(fileName);
        await file.delete();
    
        return res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
    


}

const getAllPosts=async(req,res)=>{
    try {
        const result = await Post.aggregate([
            {
                $project: {
                    user_id: 1,
                    username: 1,
                    created_at: 1,
                    imageUrl: 1,
                    likescount: { $size: "$likes" },
                    commentscount: { $size: "$comments" }
                }
            }
        ]);
    
        if (result.length === 0) {
            return res.status(404).send("No posts found");
        }
    
        return res.status(200).send(result);
    } catch (error) {
        console.error("Error fetching posts:", error);
        return res.status(500).send("Internal server error");
    }
    
}

const updateImagePost=async(req,res)=>{
    try {
        const { user_id } = req.user;
    
        if (!user_id) {
            return res.status(400).send("User ID is missing");
        }
    
        const image = req.file;
    
        if (!image) {
            return res.status(400).send("Image file is missing");
        }
    
        const post_Id = req.params.imageId;
        const posted_user = await Post.findOne({ _id: post_Id });
    
        if (!posted_user) {
            return res.status(404).json({ message: 'Post not found' });
        }
    
        const bucket = st.bucket(bucketName);
        const fileName = posted_user.imageUrl.split("/").pop().split("?")[0];
    
        await bucket.file(fileName).save(image.buffer, {
            contentType: image.mimetype,
        });
    
        const [signedUrl] = await bucket.file(fileName).getSignedUrl({
            action: 'read',
            expires: '2030-12-31',
        });
    
        await Post.updateOne({ _id: post_Id}, { $set: { imageUrl: signedUrl } });
    
        return res.status(200).send("Image updated successfully");
    
    } catch(error) {
        console.error("Error updating image:", error);
        return res.status(500).send("Internal server error");
    }
    
}

module.exports={creationOfPost,addLike,addComment,deletepost,getAllPosts,updateImagePost}