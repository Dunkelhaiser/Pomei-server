import { Router } from "express";
import { loadNotes } from "../controllers/notesController";

const router = Router();

router.get("/", loadNotes);

export default router;
