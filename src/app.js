import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.route.js";

const app = express();

// ─────────────────────────────────────────────
// CORS Configuration
// ─────────────────────────────────────────────

// Explicit list: production URL + local dev ports
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
];

// Allows all Vercel preview deployments from this account
// Preview URL pattern: https://movie-project-frontend-<hash>-ratnadip-shits-projects.vercel.app
const vercelPreviewRegex =
  /^https:\/\/movie-project-frontend-[a-z0-9]+-ratnadip-shits-projects\.vercel\.app$/;

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Allow non-browser requests (Postman, curl, etc.)
  if (allowedOrigins.includes(origin)) return true; // Allow production & localhost
  if (vercelPreviewRegex.test(origin)) return true; // Allow Vercel preview URLs
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ─────────────────────────────────────────────
// Core Middleware
// ─────────────────────────────────────────────

app.use(express.json({ limit: "15kb" }));
app.use(express.urlencoded({ extended: true, limit: "15kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// ─────────────────────────────────────────────
// Health Check Route
// ─────────────────────────────────────────────

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Movie Backend API is running",
  });
});

// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────

app.use("/api/v1/users", userRouter);

// ─────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
  });
});

export default app;