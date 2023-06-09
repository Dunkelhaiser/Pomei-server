import { Router } from "express";
import { isAuthorized } from "../controllers/auth/authVallidation";
import {
    archiveNote,
    createNote,
    deleteNote,
    duplicateNote,
    loadNote,
    loadNotes,
    pinNote,
    updateNote,
} from "../controllers/notes/notesController";
import { validateNote } from "../controllers/notes/notesVallidation";

const router = Router();

router.get("/", isAuthorized, loadNotes);
router.post("/", isAuthorized, validateNote, createNote);
router.get("/:id", isAuthorized, loadNote);
router.put("/:id", isAuthorized, validateNote, updateNote);
router.delete("/:id", isAuthorized, deleteNote);
router.post("/duplicate/:id", isAuthorized, duplicateNote);
router.put("/archive/:id", isAuthorized, archiveNote);
router.put("/pin/:id", isAuthorized, pinNote);

export default router;
