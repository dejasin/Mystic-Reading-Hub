import VideoTemplate from "@/components/video/VideoTemplate";

export default function App() {
  return (
    <div className="w-full h-screen overflow-hidden flex items-center justify-center bg-[#02020a]">
      <div
        className="relative overflow-hidden bg-[#04040f]"
        style={{
          aspectRatio: "9 / 16",
          height: "100%",
          maxHeight: "100vh",
          maxWidth: "calc(100vh * 9 / 16)",
        }}
      >
        <VideoTemplate />
      </div>
    </div>
  );
}
