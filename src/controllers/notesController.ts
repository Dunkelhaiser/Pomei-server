import { Request, Response } from "express";
import db from "../db";

export const loadNotes = async (_req: Request, res: Response) => {
    try {
        const results = await db.note.findMany();
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
