const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure that the 'uploads' folder exists, or create it
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Upload to the 'uploads' directory
  },
  filename: function (req, file, cb) {
    // Create a unique filename by appending the timestamp to the file's extension
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpg", "image/jpeg", "image/png", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error("Invalid file type"), false); // Reject the file
  }
};

// Initialize multer with storage and fileFilter options
const upload = multer({ storage, fileFilter });

module.exports = upload;
