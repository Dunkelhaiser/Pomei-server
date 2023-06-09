import { isAuthorized } from "../controllers/auth/authVallidation";
import { createFolder, deleteFolder, loadFolders, pinFolder, updateFolder } from "../controllers/folders/foldersController";
import { validateFolder } from "../controllers/folders/foldersVallidation";
import router from "./auth";

router.get("/", isAuthorized, loadFolders);
router.post("/", isAuthorized, validateFolder, createFolder);
router.put("/:id", isAuthorized, validateFolder, updateFolder);
router.delete("/:id", isAuthorized, deleteFolder);
router.put("/pin/:id", isAuthorized, pinFolder);

export default router;
