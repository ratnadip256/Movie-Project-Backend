import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.route.js";

const app = express();



const vercelPreviewRegex =
  /^https:\/\/movie-project-frontend-[a-z0-9]+-ratnadip-shits-projects\.vercel\.app$/;


app.use(
  cors({
    origin: [ "http://localhost:5173","https://movie-project-frontend-three.vercel.app"]
  })
);

// ─────────────────────────────────────────────
// Core Middleware

app.use(express.json({ limit: "15kb" }));
app.use(express.urlencoded({ extended: true, limit: "15kb" }));
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
