import { DirectionOfCut } from "@/components/direction-of-cut";

export default function DirectionPreviewPage() {
  return (
    <main className="min-h-screen bg-[#333e3d] p-6 text-[#f4f1eb]">
      <div className="mx-auto max-w-5xl">
        <DirectionOfCut
          date="2026-08-25"
          initialDirections={{
            greensCutDirection: "8-2",
            approachesCutDirection: "10-4",
            teesCutDirection: "12-6",
            fairwaysCutDirection: "9-3",
          }}
        />
      </div>
    </main>
  );
}
