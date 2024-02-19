require('dotenv').config();
const { storage,admin } = require("../config/foirebaseconfig");
const connectToMongoose = require('../databaseconnection');
const { Storage } = require('@google-cloud/storage');
const jwt = require('jsonwebtoken');
const User=require("../models/user")
const axios = require('axios');


const projectId=process.env.cloud_project_id
const keyFilename='cloudstorage.json'
// console.log(keyFilename)
const st = new Storage({projectId,keyFilename});
const bucketName=process.env.bucket_name



const createUser=async(req,res)=>{
    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).send("Authorization token is missing");
        }
    
        let user;
        try {
            user = await admin.auth().verifyIdToken(token);
        } catch (verifyError) {
            console.error("Error verifying token:", verifyError);
            return res.status(401).send("Invalid token");
        }
    
        if (!user) {
            return res.status(401).send("User not authenticated");
        }
    
        const userId = user.uid;
        const name = user.name;
        const emailId = user.email;
        const picture = user.picture || null;
        const payload = {
            user_name: name,
            user_email: emailId,
            user_id: userId
        };
    
        try {
            const dataFromDatabase = await User.findOne({ userid: userId });
            if (dataFromDatabase) {
                return res.status(409).send("User already exists");
            } else {
                const key = process.env.token;
                const secret_key = jwt.sign(payload, key, { expiresIn: '4h' });
                console.log(secret_key);
                
                const remoteFileName = `image_user_id_${userId}`;
                const signedUrl = await uploadImageInCloudStorage(picture, remoteFileName);
                
                const newUser = {
                    "userid": userId,
                    "username": name,
                    "email": emailId,
                    "created_at": new Date(),
                    "img_url": signedUrl
                };
    
                await User.insertMany(newUser);
                return res.status(200).send(payload); // User created successfully
            }
        } catch (databaseError) {
            console.error("Error accessing database:", databaseError);
            return res.status(500).send("Internal server error");
        }
    } catch (error) {
        console.error("Unexpected error:", error);
        return res.status(500).send("Unexpected error");
    }
    
}

const updatephoto=async(req,res)=>{
    try {
        const { user_id } = req.user;
    
        if (!user_id) {
            return res.status(400).send("User ID is missing");
        }
    
        const image = req.file;
    
        if (!image) {
            return res.status(400).send("Image file is missing");
        }
    
        const bucket = st.bucket(bucketName);
        const remoteFileName = `image_user_id_${user_id}`;
    
        try {
            await bucket.file(remoteFileName).save(image.buffer, {
                contentType: image.mimetype,
            });
    
            const [signedUrl] = await bucket.file(remoteFileName).getSignedUrl({
                action: 'read',
                expires: '2030-12-31', // Adjust expiration date as needed
            });
    
            console.log('Image uploaded to GCS:', signedUrl);
    
            await User.updateOne({ userid: user_id }, { $set: { img_url: signedUrl } });
    
            return res.status(200).send("Image URL updated successfully");
        } catch (uploadError) {
            console.error("Error uploading image to cloud storage:", uploadError);
            return res.status(500).send("Error uploading image to cloud storage");
        }
    } catch (error) {
        console.error("Unexpected error:", error);
        return res.status(500).send("Unexpected error");
    }
    
}

const getUserInfo = async (req, res) => {
    try {
        const { user_id } = req.user;
    
        if (!user_id) {
            return res.status(400).send("User ID is missing");
        }
    
        try {
            const user = await User.findOne({ userid: user_id });
    
            if (!user) {
                return res.status(404).send("User not found");
            }
    
            console.log("User data:", user);
            return res.status(200).send(user);
        } catch (findError) {
            console.error("Error finding user:", findError);
            return res.status(500).send("Error finding user");
        }
    } catch (error) {
        console.error("Unexpected error:", error);
        return res.status(500).send("Unexpected error");
    }
    
    
  };

const deleteuser=async (req,res)=>{
    
    try {
        const { user_id } = req.user;
    
        if (!user_id) {
            return res.status(400).send("User ID is missing");
        }
    
        const currentUser = await User.findOne({ userid: user_id });
    
        if (!currentUser) {
            return res.status(404).send("User not found");
        }
    
        const profilePicUrl = currentUser.img_url;
    
        if (!profilePicUrl) {
            return res.status(404).send("Profile picture not found for the user");
        }
    
        const profilePicName = profilePicUrl.split("/").pop().split("?")[0];
        console.log("Profile picture name:", profilePicName);
    
        const bucket = st.bucket(bucketName);
        const file = bucket.file(profilePicName);
    
        try {
            await file.delete();
            console.log(`Profile picture deleted from GCP`);
    
            const deletedUser = await User.findOneAndDelete({ userid: user_id });
    
            if (deletedUser) {
                return res.status(200).send("User and profile picture deleted successfully");
            } else {
                return res.status(404).send("User not found in the database");
            }
        } catch (deleteError) {
            console.error(`Error deleting profile picture from GCP:`, deleteError);
            return res.status(500).send("Error deleting profile picture from GCP");
        }
    } catch (error) {
        console.error("Unexpected error:", error);
        return res.status(500).send("Unexpected error");
    }
    
   
}


