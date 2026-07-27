import multer from "multer";


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/temp") //cb --> callback.
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
})

export const multerStorage = multer({ storage });