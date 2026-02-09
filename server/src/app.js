import express from "express";
import cors from "cors";
import path from "path";
import musicRoutes from "./routes/music.routes.js";

const app = express();

// Health Check (Top level)
app.get("/", (_, res) => res.send("🎵 Sangatamizh Music API is Live!"));
app.get("/health", (_, res) => res.json({ ok: true, status: "stable", folder: "server" }));

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173", 
  "http://localhost:5174",
  process.env.CLIENT_URL,
  process.env.MOBILE_CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // For debugging: Log the incoming origin
    if (origin) {
      console.log(`[CORS] Request from origin: ${origin}`);
    } else {
      console.log(`[CORS] Request with no origin (Server-side/Mobile)`);
    }

    // Always allow in this phase to stop the "Not allowed by CORS" errors
    callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// Routes mounted at /api to match frontend calls (e.g. api.get('/songs'))
app.use("/api", musicRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/health", (_, res) => res.json({ ok: true, status: "stable", folder: "server" }));

export default app;

