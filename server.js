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


// ====================================================
// HOME
// ====================================================

app.get("/", (req, res) => {
  res.send("MedScan Backend Running With Groq Vision");
});


// ====================================================
// TEXT /ask
// ====================================================

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
    console.error("ASK ERROR:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});


// ====================================================
// IMAGE ANALYSIS
// NO OCR
// IMAGE GOES DIRECTLY TO GROQ VISION
// ====================================================

app.post(
  "/analyze-image",
  upload.single("image"),
  async (req, res) => {

    let imagePath = null;

    try {

      // ----------------------------------------------
      // CHECK IMAGE
      // ----------------------------------------------

      if (!req.file) {
        return res.status(400).json({
          error: "No image uploaded",
        });
      }

      imagePath = req.file.path;


      // ----------------------------------------------
      // GET LANGUAGE
      // ----------------------------------------------

      const language =
        req.body.language || "English";


      // ----------------------------------------------
      // LANGUAGE INSTRUCTION
      // ----------------------------------------------

      let languageInstruction = "";

      if (language === "Hindi") {

        languageInstruction = `
Answer completely in Hindi.

Use simple Hindi.
Use Devanagari script.

Medicine names may remain in their
normal spelling when appropriate.
`;

      } else if (language === "Punjabi") {

        languageInstruction = `
Answer completely in Punjabi.

Use simple Punjabi.
Use Gurmukhi script.

Medicine names may remain in their
normal spelling when appropriate.
`;

      } else {

        languageInstruction = `
Answer completely in English.

Use simple and clear English.
`;
      }


      // ----------------------------------------------
      // READ IMAGE
      // ----------------------------------------------

      const imageBuffer =
        fs.readFileSync(imagePath);

      const base64Image =
        imageBuffer.toString("base64");


      // ----------------------------------------------
      // IMAGE MIME TYPE
      // ----------------------------------------------

      const mimeType =
        req.file.mimetype || "image/jpeg";


      console.log(
        "================================"
      );

      console.log(
        "Image received"
      );

      console.log(
        "Language:",
        language
      );

      console.log(
        "MIME type:",
        mimeType
      );

      console.log(
        "Sending image to Groq Vision..."
      );


      // ----------------------------------------------
      // GROQ VISION
      // ----------------------------------------------

      const completion =
        await groq.chat.completions.create({

          model:
            "qwen/qwen3.6-27b",

          messages: [

            {
              role: "user",

              content: [

                {
                  type: "text",

                  text: `
You are MedScan AI.

${languageInstruction}

Look directly at the prescription image.

The user wants the AI answer directly.
Do NOT show OCR text.
Do NOT provide a separate extracted-text section.
Do NOT mention OCR.

Analyze the prescription image.

Identify medicines only when you can read
them with reasonable confidence.

For each medicine, provide:

1. Medicine name
2. General use
3. Dosage/frequency if clearly visible
4. Common side effects
5. Important warnings
6. Instructions visible on the prescription

IMPORTANT SAFETY RULES:

- Never invent a medicine name.
- Never invent a dosage.
- Never guess unclear handwriting.
- If something is unclear, clearly say it is unclear.
- Do not diagnose the patient.
- Do not tell the patient to start, stop,
  or change a medicine.
- Tell the user to confirm the prescription
  with a qualified healthcare professional.

Give the final answer directly to the user.

Keep the answer clear and easy to understand.
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


      // ----------------------------------------------
      // GET ANSWER
      // ----------------------------------------------

      const answer =
        completion
          .choices[0]
          ?.message
          ?.content ||
        "No AI response";


      console.log(
        "Groq response received"
      );


      // ----------------------------------------------
      // SEND ONLY AI ANSWER
      // ----------------------------------------------

      res.json({
        answer: answer,
        language: language,
      });


    } catch (err) {

      console.error(
        "================================"
      );

      console.error(
        "VISION ERROR:"
      );

      console.error(err);

      console.error(
        "================================"
      );


      res.status(500).json({
        error: err.message,
      });


    } finally {

      // --------------------------------------------
      // DELETE TEMPORARY IMAGE
      // --------------------------------------------

      if (imagePath) {

        try {

          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }

        } catch (deleteError) {

          console.error(
            "Could not delete temporary image:",
            deleteError
          );
        }
      }
    }
  }
);


// ====================================================
// START SERVER
// ====================================================

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});
