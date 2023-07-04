import { Response } from "express";
import { CronJob } from "cron";
import db from "../../db";
import { AuthRequest } from "../../models/AuthRequest";

const THIRTY_DAYS = 2592000000;
const job = new CronJob("59 23 * * *", async () => {
    await db.note.deleteMany({
        where: {
            isDeleted: true,
            deletedAt: {
                lte: new Date(Date.now() - THIRTY_DAYS),
            },
        },
    });
});

job.start();

export const loadNotes = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;
        const results = await db.note.findMany({
            where: {
                userId,
            },
        });
        res.status(200).json({
            status: "loaded notes",
            notes: results,
        });
    } catch (err) {
        res.status(500).json({
            status: "failed to load notes",
        });
    }
};

export const createNote = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;
        const { title, content } = req.body;
        const result = await db.note.create({
            data: {
                title,
                content,
                user: {
                    connect: {
                        id: userId,
                    },
                },
            },
        });
        res.status(201).json({
            status: "created note",
            note: result,
        });
    } catch (err) {
        res.status(500).json({
            status: "failed to create note",
        });
    }
};

export const updateNote = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;
        const noteId = req.params.id;
        const { title, content } = req.body;

        const note = await db.note.findFirst({
            where: {
                AND: [{ id: noteId }, { userId }],
            },
        });

        if (!note) {
            res.status(404).json({
                status: "note not found",
            });
            return;
        }

        const result = await db.note.update({
            where: {
                id: noteId,
            },
            data: {
                title,
                content,
            },
        });
        res.status(200).json({
            status: "updated note",
            note: result,
        });
    } catch (err) {
        res.status(500).json({
            status: "failed to update note",
        });
    }
};

export const moveToBin = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;
        const noteId = req.params.id;

        const note = await db.note.findFirst({
            where: {
                AND: [{ id: noteId }, { userId }],
            },
        });

        if (!note) {
            res.status(404).json({
                status: "note not found",
            });
            return;
        }

        const result = await db.note.update({
            where: {
                id: noteId,
            },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                isPinned: false,
                isArchived: false,
                folder: {
                    disconnect: true,
                },
            },
        });
        res.status(200).json({
            status: "moved to bin",
            note: result,
        });
    } catch (err) {
        res.status(500).json({
            status: "failed to move to bin",
        });
    }
};

export const restoreNote = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;
        const noteId = req.params.id;

        const note = await db.note.findFirst({
            where: {
                AND: [{ id: noteId }, { userId }],
            },
        });

        if (!note) {
            res.status(404).json({
                status: "note not found",
            });
            return;
        }

        const result = await db.note.update({
            where: {
                id: noteId,
            },
            data: {
                isDeleted: false,
                deletedAt: null,
            },
        });
        res.status(200).json({
            status: "restored note",
            note: result,
        });
    } catch (err) {
        res.status(500).json({
            status: "failed to restore note",
        });
    }
};

export const deleteNote = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;
        const noteId = req.params.id;

        const note = await db.note.findFirst({
            where: {
                AND: [{ id: noteId }, { userId }],
            },
        });

        if (!note) {
            res.status(404).json({
                status: "note not found",
            });
            return;
        }

        await db.note.delete({
            where: {
                id: noteId,
            },
        });
        res.status(200).json({
            status: "deleted note",
        });
    } catch (err) {
        res.status(500).json({
            status: "failed to delete note",
        });
    }
};

export const emptyBin = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;

        const notes = await db.note.findMany({
            where: {
                AND: [{ userId }, { isDeleted: true }],
            },
        });

        if (notes.length === 0) {
            res.status(204).json({
                status: "no notes to delete",
            });
            return;
        }

        await db.note.deleteMany({
            where: {
                AND: [{ userId }, { isDeleted: true }],
            },
        });
        res.status(200).json({
            status: "emptied bin",
        });
    } catch (err) {
        res.status(500).json({
            status: "failed to empty bin",
        });
    }
};

export const duplicateNote = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;
        const noteId = req.params.id;

        const note = await db.note.findFirst({
            where: {
                AND: [{ id: noteId }, { userId }],
            },
        });

        if (!note) {
            res.status(404).json({
                status: "note not found",
            });
            return;
        }

        const result = await db.note.create({
            data: {
                title: note.title,
                content: note.content,
                user: {
                    connect: {
                        id: userId,
                    },
                },
            },
        });
        res.status(201).json({
            status: "duplicated note",
            note: result,
        });
    } catch (err) {
        res.status(500).json({
            status: "failed to duplicate note",
        });
    }
};

