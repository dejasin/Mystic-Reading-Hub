import { useMemo } from "react";

interface Star {
  id: number;
  top: string;
  left: string;
  size: string;
  duration: string;
  delay: string;
  maxOpacity: string;
}

export function StarsBg() {
  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 0.5}px`,
      duration: `${Math.random() * 4 + 2}s`,
      delay: `${Math.random() * 5}s`,
      maxOpacity: `${Math.random() * 0.5 + 0.2}`,
    }));
  }, []);

  return (
    <div className="stars-bg" aria-hidden="true">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            ["--duration" as string]: star.duration,
            ["--delay" as string]: star.delay,
            ["--max-opacity" as string]: star.maxOpacity,
          }}
        />
      ))}

      {/* Sacred geometry SVG — subtle hexagram */}
      <svg
        className="sacred-geometry"
        style={{ top: "10%", right: "5%", width: "180px", height: "180px" }}
        viewBox="0 0 100 100"
        fill="none"
        stroke="#c9a84c"
        strokeWidth="0.5"
      >
        <polygon points="50,5 95,75 5,75" />
        <polygon points="50,95 5,25 95,25" />
        <circle cx="50" cy="50" r="30" />
        <circle cx="50" cy="50" r="15" />
      </svg>

      {/* Sacred geometry — subtle circle pattern */}
      <svg
        className="sacred-geometry"
        style={{ bottom: "15%", left: "3%", width: "140px", height: "140px" }}
        viewBox="0 0 100 100"
        fill="none"
        stroke="#c9a84c"
        strokeWidth="0.5"
      >
        <circle cx="50" cy="50" r="45" />
        <circle cx="50" cy="50" r="30" />
        <circle cx="50" cy="50" r="15" />
        <line x1="50" y1="5" x2="50" y2="95" />
        <line x1="5" y1="50" x2="95" y2="50" />
        <line x1="18" y1="18" x2="82" y2="82" />
        <line x1="82" y1="18" x2="18" y2="82" />
      </svg>
    </div>
  );
}
