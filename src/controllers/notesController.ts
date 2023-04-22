import { Request, Response } from "express";
import db from "../db/index";

export const loadNotes = async (_req: Request, res: Response) => {
    try {
        const results = await db.query("SELECT * FROM notes");
        res.status(200).json({
            status: "success",
            results: results.rows.length,
            posts: results.rows,
        });
    } catch (err) {
        res.status(404).json({
            status: "not found",
            posts: "Not Found",
        });
    }
};
