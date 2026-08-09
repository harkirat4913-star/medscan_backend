require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");
const multer = require("multer");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const upload = multer({
  dest: "uploads/",
});


// HOME
app.get("/", (req, res) => {
  res.send("MedScan Backend Running With Groq Vision");
});


// TEXT AI
app.post("/ask", async (req, res) => {
  try {
    const prompt = req.body.prompt;

    if (!prompt) {
      return res.status(400).json({
        error: "Prompt required",
      });
    }

    const completion =
      await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",

        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

    const answer =
      completion.choices[0]?.message?.content ||
      "No response from AI";

    res.json({
      answer: answer,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});


// IMAGE ANALYSIS
app.post(
  "/analyze-image",
  upload.single("image"),
  async (req, res) => {

    let imagePath = null;

    try {

      if (!req.file) {
        return res.status(400).json({
          error: "No image uploaded",
        });
      }

      imagePath = req.file.path;

      const language =
        req.body.language || "English";

      let languageInstruction;

      if (language === "Punjabi") {

        languageInstruction = `
Write the final answer ONLY in Punjabi.

Use Gurmukhi script.

Do not write the explanation in English.

Medicine names may remain in English if necessary.
`;

      } else if (language === "Hindi") {

        languageInstruction = `
Write the final answer ONLY in Hindi.

Use Devanagari script.

Do not write the explanation in English.

Medicine names may remain in English if necessary.
`;

      } else {

        languageInstruction = `
Write the final answer ONLY in English.
`;
      }


      // Read image
      const imageBuffer =
        fs.readFileSync(imagePath);

      const base64Image =
        imageBuffer.toString("base64");

      const mimeType =
        req.file.mimetype || "image/jpeg";


      // Send image directly to AI
      const completion =
        await groq.chat.completions.create({

          model: "qwen/qwen3.6-27b",

          reasoning_effort: "none",

          reasoning_format: "hidden",

          messages: [
            {
              role: "user",

              content: [

                {
                  type: "text",

                  text: `
You are MedScan AI.

${languageInstruction}

Analyze the uploaded medicine or prescription image directly.

Do NOT provide OCR text.

Do NOT provide an extracted text section.

Do NOT explain the OCR process.

Do NOT show internal reasoning.

Do NOT use <think> tags.

Give ONLY the final answer.

Provide:

1. Medicine name
2. General use
3. Dosage/frequency only if clearly visible
4. Common side effects
5. Important warnings
6. Important instructions if visible

Safety rules:

- Never invent a medicine name.
- Never invent dosage.
- If the image is unclear, say that it is unclear.
- Do not diagnose the patient.
- Do not tell the patient to start or stop medication.
- Recommend confirming medication and dosage with a qualified healthcare professional.

${languageInstruction}

Return ONLY the final user-facing answer.
`,
                },

                {
                  type: "image_url",

                  image_url: {
                    url:
                      `data:${mimeType};base64,${base64Image}`,
                  },
                },

              ],
            },
          ],

          temperature: 0.2,

          max_completion_tokens: 1500,
        });


      let answer =
        completion.choices[0]?.message?.content ||
        "No AI response";


      // Remove any accidental thinking tags
      answer = answer
        .replace(
          /<think>[\s\S]*?<\/think>/gi,
          ""
        )
        .replace(
          /<think>[\s\S]*/gi,
          ""
        )
        .trim();


      res.json({
        answer: answer,
        language: language,
      });


    } catch (err) {

      console.error("VISION ERROR:");
      console.error(err);

      res.status(500).json({
        error: err.message,
      });

    } finally {

      if (imagePath) {

        try {

          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }

        } catch (error) {

          console.error(
            "Could not delete temporary image:",
            error
          );

        }
      }
    }
  }
);


// START SERVER
const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});
