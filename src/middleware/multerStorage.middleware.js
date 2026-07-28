import multer from "multer";
import os from "os";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use the OS temporary directory (which maps to /tmp in Vercel)
    // because Vercel serverless functions have a read-only filesystem everywhere else.
    cb(null, os.tmpdir()); 
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
})

export const multerStorage = multer({ storage });