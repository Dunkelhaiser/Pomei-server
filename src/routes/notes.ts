import { Router } from "express";
import { isAuthorized } from "../controllers/auth/authVallidation";
import {
    addToFolder,
    archiveNote,
    createNote,
    deleteNote,
    duplicateNote,
    emptyBin,
    loadArchive,
    loadBin,
    loadNote,
    loadNotes,
    moveToBin,
    pinNote,
    removeFromFolder,
    restoreNote,
    updateNote,
} from "../controllers/notes/notesController";
import { validateNote } from "../controllers/notes/notesVallidation";

const router = Router();

router.get("/", isAuthorized, loadNotes);
router.post("/", isAuthorized, validateNote, createNote);
router.get("/bin", isAuthorized, loadBin);
router.delete("/move_to_bin/:id", isAuthorized, moveToBin);
router.put("/restore/:id", isAuthorized, restoreNote);
router.delete("/delete/:id", isAuthorized, deleteNote);
router.delete("/empty_bin", isAuthorized, emptyBin);
router.post("/duplicate/:id", isAuthorized, duplicateNote);
router.get("/archive", isAuthorized, loadArchive);
router.put("/archive/:id", isAuthorized, archiveNote);
router.put("/pin/:id", isAuthorized, pinNote);
router.post("/folder/:id", isAuthorized, addToFolder);
router.delete("/folder/:id", isAuthorized, removeFromFolder);
router.get("/:id", isAuthorized, loadNote);
router.put("/:id", isAuthorized, validateNote, updateNote);

export default router;
