import { asyncErrorHandler } from "../utils/asyncErrorHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { emailSend } from "../sendEmail/sendEmail.js";
import jwt, { decode } from "jsonwebtoken";
import { apiResponse } from "../utils/apiResponse.js";
import { forgotPasswordMail } from "../sendEmail/forgotPasswordMail.js";
import fs from "fs";




//Right formatting of input fields...
const emailRegex = /^(?!.*\.\.)(?!\.)(?!.*\.$)[a-zA-Z0-9._%+-]+@gmail\.com$/i;

// username regex (letters, numbers, underscore)
const usernameRegex = /^(?!_)(?!.*__)(?!.*_$)[a-zA-Z0-9_]{3,20}$/; //ex: user_123

// password regex (min 8 chars, at least 1 letter and 1 number)
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/; //ex: Password@123 , Qx7$kLm9!p2Z



const generateAccessAndRefreshTokens = async (userId) => {
  const user = await User.findById(userId);

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};



export const registerUser = asyncErrorHandler(async (req, res) => {
  const { fullname, username, email, password } = req.body;

  if (
    [fullname, username, email, password].some(
      (field) => typeof field === "string" && field.trim() === ""
    )
  ) {
    throw new apiError(400, "All fields are required.");
  }

  if (!usernameRegex.test(username.trim())) {
    throw new apiError(400, "Invalid username");
  }
  if (!emailRegex.test(email.trim())) {
    throw new apiError(400, "Invalid email");
  }
  if (!passwordRegex.test(password.trim())) {
    throw new apiError(400, "Invalid password");
  }



  const alreadyExists = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (alreadyExists) {
    throw new apiError(409, "User email or username has already exists");
  }



  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar is required");
  }
  
  // Minimum 300KB constraint check
  const minSizeBytes = 300 * 1024; // 300KB in bytes
  if (req.file.size < minSizeBytes) {
    if (fs.existsSync(avatarLocalPath)) {
      fs.unlinkSync(avatarLocalPath);
    }
    throw new apiError(400, "Avatar image size must be at least 300 KB");
  }
  // console.log("Avatar path:", avatarLocalPath);


  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new apiError(400, "Avatar upload failed");
  }



  const user = await User.create({
    fullname,
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password,
    avatar: avatar.url
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )



  return res
    .status(201)
    .json({
      message: "Register Successfully",
      data: { user: createdUser }
    });

});


export const loginUser = asyncErrorHandler(async (req, res) => {

  const { email, username, password } = req.body;

  if (!email && !username) {
    throw new apiError(400, "Email or Username is required");
  }

  if (!password) {
    throw new apiError(400, "Password is required");
  }

  const conditions = [];
  if (username) conditions.push({ username });
  if (email) conditions.push({ email });

  const user = await User.findOne({ $or: conditions });

  if (!user) {
    throw new apiError(404, "User not exist!");
  }

  // Check if user is blocked from logging in
  if (user.loginBlockedUntil && user.loginBlockedUntil > Date.now()) {
    return res.status(429).json({
      success: false,
      message: "You are blocked for 5 minutes due to too many failed login attempts. Relogin after 5 minutes."
    });
  }

  const isPasswordMatch = await user.isPasswordCorrect(password);
  if (!isPasswordMatch) {
    user.loginAttempts += 1;
    if (user.loginAttempts >= 5) {
      user.loginBlockedUntil = Date.now() + 5 * 60 * 1000;
      user.loginAttempts = 0;
      await user.save({ validateBeforeSave: false });
      return res.status(429).json({
        success: false,
        message: "You are blocked for 5 minutes due to too many failed login attempts. Relogin after 5 minutes."
      });
    }
    await user.save({ validateBeforeSave: false });
    throw new apiError(404, "Invalid password!");
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    user.loginAttempts = 0;
    await user.save({ validateBeforeSave: false });
  }


  // when user has already attempting otp 5 times then block the user for 2 min...user in that time cannot send otp request means resend otp
  if (user.otpBlockedUntil && user.otpBlockedUntil > Date.now()) {
    return res.status(429).json({
      success: false,
      message: "Too many attempts. Try again after 2 minutes."
    });
  }


  //otp create and save in db.
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpiry = Date.now() + 60 * 1000; //60s
  await user.save({ validateBeforeSave: false });

  //send the otp to user
  await emailSend(otp, user.email);

  return res.status(200).json({
    success: true,
    message: "Login OTP sent successfully."
  });

})


