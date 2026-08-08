const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json());

console.log("SERVER VERSION 4");
console.log("API KEY EXISTS:", !!process.env.GEMINI_API_KEY);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/ask", async (req, res) => {
  try {
    const prompt = req.body.prompt;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash"
    });

    console.log("Using model: gemini-2.0-flash");

    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    res.json({
      answer: answer,
    });
  } catch (error) {
    console.error("Gemini Error:", error);

    res.status(500).json({
      answer: "Failed to get AI response",
      error: error.message,
    });
  }
});

app.get("/", (req, res) => {
  res.send("MedScan AI Backend Running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});