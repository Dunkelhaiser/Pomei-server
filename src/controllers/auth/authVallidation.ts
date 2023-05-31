import { NextFunction, Request, Response } from "express";
import { z as zod } from "zod";

const schema = zod
    .object({
        username: zod
            .string()
            .min(6, { message: "Username must be at least 6 characters long" })
            .max(20, { message: "Username must be at maximum 20 characters long" }),
        email: zod.string().email(),
        password: zod
            .string()
            .min(6, { message: "Password must be at least 6 characters long" })
            .max(36, { message: "Password must be at maximum 36 characters long" }),
        confirmPassword: zod.string().nonempty({ message: "Confirm your password" }),
    })
    .refine((schemaData) => schemaData.password === schemaData.confirmPassword, {
        message: "Passwords must match",
        path: ["confirmPassword"],
    });

export const validateSignUp = async (req: Request, res: Response, next: NextFunction) => {
    const formData = req.body;
    try {
        await schema.parseAsync(formData);
        next();
    } catch (err) {
        res.status(400).json({
            status: (err as zod.ZodError).issues[0].message,
        });
    }
};
