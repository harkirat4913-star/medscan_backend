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


// ----------------------------------------------------
// HOME
// ----------------------------------------------------

app.get("/", (req, res) => {
  res.send("MedScan Backend Running With Groq Vision");
});


// ----------------------------------------------------
// TEXT /ASK ENDPOINT
// ----------------------------------------------------

app.post("/ask", async (req, res) => {
  try {
    const prompt = req.body.prompt;

    if (!prompt) {
      return res.status(400).json({
        error: "Prompt required",
      });
    }

    const chatCompletion =
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
      chatCompletion.choices[0]?.message?.content ||
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


// ----------------------------------------------------
// IMAGE ANALYSIS - NO OCR
// ----------------------------------------------------

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


      // ----------------------------------------------
      // LANGUAGE
      // ----------------------------------------------

      let languageInstruction = "";

      if (language === "Hindi") {

        languageInstruction = `
Answer completely in Hindi.
Use simple Hindi and Devanagari script.
Medicine names can remain in their normal spelling.
`;

      } else if (language === "Punjabi") {

        languageInstruction = `
Answer completely in Punjabi.
Use simple Punjabi written in Gurmukhi script.
Medicine names can remain in their normal spelling.
`;

      } else {

        languageInstruction = `
Answer completely in English.
Use simple and clear English.
`;
      }


      // ----------------------------------------------
      // READ IMAGE AS BASE64
      // ----------------------------------------------

      const imageBuffer =
        fs.readFileSync(imagePath);

      const base64Image =
        imageBuffer.toString("base64");


      // ----------------------------------------------
      // DETERMINE IMAGE TYPE
      // ----------------------------------------------

      let mimeType =
        req.file.mimetype ||
        "image/jpeg";


      // ----------------------------------------------
      // SEND IMAGE DIRECTLY TO GROQ VISION
      // ----------------------------------------------

      const completion =
        await groq.chat.completions.create({

          model:
            "meta-llama/llama-4-scout-17b-16e-instruct",

          messages: [

            {
              role: "user",

              content: [

                {
                  type: "text",

                  text: `
You are MedScan AI.

${languageInstruction}

Look directly at this prescription image.

DO NOT describe the OCR process.
DO NOT provide extracted text separately.

Analyze the prescription image and give the user a useful medical-information summary.

Identify medicines only when you can read them with reasonable confidence.

For each medicine, provide:

1. Medicine name
2. What it is generally used for
3. Dosage/frequency if clearly visible
4. Common side effects
5. Important warnings
6. Instructions visible on the prescription

IMPORTANT:

- Never invent a medicine name.
- Never invent a dosage.
- If something is unclear, say that it is unclear.
- Do not diagnose the patient.
- Do not tell the patient to start, stop, or change medication.
- Tell the user to confirm the prescription with a qualified healthcare professional.
- Keep the answer clear and easy to understand.

Give the final answer directly to the user.
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


      const answer =
        completion
          .choices[0]
          ?.message
          ?.content ||
        "No AI response";


      // ----------------------------------------------
      // SEND ONLY AI ANSWER
      // ----------------------------------------------

      res.json({
        answer: answer,
        language: language,
      });


    } catch (err) {

      console.error(
        "VISION ERROR:",
        err
      );

      res.status(500).json({
        error: err.message,
      });


    } finally {

      // Delete temporary image

      if (imagePath) {

        try {

          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }

        } catch (deleteError) {

          console.error(
            "Could not delete image:",
            deleteError
          );

        }
      }
    }
  }
);


// ----------------------------------------------------
// SERVER
// ----------------------------------------------------

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});