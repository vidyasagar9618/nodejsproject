const jwt = require('jsonwebtoken');

require('dotenv').config();

const key=process.env.token

const verifyingJwtToken=(req,res,next)=>{
    console.log("vidya")
    try{
        let jwtToken;
        jwtToken = req.headers.authorization;
        if (jwtToken){
            try{
                const decoded = jwt.verify(jwtToken, key)
                console.log(decoded)
                req.user=decoded
                next();
            }catch(error){
                if (error==='TokenExpiredError'){
                    res.status(401).json({ error: "jwt token is not their" });
                }else{
                    res.status(401).json({ error: "Invalid token"});
                }

            }

        }else{
            res.status(401).json({ error: "jwt token is not their" });
        }

    }catch(error){
        res.status(500).json({ error: "Internal Server Error" });


    }
    
};

module.exports={verifyingJwtToken};