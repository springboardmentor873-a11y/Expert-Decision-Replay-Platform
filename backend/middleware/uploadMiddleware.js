const multer = require("multer");
const path = require("path");

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueName + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  console.log("File received:", file.originalname);
  console.log("File MIME type:", file.mimetype);

  const allowedExtensions = [
    "pdf",
    "doc",
    "docx",
    "jpg",
    "jpeg",
    "png",
  ];

  const extension = path
    .extname(file.originalname)
    .toLowerCase()
    .replace(".", "");

  console.log("File extension:", extension);

  if (allowedExtensions.includes(extension)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only PDF, DOC, DOCX, JPG, JPEG and PNG files are allowed"
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;