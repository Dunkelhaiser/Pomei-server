import { Router } from "express";
import { signUp, checkAvailableData, signIn, getAuthUser } from "../controllers/auth/authContoller";
import { isAuthorized, validateSignIn, validateSignUp } from "../controllers/auth/authVallidation";

const router = Router();

router.post("/sign_up", validateSignUp, signUp);
router.post("/sign_up_check", checkAvailableData);
router.post("/sign_in", validateSignIn, signIn);
router.post("/sign_check", isAuthorized, checkAvailableData);
router.get("/get_auth_user", isAuthorized, getAuthUser);

export default router;
