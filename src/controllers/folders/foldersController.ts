import { Response } from "express";
import db from "../../db";
import { AuthRequest } from "../../models/AuthRequest";

export const loadFolders = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;
        const results = await db.folder.findMany({
            where: {
                userId,
            },
        });
        res.status(200).json({
            status: "success",
            folders: results,
        });
    } catch (err) {
        res.status(404).json({
            status: "not found",
        });
    }
};

export const createFolder = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;
        const { title } = req.body;
        const result = await db.folder.create({
            data: {
                title,
                user: {
                    connect: {
                        id: userId,
                    },
                },
            },
        });
        res.status(201).json({
            status: "success",
            folder: result,
        });
    } catch (err) {
        res.status(400).json({
            status: "error",
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
                status: "not found",
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
            status: "success",
            folder: result,
        });
    } catch (err) {
        res.status(400).json({
            status: "error",
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
                status: "not found",
            });
            return;
        }

        await db.folder.delete({
            where: {
                id: folderId,
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

export const pinFolder = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;
        const folderId = req.params.id;
        const { isPinned } = req.query;

        if (isPinned !== "true" && isPinned !== "false") {
            res.status(400).json({
                status: "invalid input",
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

        const result = await db.folder.update({
            where: {
                id: folderId,
            },
            data: {
                isPinned: isPinned === "true",
            },
        });

        res.status(200).json({
            status: "success",
            folder: result,
        });
    } catch (err) {
        res.status(400).json({
            status: "error",
        });
    }
};
