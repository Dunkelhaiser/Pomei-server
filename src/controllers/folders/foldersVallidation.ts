import { Request, Response, NextFunction } from "express";
import { z as zod } from "zod";

const schemaFolder = zod.object({
    title: zod.string().nonempty({ message: "Enter the title" }).max(255, { message: "Title must be at maximum 255 characters long" }),
    color: zod.string().optional(),
});

export const validateFolder = async (req: Request, res: Response, next: NextFunction) => {
    const folder = req.body;
    try {
        await schemaFolder.parseAsync(folder);
        next();
    } catch (err) {
        res.status(400).json({
            status: (err as zod.ZodError).issues[0].message,
        });
    }
};
