Gemini AI Video Generator
This full-stack AI-powered app generates marketing videos for an energy drink called Suplimax and also generates a tour of one of Beverly Hill's finest estate using:

Google Gemini (Image & Script Generation)

Google Veo2 (Video Generation)

Cloudinary (Image Hosting)

Node.js + Express (Backend)

React + Vite + TypeScript + Tailwind (Frontend)

🚀 Features
✨ Prompt-based marketing script generation

🎨 AI-generated product image using Google Gemini

🎞️ Video generation from script + image using Google Veo2

☁️ Cloudinary integration to host images

🔗 Render-hosted backend serving static video files	

📦 Installation
1. Clone the repository
bash
Copy
Edit
git clone https://github.com/nida-spec/gemini-ai-video-gen.git
cd gemini-ai-video-gen
2. Install dependencies
Frontend

bash
Copy
Edit
cd frontend
npm install
Backend

bash
Copy
Edit
cd backend
npm install
🔐 Environment Variables
Create a .env file in /backend:
env
Copy
Edit
PORT=3000
USE_VEO=true

# Cloudinary
CLOUD_NAME=your_cloudinary_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret

# Google AI Platform (Gemini / Veo)
GCP_PROJECT_ID=your_project_id
GCP_LOCATION=us-central1
API_ENDPOINT=us-central1-aiplatform.googleapis.com
MODEL_ID_IMAGE=imagen-1
MODEL_ID_VIDEO=veo-1
GOOGLE_OAUTH_TOKEN=your_oauth_access_token
🔑 Use a valid OAuth 2.0 access token with permissions to use Gemini and Veo APIs.

▶️ Running the App Locally
1. Start Backend
bash
Copy
Edit
cd backend
node index.js
2. Start Frontend
bash
Copy
Edit
cd frontend
npm run dev
Open your browser at http://localhost:5173

📁 Project Structure
bash
Copy
Edit
gemini-ai-video-gen/
│
├── backend/
│   ├── routes/gemini.js        # Image + video generation logic
│   ├── public/videos/          # Generated video storage
│   └── index.js                # Express server
│
├── frontend/
│   ├── components/             # SuplimaxForm + VideoPlayer
│   └── main.tsx / App.tsx      # React app setup
│
└── README.md
🌐 Deployment
Backend (Render)
Deploy /backend folder as a Web Service on Render

Enable static files for /public/videos

Use the full backend URL in your frontend’s .env:

env
Copy
Edit
VITE_API_BASE_URL= https://gemini-ai-video-gen-backend.onrender.com/
🧪 Sample Prompt
"High caffeine, zero sugar, tropical flavor"

Tone: Excited
Audience: Teenagers
Style: Animated

Result:

AI Image of Suplimax

Script: “Fuel your day with Suplimax — a burst of tropical energy with zero sugar!”

Video with motion, text, and image

📸 Screenshots
Add screenshots here showing:

The form
![image](https://github.com/user-attachments/assets/c433579c-cbb0-4072-baf4-093f5d3d6e7f)

The generated image and script
![image](https://github.com/user-attachments/assets/66eecedd-2259-4160-8ad9-df0e6132b003)

The video playback
![image](https://github.com/user-attachments/assets/3b636f4e-9f15-4c2b-a5a3-55264aa76471)


🛠️ TODOs / Improvements
 -Add download button for video

 -Add loading spinners for each stage (image, script, video)

 -Support custom brand name

 -Display video generation progress

 -Use a Google Service Account to Generate and Refresh the Access Token in Code

