import { Router } from "express";
import {
    signUp,
    checkAvailableData,
    signIn,
    getAuthUser,
    handleRefreshToken,
    signOut,
    terminateAllSessions,
    verifyUser,
    resetPasswordRequest,
    resetPassword,
    checkResetPasswordToken,
    resendVerificationEmail,
    deleteAccount,
} from "../controllers/auth/authContoller";
import {
    isAuthorized,
    validateResetPassword,
    validateEmailRequest,
    validateSignIn,
    validateSignUp,
} from "../controllers/auth/authVallidation";

const router = Router();

router.post("/sign_up", validateSignUp, signUp);
router.post("/sign_up_check", checkAvailableData);
router.post("/sign_in", validateSignIn, signIn);
router.get("/get_auth_user", isAuthorized, getAuthUser);
router.get("/refresh_token", handleRefreshToken);
router.get("/sign_out", signOut);
router.get("/terminate_all_sessions", isAuthorized, terminateAllSessions);
router.get("/verify_user/:token", verifyUser);
router.post("/resend_verification_email", validateEmailRequest, resendVerificationEmail);
router.post("/reset_password_request", validateEmailRequest, resetPasswordRequest);
router.post("/reset_password/:token", validateResetPassword, resetPassword);
router.post("/reset_password_check/:token", checkResetPasswordToken);
router.delete("/delete_account/:id", deleteAccount);

export default router;
