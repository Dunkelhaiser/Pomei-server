/* eslint-disable import/first */
import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, ".env") });
import notesRoutes from "./routes/notes";
import authRoutes from "./routes/auth";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({ credentials: true, origin: `${process.env.CLIENT}` }));

app.use("/notes", notesRoutes);
app.use("/auth", authRoutes);

const port = process.env.PORT || 3006;
app.listen(port, () => {
    console.log(`Server is clocked on port ${port}`);
});
