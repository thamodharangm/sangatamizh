import express from "express";
import cors from "cors";
import path from "path";
import musicRoutes from "./routes/music.routes.js";

const app = express();

// Allow both desktop (5173) and mobile (5174) origins
const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());

// Routes mounted at /api to match frontend calls (e.g. api.get('/songs'))
app.use("/api", musicRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/health", (_, res) => res.json({ ok: true, status: "stable" }));

export default app;

