import { Request, Response } from "express";
import crypto from "crypto";
import { createTransport } from "nodemailer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../../db";
import { AuthRequest, Payload } from "../../models/AuthRequest";

const transporter = createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_ADDRESS,
        pass: process.env.GMAIL_PASSWORD,
    },
});

const sendVerificationEmail = async (email: string, token: string) => {
    const mailOptions = {
        from: process.env.GMAIL_ADDRESS,
        to: email,
        subject: "Pomei - Verification",
        html: `<h1>Click <a href="${process.env.CLIENT}/verify/${token}">here</a> to verify your account</h1>`,
    };
    await transporter.sendMail(mailOptions);
};

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
        const verificationToken = crypto.randomBytes(20).toString("hex");

        const createdUser = await db.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                verificationEmail: {
                    create: {
                        token: verificationToken,
                        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
                    },
                },
            },
        });

        await sendVerificationEmail(email, verificationToken);

        setTimeout(async () => {
            const user = await db.user.findUnique({
                where: { id: createdUser.id },
                include: { verificationEmail: true },
            });

            if (!user || user.isVerified) {
                return;
            }

            await db.user.delete({ where: { id: createdUser.id } });
        }, 60 * 60 * 1000);

        res.status(201).json({
            status: "Verification email sent",
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
        if (!existingUser.isVerified) {
            res.status(403).json({
                error: "Account is not verified",
            });
            return;
        }
        const accessToken = jwt.sign({ id: existingUser.id }, `${process.env.JWT_ACCESS_SECRET}`, { expiresIn: "30m" });
        const refreshToken = jwt.sign({ id: existingUser.id }, `${process.env.JWT_REFRESH_SECRET}`, { expiresIn: "30d" });
        await db.refreshToken.create({
            data: {
                token: refreshToken,
                userId: existingUser.id,
            },
        });
        res.cookie("jwt", refreshToken, { httpOnly: true, sameSite: "none", secure: true, maxAge: 1000 * 60 * 60 * 24 * 30 });
        res.status(200).json({ accessToken });
    } catch (err) {
        res.status(400).json({
            error: "Invalid user data",
        });
    }
};

export const signOut = async (req: AuthRequest, res: Response) => {
    try {
        const refreshToken = req.cookies.jwt;
        if (!refreshToken) {
            res.sendStatus(204);
            return;
        }
        const existingRefreshToken = await db.refreshToken.findFirst({
            where: {
                token: refreshToken,
            },
        });
        if (!existingRefreshToken) {
            res.clearCookie("jwt", { httpOnly: true, sameSite: "none", secure: true, maxAge: 1000 * 60 * 60 * 24 * 30 });
            res.sendStatus(204);
            return;
        }
        await db.refreshToken.delete({
            where: {
                id: existingRefreshToken.id,
            },
        });
        res.clearCookie("jwt", { httpOnly: true, sameSite: "none", secure: true, maxAge: 1000 * 60 * 60 * 24 * 30 });
        res.sendStatus(204);
    } catch (err) {
        res.status(401).json({
            error: "Unauthorized",
        });
    }
};

export const terminateAllSessions = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;
        await db.refreshToken.deleteMany({
            where: {
                userId,
            },
        });
        res.sendStatus(204);
    } catch (err) {
        res.status(401).json({
            error: "Unauthorized",
        });
    }
};

export const getAuthUser = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user;
        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                age: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.status(200).json({
            user,
        });
    } catch (err) {
        res.status(401).json({
            error: "Unauthorized",
        });
    }
};

export const handleRefreshToken = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies.jwt;
        if (!refreshToken) throw new Error("Unauthorized");
        const existingUser = await db.user.findFirst({
            where: {
                refreshTokens: {
                    some: {
                        token: refreshToken,
                    },
                },
            },
        });
        if (!existingUser) throw new Error("Unauthorized");
        const decodedToken = jwt.verify(refreshToken, `${process.env.JWT_REFRESH_SECRET}`) as Payload;
        if (existingUser.id !== decodedToken.id) throw new Error("Unauthorized");
        const accessToken = jwt.sign({ id: decodedToken.id }, `${process.env.JWT_ACCESS_SECRET}`, { expiresIn: "30m" });
        res.status(201).json({
            accessToken,
        });
    } catch (err) {
        res.status(401).json({
            error: "Unauthorized",
        });
    }
};

export const verifyUser = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const verificationEmail = await db.verificationEmail.findFirst({
            where: {
                token,
            },
        });

        if (!verificationEmail) {
            res.status(404).json({ message: "Invalid verification token" });
            return;
        }

        const user = await db.user.findFirst({
            where: {
                verificationEmail: {
                    token,
                },
            },
        });

        if (!user) {
            res.status(404).json({ message: "Invalid verification token" });
            return;
        }

        const isExpired = new Date() > verificationEmail.expiresAt;

        if (isExpired) {
            res.status(403).json({ message: "Verification has expired" });
            return;
        }

        await db.user.update({
            where: { id: user.id },
            data: { isVerified: true, verificationEmail: undefined },
        });

        await db.verificationEmail.delete({
            where: { id: verificationEmail.id },
        });

        res.status(200).json({ message: "Account verified successfully" });
    } catch (err) {
        res.status(403).json({ message: "Invalid verification token" });
    }
};
