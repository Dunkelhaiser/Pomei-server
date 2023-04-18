import express from "express";
import * as dotenv from "dotenv";
// import cors from "cors";

dotenv.config({ path: `${__dirname}/.env` });

const app = express();
app.use(express.json());

const port = process.env.PORT || 3006;
app.listen(port, () => {
    console.log(`Server is clocked on port ${port}`);
});
