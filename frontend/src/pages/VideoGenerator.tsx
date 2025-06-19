import { useState } from "react";
import SuplimaxForm from "../components/SupplimaxForm";
import RealEstateForm from "../components/RealEstateForm";

export default function VideoGenerator() {
  const [tab, setTab] = useState<"suplimax" | "realestate">("suplimax");

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex justify-center space-x-2 mb-4">
        <button
          onClick={() => setTab("suplimax")}
          className={`px-4 py-2 rounded ${tab === "suplimax" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          Suplimax
        </button>
        <button
          onClick={() => setTab("realestate")}
          className={`px-4 py-2 rounded ${tab === "realestate" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          Real Estate
        </button>
      </div>

      {tab === "suplimax" ? <SuplimaxForm /> : <RealEstateForm />}
    </div>
  );
}
