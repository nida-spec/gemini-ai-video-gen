type Props = {
  videoUrl: string;
};

export default function VideoPlayer({ videoUrl }: Props) {
  return (
    <div className="mt-6">
      <video src={videoUrl} controls className="w-full rounded shadow" />
      <a href={videoUrl} download className="text-blue-600 underline block mt-2">
        ⬇ Download Video
      </a>
    </div>
  );
}
