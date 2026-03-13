const jwt = require('jsonwebtoken')
const util = require('util')
//Abo Sofyan
async function authentication (req, res, next){

    let {token} = req.headers

    if(!token){
        res.status(401).json({message:"Please login first"})
    }

    try{

        let decodedToken = await util.promisify(jwt.verify)(token, process.env.SECRET_KEY)
        console.log(decodedToken);
        req.user = {
        id: decodedToken.id,
        role: decodedToken.role
    };
        // req.userId =decodedToken.id
        // req.role = decodedToken.role

        console.log(decodedToken)

        next()
        

    }catch(error){
        res.status(401).json({message:"you are not authenticated try again"})
    }


}

let authorization = (...roles)=>{

    return (req, res, next)=>{
        if(!roles.includes(req.role)){
            return res.status(403).json({message: "You are not authorized to do this action"})
        }

        next()
    }
}

module.exports = {authentication, authorization}