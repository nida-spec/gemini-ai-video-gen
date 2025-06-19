import { useState } from "react";
import GenerateButton from "./GenerateButton";
import VideoPlayer from "./VideoPlayer";

export default function RealEstateForm() {
  const [style, setStyle] = useState("Luxury");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const listing = `🏡 4 Bed | 4 Bath | 4,142 sqft | Beverly Hills This mid-century luxury estate features hardwood floors, a private gated pool, landscaped grounds, a home theater, and sweeping city views — all in a prime Beverly Hills hillside location.`;

  const handleGenerate = async () => {
    setLoading(true);
    setVideoUrl("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api2/generate-realestate-video`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listing, style }),
        }
      );
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
      <p className='p-2 border rounded bg-gray-100 mb-2'>{listing}</p>
      <select
        value={style}
        onChange={(e) => setStyle(e.target.value)}
        className='w-full p-2 mb-2 border rounded'
      >
        <option>Luxury</option>
        <option>Family-Friendly</option>
        <option>Minimalist</option>
      </select>
      <GenerateButton onClick={handleGenerate} loading={loading} />
      {videoUrl && <VideoPlayer videoUrl={videoUrl} />}
    </div>
  );
}
