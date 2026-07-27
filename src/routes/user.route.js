import { Router } from "express";
import { loginUser, registerUser, verifyForgotPasswordOtp, verifyOtp, getCurrentUser, refreshAccessToken, updateUser } from "../controller/user.controller.js";
import { multerStorage } from "../middleware/multerStorage.middleware.js";
import { verifyUser } from "../middleware/verifyUser.middleware.js";
import { loggedOutUser } from "../controller/user.controller.js";
import { forgotPassword } from "../controller/user.controller.js";
import { changePassword } from "../controller/user.controller.js";

const router = Router();

//register route
router.route("/register").post(
    multerStorage.single("avatar"), 
    registerUser
);

router.route("/login").post(multerStorage.none(),loginUser);

router.post("/auth/verify/otp", verifyOtp);

router.post("/auth/forgot-password",  forgotPassword);

router.post("/auth/verify-forgot-password-otp", verifyForgotPasswordOtp);

router.post("/auth/change-password",  changePassword);

router.post("/logout", verifyUser, loggedOutUser);

router.get("/current-user", verifyUser, getCurrentUser);

router.post("/refresh-token", refreshAccessToken);

router.patch("/update-account", verifyUser, multerStorage.single("avatar"), updateUser);

export default router;