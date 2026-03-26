import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";

export interface MultishotResult {
  face_front: string;
  face_left: string;
  face_right: string;
}

interface Props {
  onComplete: (result: MultishotResult) => void;
  onCancel: () => void;
}

type Phase =
  | "front_ready"
  | "front_countdown"
  | "left_reposition"
  | "right_reposition"
  | "done";

const REPOSITION_COUNTDOWN = 3;

const PHASE_LABELS: Record<Phase, string> = {
  front_ready: "Face the camera directly",
  front_countdown: "Hold still…",
  left_reposition: "Turn to show your LEFT profile",
  right_reposition: "Turn to show your RIGHT profile",
  done: "All photos captured",
};

export default function MultishotFaceCamera({ onComplete, onCancel }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>("front_ready");
  const [countdown, setCountdown] = useState(0);
  const uris = useRef<{ front?: string; left?: string; right?: string }>({});
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isTakingPhoto = useRef(false);

  const stopCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const haptic = useCallback(async () => {
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const takePhoto = useCallback(async (): Promise<string | null> => {
    if (!cameraRef.current || isTakingPhoto.current) return null;
    isTakingPhoto.current = true;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });
      return photo?.uri ?? null;
    } catch {
      return null;
    } finally {
      isTakingPhoto.current = false;
    }
  }, []);

  const showCaptureError = useCallback((retryPhase: Phase) => {
    Alert.alert(
      "Capture Failed",
      "Could not save the photo. Please try again.",
      [{ text: "Retry", onPress: () => setPhase(retryPhase) }]
    );
  }, []);

  const startRepositionCountdown = useCallback(
    (seconds: number, onZero: () => void) => {
      setCountdown(seconds);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            stopCountdown();
            onZero();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [stopCountdown]
  );

  const runSession = useCallback(() => {
    setPhase("front_countdown");
    startRepositionCountdown(REPOSITION_COUNTDOWN, async () => {
      const frontUri = await takePhoto();
      if (!frontUri) {
        showCaptureError("front_countdown");
        return;
      }
      await haptic();
      uris.current.front = frontUri;

      setPhase("left_reposition");
      startRepositionCountdown(REPOSITION_COUNTDOWN, async () => {
        const leftUri = await takePhoto();
        if (!leftUri) {
          showCaptureError("left_reposition");
          return;
        }
        await haptic();
        uris.current.left = leftUri;

        setPhase("right_reposition");
        startRepositionCountdown(REPOSITION_COUNTDOWN, async () => {
          const rightUri = await takePhoto();
          if (!rightUri) {
            showCaptureError("right_reposition");
            return;
          }
          await haptic();
          uris.current.right = rightUri;
          setPhase("done");
        });
      });
    });
  }, [startRepositionCountdown, takePhoto, haptic, showCaptureError]);

  useEffect(() => {
    if (phase === "done") {
      const { front, left, right } = uris.current;
      if (front && left && right) {
        onComplete({ face_front: front, face_left: left, face_right: right });
      }
    }
  }, [phase, onComplete]);

  useEffect(() => {
    return () => {
      stopCountdown();
    };
  }, [stopCountdown]);

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>Requesting camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>
          Camera access is required for the face reading session.
        </Text>
        <Pressable style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Access</Text>
        </Pressable>
        <Pressable style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  const showCountdown =
    phase === "front_countdown" ||
    phase === "left_reposition" ||
    phase === "right_reposition";

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
      />

      <View style={styles.overlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable style={styles.closeBtn} onPress={onCancel} hitSlop={12}>
            <Feather name="x" size={22} color={Colors.cream} />
          </Pressable>
          <Text style={styles.sectionBadge}>Chinese Face Reading (面相)</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Face oval guide */}
        <View style={styles.ovalGuide} />

        {/* Bottom instruction panel */}
        <View style={styles.bottomPanel}>
          <Text style={styles.phaseLabel}>{PHASE_LABELS[phase]}</Text>

          {showCountdown && (
            <View style={styles.countdownCircle}>
              <Text style={styles.countdownNumber}>{countdown}</Text>
            </View>
          )}

          {phase === "left_reposition" && (
            <Text style={styles.hint}>
              Turn fully to your right so the camera sees your LEFT profile.
              Keep chin level and hair behind your ear.
            </Text>
          )}

          {phase === "right_reposition" && (
            <Text style={styles.hint}>
              Turn fully to your left so the camera sees your RIGHT profile.
              Keep chin level and expression neutral.
            </Text>
          )}

          {phase === "front_ready" && (
            <>
              <Text style={styles.hint}>
                Face the camera directly, chin level, neutral expression. After
                the first shot, the app will automatically guide you through
                left and right profiles.
              </Text>
              <Pressable style={styles.btn} onPress={runSession}>
                <Feather name="camera" size={20} color={Colors.bg} />
                <Text style={styles.btnText}>Begin Session</Text>
              </Pressable>
            </>
          )}

          {phase === "front_countdown" && (
            <Text style={styles.hint}>Hold still…</Text>
          )}

          {phase === "done" && (
            <Text style={styles.hint}>All three photos captured. Returning…</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 12,
    backgroundColor: "rgba(4,4,15,0.55)",
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionBadge: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 11,
    color: Colors.gold,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  ovalGuide: {
    alignSelf: "center",
    width: 220,
    height: 300,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: "rgba(201,168,76,0.5)",
    backgroundColor: "transparent",
  },
  bottomPanel: {
    backgroundColor: "rgba(4,4,15,0.8)",
    paddingTop: 20,
    paddingBottom: 48,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 14,
  },
  phaseLabel: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 14,
    color: Colors.gold,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  hint: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 15,
    color: Colors.cream,
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.85,
  },
  countdownCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(201,168,76,0.12)",
  },
  countdownNumber: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 32,
    color: Colors.gold,
  },
  btn: {
    flexDirection: "row",
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 52,
    alignSelf: "stretch",
  },
  btnText: {
    fontFamily: "CinzelDecorative_400Regular",
    fontSize: 13,
    color: Colors.bg,
    letterSpacing: 0.5,
  },
  infoText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 16,
    color: Colors.cream,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 24,
  },
  cancelBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelText: {
    fontFamily: "EBGaramond_400Regular",
    fontSize: 15,
    color: Colors.muted,
  },
});
