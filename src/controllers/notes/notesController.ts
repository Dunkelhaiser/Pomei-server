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
