// server.js
import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors"; // Import cors

const app = express();

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json({ limit: "10mb" })); // Increase limit if needed

// Serve static files
app.use(express.static(path.join(process.cwd(), "public")));

// Handle POST request to /save-image
app.post("/save-image", (req, res) => {
  const { image } = req.body;

  // image should be "data:image/png;base64,..." format
  const base64Data = image.replace(/^data:image\/png;base64,/, "");

  const timestamp = Date.now();
  const filename = `image_${timestamp}.png`;

  // Ensure saved_images directory exists
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

// Start the server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
