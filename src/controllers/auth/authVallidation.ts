import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z as zod } from "zod";

const schema = zod
    .object({
        username: zod
            .string()
            .nonempty({ message: "Enter your username" })
            .min(6, { message: "Username must be at least 6 characters long" })
            .max(20, { message: "Username must be at maximum 20 characters long" }),
        email: zod.string().nonempty({ message: "Enter your email" }).email(),
        password: zod
            .string()
            .nonempty({ message: "Enter your password" })
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

const schemaSignIn = zod.object({
    login: zod.string().nonempty({ message: "Enter your username or email" }),
    password: zod.string().nonempty({ message: "Enter your password" }),
});

export const validateSignIn = async (req: Request, res: Response, next: NextFunction) => {
    const formData = req.body;
    try {
        await schemaSignIn.parseAsync(formData);
        next();
    } catch (err) {
        res.status(400).json({
            status: (err as zod.ZodError).issues[0].message,
        });
    }
};

interface Payload {
    id: string;
}
interface AuthRequest extends Request {
    user?: Payload;
}

export const isAuthorized = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { authorization } = req.headers;
        const token = authorization?.split(" ")[1];
        if (!token) throw new Error("Unauthorized");
        const decodedToken = jwt.verify(token, `${process.env.JWT_ACCESS_SECRET}`) as Payload;
        req.user = decodedToken;
        next();
    } catch (err) {
        res.status(401).json({
            error: "Unauthorized",
        });
    }
};
