import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// Memoized Slider to reduce unnecessary renders
const MemoizedSlider = React.memo((props: any) => {
  return <Slider {...props} />;
});

interface VideoOverlayPlayerProps {
  visible: boolean;
  onClose: () => void;
  coachVideoUrl: string;
  learnerVideoUrl: string;
}

const VideoOverlayPlayer: React.FC<VideoOverlayPlayerProps> = ({
  visible,
  onClose,
  coachVideoUrl,
  learnerVideoUrl,
}) => {
  const insets = useSafeAreaInsets();
  const opacityAnim = useRef(new Animated.Value(0.5)).current;
  const [opacityDisplay, setOpacityDisplay] = useState(0.5);

  // Mode state: false = Split View (default), true = Overlay View (Compare)
  const [isOverlayMode, setIsOverlayMode] = useState(false);

  const [isPlaying, setIsPlaying] = useState({ coach: false, learner: false });
  const [isLoading, setIsLoading] = useState(false);

  const coachPlayer = useVideoPlayer(coachVideoUrl, (player) => {
    player.loop = false;
    player.play();
    player.pause();
  });

  const learnerPlayer = useVideoPlayer(learnerVideoUrl, (player) => {
    player.loop = false;
    player.play();
    player.pause();
  });

  const currentTimesRef = useRef({ coach: 0, learner: 0 });
  const [uiTimes, setUiTimes] = useState({ coach: 0, learner: 0 });

  const coachDuration = coachPlayer.duration;
  const learnerDuration = learnerPlayer.duration;

  const [isSeeking, setIsSeeking] = useState({ coach: false, learner: false });
  const [sliderValues, setSliderValues] = useState({ coach: 0, learner: 0 });

  // Update UI times loop
  useEffect(() => {
    let animationFrameId: number;
    let lastUpdate = Date.now();

    const updateLoop = () => {
      if (visible) {
        const now = Date.now();

        // Update UI times max every 200ms
        if (now - lastUpdate > 200) {
          const coachTime = coachPlayer.currentTime;
          const learnerTime = learnerPlayer.currentTime;
          currentTimesRef.current = { coach: coachTime, learner: learnerTime };
          setUiTimes({ coach: coachTime, learner: learnerTime });
          lastUpdate = now;
        }

        // Check playing status to update UI icons if needed (though we manage state manually too)
        if (coachPlayer.playing !== isPlaying.coach) {
          setIsPlaying((prev) => ({ ...prev, coach: coachPlayer.playing }));
        }
        if (learnerPlayer.playing !== isPlaying.learner) {
          setIsPlaying((prev) => ({ ...prev, learner: learnerPlayer.playing }));
        }

        // Clear loading indicator once videos playing or ready
        if (isLoading && (coachPlayer.playing || learnerPlayer.playing)) {
          setIsLoading(false);
        }

        animationFrameId = requestAnimationFrame(updateLoop);
      }
    };

    if (visible) animationFrameId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [visible, coachPlayer, learnerPlayer, isLoading, isPlaying]);

  // Reset on modal visible
  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      setIsOverlayMode(false); // Default to Split View

      coachPlayer.currentTime = 0;
      learnerPlayer.currentTime = 0;
      coachPlayer.pause();
      learnerPlayer.pause();

      setIsPlaying({ coach: false, learner: false });
      setSliderValues({ coach: 0, learner: 0 });
      currentTimesRef.current = { coach: 0, learner: 0 };
      setUiTimes({ coach: 0, learner: 0 });

      // Small delay to clear loading if needed, or wait for user to play
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [visible]);

  const handlePlay = useCallback(
    (type: "coach" | "learner") => {
      if (type === "coach") {
        if (coachPlayer.playing) {
          coachPlayer.pause();
          setIsPlaying((prev) => ({ ...prev, coach: false }));
        } else {
          // Mutual exclusion: Pause learner before playing coach
          learnerPlayer.pause();
          setIsPlaying((prev) => ({ ...prev, learner: false }));

          coachPlayer.play();
          setIsPlaying((prev) => ({ ...prev, coach: true }));
        }
      } else {
        if (learnerPlayer.playing) {
          learnerPlayer.pause();
          setIsPlaying((prev) => ({ ...prev, learner: false }));
        } else {
          // Mutual exclusion: Pause coach before playing learner
          coachPlayer.pause();
          setIsPlaying((prev) => ({ ...prev, coach: false }));

          learnerPlayer.play();
          setIsPlaying((prev) => ({ ...prev, learner: true }));
        }
      }
    },
    [coachPlayer, learnerPlayer]
  );

  const handleSeek = useCallback(
    (type: "coach" | "learner", value: number) => {
      setSliderValues((prev) => ({ ...prev, [type]: value }));
      setUiTimes((prev) => ({ ...prev, [type]: value }));

      if (type === "coach") {
        coachPlayer.currentTime = value;
        currentTimesRef.current.coach = value;
      } else {
        learnerPlayer.currentTime = value;
        currentTimesRef.current.learner = value;
      }
    },
    [coachPlayer, learnerPlayer]
  );

  const getDisplayValue = (type: "coach" | "learner") => {
    const isTypeSeeking =
      type === "coach" ? isSeeking.coach : isSeeking.learner;
    const currentTime = type === "coach" ? uiTimes.coach : uiTimes.learner;
    const sliderValue =
      type === "coach" ? sliderValues.coach : sliderValues.learner;

    if (
      (type === "coach" ? isPlaying.coach : isPlaying.learner) &&
      !isTypeSeeking
    ) {
      return currentTime;
    }
    return sliderValue;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`;
  };

  const onOpacityChange = useCallback(
    (val: number) => {
      setOpacityDisplay(val);
      Animated.timing(opacityAnim, {
        toValue: val,
        duration: 0,
        useNativeDriver: true,
      }).start();
    },
    [opacityAnim]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>So sánh Video</Text>

          {/* Toggle Mode Button */}
          <TouchableOpacity
            onPress={() => setIsOverlayMode(!isOverlayMode)}
            style={styles.modeButton}
          >
            <Ionicons
              name={isOverlayMode ? "grid-outline" : "layers-outline"}
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.modeButtonText}>
              {isOverlayMode ? "Tách biệt" : "Chồng lớp"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Video Area */}
        <View style={styles.videoContainer}>
          {!isOverlayMode ? (
            // SPLIT VIEW
            <View style={styles.splitViewContainer}>
              <View style={styles.splitVideoWrapper}>
                <View style={styles.videoLabelTag}>
                  <Text style={styles.videoLabelText}>Learner</Text>
                </View>
                <VideoView
                  player={learnerPlayer}
                  style={styles.video}
                  contentFit="contain"
                />
              </View>
              <View style={styles.splitVideoDivider} />
              <View style={styles.splitVideoWrapper}>
                <View style={styles.videoLabelTag}>
                  <Text style={styles.videoLabelText}>Coach</Text>
                </View>
                <VideoView
                  player={coachPlayer}
                  style={styles.video}
                  contentFit="contain"
                />
              </View>
            </View>
          ) : (
            // OVERLAY VIEW
            <View style={styles.overlayViewContainer}>
              {/* Coach Video (Background) */}
              <VideoView
                player={coachPlayer}
                style={styles.video}
                contentFit="contain"
              />

              {/* Learner Video with opacity */}
              <Animated.View
                style={[styles.overlayVideoContainer, { opacity: opacityAnim }]}
              >
                <VideoView
                  player={learnerPlayer}
                  style={styles.video}
                  contentFit="contain"
                />
              </Animated.View>

              {/* Opacity Slider */}
              <View style={styles.verticalSliderContainer}>
                <View style={styles.verticalSliderWrapper}>
                  <MemoizedSlider
                    style={{ width: 200, height: 40 }}
                    minimumValue={0}
                    maximumValue={1}
                    value={opacityDisplay}
                    onValueChange={onOpacityChange}
                    minimumTrackTintColor="#FFFFFF"
                    maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                    thumbTintColor="#FFFFFF"
                  />
                </View>
                <Text style={styles.opacityLabel}>
                  {Math.round(opacityDisplay * 100)}%
                </Text>
              </View>
            </View>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Đang tải video...</Text>
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          {/* Sliders for Coach and Learner */}
          <View style={styles.slidersContainer}>
            {/* Coach Control Row */}
            <View style={styles.sliderRow}>
              <View style={styles.sliderHeader}>
                <View style={styles.sliderLabelContainer}>
                  <TouchableOpacity onPress={() => handlePlay("coach")}>
                    <Ionicons
                      name={isPlaying.coach ? "pause-circle" : "play-circle"}
                      size={28}
                      color="#3B82F6"
                    />
                  </TouchableOpacity>
                  <Text style={[styles.sliderLabel, { color: "#3B82F6" }]}>
                    Coach
                  </Text>
                </View>
                <Text style={styles.timeValue}>
                  {formatTime(getDisplayValue("coach"))}
                  <Text style={styles.durationText}>
                    {" "}
                    / {formatTime(coachDuration || 0)}
                  </Text>
                </Text>
              </View>
              <MemoizedSlider
                style={{ width: "100%", height: 40 }}
                minimumValue={0}
                maximumValue={coachDuration || 60}
                value={getDisplayValue("coach")}
                onSlidingStart={() =>
                  setIsSeeking((prev) => ({ ...prev, coach: true }))
                }
                onValueChange={(val: number) => handleSeek("coach", val)}
                onSlidingComplete={() => {
                  setTimeout(() => {
                    setIsSeeking((prev) => ({ ...prev, coach: false }));
                  }, 500);
                }}
                minimumTrackTintColor="#3B82F6"
                maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                thumbTintColor="#3B82F6"
              />
            </View>

            {/* Learner Control Row */}
            <View style={styles.sliderRow}>
              <View style={styles.sliderHeader}>
                <View style={styles.sliderLabelContainer}>
                  <TouchableOpacity onPress={() => handlePlay("learner")}>
                    <Ionicons
                      name={isPlaying.learner ? "pause-circle" : "play-circle"}
                      size={28}
                      color="#10B981"
                    />
                  </TouchableOpacity>
                  <Text style={[styles.sliderLabel, { color: "#10B981" }]}>
                    Learner
                  </Text>
                </View>
                <Text style={styles.timeValue}>
                  {formatTime(getDisplayValue("learner"))}
                  <Text style={styles.durationText}>
                    {" "}
                    / {formatTime(learnerDuration || 0)}
                  </Text>
                </Text>
              </View>
              <MemoizedSlider
                style={{ width: "100%", height: 40 }}
                minimumValue={0}
                maximumValue={learnerDuration || 60}
                value={getDisplayValue("learner")}
                onSlidingStart={() =>
                  setIsSeeking((prev) => ({ ...prev, learner: true }))
                }
                onValueChange={(val: number) => handleSeek("learner", val)}
                onSlidingComplete={() => {
                  setTimeout(() => {
                    setIsSeeking((prev) => ({ ...prev, learner: false }));
                  }, 500);
                }}
                minimumTrackTintColor="#10B981"
                maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                thumbTintColor="#10B981"
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  modeButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  videoContainer: {
    width: width,
    flex: 1,
    position: "relative",
    backgroundColor: "#1F2937",
  },
  splitViewContainer: {
    flex: 1,
    flexDirection: "column",
  },
  splitVideoWrapper: {
    flex: 1,
    position: "relative",
  },
  splitVideoDivider: {
    height: 2,
    backgroundColor: "#374151",
  },
  overlayViewContainer: {
    flex: 1,
    position: "relative",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  videoLabelTag: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  videoLabelText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  overlayVideoContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 20,
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
  },
  verticalSliderContainer: {
    position: "absolute",
    top: 20,
    right: 10,
    alignItems: "center",
    justifyContent: "center",
    height: 200,
    width: 50,
    zIndex: 10,
  },
  verticalSliderWrapper: {
    transform: [{ rotate: "-90deg" }],
    width: 200,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  opacityLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 100,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  controlsContainer: {
    flexGrow: 0,
    padding: 20,
    paddingBottom: 40,
    justifyContent: "flex-end",
  },
  slidersContainer: {
    gap: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  sliderRow: {
    gap: 4,
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sliderLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  timeValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
  },
  durationText: {
    color: "#E5E7EB",
    fontSize: 12,
    fontWeight: "normal",
  },
});

export default VideoOverlayPlayer;
