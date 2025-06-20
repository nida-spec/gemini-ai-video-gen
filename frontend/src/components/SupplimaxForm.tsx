import { useState } from "react";
import GenerateButton from "./GenerateButton";
import VideoPlayer from "./VideoPlayer";

export default function SuplimaxForm() {
  const [features, setFeatures] = useState("");
  const [tone, setTone] = useState("Professional");
  const [audience, setAudience] = useState("Adults");
  const [style, setStyle] = useState("Animated");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [script, setScript] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!features.trim()) {
      alert("Please enter at least one product feature.");
      return;
    }

    setLoading(true);
    setVideoUrl("");
    setImageUrl("");
    setScript("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/generate-marketing-video`,

        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            features: features.split(","),
            tone,
            audience,
            style,
          }),
        }
      );

      const data = await res.json();
      setVideoUrl(data.videoUrl);
      setImageUrl(data.imageUrl);
      setScript(data.script);
    } catch {
      alert("❌ Video generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='max-w-xl mx-auto p-4'>
    

      <textarea
        value={features}
        onChange={(e) => setFeatures(e.target.value)}
        placeholder='Enter product features, separated by commas...'
        className='w-full p-2 border rounded mb-2'
      />

      <select
        value={tone}
        onChange={(e) => setTone(e.target.value)}
        className='w-full p-2 mb-2 border rounded'
      >
        <option>Professional</option>
        <option>Friendly</option>
        <option>Excited</option>
      </select>

      <select
        value={audience}
        onChange={(e) => setAudience(e.target.value)}
        className='w-full p-2 mb-2 border rounded'
      >
        <option>Adults</option>
        <option>Teenagers</option>
        <option>Parents</option>
      </select>

      <select
        value={style}
        onChange={(e) => setStyle(e.target.value)}
        className='w-full p-2 mb-2 border rounded'
      >
        <option>Animated</option>
        <option>Realistic</option>
        <option>Minimalist</option>
      </select>

      <GenerateButton onClick={handleGenerate} loading={loading} />

      {script && (
        <div className='bg-gray-100 p-4 rounded mb-4 mt-4'>
          <h2 className='font-semibold mb-2'>📜 Generated Script</h2>
          <p>{script}</p>
        </div>
      )}

      {imageUrl && (
        <img
          src={imageUrl}
          alt='Generated Suplimax'
          className='mb-4 w-full max-w-md mx-auto rounded shadow'
        />
      )}

      {videoUrl && <VideoPlayer videoUrl={videoUrl} />}
    </div>
  );
}
