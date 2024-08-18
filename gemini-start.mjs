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

function parseBulletPoints(prompt, offset) {
  console.log(prompt);
  const breaker = />>/;
  let prevNum = 0;
  let nxtNum = prompt.search(breaker);
  let steps = [];

  if (nxtNum == -1) {
    console.log("Did not have any steps... uh oh");
    return prompt;
  }

  do {
    let line = prompt.substring(prevNum + offset, nxtNum);
    //let temp = "<li>" + line + "</li>"; // why does this not work
    steps.push(line);
    //console.log("LINE: " + line);
    //console.log(prevNum + " : " + nxtNum);
    prevNum = prompt.indexOf("<<", nxtNum);
    nxtNum = prompt.indexOf(">>", prevNum);
  } while (prevNum > 0);

  let allSteps = "<ol>";
  //console.log(allSteps);
  for (let i = 0; i < steps.length; ++i) {
    allSteps += "<li>";
    allSteps += steps[i];
    allSteps += "</li>";
    //console.log(allSteps);
  }
  allSteps += "</ol>";

  //console.log(steps);
  //console.log(allSteps);
  return allSteps;
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
      "please give me the name of the object in the picture, do not capitalize the first word unless it is a formal name, add a or an before it";
    const object = (
      await model.generateContent([getObjName, ...imageParts])
    ).response.text();

    const getReqItems =
      "please give me the list of items required to create/produce/cook/build/craft " +
      object +
      " and include measurements needed. do not add any filler outside of << and >>. all items need to be in << and >> like <<item>>";
    const items = (await model.generateContent(getReqItems)).response.text();
    const tableOfItems = parseBulletPoints(items, 2);

    const getObjSteps =
      "please tell me how to create/produce/cook/build/craft " +
      object +
      " in simple, step by step instructions. do not use markdown notation. wrap each step in << and >>. for example <<1. cook the pasta>>. do not add any filler text outside of << and >>";
    const steps = (await model.generateContent(getObjSteps)).response.text();
    const tableOfSteps = parseBulletPoints(steps, 5);

    const getRelatedObj =
      "please give me 3 other things i could make, related to " +
      object +
      " and wrap each step in << and >>. for example, <<item>>. do not add anything outside of << and >>";
    const relatedObj = (
      await model.generateContent(getRelatedObj)
    ).response.text();
    const tableOfRelatedItems = parseBulletPoints(relatedObj, 2);

    //try {
    //  parseBulletPoints(steps);
    //} catch (error) {
    //  console.log("WHYYYYY");
    //}

    let page =
      `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>How to do anything!</title>
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
	<h1>How to make ${object}</h1>
	<h2>Items Needed</h2>` +
      tableOfItems +
      `<h2>Steps</h2>` +
      tableOfSteps +
      `
	<h2>Related Items</h2>
	<p>Here are 3 other cool things you could make related to ${object}:</p>` +
      tableOfRelatedItems +
      `</body>
</html>
`;

    res.send(page);
  } catch (error) {
    res.status(500).send("Error processing the file with AI.");
  } finally {
    fs.unlinkSync(filePath); // Clean up the uploaded file
  }
});

const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, 'public')));
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
