const jwt = require('jsonwebtoken')
const util = require('util')

async function authentication(req, res, next) {
    // Support both standard "Authorization: Bearer <token>" and legacy "token: <token>" header
    let token = req.headers['authorization']?.split(' ')[1] || req.headers['token'];

    if (!token) {
       return res.status(401).json({ message: "Please login first" })
    }

    try {
        let decodedToken = await util.promisify(jwt.verify)(token, process.env.SECRET_KEY)
        console.log(decodedToken);
        req.user = {
        id: decodedToken.id,
        role: decodedToken.role
    };

        // console.log(decodedToken)

        next()
    } catch (error) {
        console.log(error)
        res.status(401).json({ message: "you are not authenticated try again" })
    }
}

let authorization = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "You are not authorized to do this action" })
        }
        next()
    }
}

module.exports = { authentication, authorization }
