const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto') // bulit in Node for encryption


let userModel = require('../models/user')
let sendEmail = require('../utils/sendEmail')
let registerUser = async (req, res) => {
    try {

        let userData = req.body

        // Generate 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        userData.verificationCode = verificationCode;
        userData.verificationCodeExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours expiry
        userData.isVerified = false;

        const newUser = await userModel.create(userData)

        // Send Email
        const message = `
        <h2>Welcome to Gheras!</h2>
        <p>Your verification code is: <b style="color:green; font-size: 24px;">${verificationCode}</b></p>
        <p>Please enter this code to verify your account.</p>
        <p>Best regards,<br>Gheras Team</p>
        `;

        await sendEmail({
            email: newUser.email,
            subject: "Verify your Gheras Account",
            message: message
        });

        res.status(201).json({
            message: "user has been created, please check your email for verification code",
            userId: newUser._id
        })

    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "username or email already exist" })
        }
        res.status(400).json({ message: "Registration failed", error: err.message })
    }
}

//Abo Sofyan
let verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;

        const user = await userModel.findOne({
            email: email,
            verificationCode: code,
            verificationCodeExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired verification code" });
        }

        user.isVerified = true;
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Email verified successfully! You can now login." });
    } catch (err) {
        res.status(500).json({ message: "Verification failed", error: err.message });
    }
}



let getUsersNames = async (req, res) => {

    try {
        const users = await userModel.find().select('firstName , email')
        res.status(200).json(users)


    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

let getUserById = async (req, res) => {
    try {
        let userId = req.params.id
        const user = await userModel.findById(userId)
        res.status(200).json(user)
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

let updateUser = async (req, res) => {
    try {
        const userId = req.params.id
        
        // Allowed fields to update
        const allowedUpdates = ['firstName', 'lastName', 'username', 'avatar'];
        const updates = {};
        
        for (const key in req.body) {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        }

        const updatedUser = await userModel.findByIdAndUpdate(userId, updates, { new: true, runValidators: true })
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User has been updated", user: updatedUser })
    } catch (err) {

        if (err.code === 11000) {
            return res.status(400).json({ message: "Username already exists" });
        }
        res.status(400).json({
            message: "Update failed",
            error: err.message
        })
    }
}

//Abo Sofyan
let deleteUser = async (req, res) => {
    try {
        const userId = req.params.id
        const deletedUser = await userModel.findByIdAndDelete(userId)
        if (!deletedUser) {
            return res.status(404).json({ message: "User not found!" });
        }
        res.status(200).json({
            message: "User deleted successfully",
            userId: userId
        })
    } catch (err) {
        res.status(500).json({
            message: "Delete failed",
            error: err.message
        })
    }
}


//Abo Sofyan
let login = async (req, res) => {
    try {

        let { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ message: "Please enter email and password correctly" })
        }

        let user = await userModel.findOne({ email: email })
        let username = user.username

        if (!user) {
            return res.status(404).json({ message: "invalid email or password" })
        }

        let isValid = await bcrypt.compare(password, user.password)

        if (isValid == false) {
            return res.status(401).json({ message: "neither email or password is invalid" })
        }

        if (!user.isVerified) {
            return res.status(401).json({ message: "Please verify your email first" })
        }

        let token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.SECRET_KEY)
        res.status(200).json({ token: token, username: username })
    } catch (error) {
        res.status(500).json(error.message)
    }
}

//Abo Sofyan
let updatePassword = async (req, res) => {
    try {

        let { currentPassword, newPassword } = req.body

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ status: "Error", message: "please enter current or password" })
        }

        let user = await userModel.findById(req.user.id)

        if (!user) {
            return res.status(404).json({ status: "Error", message: "inValid please login first" })
        }

        let valid = await bcrypt.compare(currentPassword, user.password)

        if (!valid) {
            return res.status(400).json({ status: "faild", message: "please enter right currentPassword" })
        }

        user.password = newPassword
        await user.save()

        let token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.SECRET_KEY, { expiresIn: '1d' })

        res.status(200).json({ token: token })

    } catch (error) {
        res.status(500).json(error.message)
    }
}

//Ramadan
//مكتبه تأكيد عبر الايميل
let forgetPassword = async (req, res) => {

    let { email } = req.body;

    let user = await userModel.findOne({ email: email })

    if (!user) {
        return res.status(404).json({ message: "No User with this email " })
    }


    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashResetCode = crypto.createHash('sha256')
        .update(resetCode) // Fix: use variable resetCode, not string 'resetCode'
        .digest('hex');

    // save hashed reset code in database
    user.verificationCode = hashResetCode;
    user.verificationCodeExpires = Date.now() + 10 * 60 * 1000;  // code expires afrt (10 min)
    user.passwordVerified = false;
    await user.save()


    const message = `
        <h2>Hi ${user.firstName}</h2>

        <p>You received a request for a password reset on <b>Gheras Website</b></p>

        <h1 style="color:green;">${resetCode}</h1>

        <p>This code will expire in 10 minutes.</p>

        <p>Best regards,<br>Gheras Team</p>
        `;
    try {
        await sendEmail({
            email: user.email,
            subject: "Password Reset Code Vaild for 10 minutes",
            message: message
        })

        res.status(200).json({ message: "Reset code sent to your email" })
    } catch (err) {
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        user.passwordVerified = undefined;
        await user.save();

        res.status(500).json({ message: "Error sending email", error: err.message })
    }
}


let verifyEmailAndResetPassword = async (req, res) => {
    try {
        const { newPassword, code } = req.body;

        const hashResetCode = crypto.createHash('sha256')
            .update(code)
            .digest('hex');

        const user = await userModel.findOne({
            verificationCode: hashResetCode,
            verificationCodeExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired verification code" });
        }

        user.password = newPassword;
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Password reset successfully! You can now login." });
    } catch (err) {
        res.status(500).json({ message: "Verification failed", error: err.message });
    }
}

//Abo Sofyan
let googleAuthCallback = async (req, res) => {
    try {
        const user = req.user;
        let token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.SECRET_KEY);
        // Normally, for Google popup logins, you might redirect to front-end with token in URL 
        // OR send back as JSON depending on your FE setup.
        res.status(200).json({
            message: "Login successful with Google",
            token: token
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = { registerUser, verifyEmail, getUsersNames, updateUser, deleteUser, login, updatePassword, forgetPassword, getUserById, verifyEmailAndResetPassword, googleAuthCallback }
