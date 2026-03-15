const express = require('express')
const passport = require('passport')
require('../config/passport')

const Router = express.Router()

let { authentication, authorization } = require('../Middlewares/authentication')
let { registerUser, verifyEmail, getUsersNames, updateUser, deleteUser, login, updatePassword, forgetPassword, getUserById, verifyEmailAndResetPassword, googleAuthCallback } = require('../controllers/user')


Router.post('/signup', registerUser)
Router.post('/verify-email', verifyEmail)
Router.post('/login', login)


// Google OAuth routes .. Abo Sofyan
Router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

Router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    googleAuthCallback
)

Router.patch("/forget-password", forgetPassword)
Router.patch('/verify-password', verifyEmailAndResetPassword)


//أي مسار هيتكتب تحت السطر ده، الـ Express هيفهم أوتوماتيكياً إنه "محمي" ولازم يعدي على الـ Middleware بتاع الـ Authentication الأول.
//لسا مظبطناش الرولز بالظبط عايزين نراجع عليها
Router.use(authentication)

Router.patch('/update-password', updatePassword)
Router.delete('/:id', authorization("admin", "user"), deleteUser)

Router.get('/', authorization("admin"), getUsersNames)
Router.get('/:id', authorization("admin"), getUserById)
Router.patch('/update-user/:id', authorization("admin", "user"), updateUser)



module.exports = Router