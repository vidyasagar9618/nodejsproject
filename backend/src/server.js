const express=require("express")
require('dotenv').config();
const connectToMongoose = require('./databaseconnection.js');
const usercon=require("./controller/user.js")
const verifyjwttoken=require('./controller/user.js')
const verification=require('./jwt_verification/index.js')
const app=express();
app.use(express.json())
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

const postUrls=require("./controller/post.js")


const port=process.env.port

connectToMongoose()

app.get("/",usercon.createUser);
app.get("/singleuser",verification.verifyingJwtToken,usercon.getUserInfo);
app.put("/updateUserProfilePhote",upload.single('image'),verification.verifyingJwtToken,usercon.updatephoto)
app.delete("/deleteuser",verification.verifyingJwtToken,usercon.deleteuser)


// post urls
app.post("/addpost",upload.single('image'),verification.verifyingJwtToken,postUrls.creationOfPost)
app.post("/addlike/:imageId",verification.verifyingJwtToken,postUrls.addLike)
app.post("/addcomment/:imageId",verification.verifyingJwtToken,postUrls.addComment)
app.delete("/deletepost/:imageId",verification.verifyingJwtToken,postUrls.deletepost)
app.get("/getallposts",postUrls.getAllPosts)
app.put('/updateimage/:imageId',upload.single('image'),verification.verifyingJwtToken,postUrls.updateImagePost)


app.listen(port,()=>{
    console.log(`server running on port ${port}`)
})

