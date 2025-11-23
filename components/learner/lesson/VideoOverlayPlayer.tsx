import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { AVPlaybackStatus, ResizeMode, Video } from "expo-av";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const MemoizedSlider = React.memo((props: any) => <Slider {...props} />);

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
  const [opacityDisplay, setOpacityDisplay] = useState(0.5);
  const [isOverlayMode, setIsOverlayMode] = useState(false);

  const coachVideoRef = useRef<Video>(null);
  const learnerVideoRef = useRef<Video>(null);

  const [status, setStatus] = useState({
    coach: { isPlaying: false, position: 0, duration: 0, isLoaded: false },
    learner: { isPlaying: false, position: 0, duration: 0, isLoaded: false },
  });

  const [isSeeking, setIsSeeking] = useState({ coach: false, learner: false });
  const [sliderValues, setSliderValues] = useState({ coach: 0, learner: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      setIsOverlayMode(false);
      setStatus({
        coach: { isPlaying: false, position: 0, duration: 0, isLoaded: false },
        learner: {
          isPlaying: false,
          position: 0,
          duration: 0,
          isLoaded: false,
        },
      });
      setSliderValues({ coach: 0, learner: 0 });
      // Reset position as well on visible
      coachVideoRef.current?.setPositionAsync(0);
      learnerVideoRef.current?.setPositionAsync(0);
    }
  }, [visible]);

  // Pause both when in overlay mode to reduce CPU load until playing explicitly
  useEffect(() => {
    if (isOverlayMode) {
      coachVideoRef.current?.pauseAsync();
      learnerVideoRef.current?.pauseAsync();
      setIsLoading(false);
    }
  }, [isOverlayMode]);

  // Update playback status throttled to reduce frequent rerenders
  const onPlaybackStatusUpdate =
    (type: "coach" | "learner") => (playbackStatus: AVPlaybackStatus) => {
      if (!playbackStatus.isLoaded) return;

      setStatus((prev) => ({
        ...prev,
        [type]: {
          isPlaying: playbackStatus.isPlaying,
          position: playbackStatus.positionMillis / 1000,
          duration: (playbackStatus.durationMillis || 0) / 1000,
          isLoaded: true,
        },
      }));

      if (playbackStatus.isBuffering) {
        setIsLoading(true);
      } else {
        setIsLoading(false);
      }
    };

  // Ensure only one video plays at a time for better performance
  const handlePlay = async (type: "coach" | "learner") => {
    if (type === "coach") {
      if (status.coach.isPlaying) {
        await coachVideoRef.current?.pauseAsync();
      } else {
        await learnerVideoRef.current?.pauseAsync();
        await coachVideoRef.current?.playAsync();
      }
    } else {
      if (status.learner.isPlaying) {
        await learnerVideoRef.current?.pauseAsync();
      } else {
        await coachVideoRef.current?.pauseAsync();
        await learnerVideoRef.current?.playAsync();
      }
    }
  };

  // Seeking handler throttled to reduce rapid state updates
  const handleSeek = (type: "coach" | "learner", value: number) => {
    setSliderValues((prev) => ({ ...prev, [type]: value }));
  };

  const handleSeekComplete = async (
    type: "coach" | "learner",
    value: number
  ) => {
    const ref =
      type === "coach" ? coachVideoRef.current : learnerVideoRef.current;
    if (ref) {
      try {
        await ref.setPositionAsync(value * 1000, {
          toleranceMillisBefore: 100,
          toleranceMillisAfter: 100,
        });
      } catch (error) {
        console.log("Seek error:", error);
      }
    }
    setTimeout(() => {
      setIsSeeking((prev) => ({ ...prev, [type]: false }));
    }, 500);
  };

  const getDisplayValue = (type: "coach" | "learner") => {
    const isTypeSeeking =
      type === "coach" ? isSeeking.coach : isSeeking.learner;
    const currentPos =
      type === "coach" ? status.coach.position : status.learner.position;
    const sliderVal =
      type === "coach" ? sliderValues.coach : sliderValues.learner;
    if (
      (type === "coach" ? status.coach.isPlaying : status.learner.isPlaying) &&
      !isTypeSeeking
    ) {
      return currentPos;
    }
    return sliderVal;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`;
  };

  const onOpacityChange = useCallback((val: number) => {
    setOpacityDisplay(val);
  }, []);

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
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>So sánh Video</Text>
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

        <View style={styles.videoContainer}>
          {!isOverlayMode ? (
            <View style={styles.splitViewContainer}>
              <View style={styles.splitVideoWrapper}>
                <View style={styles.videoLabelTag}>
                  <Text style={styles.videoLabelText}>Học viên</Text>
                </View>
                <Video
                  ref={learnerVideoRef}
                  source={{ uri: learnerVideoUrl }}
                  style={styles.video}
                  resizeMode={ResizeMode.CONTAIN}
                  onPlaybackStatusUpdate={onPlaybackStatusUpdate("learner")}
                  shouldPlay={false}
                  useNativeControls={false}
                />
              </View>
              <View style={styles.splitVideoDivider} />
              <View style={styles.splitVideoWrapper}>
                <View style={styles.videoLabelTag}>
                  <Text style={styles.videoLabelText}>HLV</Text>
                </View>
                <Video
                  ref={coachVideoRef}
                  source={{ uri: coachVideoUrl }}
                  style={styles.video}
                  resizeMode={ResizeMode.CONTAIN}
                  onPlaybackStatusUpdate={onPlaybackStatusUpdate("coach")}
                  shouldPlay={false}
                  useNativeControls={false}
                />
              </View>
            </View>
          ) : (
            <View style={styles.overlayViewContainer}>
              <Video
                ref={coachVideoRef}
                source={{ uri: coachVideoUrl }}
                style={styles.video}
                resizeMode={ResizeMode.CONTAIN}
                onPlaybackStatusUpdate={onPlaybackStatusUpdate("coach")}
                shouldPlay={false}
                useNativeControls={false}
              />
              <View
                style={[
                  styles.learnerVideoContainer,
                  { opacity: opacityDisplay },
                ]}
                collapsable={false}
                renderToHardwareTextureAndroid={true}
              >
                <Video
                  ref={learnerVideoRef}
                  source={{ uri: learnerVideoUrl }}
                  style={styles.learnerVideoContent}
                  resizeMode={ResizeMode.CONTAIN}
                  onPlaybackStatusUpdate={onPlaybackStatusUpdate("learner")}
                  shouldPlay={false}
                  useNativeControls={false}
                />
              </View>

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

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Đang tải video...</Text>
            </View>
          )}
        </View>

        <View style={styles.controlsContainer}>
          <View style={styles.slidersContainer}>
            <View style={styles.sliderRow}>
              <View style={styles.sliderHeader}>
                <View style={styles.sliderLabelContainer}>
                  <TouchableOpacity onPress={() => handlePlay("coach")}>
                    <Ionicons
                      name={
                        status.coach.isPlaying ? "pause-circle" : "play-circle"
                      }
                      size={28}
                      color="#3B82F6"
                    />
                  </TouchableOpacity>
                  <Text style={[styles.sliderLabel, { color: "#3B82F6" }]}>
                    HLV
                  </Text>
                </View>
                <Text style={styles.timeValue}>
                  {formatTime(getDisplayValue("coach"))}
                  <Text style={styles.durationText}>
                    {" "}
                    / {formatTime(status.coach.duration)}
                  </Text>
                </Text>
              </View>
              <MemoizedSlider
                style={{ width: "100%", height: 40 }}
                minimumValue={0}
                maximumValue={status.coach.duration || 60}
                value={getDisplayValue("coach")}
                onSlidingStart={() =>
                  setIsSeeking((prev) => ({ ...prev, coach: true }))
                }
                onValueChange={(val: number) => handleSeek("coach", val)}
                onSlidingComplete={(val: number) =>
                  handleSeekComplete("coach", val)
                }
                minimumTrackTintColor="#3B82F6"
                maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                thumbTintColor="#3B82F6"
              />
            </View>

            <View style={styles.sliderRow}>
              <View style={styles.sliderHeader}>
                <View style={styles.sliderLabelContainer}>
                  <TouchableOpacity onPress={() => handlePlay("learner")}>
                    <Ionicons
                      name={
                        status.learner.isPlaying
                          ? "pause-circle"
                          : "play-circle"
                      }
                      size={28}
                      color="#10B981"
                    />
                  </TouchableOpacity>
                  <Text style={[styles.sliderLabel, { color: "#10B981" }]}>
                    Học viên
                  </Text>
                </View>
                <Text style={styles.timeValue}>
                  {formatTime(getDisplayValue("learner"))}
                  <Text style={styles.durationText}>
                    {" "}
                    / {formatTime(status.learner.duration)}
                  </Text>
                </Text>
              </View>
              <MemoizedSlider
                style={{ width: "100%", height: 40 }}
                minimumValue={0}
                maximumValue={status.learner.duration || 60}
                value={getDisplayValue("learner")}
                onSlidingStart={() =>
                  setIsSeeking((prev) => ({ ...prev, learner: true }))
                }
                onValueChange={(val: number) => handleSeek("learner", val)}
                onSlidingComplete={(val: number) =>
                  handleSeekComplete("learner", val)
                }
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
  container: { flex: 1, backgroundColor: "#000" },
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
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  modeButtonText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  videoContainer: {
    width,
    flex: 1,
    position: "relative",
    backgroundColor: "#1F2937",
  },
  splitViewContainer: { flex: 1, flexDirection: "column" },
  splitVideoWrapper: { flex: 1, position: "relative" },
  splitVideoDivider: { height: 2, backgroundColor: "#374151" },
  overlayViewContainer: { flex: 1, position: "relative" },
  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "black",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
  },
  learnerVideoContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  learnerVideoContent: {
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
  videoLabelText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 20,
  },
  loadingText: {
    color: "#fff",
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
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 100,
    textShadowColor: "rgba(0,0,0,0.75)",
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
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  sliderRow: { gap: 4 },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sliderLabelContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  sliderLabel: { fontSize: 14, fontWeight: "600" },
  timeValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
  },
  durationText: { color: "#E5E7EB", fontSize: 12, fontWeight: "normal" },
});

export default VideoOverlayPlayer;
