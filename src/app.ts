/* eslint-disable import/first */
import express from "express";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, ".env") });
import authRoutes from "./routes/auth";
import notesRoutes from "./routes/notes";
import foldersRoutes from "./routes/folders";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: `${process.env.CLIENT}` }));

app.use("/auth", authRoutes);
app.use("/notes", notesRoutes);
app.use("/folders", foldersRoutes);

const port = process.env.PORT || 3006;
app.listen(port, () => {
    console.log(`Server is clocked on port ${port}`);
});
