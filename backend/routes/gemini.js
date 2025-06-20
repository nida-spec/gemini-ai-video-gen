const express = require("express");
const axios = require("axios");
const { v2: cloudinary } = require("cloudinary");
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const USE_VEO = process.env.USE_VEO === "true";

// STEP 1: Build script prompt
async function buildScriptPrompt({ features, tone, audience, style }) {
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

// STEP 2: Generate energy drink image
async function generateSuplimaxImage(prompt) {
  const requestPayload = {
    endpoint: `projects/${process.env.GCP_PROJECT_ID}/locations/${process.env.GCP_LOCATION}/publishers/google/models/${process.env.MODEL_ID_IMAGE}`,
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
    const apiURL = `https://${process.env.API_ENDPOINT}/v1/projects/${process.env.GCP_PROJECT_ID}/locations/${process.env.GCP_LOCATION}/publishers/google/models/${process.env.MODEL_ID_IMAGE}:predict`;
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

// NOTE: This requires a valid OAuth 2.0 access token, not API key
// STEP 3: Generate video using veo based on generated image and prompt
async function generateVideoWithVeo({ script, base64 }) {
  try {
    const accessToken = process.env.GOOGLE_OAUTH_TOKEN; // From service account or gcloud

    // Step 1: Request video generation
    const startResponse = await axios.post(
      `https://${process.env.API_ENDPOINT}/v1/projects/${process.env.GCP_PROJECT_ID}/locations/${process.env.GCP_LOCATION}/publishers/google/models/${process.env.MODEL_ID_VIDEO}:predictLongRunning`,
      {
        endpoint: `projects/${process.env.GCP_PROJECT_ID}/locations/${process.env.GCP_LOCATION}/publishers/google/models/${process.env.MODEL_ID_VIDEO}`,
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
    const pollUrl = `https://${process.env.API_ENDPOINT}/v1/projects/${process.env.GCP_PROJECT_ID}/locations/${process.env.GCP_LOCATION}/publishers/google/models/${process.env.MODEL_ID_VIDEO}:fetchPredictOperation`;

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
    console.log("🎉 Final video ready at:", outputPath);
    return `/videos/raw-${timestamp}.mp4`;
  } catch (err) {
    console.error("❌ Failed to generate video with Veo:", err.message);
    return null;
  }
}

// Step 4: Save base64 to MP4
function saveBase64Video(base64String, outputPath) {
  const cleanBase64 = base64String.replace(/^data:video\/mp4;base64,/, "");
  const buffer = Buffer.from(cleanBase64, "base64");
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Raw base64 video saved to: ${outputPath}`);
}

// MAIN ROUTE
router.post("/generate-marketing-video", async (req, res) => {
  try {
    const { features, tone, audience, style } = req.body;
    const script = await buildScriptPrompt({ features, tone, audience, style });
    const imagePrompt =
      "can you create me an AI image of an energy drink labelled with the word: 'Suplimax' clearly visible";
    const { imageUrl: suplimaxImageUrl, base64: base64image } =
      await generateSuplimaxImage(imagePrompt);

    const videoUrl = await generateVideoWithVeo({
      script,
      base64: base64image,
    });
    console.log("Script:\n", script);
    console.log("Image URL:\n", suplimaxImageUrl);
    console.log("Video URL:\n", 'https://gemini-ai-video-gen-backend.onrender.com/videos/raw-1750386719251.mp4');

    res.json({ script, imageUrl: suplimaxImageUrl, videoUrl });
  } catch (err) {
    console.error("❌ Error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Video generation failed" });
  }
});

module.exports = router;
