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

        const page = Number(req.query.page) || 1;
        const perPage = Number(req.query.size);
        const order = req.query.order as "asc" | "desc";
        const orderBy = req.query.orderBy as string;

        const totalNotes = await db.folder.count({ where: { userId } });
        const totalPages = Math.ceil(totalNotes / perPage) || 1;
        const results = await db.note.findMany({
            where: {
                userId,
                isDeleted: false,
                isArchived: false,
            },
            skip: perPage ? (page - 1) * perPage : undefined,
            take: perPage || undefined,
            orderBy: [{ isPinned: "desc" }, { [orderBy]: order }],
        });

        res.status(200).json({
            status: "Loaded notes",
            notes: results,
            totalNotes,
            totalPages,
        });
    } catch (err) {
        res.status(500).json({
            status: "Failed to load notes",
        });
    }
};

export const loadBin = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;

        const page = Number(req.query.page) || 1;
        const perPage = Number(req.query.size);
        const order = req.query.order as "asc" | "desc";
        const orderBy = req.query.orderBy as string;

        const totalNotes = await db.folder.count({ where: { userId } });
        const totalPages = Math.ceil(totalNotes / perPage) || 1;
        const results = await db.note.findMany({
            where: {
                userId,
                isDeleted: true,
            },
            skip: perPage ? (page - 1) * perPage : undefined,
            take: perPage || undefined,
            orderBy: {
                [orderBy]: order,
            },
        });

        res.status(200).json({
            status: "Loaded bin",
            notes: results,
            totalNotes,
            totalPages,
        });
    } catch (err) {
        res.status(500).json({
            status: "Failed to load bin",
        });
    }
};

export const loadArchive = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;

        const page = Number(req.query.page) || 1;
        const perPage = Number(req.query.size);
        const order = req.query.order as "asc" | "desc";
        const orderBy = req.query.orderBy as string;

        const totalNotes = await db.folder.count({ where: { userId } });
        const totalPages = Math.ceil(totalNotes / perPage) || 1;
        const results = await db.note.findMany({
            where: {
                userId,
                isArchived: true,
            },
            skip: perPage ? (page - 1) * perPage : undefined,
            take: perPage || undefined,
            orderBy: {
                [orderBy]: order,
            },
        });

        res.status(200).json({
            status: "Loaded archive",
            notes: results,
            totalNotes,
            totalPages,
        });
    } catch (err) {
        res.status(500).json({
            status: "Failed to load archive",
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
            status: "Created note",
            note: result,
        });
    } catch (err) {
        res.status(500).json({
            status: "Failed to create note",
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
                status: "Note not found",
            });
            return;
        }

        if (note.isDeleted) {
            res.status(400).json({
                status: "Cannot update deleted note",
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
            status: "Updated note",
            note: result,
        });
    } catch (err) {
        res.status(500).json({
            status: "Failed to update note",
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
                status: "Note not found",
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
            status: "Note moved to bin successfully",
            note: result,
        });
    } catch (err) {
        res.status(500).json({
            status: "Failed to move note to bin",
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
                status: "Note not found",
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
            status: "Restored note",
            note: result,
        });
    } catch (err) {
        res.status(500).json({
            status: "Failed to restore note",
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
                status: "Note not found",
            });
            return;
        }

        await db.note.delete({
            where: {
                id: noteId,
            },
        });
        res.status(200).json({
            status: "Deleted note",
        });
    } catch (err) {
        res.status(500).json({
            status: "Failed to delete note",
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
                status: "No notes to delete",
            });
            return;
        }

        await db.note.deleteMany({
            where: {
                AND: [{ userId }, { isDeleted: true }],
            },
        });
        res.status(200).json({
            status: "Emptied bin",
        });
    } catch (err) {
        res.status(500).json({
            status: "Failed to empty bin",
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
                status: "Note not found",
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
            status: "Note duplicated successfully",
            note: result,
        });
    } catch (err) {
        res.status(500).json({
            status: "Failed to duplicate note",
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
                status: "Note not found",
            });
            return;
        }

        res.status(200).json({
            status: "Loaded note",
            note,
        });
    } catch (err) {
        res.status(500).json({
            status: "Failed to load note",
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
                status: "Invalid input",
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
                status: "Note not found",
            });
            return;
        }
        if (note.isDeleted) {
            res.status(400).json({
                status: "Cannot archive deleted note",
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
            status: `Note ${isArchived === "true" ? "archived" : "unarchived"}`,
            note: result,
        });
    } catch (err) {
        res.status(400).json({
            status: "Failed to archive note",
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
                status: "Note not found",
            });
            return;
        }

        if (note.isArchived) {
            res.status(400).json({
                status: "Cannot pin archived note",
            });
            return;
        }
        if (note.isDeleted) {
            res.status(400).json({
                status: "Cannot pin deleted note",
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
            status: `Note ${isPinned === "true" ? "pinned" : "unpinned"}`,
            note: result,
        });
    } catch (err) {
        res.status(500).json({
            status: "Failed to pin note",
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
                status: "Note not found",
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
                status: "Folder not found",
            });
            return;
        }

        if (note.folderId !== null) {
            res.status(400).json({
                status: "Note already in folder",
            });
            return;
        }

        if (note.isArchived) {
            res.status(403).json({
                status: "Cannot add archived note to folder",
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
            status: "Added to folder",
            note: result,
        });
    } catch (err) {
        res.status(500).json({
            status: "Failed to add to folder",
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
                status: "Note not found",
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
            status: "Removed from folder",
            note: result,
        });
    } catch (err) {
        res.status(500).json({
            status: "Failed to remove from folder",
        });
    }
};
