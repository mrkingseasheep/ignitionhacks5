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

function parseBulletPoints(prompt) {
  const bulletPoint = />> <</;
  let prevNum = 2;
  let nxtNum = prompt.search(bulletPoint);
  let steps = [];

  if (nxtNum == -1) {
    console.log("Did not have any steps... uh oh");
    return prompt;
  }

  do {
    let line = prompt.substring(prevNum, nxtNum);
    console.log("LINE: " + line);
    console.log(prevNum + " : " + nxtNum);
    prevNum = nxtNum;
    steps.push(line);
    nxtNum = prompt.indexOf(bulletPoint, prevNum);
  } while (nxtNum != -1);

  console.log(steps);
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
    const getObjName =
      "please give me the name of the object in the picture, do not capitalize the first word unless it is a formal name";
    const object = (
      await model.generateContent([getObjName, ...imageParts])
    ).response.text();

    const getObjSteps =
      "please tell me how to create/produce/cook/build/craft " +
      object +
      " in simple, step by step instructions. do not use markdown notation. wrap each step in << and >>. for example <<1. cook the pasta>>. do not add any filler text outside of << and >>";
    const steps = (await model.generateContent(getObjSteps)).response.text();

    const getRelatedObj =
      "please give me 3 other things i could make, related to " + object;
    const relatedObj = (
      await model.generateContent(getRelatedObj)
    ).response.text();

    parseBulletPoints(steps);

    res.send(`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>How to do anything!</title>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
	<h1>How to make ${object}</h1>
	<h2>Steps</h2>
	<p>${steps} </p>
	<h2>Related Items</h2>
	<p>${relatedObj}</p>
  </body>
</html>
`);
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
