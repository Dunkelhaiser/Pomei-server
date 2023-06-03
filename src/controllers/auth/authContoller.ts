import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../../db";

type ConflictError = {
    username: string;
    email: string;
};

const checkAvailability = async (username: string, email: string) => {
    const existingUsers = await db.user.findMany({
        where: {
            OR: [{ username }, { email }],
        },
    });
    const errors = {} as ConflictError;
    existingUsers.forEach((user) => {
        if (user.username === username) {
            errors.username = "Username already exists";
        }
        if (user.email === email) {
            errors.email = "Email already exists";
        }
    });
    return Object.keys(errors).length > 0 ? { error: errors } : null;
};

export const signUp = async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;
        const isAvailable = await checkAvailability(username, email);

        if (isAvailable?.error) {
            res.status(409).json({
                error: isAvailable.error,
            });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        await db.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
            },
        });
        res.status(201).json({
            status: "Sign up successful",
        });
    } catch (err) {
        res.status(400).json({
            error: "Invalid user data",
        });
    }
};

export const checkAvailableData = async (req: Request, res: Response) => {
    try {
        const { username, email } = req.body;
        const isAvailable = await checkAvailability(username, email);

        if (isAvailable?.error) {
            res.status(409).json({
                error: isAvailable.error,
            });
            return;
        }
        res.status(200).json({
            status: "Data is available",
        });
    } catch (err) {
        res.status(400).json({
            error: "Invalid user data",
        });
    }
};

export const signIn = async (req: Request, res: Response) => {
    try {
        const { login, password } = req.body;
        const existingUser = await db.user.findFirst({
            where: {
                OR: [{ email: login }, { username: login }],
            },
        });
        if (!existingUser) {
            res.status(401).json({
                error: "Invalid username/email or password",
            });
            return;
        }
        const validPassword = await bcrypt.compare(password, existingUser.password);
        if (!validPassword) {
            res.status(401).json({
                error: "Invalid username/email or password",
            });
            return;
        }
        const token = jwt.sign(
            { id: existingUser.id, username: existingUser.username, email: existingUser.email },
            `${process.env.JWT_ACCESS_SECRET}`,
            { expiresIn: "2h" }
        );
        res.status(200).json({
            token,
            user: existingUser.id,
        });
    } catch (err) {
        res.status(400).json({
            error: "Invalid user data",
        });
    }
};
