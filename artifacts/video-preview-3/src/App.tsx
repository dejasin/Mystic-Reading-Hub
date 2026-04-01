import VideoTemplate from "@/components/video/VideoTemplate";

export default function App() {
  return (
    <div className="w-full h-screen overflow-hidden flex items-center justify-center bg-[#04040f]">
      <div className="relative w-full h-full max-w-[1920px] aspect-[16/9] bg-[#04040f]">
        <VideoTemplate />
      </div>
    </div>
  );
}
