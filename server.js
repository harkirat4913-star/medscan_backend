require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");
const multer = require("multer");
const Tesseract = require("tesseract.js");

const app = express();

app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const upload = multer({
  dest: "uploads/",
});

app.get("/", (req, res) => {
  res.send("MedScan Backend Running With OCR + Groq");
});

app.post("/ask", async (req, res) => {
  try {
    const prompt = req.body.prompt;

    const chatCompletion =
      await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.1-8b-instant",
      });

    res.json({
      answer:
        chatCompletion.choices[0]?.message?.content ||
        "No response",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

app.post(
  "/analyze-image",
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "No image uploaded",
        });
      }

      const result =
        await Tesseract.recognize(
          req.file.path,
          "eng"
        );

      const extractedText =
        result.data.text;

      const chatCompletion =
        await groq.chat.completions.create({
          messages: [
            {
              role: "user",
              content:
                `Analyze this prescription:\n\n${extractedText}\n\nExplain medicines, dosage, uses, warnings and side effects in simple language.`,
            },
          ],
          model: "llama-3.1-8b-instant",
        });

      res.json({
        extractedText,
        answer:
          chatCompletion.choices[0]?.message
            ?.content || "No response",
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});