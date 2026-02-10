import express from "express";
import cors from "cors";
import path from "path";
import musicRoutes from "./routes/music.routes.js";
import supabaseAdminRoutes from "./routes/supabase.admin.routes.js";

const app = express();

// 1. GLOBAL MIDDLEWARE (MUST be before routes)
app.use(cors({
  origin: (origin, callback) => {
    // 1. Allow mobile/server-side (no origin)
    if (!origin) return callback(null, true);
    
    // 2. Define your production domains here and in .env
    const allowed = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5175',
      process.env.CLIENT_URL,
      process.env.ADMIN_URL
    ].filter(Boolean);

    // 3. Check if current origin is allowed or in same family
    const isAllowed = allowed.some(a => origin.startsWith(a)) || origin.includes('vercel.app');
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log(`[CORS] Rejected: ${origin}`);
      callback(null, true); // Still allowing for now but logging
    }
  },
  credentials: true
}));

app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// 2. HEALTH & INFO ROUTES
app.get("/", (_, res) => res.send("🎵 Sangatamizh Music API is Live!"));
app.get("/health", (_, res) => res.json({ ok: true, status: "stable", folder: "server" }));

// 3. API ROUTES
app.use("/api", musicRoutes);
app.use("/api/supabase", supabaseAdminRoutes);

export default app;
