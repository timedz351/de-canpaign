/* eslint-disable no-undef */
// server.js
import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Assuming public folder for some static files if needed
app.use(express.static(path.join(process.cwd(), "public")));

// Serve the saved images statically
// This will allow direct access via: http://localhost:3001/saved_images/<filename>.png
app.use(
  "/saved_images",
  express.static(path.join(process.cwd(), "saved_images"))
);

app.post("/save-image", (req, res) => {
  const { image } = req.body;
  const base64Data = image.replace(/^data:image\/png;base64,/, "");
  const timestamp = Date.now();
  const filename = `image_${timestamp}.png`;

  const dir = path.join(process.cwd(), "saved_images");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const filepath = path.join(dir, filename);

  fs.writeFile(filepath, base64Data, "base64", (err) => {
    if (err) {
      console.error("Error saving image:", err);
      return res.status(500).json({
        success: false,
        message: "Error saving image",
      });
    }
    console.log("Image saved to", filepath);
    res.json({ success: true, message: "Image saved successfully", filename });
  });
});

// New endpoint to get the list of saved images
app.get("/images-list", (req, res) => {
  const dir = path.join(process.cwd(), "saved_images");

  // If directory doesn't exist, return an empty array
  if (!fs.existsSync(dir)) {
    return res.json([]);
  }

  fs.readdir(dir, (err, files) => {
    if (err) {
      console.error("Error reading saved_images directory:", err);
      return res
        .status(500)
        .json({ success: false, message: "Error reading images" });
    }

    // Filter only PNG files if needed:
    const imageFiles = files.filter((f) => f.endsWith(".png"));

    // Return array of filenames
    res.json(imageFiles);
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
