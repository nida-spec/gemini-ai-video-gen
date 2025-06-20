const express = require("express");
const axios = require("axios");
require("dotenv").config();
const path = require("path");
const fs = require("fs");

const router = express.Router();
router.post("/generate-realestate-video", async (req, res) => {
  const { listing, style } = req.body;

  if (!style) {
    return res.status(400).json({ error: "Missing listing or style" });
  }

  console.log(
    `🎬 Received request to generate a ${style} video for: ${listing}`
  );
  const prompt = await generatePrompt(style);

  const videoUrl = await generateVideoWithVeo(prompt);

  return res.json({ videoUrl: videoUrl });
});

module.exports = router;

async function generateVideoWithVeo(script) {
  const PROJECT_ID = process.env.GCP_PROJECT_ID;
  const LOCATION = process.env.GCP_LOCATION || "us-central1";
  const MODEL_ID = "veo-2.0-generate-001";
  const API_ENDPOINT = `${LOCATION}-aiplatform.googleapis.com`;
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
          },
        ],
        parameters: {
          aspectRatio: "16:9",
          sampleCount: 1,
          durationSeconds: "8",
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

    // Step 3: Decode and save the video
    const videoBase64 = result.response.videos[0].bytesBase64Encoded;

    saveBase64Video(videoBase64, inputPath);

    return `/videos/raw-${timestamp}.mp4`;
  } catch (err) {
    console.error("❌ Failed to generate video with Veo:", err.message);
    return null;
  }
}

function saveBase64Video(base64String, outputPath) {
  const cleanBase64 = base64String.replace(/^data:video\/mp4;base64,/, "");
  const buffer = Buffer.from(cleanBase64, "base64");
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Raw base64 video saved to: ${outputPath}`);
}

async function generatePrompt(style) {
  return ` Create a cinematic property video tour (as if you're walking) with a tour style of ${style} of a luxury mid-century modern estate at 1603 Tower Grove Dr, Beverly Hills. Start with a wide drone sweep over the hillside setting, showing the elegant entrance and grand staircase leading into an open-plan living area. Showcase the soaring living room with walls of windows and French doors opening to lush lawns and city views. Highlight the hardwood floors, formal dining room, and home theater. Transition to the master suite with a cozy fireplace and private pool access. End outdoors with sweeping shots of the gated backyard, sparkling pool, and twilight city skyline. Maintain a warm, inviting tone with cinematic lighting and soft instrumental background music.
Here are the key features of the property:
Key Description: A mid-century gem infused with 1960s modern flair: expansive open living room, French doors & floor-to-ceiling windows overlooking city views, gated backyard with a sparkling pool, master suite with fireplace and pool access, plus a home theater, formal dining room, and three additional bedrooms 
Address: 1603 Tower Grove Dr, Beverly Hills, CA 90210 
Price Estimate: ~$3.93M (Redfin estimate) 
Bedrooms: 4
Bathrooms: 4
Square Footage: 4,142 sqft 
Features: Luxury estate with 1 car garage, landscaped grounds, elegant entrance and staircase, 1960s modern design, prime Beverly Hills hillside location 
Flooring: Hardwood throughout 
Total Floors: 1 story 
Pool: Private gated backyard with a large sparkling swimming pool`;
}

module.exports = router;
