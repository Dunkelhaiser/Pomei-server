import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, ".env") });
// eslint-disable-next-line import/first
import notesRoutes from "./routes/notes";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({ credentials: true, origin: `${process.env.CLIENT}` }));

app.use(notesRoutes);

const port = process.env.PORT || 3006;
app.listen(port, () => {
    console.log(`Server is clocked on port ${port}`);
});
