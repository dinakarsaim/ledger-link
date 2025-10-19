import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import authRouter from "./routes/auth";
import meRouter from "./routes/me";
import receiptsRouter from "./routes/receipts";


dotenv.config();
const app = express();

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

const ALLOWED_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
app.use(cors({
  origin: ALLOWED_ORIGIN,
  credentials: true,
}));


app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use("/api/auth", authRouter);
app.use("/api/receipts", receiptsRouter);

// placeholder for future routes
// app.use("/api/receipts", receiptsRouter);

app.use("/api/me", meRouter);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});