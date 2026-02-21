import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      }
    );

    const data = await response.json();

    // ✅ extract safely
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Gadfly is unimpressed. Try again.";

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "api failed" });
  }
});
app.get("/", (req, res) => {
  res.send("Gadfly backend is alive 🔥");
});
app.listen(3000, () => console.log("gadfly backend running on port 3000"));