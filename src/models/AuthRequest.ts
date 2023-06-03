import { Request } from "express";

export interface Payload {
    id: string;
}
export interface AuthRequest extends Request {
    user?: string;
}
