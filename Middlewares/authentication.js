const jwt = require('jsonwebtoken')
const util = require('util')
//Abo Sofyan
async function authentication (req, res, next){

    let {token} = req.headers

    if(!token){
        return res.status(401).json({message:"Please login first"})
    }

    try{

        let decodedToken = await util.promisify(jwt.verify)(token, process.env.SECRET_KEY)
        console.log(decodedToken);

        // Attach user info in a consistent way
        req.user = {
            id: decodedToken.id,
            role: decodedToken.role
        };

        // Backward compatibility for old code paths
        req.userId = decodedToken.id;
        req.role = decodedToken.role;

        console.log(decodedToken)

        return next()
        

    }catch(error){
        return res.status(401).json({message:"you are not authenticated try again"})
    }


}

let authorization = (...roles)=>{

    return (req, res, next)=>{
        if(!roles.includes(req.user.role)){
            return res.status(403).json({message: "You are not authorized to do this action"})
        }

        next()
    }
}

module.exports = {authentication, authorization}