const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fileUpload = require("express-fileupload");
const User = require("../models/User");
const path = require("path");
require("dotenv").config();

const router = express.Router();

router.use(
  fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 },
  })
);

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  console.log("Request Body:", req.body);
  console.log("Uploaded Files:", req.files);

  if (!req.files || !req.files.image) {
    return res.status(400).json({ msg: "No image uploaded" });
  }

  const image = req.files.image;

  console.log("Uploaded Image:", image);
  console.log("Image Size:", image.size);
  console.log("Image Type:", image.mimetype);

  if (image.size > 5 * 1024 * 1024) {
    return res.status(400).json({ msg: "File size exceeds the 5MB limit" });
  }

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

    const imagePath = path.join(
      __dirname,
      "../uploads",
      `${Date.now()}-${image.name}`
    );

    console.log("Saving image to path:", imagePath);

    image.mv(imagePath, async (err) => {
      if (err) {
        console.error("Error moving file:", err);
        return res.status(500).json({ msg: "Error uploading file" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = new User({
        name,
        email,
        password: hashedPassword,
        image: imagePath,
      });

      await user.save();

      const payload = { user: { id: user.id } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      res.status(201).json({ token });
    });
  } catch (err) {
    console.error("Error saving user:", err.message);
    res.status(500).send("Server error");
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (err) {
    console.error("Error during login:", err.message);
    res.status(500).send("Server error");
  }
});

router.get("/profile", require("../middleware/auth"), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("Error fetching profile:", err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
