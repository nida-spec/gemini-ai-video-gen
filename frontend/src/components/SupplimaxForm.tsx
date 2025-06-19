import { useState } from "react";
import GenerateButton from "./GenerateButton";
import VideoPlayer from "./VideoPlayer";

export default function SuplimaxForm() {
  const [features, setFeatures] = useState("");
  const [tone, setTone] = useState("Professional");
  const [audience, setAudience] = useState("Adults");
  const [style, setStyle] = useState("Animated");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setVideoUrl("");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/generate-suplimax-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features, tone, audience, style }),
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
      <textarea
        value={features}
        onChange={(e) => setFeatures(e.target.value)}
        placeholder="Enter product features..."
        className="w-full p-2 border rounded mb-2"
      />
      <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full p-2 mb-2 border rounded">
        <option>Professional</option>
        <option>Friendly</option>
        <option>Excited</option>
      </select>
      <select value={audience} onChange={(e) => setAudience(e.target.value)} className="w-full p-2 mb-2 border rounded">
        <option>Adults</option>
        <option>Teenagers</option>
        <option>Parents</option>
      </select>
      <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full p-2 mb-2 border rounded">
        <option>Animated</option>
        <option>Realistic</option>
        <option>Minimalist</option>
      </select>
      <GenerateButton onClick={handleGenerate} loading={loading} />
      {videoUrl && <VideoPlayer videoUrl={videoUrl} />}
    </div>
  );
}