// const home= async(req,res)=>{
//     console.log(req.headers)
//     const token = req.headers.authorization
//     console.log(token)
//     const user = await admin.auth().verifyIdToken(token);
//     if (user){
//         let client;
//         try {
//             client = await connectDB();
//             const database = client.db('vidya');
//             //Retrieve data from the "books" collection
//             const booksCollection = database.collection('books');
//             console.log(booksCollection)
//             const booksData = await booksCollection.find({}).toArray();
//             console.log('Retrieved data from books collection:', booksData);
//             return res.send(booksData)
    
//         }
//         catch (error) {
//             console.error('Error retrieving data from collections:', error);
//             throw error;
//         }
//         finally {
//             if (client) {
//                 client.close(); // Close the client connection when done
//             }

//     }
   
//     }else{
//         return res.send("not enough")
//     }
    
// }

// const userCreation=async (req,res)=>{

//     // console.log(req.headers)
//     const token = req.headers.authorization
//     const user = await admin.auth().verifyIdToken(token);
//     if (user){
//         const userId = user.uid;
//         const name = user.name;
//         const emailId = user.email;
//         const picture = user.picture || null;
//         const payload={
//             user_name:name,
//             user_email:emailId,
//             user_id:userId
//         }
//         const key=process.env.token

//         const secert_key=jwt.sign(payload, key, { expiresIn: '1h' });
//         console.log(secert_key)

//         return res.send(payload)


        
//     }
//     else{
//         return res.send("good bye")
//     }
// }


const re=async (req,res)=>{
    console.log("prinrt")
    console.log(keyFilename)
    const {user_id}=req.user
    console.log(req.file)

    
    try{
        const file=req.file
        if (!file){
            return res.status(400).send('No file uploaded.');
        }
        const bucket = st.bucket(bucketName);
        const remoteFileName=`image_user_id_${user_id}_create_on_${new Date()}`
        await bucket.file(remoteFileName).save(file.buffer, {
            contentType: file.mimetype,
        });
        const [signedUrl] = await bucket.file(remoteFileName).getSignedUrl({
            action: 'read',
            expires: '2030-12-31', // Adjust expiration date as needed
        });
        console.log('Image uploaded to GCS:', signedUrl);
        res.json({ signedUrl });

    }catch(error){
        console.error('Error uploading image to GCS:', error);
        return res.send('Error uploading image to GCS');

    }
    
    

}





// const st = new Storage();

const uploadImageInCloudStorage=async ( picture, remoteFileName)=>{
    
    try{
        const response = await axios.get(picture, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data, 'binary');

        const bucket = st.bucket(bucketName);
        const file = bucket.file(remoteFileName);
        await file.save(imageBuffer, {
            metadata: { contentType: response.headers['content-type'] },
        });

        const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: '2030-12-31', // Adjust expiration date as needed
        });
        // console.log('Image uploaded to GCS:', signedUrl);

        return signedUrl

    }catch(error){
        console.log(error)

    }

    


}





    

    
//     try{
//     //     const bucket = st.bucket(bucketName);
//     //     const response = await fetch(picture);
//     //     await bucket.file(remoteFileName).save(response.buffer, {
//     //     contentType: response.mimetype,
//     // });
//     const file = .file(remoteFileName);
//     const response = await fetch(picture);
//     const pictureBuffer = await response.buffer();
//     await file.save(pictureBuffer);
//     const [gcsPictureUrl] = await file.getSignedUrl({
//         action: "read",
//         expires: "2030-01-01",
//       });
    
    
  
// //   const [signedUrl] = await bucket.file(remoteFileName).getSignedUrl({
// //         action: 'read',
// //         expires: '2030-12-31', // Adjust expiration date as needed
// //     });
//     console.log('Image uploaded to GCS:', signedUrl);
//     return gcsPictureUrl
// //     }
//     catch(error){
//         console.error('Error uploading image to GCS:', error);
        

//     }
    








module.exports={createUser,updatephoto,getUserInfo,deleteuser};