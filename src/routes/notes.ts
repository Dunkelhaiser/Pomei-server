import { Router } from "express";
import { isAuthorized } from "../controllers/auth/authVallidation";
import { loadNotes } from "../controllers/notes/notesController";

const router = Router();

router.get("/", isAuthorized, loadNotes);

export default router;
