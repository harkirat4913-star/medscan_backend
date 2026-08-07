const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json());

// Read Gemini API key from Render Environment Variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// AI Endpoint
app.post("/ask", async (req, res) => {
  try {
    const prompt = req.body.prompt;

    if (!prompt) {
      return res.status(400).json({
        answer: "Please provide a prompt",
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    res.json({
      answer: answer,
    });
  } catch (error) {
    console.error("Gemini Error:", error);

    res.status(500).json({
      answer: "Failed to get AI response",
    });
  }
});

// Home Route
app.get("/", (req, res) => {
  res.send("MedScan AI Backend Running");
});

// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});