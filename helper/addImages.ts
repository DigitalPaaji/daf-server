import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";












const uploadDirBanner = path.join(process.cwd(), "uploads","banners");


if (!fs.existsSync(uploadDirBanner)) {
  fs.mkdirSync(uploadDirBanner, { recursive: true });
}


const storageBanner = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirBanner);
  },

  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);

    // 🔐 Strong unique filename  
    const uniqueName =
      crypto.randomBytes(16).toString("hex") +
      "-" +
      Date.now() +
      ext;

    cb(null, uniqueName);
  },
});


export const uploadBanners = multer({
  storage:storageBanner,
  //  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
});






// / / / / / / / / / / / / / / /   category     / / / / / / / / // /  ///  / / / / 
const uploadDirCategory = path.join(process.cwd(), "uploads","category");


if (!fs.existsSync(uploadDirCategory)) {
  fs.mkdirSync(uploadDirCategory, { recursive: true });
}


const storageCategory= multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirCategory);
  },

  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);

    // 🔐 Strong unique filename
    const uniqueName =
      crypto.randomBytes(16).toString("hex") +
      "-" +
      Date.now() +
      ext;

    cb(null, uniqueName);
  },
});


export const uploadCategory = multer({
  storage:storageCategory,
  // fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
});

///// products ]

const uploadDirProduct = path.join(process.cwd(), "uploads","product");

if (!fs.existsSync(uploadDirProduct)) {
  fs.mkdirSync(uploadDirProduct, { recursive: true });
}



const storageProduct= multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirProduct);
  },

  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);

    // 🔐 Strong unique filename
    const uniqueName =
      crypto.randomBytes(16).toString("hex") +
      "-" +
      Date.now() +
      ext;

    cb(null, uniqueName);
  },
});


export const uploadProducts = multer({
  storage:storageProduct,

  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
});


//collection  


const uploadDirCollection= path.join(process.cwd(), "uploads","collection");

if (!fs.existsSync(uploadDirCollection)) {
  fs.mkdirSync(uploadDirCollection, { recursive: true });
}



const storageCollaction= multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirCollection);
  },

  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);

    // 🔐 Strong unique filename 
    const uniqueName =
      crypto.randomBytes(16).toString("hex") +
      "-" +
      Date.now() +
      ext;

    cb(null, uniqueName);
  },
});


export const uploadCollection = multer({
  storage:storageCollaction,

  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
});










//////////// blog


const uploadDirBlog= path.join(process.cwd(), "uploads","blog");

if (!fs.existsSync(uploadDirBlog)) {
  fs.mkdirSync(uploadDirBlog, { recursive: true });
}



const storageBlog= multer.diskStorage({
  destination: (_req, _file, cb) => { 
    cb(null, uploadDirBlog);
  },

  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);

    // 🔐 Strong unique filename 
    const uniqueName =
      crypto.randomBytes(16).toString("hex") +
      "-" +
      Date.now() +
      ext;

    cb(null, uniqueName);
  },
});


export const uploadBlogs = multer({
  storage:storageBlog,

  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
});