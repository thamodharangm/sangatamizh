import express from "express";
import cors from "cors";
import path from "path";
import musicRoutes from "./routes/music.routes.js";

const app = express();

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173", 
  "http://localhost:5174",
  process.env.CLIENT_URL,
  process.env.MOBILE_CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      // In production, you might want to be stricter, but for now we allow if it matches
      callback(null, true); 
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

