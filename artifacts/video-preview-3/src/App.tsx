import VideoTemplate from "@/components/video/VideoTemplate";

export default function App() {
  return (
    <div className="w-full h-screen overflow-hidden flex items-center justify-center bg-[#02020a]">
      <div className="relative w-[56.25vh] h-[100vh] max-w-full bg-[#04040f] overflow-hidden">
        <VideoTemplate />
      </div>
    </div>
  );
}
