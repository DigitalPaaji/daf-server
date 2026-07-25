import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const uploadDirectory = path.join(process.cwd(), "uploads", "videos");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${crypto.randomBytes(16).toString("hex")}-${Date.now()}${extension}`;

    callback(null, uniqueName);
  },
});

const allowedVideoTypes = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
];

const fileFilter: multer.Options["fileFilter"] = (
  _req,
  file,
  callback
) => {
  if (!allowedVideoTypes.includes(file.mimetype)) {
    return callback(
      new Error("Only MP4, WebM, MOV and MKV videos are allowed")
    );
  }

  callback(null, true);
};

export const uploadVideo = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200 MB
  },
});