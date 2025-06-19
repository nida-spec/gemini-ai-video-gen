import { useState } from "react";
import GenerateButton from "./GenerateButton";
import VideoPlayer from "./VideoPlayer";

export default function RealEstateForm() {
  const [style, setStyle] = useState("Luxury");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const listing = `🏡 3 Bed | 2 Bath | 2,000 sqft | Oceanview
Located in Malibu, this luxury home includes a private pool, open-concept kitchen, smart lighting, and panoramic views.`;

  const handleGenerate = async () => {
    setLoading(true);
    setVideoUrl("");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/generate-realestate-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing, style }),
      });
      const data = await res.json();
      setVideoUrl(data.videoUrl);
    } catch {
      alert("❌ Video generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="p-2 border rounded bg-gray-100 mb-2">{listing}</p>
      <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full p-2 mb-2 border rounded">
        <option>Luxury</option>
        <option>Family-Friendly</option>
        <option>Minimalist</option>
      </select>
      <GenerateButton onClick={handleGenerate} loading={loading} />
      {videoUrl && <VideoPlayer videoUrl={videoUrl} />}
    </div>
  );
}