export const verifyOtp = asyncErrorHandler(async (req, res) => {
  const { email, username, otp } = req.body;

  if (!email && !username) {
    throw new apiError(400, "Email or Username is required");
  }

  if (!otp) {
    throw new apiError(400, "Otp is required.")
  }

  const conditions = [];
  if (username) conditions.push({ username });
  if (email) conditions.push({ email });

  const user = await User.findOne({ $or: conditions });

  if (!user) {
    throw new apiError(404, "User not found");
  }


  if (user.otpBlockedUntil && user.otpBlockedUntil > Date.now()) {
    return res.status(429).json({
      success: false,
      message: "Too many attempts. Try again after 2 minutes."
    });
  }


  if (!user.otp || !user.otpExpiry) {
    throw new apiError(400, "Otp not generated or already verified.");
  }


  //2 min block after attempting otp 5 times.
  if (user.otpAttempts >= 5) {
    user.otpBlockedUntil = Date.now() + 2 * 60 * 1000; // 2 min block
    user.otpAttempts = 0;

    await user.save({ validateBeforeSave: false });

    return res.status(429).json({
      success: false,
      message: "Too many attempts. Try again after 2 minutes."
    });
  }


  if (!user.otp || user.otp !== otp) {
    user.otpAttempts += 1;
    await user.save({ validateBeforeSave: false });

    return res.status(400).json({
      success: false,
      message: "Invalid OTP"
    });
  }


  if (user.otpExpiry < Date.now()) {
    throw new apiError(400, "OTP expired");
  }

  user.otp = null;
  user.otpExpiry = null;
  user.otpAttempts = 0;
  user.otpBlockedUntil = null;
  user.verifiedAt = new Date();

  await user.save({ validateBeforeSave: false });

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(user._id);

  return res
    .status(200)
    .cookie("accessToken", accessToken, { httpOnly: true, secure: true, sameSite: "none" })
    .cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, sameSite: "none" })
    .json({
      success: true,
      message: `${user.fullname}, you are successfully LoggedIn!`,
    });


});


export const forgotPassword = asyncErrorHandler(async (req, res) => {
  const { email, username } = req.body;

  if (!email && !username) {
    throw new apiError(400, "Email or Username is required");
  }

  const conditions = [];
  if (username) conditions.push({ username: username.trim().toLowerCase() });
  if (email) conditions.push({ email: email.trim().toLowerCase() });

  const user = await User.findOne({ $or: conditions });

  if (!user) {
    throw new apiError(404, "User not found");
  }

  // block check (5 min)
  if (user.otpBlockedUntil && user.otpBlockedUntil > Date.now()) {
    return res.status(429).json({
      success: false,
      message: "Too many requests. Try again after 5 minutes.",
    });
  }

  // increment request count
  user.otpAttempts += 1;

  // 5 attempts → block 5 min
  if (user.otpAttempts >= 5) {
    user.otpBlockedUntil = Date.now() + 5 * 60 * 1000; // 5 min block
    user.otpAttempts = 0;

    await user.save({ validateBeforeSave: false });

    return res.status(429).json({
      success: false,
      message: "Too many OTP requests. Blocked for 5 minutes.",
    });
  }


  // generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.otp = otp;
  user.otpExpiry = Date.now() + 60 * 1000; // 60 seconds

  await user.save({ validateBeforeSave: false });

  await forgotPasswordMail(otp, user.email);

  return res.status(200).json({
    success: true,
    message: "forgot password OTP sent successfully",
  });
});


