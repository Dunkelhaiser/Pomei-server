import { Request, Response, NextFunction } from "express";
import { z as zod } from "zod";

const schemaNote = zod.object({
    title: zod.string().max(255, { message: "Title must be at maximum 255 characters long" }),
    content: zod.string(),
});

export const validateNote = async (req: Request, res: Response, next: NextFunction) => {
    const note = req.body;
    try {
        await schemaNote.parseAsync(note);
        next();
    } catch (err) {
        res.status(400).json({
            status: (err as zod.ZodError).issues[0].message,
        });
    }
};
