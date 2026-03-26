import React, { useMemo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Svg, { Circle, Path, G } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Colors from "@/constants/colors";

const { width: W, height: H } = Dimensions.get("window");

interface Star {
  x: number;
  y: number;
  r: number;
  opacity: number;
}

function generateStars(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      opacity: Math.random() * 0.6 + 0.2,
    });
  }
  return stars;
}

export default function StarField() {
  const stars = useMemo(() => generateStars(300), []);
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 60000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const geoStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
    opacity: 0.03,
  }));

  const cx = W / 2;
  const cy = H / 2;
  const size = Math.max(W, H) * 0.8;
  const r = size / 2;

  // Hexagram paths
  const hexPoints = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  });
  const tri1 = `M ${hexPoints[0][0]} ${hexPoints[0][1]} L ${hexPoints[2][0]} ${hexPoints[2][1]} L ${hexPoints[4][0]} ${hexPoints[4][1]} Z`;
  const tri2 = `M ${hexPoints[1][0]} ${hexPoints[1][1]} L ${hexPoints[3][0]} ${hexPoints[3][1]} L ${hexPoints[5][0]} ${hexPoints[5][1]} Z`;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessible={false} importantForAccessibility="no">
      {/* Stars */}
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        {stars.map((s, i) => (
          <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.opacity} />
        ))}
      </Svg>

      {/* Sacred geometry */}
      <Animated.View style={[StyleSheet.absoluteFill, geoStyle]}>
        <Svg width={W} height={H}>
          <Path d={tri1} fill="none" stroke="white" strokeWidth={1} />
          <Path d={tri2} fill="none" stroke="white" strokeWidth={1} />
          {/* Outer circle */}
          <Circle cx={cx} cy={cy} r={r} fill="none" stroke="white" strokeWidth={0.5} />
          {/* Inner circles */}
          {hexPoints.map(([hx, hy], i) => (
            <Circle key={i} cx={hx} cy={hy} r={r * 0.5} fill="none" stroke="white" strokeWidth={0.3} />
          ))}
        </Svg>
      </Animated.View>
    </View>
  );
}
