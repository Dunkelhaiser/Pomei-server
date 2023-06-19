import { Response } from "express";
import db from "../../db";
import { AuthRequest } from "../../models/AuthRequest";

export const loadNotes = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;
        const results = await db.note.findMany({
            where: {
                userId,
            },
        });
        res.status(200).json({
            status: "success",
            notes: results,
        });
    } catch (err) {
        res.status(404).json({
            status: "not found",
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
            status: "success",
            note: result,
        });
    } catch (err) {
        res.status(400).json({
            status: "error",
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
                status: "not found",
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
            status: "success",
            note: result,
        });
    } catch (err) {
        res.status(400).json({
            status: "error",
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
                status: "not found",
            });
            return;
        }

        await db.note.delete({
            where: {
                id: noteId,
            },
        });
        res.status(200).json({
            status: "success",
        });
    } catch (err) {
        res.status(400).json({
            status: "error",
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
                status: "not found",
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
            status: "success",
            note: result,
        });
    } catch (err) {
        res.status(400).json({
            status: "error",
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
                status: "not found",
            });
            return;
        }

        res.status(200).json({
            status: "success",
            note,
        });
    } catch (err) {
        res.status(400).json({
            status: "error",
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
                status: "not found",
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
            status: "success",
            note: result,
        });
    } catch (err) {
        res.status(400).json({
            status: "error",
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
                status: "not found",
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
            status: "success",
            note: result,
        });
    } catch (err) {
        res.status(400).json({
            status: "error",
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
                status: "not found",
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
                status: "not found",
            });
            return;
        }

        if (note.folderId !== null) {
            res.status(400).json({
                status: "note already in folder",
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
            status: "success",
            note: result,
        });
    } catch (err) {
        res.status(400).json({
            status: "error",
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
                status: "not found",
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
            status: "success",
            note: result,
        });
    } catch (err) {
        res.status(400).json({
            status: "error",
        });
    }
};