export const verifyForgotPasswordOtp = asyncErrorHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new apiError(400, "Email and OTP are required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new apiError(404, "User not found");
  }

  if (user.otpBlockedUntil && user.otpBlockedUntil > Date.now()) {
    return res.status(429).json({
      success: false,
      message: "Too many attempts. Try again after 5 minutes."
    });
  }

  if (!user.otp || !user.otpExpiry) {
    throw new apiError(400, "OTP not generated or already used");
  }

  if (user.otpExpiry < Date.now()) {
    throw new apiError(400, "OTP expired");
  }

  if (user.otp !== otp) {
    user.otpAttempts += 1;

    if (user.otpAttempts >= 5) {
      user.otpBlockedUntil = Date.now() + 5 * 60 * 1000;
      user.otpAttempts = 0;

      await user.save({ validateBeforeSave: false });

      return res.status(429).json({
        success: false,
        message: "Too many attempts. Blocked for 5 minutes."
      });
    }

    await user.save({ validateBeforeSave: false });

    return res.status(400).json({
      success: false,
      message: "Invalid OTP"
    });
  }

  // SUCCESS CASE
  user.otp = null;
  user.otpExpiry = null;
  user.otpAttempts = 0;
  user.otpBlockedUntil = null;
  user.forgotPasswordVerified = true;
  user.forgotPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins window

  await user.save({ validateBeforeSave: false });

  return res.status(200).json({
    success: true,
    message: "OTP verified successfully"
  });
});


export const changePassword = asyncErrorHandler(async (req, res) => {
  const { email, username, newPassword, confirmPassword } = req.body;

  // validations
  if (!email && !username) {
    throw new apiError(400, "Email or Username is required");
  }

  if (!newPassword || !confirmPassword) {
    throw new apiError(400, "Both password fields are required");
  }

  if (!passwordRegex.test(newPassword)) {
    throw new apiError(
      400,
      "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character"
    );
  }

  if (newPassword !== confirmPassword) {
    throw new apiError(400, "Passwords do not match");
  }

  // find user (OTP must be verified and reset window active)
  const conditions = [];
  if (username) conditions.push({ username: username.trim().toLowerCase() });
  if (email) conditions.push({ email: email.trim().toLowerCase() });

  const user = await User.findOne({
    $or: conditions,
    forgotPasswordVerified: true,
    forgotPasswordExpiry: { $gt: new Date() },
  });

  if (!user) {
    throw new apiError(400, "OTP verification expired or invalid password reset session. Please request a new OTP.");
  }

  // update password
  user.password = newPassword;

  // cleanup
  user.forgotPasswordVerified = false;
  user.forgotPasswordExpiry = null;
  user.otp = null;
  user.otpExpiry = null;
  user.otpAttempts = 0;
  user.otpBlockedUntil = null;

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Password reset successful",
  });
});


export const refreshAccessToken = asyncErrorHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    throw new apiError(401, "Unauthorized request");
  }

  const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

  const user = await User.findById(decoded?._id);

  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new apiError(401, "Invalid refresh token");
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(user._id);

  return res
    .status(200)
    .cookie("accessToken", accessToken, { httpOnly: true, secure: true, sameSite: "none" })
    .cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, sameSite: "none" })
    .json({
      success: true,
      message: "Access token refreshed",
    });
});


export const getCurrentUser = asyncErrorHandler(async (req, res) => {
  return res.status(200).json(
    new apiResponse(200, req.user, "Current user fetched successfully.")
  );
});


export const updateUser = asyncErrorHandler(async (req, res) => {
  console.log("UPDATE USER CALLED:", req.body, req.file);
  const { fullname, username, email } = req.body;

  const updateFields = {
    fullname,
    username,
    email
  };

  const avatarLocalPath = req.file?.path;
  if (avatarLocalPath) {
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (avatar?.url) {
      updateFields.avatar = avatar.url;
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: updateFields
    },
    { new: true }
  ).select("-password -refreshToken");

  return res.status(200).json({
    success: true,
    data: user
  });
});


export const loggedOutUser = asyncErrorHandler(async (req, res) => {

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: null } },
    { returnDocument: "after" }
  );

  if (!user) {
    throw new apiError(404, "User not found");
  }

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none"
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, `${req.user.fullname}, logged out successfully`));

});