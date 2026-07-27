import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import 'dotenv/config'

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      required: true,
    },

    otp: {
      type: String,
      default: null,
    },
    otpExpiry: {
      type: Date,
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    otpAttempts: {
      type: Number,
      default: 0,
    },
    
    otpBlockedUntil: {
      type: Date,
      default: null
    },

    loginAttempts: {
      type: Number,
      default: 0,
    },

    loginBlockedUntil: {
      type: Date,
      default: null,
    },

    refreshToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);



//bcrypt password
userSchema.pre("save", async function () {
    if( !this.isModified("password") ) return; // if password is not modified don't reencrypt the password, call next().
    this.password = await bcrypt.hash(this.password, 10);
})

//log in phase
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password) //here "password" is which password client enter and "this.password" is the bcrypt encryption password so logged in the user.
}


//* JWT(JSON WEB TOKEN USE).
userSchema.methods.generateAccessToken =  function() {
    return jwt.sign(
        {
            _id: this._id,
            fullname: this.fullname,
            username: this.username,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken =  function() {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema);