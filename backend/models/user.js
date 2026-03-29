const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
var validator = require('validator');

const userModel = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "username is require"],
        unique: [true, "username must be unique"],
        maxLength: 14,
        minLength: 4
    },
    email: {
        type: String,
        required: [true, "email is required"],
        unique: true,
        validate: {
            validator: function (email) {
                return validator.isEmail(email)
            },
            message: (obj) => `${obj.value} is not correct`
        }
    },
    password: {
        type: String,
        required: function () {
            return !this.googleId; // Required ONLY if not using Google login
        },
        minLength: 8
    },

    googleId: {
        type: String,
        required: false,
        unique: true,
        sparse: true // Allows multiple users to have null googleId
    },

    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordVerified: {
        type: Boolean,
        default: false
    },

    firstName: {
        type: String,
        required: true,

        minLength: 3,
        maxLength: 15,
    },
    lastName: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 15,
    },

    role: {
        type: String,
        enum: ["admin", "user"],
        default: "user"

    },
    premium: {
        type: Boolean,
        default: false
    },
    avatar: {
        type: String,
        default: "https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-social-media-user-image-182145777.jpg",
        required: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationCode: String,
    verificationCodeExpires: Date,
    time: Date ,
    balance: {
        type: Number,
        default: 0
    },

    // user Planets
    myPlants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plant'
    }] },
    { timestamps: true });


userModel.pre("save", async function () {
    if (!this.isModified("password") || !this.password) return;

    let salt = await bcrypt.genSalt(10)
    let hashedPassword = await bcrypt.hash(this.password, salt)
    this.password = hashedPassword
})

let usersModel = mongoose.model("User", userModel, "users")
module.exports = usersModel

