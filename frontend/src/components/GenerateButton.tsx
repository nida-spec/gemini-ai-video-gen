type Props = {
  onClick: () => void;
  loading: boolean;
};

export default function GenerateButton({ onClick, loading }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
    >
      {loading ? "Generating... Please do not refresh.." : "Generate Video"}
    </button>
  );
}
