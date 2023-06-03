import { Router } from "express";
import { signUp, checkAvailableData, signIn } from "../controllers/auth/authContoller";
import { validateSignIn, validateSignUp } from "../controllers/auth/authVallidation";

const router = Router();

router.post("/sign_up", validateSignUp, signUp);
router.post("/sign_up_check", checkAvailableData);
router.post("/sign_in", validateSignIn, signIn);

export default router;
