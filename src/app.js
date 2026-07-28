import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.route.js";

const app = express();

const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175'
];

// Regex to allow ALL Vercel preview deployment URLs from this account.
// Preview URLs follow the pattern: https://movie-project-frontend-<hash>-ratnadip-shits-projects.vercel.app
const vercelPreviewRegex = /^https:\/\/movie-project-frontend-[a-z0-9]+-ratnadip-shits-projects\.vercel\.app$/;

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g., mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    // Allow if it's in the explicit allowlist (production URL, localhost)
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Allow if it matches any Vercel preview URL from this project
    if (vercelPreviewRegex.test(origin)) return callback(null, true);

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: "15kb" })); // accepting json data limit from client site.
app.use(express.urlencoded({ extended: true, limit: "15kb" })); // storing data which are comes from html forms.
app.use(express.static("public")); // store image , file, folder in "public folder".
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Movie Backend API is running"
  });
});


// define main route link of user section.
app.use("/api/v1/users", userRouter)

// Global Error Handler to ensure JSON responses
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return res.status(statusCode).json({
    success: false,
    message: message,
    errors: err.errors || []
  });
});

export default app;