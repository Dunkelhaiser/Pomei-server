import { Router } from "express";
import { signUp, checkAvailableData, signIn, getAuthUser, handleRefreshToken, signOut } from "../controllers/auth/authContoller";
import { isAuthorized, validateSignIn, validateSignUp } from "../controllers/auth/authVallidation";

const router = Router();

router.post("/sign_up", validateSignUp, signUp);
router.post("/sign_up_check", checkAvailableData);
router.post("/sign_in", validateSignIn, signIn);
router.get("/get_auth_user", isAuthorized, getAuthUser);
router.get("/refresh_token", handleRefreshToken);
router.get("/sign_out", signOut);

export default router;
