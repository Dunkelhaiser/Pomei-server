import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z as zod } from "zod";
import { AuthRequest, Payload } from "../../models/AuthRequest";

const usernameRegex = /^(?!.*\.\.)(?!.*\.$)[\w_]+$/;

const shcemaSignUp = zod
    .object({
        username: zod
            .string()
            .nonempty({ message: "Enter your username" })
            .regex(usernameRegex, { message: "Username can only contain letters, numbers and underscores" })
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
        await shcemaSignUp.parseAsync(formData);
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

const schemaEmailRequest = zod.object({
    email: zod.string().nonempty({ message: "Enter your email" }).email({ message: "Enter a valid email" }),
});

export const validateEmailRequest = async (req: Request, res: Response, next: NextFunction) => {
    const formData = req.body;
    try {
        await schemaEmailRequest.parseAsync(formData);
        next();
    } catch (err) {
        res.status(400).json({
            status: (err as zod.ZodError).issues[0].message,
        });
    }
};

const schemaResetPassword = zod
    .object({
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

export const validateResetPassword = async (req: Request, res: Response, next: NextFunction) => {
    const formData = req.body;
    try {
        await schemaResetPassword.parseAsync(formData);
        next();
    } catch (err) {
        res.status(400).json({
            status: (err as zod.ZodError).issues[0].message,
        });
    }
};

export const isAuthorized = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { authorization } = req.headers;
        const token = authorization?.split(" ")[1];
        if (!token) {
            res.status(401).json({
                status: "Unauthorized",
            });
            return;
        }
        const decodedToken = jwt.verify(token, `${process.env.JWT_ACCESS_SECRET}`) as Payload;
        req.user = decodedToken.id;
        next();
    } catch (err) {
        res.status(401).json({
            status: "Invalid token",
        });
    }
};

const accountSchema = zod.object({
    username: zod
        .string()
        .nonempty({ message: "Enter your username" })
        .regex(usernameRegex, { message: "Username can only contain letters, numbers and underscores" })
        .min(6, { message: "Username must be at least 6 characters long" })
        .max(20, { message: "Username must be at maximum 20 characters long" }),
    email: zod.string().nonempty({ message: "Enter your email" }).email({ message: "Enter a valid email" }),
});

export const validateAccountChange = async (req: Request, res: Response, next: NextFunction) => {
    const formData = req.body;
    try {
        await accountSchema.parseAsync(formData);
        next();
    } catch (err) {
        res.status(400).json({
            status: (err as zod.ZodError).issues[0].message,
        });
    }
};

const changePasswordSchema = zod
    .object({
        currentPassword: zod.string().nonempty({ message: "Enter your password" }),
        newPassword: zod
            .string()
            .nonempty({ message: "Enter new password" })
            .min(6, { message: "Password must be at least 6 characters long" })
            .max(36, { message: "Password must be at maximum 36 characters long" }),
        confirmNewPassword: zod.string().nonempty({ message: "Confirm new password" }),
    })
    .refine((schemaData) => schemaData.newPassword === schemaData.confirmNewPassword, {
        message: "Passwords must match",
        path: ["confirmPassword"],
    });

export const validatePasswordChange = async (req: Request, res: Response, next: NextFunction) => {
    const formData = req.body;
    try {
        await changePasswordSchema.parseAsync(formData);
        next();
    } catch (err) {
        res.status(400).json({
            status: (err as zod.ZodError).issues[0].message,
        });
    }
};
