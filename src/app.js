import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.route.js";

const app = express();



const vercelPreviewRegex =
  /^https:\/\/movie-project-frontend-[a-z0-9]+-ratnadip-shits-projects\.vercel\.app$/;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "https://movie-project-frontend-three.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || vercelPreviewRegex.test(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// ─────────────────────────────────────────────
// Core Middleware

app.use(express.json({ limit: "16mb" }));
app.use(express.urlencoded({ extended: true, limit: "16mb" }));
app.use(express.static("public"));
app.use(cookieParser());


app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Movie Backend API is running",
  });
});


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
