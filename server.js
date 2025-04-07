const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const { SpeechClient } = require("@google-cloud/speech");
const axios = require("axios");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const speechClient = new SpeechClient({ keyFilename: "key.json" });
const SERPAPI_KEY = "b00c9cdfba3d779fc42fb3142fe431d741fdef7ecb11d58d744c04fae78502c1";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `audio-${Date.now()}.webm`);
  },
});

const upload = multer({ storage });

app.post("/upload-audio", upload.single("audio"), async (req, res) => {
  const webmPath = req.file.path;
  console.log("Received file:", webmPath);
  const flacPath = `${webmPath}.flac`;

  try {
    await new Promise((resolve, reject) => {
      ffmpeg(webmPath)
        .audioChannels(1)
        .audioFrequency(16000)
        .toFormat("flac")
        .on("end", resolve)
        .on("error", reject)
        .save(flacPath);
    });

    const file = fs.readFileSync(flacPath);
    const audioBytes = file.toString("base64");

    const [response] = await speechClient.recognize({
      audio: { content: audioBytes },
      config: {
        encoding: "FLAC",
        sampleRateHertz: 16000,
        languageCode: "en-US",
      },
    });

    const transcript = response.results.map(r => r.alternatives[0].transcript).join(" ");
    fs.unlinkSync(webmPath);
    fs.unlinkSync(flacPath);
    res.json({ transcript });
  } catch (err) {
    console.error("Transcription error:", err);
    res.status(500).json({ error: "Transcription failed" });
  }
});

app.post("/api/search", async (req, res) => {
  const { query } = req.body;
  try {
    const { data } = await axios.get("https://serpapi.com/search", {
      params: {
        engine: "google_shopping",
        q: query,
        api_key: SERPAPI_KEY,
      },
    });

    const products = (data.shopping_results || []).map(p => ({
      title: p.title,
      price: p.price,
      image: p.thumbnail,
      link: p.link,
      source: p.source,
    }));

    res.json(products);
  } catch (err) {
    console.error("SerpAPI error:", err.message);
    res.status(500).json({ error: "Failed to fetch search results" });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
