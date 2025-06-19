const express = require("express");
const axios = require("axios");
const { v2: cloudinary } = require("cloudinary");
require("dotenv").config();

const { createWriteStream, existsSync, mkdirSync } = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const { Readable } = require("stream");
const { GoogleGenAI } = require("@google/genai");
const { pipeline } = require("stream");
const { promisify } = require("util");
const pipe = promisify(pipeline);
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const USE_VEO = process.env.USE_VEO === "true";

// STEP 1: Build script prompt
function buildScriptPrompt({ features, tone, audience, style }) {
  return `
Create a 5-second promotional video script for an energy drink called "Suplimax".
- Product Features: ${features.join(", ")}
- Tone: ${tone}
- Audience: ${audience}
- Visual Style: ${style}
- The name \"Suplimax\" should be clearly mentioned in the visuals.
Keep it dynamic and punchy.
  `;
}

// POST /generate-image-- newwww
async function generateSuplimaxImage(prompt) {
  const PROJECT_ID = "amazing-folio-463417-v6";
  const LOCATION_ID = "us-central1";
  const MODEL_ID = "imagen-4.0-generate-preview-05-20";
  const API_ENDPOINT = "us-central1-aiplatform.googleapis.com";

  const requestPayload = {
    endpoint: `projects/${PROJECT_ID}/locations/${LOCATION_ID}/publishers/google/models/${MODEL_ID}`,
    instances: [{ prompt }],
    parameters: {
      aspectRatio: "16:9",
      sampleCount: 1,
      enhancePrompt: false,
      addWatermark: true,
      includeRaiReason: true,
      language: "auto",
    },
  };

  try {
    const accessToken = process.env.GOOGLE_OAUTH_TOKEN; // From service account or gcloud

    const apiURL = `https://${API_ENDPOINT}/v1/projects/${PROJECT_ID}/locations/${LOCATION_ID}/publishers/google/models/${MODEL_ID}:predict`;

    const response = await axios.post(apiURL, requestPayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const imageBase64 = response.data?.predictions?.[0]?.bytesBase64Encoded;
    if (!imageBase64) {
      throw new Error("No image returned from model");
    }

    const imageDataURL = `data:image/png;base64,${imageBase64}`;
    const uploadRes = await cloudinary.uploader.upload(imageDataURL, {
      folder: "suplimax",
      overwrite: true,
    });

    return {
      imageUrl: uploadRes.secure_url,
      base64: imageBase64,
    };
  } catch (err) {
    console.error(
      "❌ Failed to generate image:",
      err.response?.data || err.message
    );
    throw err;
  }
}
// STEP 2: Generate product image with Gemini (image model)
async function generateSuplimaxImagde() {
  const imagePrompt =
    'can you create me an AI image of an energy drink labelled with the word: "Suplimax" clearly visible';
  const imageRes = await axios.post(
    "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent",
    {
      contents: [
        {
          parts: [
            {
              text: imagePrompt,
            },
          ],
        },
      ],
    },
    {
      params: {
        key: process.env.GEMINI_API_KEY,
      },
    }
  );

  const base64Image =
    imageRes.data.candidates[0].content.parts[0].inline_data.data;
  const imageBuffer = Buffer.from(base64Image, "base64");

  const result = await cloudinary.uploader.upload(
    `data:image/png;base64,${base64Image}`,
    {
      folder: "suplimax",
      public_id: "ai-generated",
      overwrite: true,
    }
  );

  return result.secure_url;
}

// STEP 3: Generate script with Gemini
async function generateScript(prompt) {
  return prompt;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const PROJECT_ID = process.env.GCP_PROJECT_ID; // e.g. "amazing-folio-463417-v6"
const LOCATION = process.env.GCP_LOCATION || "us-central1";
const MODEL_ID = "veo-2.0-generate-001";
const API_ENDPOINT = `${LOCATION}-aiplatform.googleapis.com`;

// NOTE: This requires a valid OAuth 2.0 access token, not API key
async function generateVideoWithVeo({ script, base64 }) {
  try {
    const accessToken = process.env.GOOGLE_OAUTH_TOKEN; // From service account or gcloud

    // Step 1: Request video generation
    const startResponse = await axios.post(
      `https://${API_ENDPOINT}/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:predictLongRunning`,
      {
        endpoint: `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}`,
        instances: [
          {
            prompt: script,
            image: { bytesBase64Encoded: base64, mimeType: "image/png" },
          },
        ],
        parameters: {
          aspectRatio: "16:9",
          sampleCount: 1,
          durationSeconds: "5",
          personGeneration: "allow_all",
          enablePromptRewriting: true,
          addWatermark: true,
          includeRaiReason: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const operationName = startResponse.data.name;
    if (!operationName) throw new Error("No operation ID returned");

    console.log("🚀 Veo Operation ID:", operationName);

    // Step 2: Poll until done
    let result = null;
    const pollUrl = `https://${API_ENDPOINT}/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:fetchPredictOperation`;

    const maxAttempts = 12;
    let attempt = 0;

    while (attempt < maxAttempts) {
      console.log(`⏳ Polling attempt ${attempt + 1}...`);
      await new Promise((r) => setTimeout(r, 20000)); // 20s delay

      const pollRes = await axios.post(
        pollUrl,
        { operationName },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (pollRes.data?.done) {
        result = pollRes.data;
        break;
      }

      attempt++;
    }

    if (
      !result ||
      !result.response?.videos ||
      !result.response.videos[0]?.bytesBase64Encoded
    ) {
      throw new Error("❌ No video data returned from Veo.");
    }

    const timestamp = Date.now();
    const videoDir = path.join(__dirname, "../public/videos");
    const inputPath = path.join(videoDir, `raw-${timestamp}.mp4`);
    const outputPath = path.join(videoDir, `video-${timestamp}.mp4`);

    // Step 3: Decode and save the video
    const videoBase64 = result.response.videos[0].bytesBase64Encoded;

    saveBase64Video(videoBase64, inputPath);

    await convertToCompatibleMp4(inputPath, outputPath);

    console.log("🎉 Final video ready at:", outputPath);
    return `/videos/raw-${timestamp}.mp4`;
  } catch (err) {
    console.error("❌ Failed to generate video with Veo:", err.message);
    return null;
  }
}

// Step 1: Save base64 to MP4
function saveBase64Video(base64String, outputPath) {
  const cleanBase64 = base64String.replace(/^data:video\/mp4;base64,/, "");
  const buffer = Buffer.from(cleanBase64, "base64");
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Raw base64 video saved to: ${outputPath}`);
}

// Step 2: Convert to compatible H.264 MP4
function convertToCompatibleMp4(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec("libx264")
      .outputOptions(["-profile:v baseline", "-level 3.0", "-pix_fmt yuv420p"])
      .on("end", () => {
        console.log(`✅ FFmpeg conversion done: ${outputPath}`);
        resolve(outputPath);
      })
      .on("error", (err) => {
        console.error("❌ FFmpeg error:", err);
        reject(err);
      })
      .save(outputPath);
  });
}

// MAIN ROUTE
router.post("/generate-marketing-video", async (req, res) => {
  try {
    const { features, tone, audience, style } = req.body;

    const prompt = buildScriptPrompt({ features, tone, audience, style });
    const script = await generateScript(prompt);

    // const suplimaxImageUrl = await generateSuplimaxImage();
    // const suplimaxImageUrl = "DUMMY";
    const imagePrompt =
      "can you create me an AI image of an energy drink labelled with the word: 'Suplimax' clearly visible";
    const { imageUrl: suplimaxImageUrl, base64: base64image } =
      await generateSuplimaxImage(imagePrompt);

    const videoUrl = await generateVideoWithVeo({
      script,
      base64: base64image,
    });
    console.log("Prompt:\n", prompt);
    console.log("Script:\n", script);
    console.log("Image URL:\n", suplimaxImageUrl);
    console.log("Video URL:\n", videoUrl);

    res.json({ script, imageUrl: suplimaxImageUrl, videoUrl });
  } catch (err) {
    console.error("❌ Error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Video generation failed" });
  }
});

module.exports = router;