export const loadNote = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;
        const noteId = req.params.id;

        const note = await db.note.findFirst({
            where: {
                AND: [{ id: noteId }, { userId }],
            },
        });

        if (!note) {
            res.status(404).json({
                status: "note not found",
            });
            return;
        }

        res.status(200).json({
            status: "loaded note",
            note,
        });
    } catch (err) {
        res.status(500).json({
            status: "failed to load note",
        });
    }
};

export const archiveNote = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;
        const noteId = req.params.id;
        const { isArchived } = req.query;

        if (isArchived !== "true" && isArchived !== "false") {
            res.status(400).json({
                status: "invalid input",
            });
            return;
        }

        const note = await db.note.findFirst({
            where: {
                AND: [{ id: noteId }, { userId }],
            },
        });

        if (!note) {
            res.status(404).json({
                status: "note not found",
            });
            return;
        }

        const result = await db.note.update({
            where: {
                id: noteId,
            },
            data: {
                isArchived: isArchived === "true",
                isPinned: isArchived === "true" ? false : note.isPinned,
                folder: {
                    disconnect: true,
                },
            },
        });
        res.status(200).json({
            status: `note ${isArchived === "true" ? "archived" : "unarchived"}`,
            note: result,
        });
    } catch (err) {
        res.status(400).json({
            status: "failed to archive note",
        });
    }
};

export const pinNote = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;
        const noteId = req.params.id;
        const { isPinned } = req.query;

        if (isPinned !== "true" && isPinned !== "false") {
            res.status(400).json({
                status: "invalid input",
            });
            return;
        }

        const note = await db.note.findFirst({
            where: {
                AND: [{ id: noteId }, { userId }],
            },
        });

        if (!note) {
            res.status(404).json({
                status: "note not found",
            });
            return;
        }

        if (note.isArchived) {
            res.status(400).json({
                status: "cannot pin archived note",
            });
            return;
        }

        const result = await db.note.update({
            where: {
                id: noteId,
            },
            data: {
                isPinned: isPinned === "true",
            },
        });
        res.status(200).json({
            status: `note ${isPinned === "true" ? "pinned" : "unpinned"}`,
            note: result,
        });
    } catch (err) {
        res.status(500).json({
            status: "failed to pin note",
        });
    }
};

export const addToFolder = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;
        const noteId = req.params.id;
        const { folderId } = req.body;

        const note = await db.note.findFirst({
            where: {
                AND: [{ id: noteId }, { userId }],
            },
        });

        if (!note) {
            res.status(404).json({
                status: "note not found",
            });
            return;
        }

        const folder = await db.folder.findFirst({
            where: {
                AND: [{ id: folderId }, { userId }],
            },
        });

        if (!folder) {
            res.status(404).json({
                status: "folder not found",
            });
            return;
        }

        if (note.folderId !== null) {
            res.status(400).json({
                status: "note already in folder",
            });
            return;
        }

        if (note.isArchived) {
            res.status(403).json({
                status: "cannot add archived note to folder",
            });
            return;
        }

        const result = await db.note.update({
            where: {
                id: noteId,
            },
            data: {
                folder: {
                    connect: {
                        id: folderId,
                    },
                },
            },
        });
        res.status(200).json({
            status: "added to folder",
            note: result,
        });
    } catch (err) {
        res.status(500).json({
            status: "failed to add to folder",
        });
    }
};

export const removeFromFolder = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;
        const noteId = req.params.id;

        const note = await db.note.findFirst({
            where: {
                AND: [{ id: noteId }, { userId }],
            },
        });

        if (!note) {
            res.status(404).json({
                status: "note not found",
            });
            return;
        }

        const result = await db.note.update({
            where: {
                id: noteId,
            },
            data: {
                folder: {
                    disconnect: true,
                },
            },
        });
        res.status(200).json({
            status: "removed from folder",
            note: result,
        });
    } catch (err) {
        res.status(500).json({
            status: "failed to remove from folder",
        });
    }
};
