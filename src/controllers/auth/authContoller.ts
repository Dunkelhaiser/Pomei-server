import { Request, Response } from "express";
import crypto from "crypto";
import { createTransport } from "nodemailer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { CronJob } from "cron";
import db from "../../db";
import { AuthRequest, Payload } from "../../models/AuthRequest";

const job = new CronJob("59 23 * * *", async () => {
    await db.refreshToken.deleteMany({
        where: {
            expiresAt: {
                lte: new Date(),
            },
        },
    });
    await db.verificationEmail.deleteMany({
        where: {
            expiresAt: {
                lte: new Date(),
            },
        },
    });
    await db.resetPasswordEmail.deleteMany({
        where: {
            expiresAt: {
                lte: new Date(),
            },
        },
    });
    await db.user.deleteMany({
        where: {
            isVerified: false,
            createdAt: {
                lte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
        },
    });
});

job.start();

const ONE_HOUR = 60 * 60 * 1000;
const THIRTY_DAYS = 2592000000;

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
                status: isAvailable.error,
            });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const verificationToken = crypto.randomBytes(20).toString("hex");

        await db.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                verificationEmail: {
                    create: {
                        token: verificationToken,
                        expiresAt: new Date(Date.now() + ONE_HOUR),
                    },
                },
            },
        });

        await sendVerificationEmail(email, verificationToken);

        res.status(201).json({
            status: "Account created successfully",
        });
    } catch (err) {
        res.status(500).json({
            status: "Failed to create account",
        });
    }
};

export const checkAvailableData = async (req: Request, res: Response) => {
    try {
        const { username, email } = req.body;
        const isAvailable = await checkAvailability(username, email);

        if (isAvailable?.error) {
            res.status(409).json({
                status: isAvailable.error,
            });
            return;
        }
        res.status(200).json({
            status: "Data is available",
        });
    } catch (err) {
        res.status(500).json({
            status: "Failed to check data availability",
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
                status: "Invalid username/email or password",
            });
            return;
        }
        const validPassword = await bcrypt.compare(password, existingUser.password);
        if (!validPassword) {
            res.status(401).json({
                status: "Invalid username/email or password",
            });
            return;
        }
        if (!existingUser.isVerified) {
            res.status(403).json({
                status: "Account is not verified",
            });
            return;
        }
        const accessToken = jwt.sign({ id: existingUser.id }, `${process.env.JWT_ACCESS_SECRET}`, { expiresIn: "30m" });
        const refreshToken = jwt.sign({ id: existingUser.id }, `${process.env.JWT_REFRESH_SECRET}`, { expiresIn: "30d" });
        await db.refreshToken.create({
            data: {
                token: refreshToken,
                userId: existingUser.id,
                expiresAt: new Date(Date.now() + THIRTY_DAYS),
            },
        });
        res.cookie("jwt", refreshToken, { httpOnly: true, sameSite: "none", secure: true, maxAge: 1000 * 60 * 60 * 24 * 30 });
        res.status(200).json({
            status: "Signed in successfully",
            accessToken,
        });
    } catch (err) {
        res.status(400).json({
            status: "Invalid user data",
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
            status: "Unauthorized",
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
            status: "Unauthorized",
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
            status: "Retrieved user data",
            user,
        });
    } catch (err) {
        res.status(500).json({
            status: "Failed to retrieve user data",
        });
    }
};

export const handleRefreshToken = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies.jwt;
        if (!refreshToken) {
            res.status(201).json({
                status: "Unauthorized",
            });
            return;
        }
        const existingUser = await db.user.findFirst({
            where: {
                refreshTokens: {
                    some: {
                        token: refreshToken,
                    },
                },
            },
        });
        if (!existingUser) {
            res.status(201).json({
                status: "Unauthorized",
            });
            return;
        }
        const decodedToken = jwt.verify(refreshToken, `${process.env.JWT_REFRESH_SECRET}`) as Payload;
        if (existingUser.id !== decodedToken.id) {
            res.status(201).json({
                status: "Unauthorized",
            });
            return;
        }
        const accessToken = jwt.sign({ id: decodedToken.id }, `${process.env.JWT_ACCESS_SECRET}`, { expiresIn: "30m" });
        res.status(201).json({
            status: "Access token refreshed",
            accessToken,
        });
    } catch (err) {
        res.status(500).json({
            status: "Failed to refresh access token",
        });
    }
};

