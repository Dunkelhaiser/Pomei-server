import { Response } from "express";
import db from "../../db";
import { AuthRequest } from "../../models/AuthRequest";

export const loadFolders = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;

        const page = Number(req.query.page) || 1;
        const perPage = Number(req.query.size);
        const order = req.query.order as "asc" | "desc";
        const orderBy = req.query.orderBy as string;

        const totalFolders = await db.folder.count({ where: { userId } });
        const totalPages = Math.ceil(totalFolders / perPage) || 1;
        const results = await db.folder.findMany({
            where: {
                userId,
            },
            skip: perPage ? (page - 1) * perPage : undefined,
            take: perPage || undefined,
            orderBy: [{ isPinned: "desc" }, { [orderBy]: order }],
        });

        res.status(200).json({
            status: "Loaded folders",
            folders: results,
            totalFolders,
            totalPages,
        });
    } catch (err) {
        res.status(500).json({
            status: "Failed to load folders",
        });
    }
};

export const createFolder = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;
        const { title, color } = req.body;
        const result = await db.folder.create({
            data: {
                title,
                color,
                user: {
                    connect: {
                        id: userId,
                    },
                },
            },
        });
        res.status(201).json({
            status: "Created folder",
            folder: result,
        });
    } catch (err) {
        res.status(500).json({
            status: "Failed to create folder",
        });
    }
};

export const updateFolder = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;
        const folderId = req.params.id;
        const { title, color } = req.body;

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

        const result = await db.folder.update({
            where: {
                id: folderId,
            },
            data: {
                title,
                color,
            },
        });

        res.status(200).json({
            status: "Updated folder",
            folder: result,
        });
    } catch (err) {
        res.status(500).json({
            status: "Failed to update folder",
        });
    }
};

export const deleteFolder = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;
        const folderId = req.params.id;

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

        await db.folder.delete({
            where: {
                id: folderId,
            },
        });

        res.status(200).json({
            status: "Deleted folder",
        });
    } catch (err) {
        res.status(400).json({
            status: "Failed to delete folder",
        });
    }
};

export const pinFolder = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;
        const folderId = req.params.id;
        const { isPinned } = req.query;

        if (isPinned !== "true" && isPinned !== "false") {
            res.status(400).json({
                status: "Invalid input",
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

        const result = await db.folder.update({
            where: {
                id: folderId,
            },
            data: {
                isPinned: isPinned === "true",
            },
        });

        res.status(200).json({
            status: `Folder ${isPinned === "true" ? "pinned" : "unpinned"}`,
            folder: result,
        });
    } catch (err) {
        res.status(500).json({
            status: "Failed to modify folder",
        });
    }
};

export const getNotes = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;
        const folderId = req.params.id;

        const page = Number(req.query.page) || 1;
        const perPage = Number(req.query.size);
        const order = req.query.order as "asc" | "desc";
        const orderBy = req.query.orderBy as string;

        const totalNotes = await db.folder.count({ where: { userId } });
        const totalPages = Math.ceil(totalNotes / perPage) || 1;

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

        const results = await db.note.findMany({
            where: {
                folderId,
            },
            skip: perPage ? (page - 1) * perPage : undefined,
            take: perPage || undefined,
            orderBy: [{ isPinned: "desc" }, { [orderBy]: order }],
        });

        res.status(200).json({
            status: "Got notes from folder",
            notes: results,
            folder,
            totalNotes,
            totalPages,
        });
    } catch (err) {
        res.status(500).json({
            status: "Failed to get notes from folder",
        });
    }
};
