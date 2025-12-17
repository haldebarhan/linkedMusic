import multer from "multer";
import path from "path";
import createError from "http-errors";

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: any
) => {
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf", ".mp4", ".mp3"];
  const extension = path.extname(file.originalname).toLocaleLowerCase();
  if (allowedExtensions.includes(extension)) {
    cb(null, true);
  } else {
    cb(
      createError(
        "Invalid file type. Only JPG, JPEG, PNG, mp3, mp4 and PDF are allowed."
      )
    );
  }
};

const uploads = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 50,
  },
});

export default uploads;