export const verifyUser = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const verificationEmail = await db.verificationEmail.findFirst({
            where: { token },
        });

        const user = await db.user.findFirst({
            where: {
                verificationEmail: { token },
            },
        });

        if (!user || !verificationEmail) {
            res.status(404).json({ status: "Invalid verification token" });
            return;
        }

        const isExpired = new Date() > verificationEmail.expiresAt;

        if (isExpired) {
            res.status(403).json({ status: "Verification has expired" });
            return;
        }

        await db.user.update({
            where: { id: user.id },
            data: { isVerified: true, verificationEmail: undefined },
        });

        await db.verificationEmail.delete({
            where: { id: verificationEmail.id },
        });

        res.status(200).json({ status: "Account verified successfully" });
    } catch (err) {
        res.status(500).json({ status: "Failed to verify account" });
    }
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const user = await db.user.findFirst({
            where: {
                email,
            },
        });

        if (!user) {
            res.status(404).json({ status: "User not found" });
            return;
        }

        if (user.isVerified) {
            res.status(403).json({ status: "Account is already verified" });
            return;
        }

        const verificationToken = crypto.randomBytes(20).toString("hex");

        await db.verificationEmail.deleteMany({
            where: { userId: user.id },
        });

        await db.user.update({
            where: { id: user.id },
            data: {
                verificationEmail: {
                    create: {
                        token: verificationToken,
                        expiresAt: new Date(Date.now() + ONE_HOUR),
                    },
                },
            },
        });

        await sendVerificationEmail(email, verificationToken);

        res.status(201).json({
            status: "Verification email sent",
        });
    } catch (err) {
        res.status(500).json({
            status: "Failed to send verification email",
        });
    }
};

export const resetPasswordRequest = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const user = await db.user.findFirst({ where: { email } });

        if (!user) {
            res.status(404).json({ status: "User not found" });
            return;
        }

        const resetPasswordToken = crypto.randomBytes(20).toString("hex");
        const expiresAt = new Date(Date.now() + ONE_HOUR);

        const existingResetPasswordEmail = await db.resetPasswordEmail.findFirst({
            where: { userId: user.id },
        });

        const resetPasswordEmailData = {
            token: resetPasswordToken,
            expiresAt,
        };

        if (existingResetPasswordEmail) {
            await db.resetPasswordEmail.update({
                where: { id: existingResetPasswordEmail.id },
                data: resetPasswordEmailData,
            });
        } else {
            await db.user.update({
                where: { id: user.id },
                data: { resetPasswordEmail: { create: resetPasswordEmailData } },
            });
        }

        const mailOptions = {
            from: process.env.GMAIL_ADDRESS,
            to: email,
            subject: "Pomei - Reset Password",
            html: `<h1>Click <a href="${process.env.CLIENT}/reset_password/${resetPasswordToken}">here</a> to reset your password</h1>`,
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({
            status: "Reset password email sent",
        });
    } catch (err) {
        res.status(500).json({
            status: "Failed to send reset password email",
        });
    }
};

export const checkResetPasswordToken = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const resetPasswordEmail = await db.resetPasswordEmail.findFirst({
            where: { token },
        });

        const user = await db.user.findFirst({
            where: { resetPasswordEmail: { token } },
        });

        if (!resetPasswordEmail || !user) {
            res.status(404).json({ status: "Invalid reset password token" });
            return;
        }

        const isExpired = new Date() > resetPasswordEmail.expiresAt;

        if (isExpired) {
            res.status(403).json({ status: "Reset password link has expired" });
        }
    } catch (err) {
        res.status(500).json({ status: "Failed to check reset token" });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        const resetPasswordEmail = await db.resetPasswordEmail.findFirst({
            where: { token },
        });

        const user = await db.user.findFirst({
            where: { resetPasswordEmail: { token } },
        });

        if (!resetPasswordEmail || !user) {
            res.status(404).json({ status: "Invalid reset password token" });
            return;
        }

        const isExpired = new Date() > resetPasswordEmail.expiresAt;

        if (isExpired) {
            res.status(403).json({ status: "Reset password link has expired" });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await db.user.update({
            where: { id: user.id },
            data: { password: hashedPassword, resetPasswordEmail: undefined },
        });

        await db.resetPasswordEmail.delete({
            where: { id: resetPasswordEmail.id },
        });

        res.status(200).json({ status: "Password reset successfully" });
    } catch (err) {
        res.status(500).json({ status: "Failed to reset password" });
    }
};
