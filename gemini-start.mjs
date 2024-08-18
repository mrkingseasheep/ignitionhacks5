import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" }); // Specify the uploads directory

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.8,
  },
});

// Get the directory name for the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType,
    },
  };
}

// Serve the HTML form
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Handle file upload and AI processing
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const filePath = req.file.path;
  const mimeType = req.file.mimetype;

  const filePart = fileToGenerativePart(filePath, mimeType);

  try {
    const imageParts = [filePart];
    const getObjName = "please give me the name of the object in the picture";
    const object = (
      await model.generateContent([getObjName, ...imageParts])
    ).response.text();

    const getObjSteps =
      "please tell me how to create/produce/cook/build/craft or make " + object;
    const steps = (
      await model.generateContent([getObjSteps, ...imageParts])
    ).response.text();

    const getRelatedObj =
      "give me 3 other things i could make, related to " + object;
    const relatedObj = (
      await model.generateContent(getRelatedObj)
    ).response.text();

    res.send(
      `<h1>How to make ${object}</h1><p>${steps} </p> <br> <p>${relatedObj}</p>`,
    );
  } catch (error) {
    res.status(500).send("Error processing the file with AI.");
  } finally {
    fs.unlinkSync(filePath); // Clean up the uploaded file
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
