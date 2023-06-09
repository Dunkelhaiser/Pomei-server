import { Router } from "express";
import { isAuthorized } from "../controllers/auth/authVallidation";
import { createNote, deleteNote, duplicateNote, loadNote, loadNotes, updateNote } from "../controllers/notes/notesController";

const router = Router();

router.get("/", isAuthorized, loadNotes);
router.post("/", isAuthorized, createNote);
router.get("/:id", isAuthorized, loadNote);
router.put("/:id", isAuthorized, updateNote);
router.delete("/:id", isAuthorized, deleteNote);
router.post("/duplicate/:id", isAuthorized, duplicateNote);

export default router;
