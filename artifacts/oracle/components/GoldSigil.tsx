import React from "react";
import Svg, { Circle, Path, G, Line } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { View } from "react-native";
import Colors from "@/constants/colors";

interface Props {
  size?: number;
  style?: object;
}

export default function GoldSigil({ size = 120, style }: Props) {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 60000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  const r2 = size * 0.32;
  const r3 = size * 0.15;

  // 6 outer points
  const pts = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  });
  const tri1 = `M ${pts[0][0]} ${pts[0][1]} L ${pts[2][0]} ${pts[2][1]} L ${pts[4][0]} ${pts[4][1]} Z`;
  const tri2 = `M ${pts[1][0]} ${pts[1][1]} L ${pts[3][0]} ${pts[3][1]} L ${pts[5][0]} ${pts[5][1]} Z`;

  return (
    <View style={style} accessible={false} importantForAccessibility="no-hide-descendants">
      <Animated.View style={animStyle}>
        <Svg width={size} height={size}>
          {/* Outer ring */}
          <Circle cx={cx} cy={cy} r={r} fill="none" stroke={Colors.gold} strokeWidth={1} opacity={0.8} />
          <Circle cx={cx} cy={cy} r={r2} fill="none" stroke={Colors.gold} strokeWidth={0.5} opacity={0.5} />
          {/* Hexagram */}
          <Path d={tri1} fill="none" stroke={Colors.gold} strokeWidth={1.2} opacity={0.9} />
          <Path d={tri2} fill="none" stroke={Colors.gold} strokeWidth={1.2} opacity={0.9} />
          {/* Center dot */}
          <Circle cx={cx} cy={cy} r={r3} fill={Colors.gold} opacity={0.6} />
          <Circle cx={cx} cy={cy} r={4} fill={Colors.goldLight} opacity={0.9} />
          {/* Spokes */}
          {pts.map(([px, py], i) => (
            <Line key={i} x1={cx} y1={cy} x2={px} y2={py} stroke={Colors.gold} strokeWidth={0.4} opacity={0.3} />
          ))}
        </Svg>
      </Animated.View>
    </View>
  );
}
