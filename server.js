   const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/ask", async (req, res) => {
  try {
    const prompt = req.body.prompt;

    res.json({
      answer: `You asked: ${prompt}`
    });

  } catch (e) {
    res.status(500).json({
      answer: "Server Error"
    });
  }
});

app.get("/", (req, res) => {
  res.send("MedScan AI Backend Running");
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});
