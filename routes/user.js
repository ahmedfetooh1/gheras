const express = require('express')
const passport = require('passport')
require('../config/passport')

const Router = express.Router()

let { authentication, authorization } = require('../middlewares/authentication')
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

Router.patch('/update-password', authentication, updatePassword)
Router.delete('/:id', authentication, authorization("admin", "user"), deleteUser)


Router.get('/', authentication, authorization("admin"), getUsersNames)
Router.get('/:id', authentication, authorization("admin"), getUserById)
Router.patch('update-user/:id', authentication, authorization("admin", "user"), updateUser)

Router.patch("/forget-password", forgetPassword)
Router.patch('/verify-password', verifyEmailAndResetPassword)



module.exports = Router