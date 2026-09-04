import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import app from "../src/app.js";
import connectDB from "../src/db/connectDB.js";

export default async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error("Vercel Function DB Connection Error:", error);
    return res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
};
