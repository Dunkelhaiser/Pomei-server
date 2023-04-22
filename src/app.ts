import express from "express";
import path from "path";
// eslint-disable-next-line import/newline-after-import
import dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, ".env") });
// eslint-disable-next-line import/first
import notesRoutes from "./routes/notes";
// import cors from "cors";

const app = express();
app.use(express.json());
app.use(notesRoutes);

const port = process.env.PORT || 3006;
app.listen(port, () => {
    console.log(`Server is clocked on port ${port}`);
});
