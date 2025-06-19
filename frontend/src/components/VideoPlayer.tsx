import React from "react";

interface Props {
  videoUrl: string;
}

const VideoPlayer: React.FC<Props> = ({ videoUrl }) => {
  if (!videoUrl) return null;

  return (
    <div className="mt-6">
      <h3 className="text-lg font-bold mb-2">Your Generated Video</h3>
      <video src={videoUrl} controls className="w-full rounded-lg shadow" />
      <a
        href={videoUrl}
        download
        className="inline-block mt-4 text-white bg-green-600 px-4 py-2 rounded"
      >
        Download Video
      </a>
    </div>
  );
};

export default VideoPlayer;
