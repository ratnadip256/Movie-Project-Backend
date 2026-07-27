import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { asyncErrorHandler } from "../utils/asyncErrorHandler.js";

export const verifyUser = asyncErrorHandler(async (req, res, next) => {

  const token = req.cookies?.accessToken;

  if (!token) {
    throw new apiError(401, "Access token missing");
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new apiError(401, "Access token expired");
    }
    throw new apiError(401, "Invalid token");
  }

  const user = await User.findById(decoded._id).select("-password -refreshToken");

  if (!user) {
    throw new apiError(401, "User not found");
  }

  req.user = user; 

  next();
});