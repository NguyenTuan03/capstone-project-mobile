import { AiVideoCompareResult } from "@/types/ai";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { AVPlaybackStatus, ResizeMode, Video } from "expo-av";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const MemoizedSlider = React.memo((props: any) => <Slider {...props} />);
// Add displayName for better React DevTools identification
// and to satisfy linting rules that require component display names
MemoizedSlider.displayName = "MemoizedSlider";

interface VideoOverlayPlayerProps {
  visible: boolean;
  onClose: () => void;
  coachVideoUrl: string;
  learnerVideoUrl: string;
  aiAnalysisResult: AiVideoCompareResult | null;
}

const VideoOverlayPlayer: React.FC<VideoOverlayPlayerProps> = ({
  visible,
  onClose,
  coachVideoUrl,
  learnerVideoUrl,
  aiAnalysisResult,
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
  const [showAnalysis, setShowAnalysis] = useState(false);

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

      // Reset position with error handling
      setTimeout(() => {
        try {
          if (coachVideoRef.current) {
            coachVideoRef.current
              .setPositionAsync(0)
              .catch((err) => console.log("Coach video reset error:", err));
          }
          if (learnerVideoRef.current) {
            learnerVideoRef.current
              .setPositionAsync(0)
              .catch((err) => console.log("Learner video reset error:", err));
          }
        } catch (error) {
          console.log("Video reset error:", error);
        }
      }, 100);
    } else {
      // Pause videos when modal closes to prevent background playback
      try {
        coachVideoRef.current?.pauseAsync().catch(() => {});
        learnerVideoRef.current?.pauseAsync().catch(() => {});
      } catch (error) {
        console.log("Pause on close error:", error);
      }
    }
  }, [visible]);

  // Pause both when in overlay mode to reduce CPU load until playing explicitly
  useEffect(() => {
    if (isOverlayMode) {
      // Only pause if videos are loaded
      setTimeout(() => {
        try {
          if (coachVideoRef.current && status.coach.isLoaded) {
            coachVideoRef.current
              .pauseAsync()
              .catch((err) => console.log("Pause coach error:", err));
          }
          if (learnerVideoRef.current && status.learner.isLoaded) {
            learnerVideoRef.current
              .pauseAsync()
              .catch((err) => console.log("Pause learner error:", err));
          }
        } catch (error) {
          console.log("Overlay mode pause error:", error);
        }
      }, 200);
    }
  }, [isOverlayMode, status.coach.isLoaded, status.learner.isLoaded]);

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

      // Only hide loading when BOTH videos are loaded
      if (playbackStatus.isBuffering) {
        setIsLoading(true);
      } else if (status.coach.isLoaded && status.learner.isLoaded) {
        setIsLoading(false);
      }
    };

  // Allow independent playback control
  const handlePlay = async (type: "coach" | "learner") => {
    const ref =
      type === "coach" ? coachVideoRef.current : learnerVideoRef.current;
    const videoStatus = type === "coach" ? status.coach : status.learner;

    if (!ref) {
      console.log(`${type} video ref is null, cannot play`);
      return;
    }

    if (!videoStatus.isLoaded) {
      console.log(`${type} video not loaded yet, cannot play`);
      return;
    }

    try {
      if (type === "coach") {
        if (status.coach.isPlaying) {
          await coachVideoRef.current?.pauseAsync();
        } else {
          await coachVideoRef.current?.playAsync();
        }
      } else {
        if (status.learner.isPlaying) {
          await learnerVideoRef.current?.pauseAsync();
        } else {
          await learnerVideoRef.current?.playAsync();
        }
      }
    } catch (error) {
      console.log(`Play/Pause error for ${type}:`, error);
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

    // Check if ref exists and video is loaded before seeking
    if (!ref) {
      console.log(`${type} video ref is null, skipping seek`);
      return;
    }

    const videoStatus = type === "coach" ? status.coach : status.learner;
    if (!videoStatus.isLoaded) {
      console.log(`${type} video not loaded yet, skipping seek`);
      return;
    }

    try {
      await ref.setPositionAsync(value * 1000, {
        toleranceMillisBefore: 100,
        toleranceMillisAfter: 100,
      });
    } catch (error) {
      console.log("Seek error:", error);
    }

    setTimeout(() => {
      setIsSeeking((prev) => ({ ...prev, [type]: false }));
    }, 500);
  };

  const handleAnalysisItemClick = async (item: any) => {
    // Set both videos to their respective timestamps
    if (item.learnerTimestamp !== undefined) {
      handleSeek("learner", item.learnerTimestamp);
      await handleSeekComplete("learner", item.learnerTimestamp);
    }

    if (item.coachTimestamp !== undefined) {
      handleSeek("coach", item.coachTimestamp);
      await handleSeekComplete("coach", item.coachTimestamp);
    }

    setShowAnalysis(false);
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
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
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
            {/* Learner Slider - Now on top */}
            <View style={styles.sliderRow}>
              <View style={styles.sliderHeader}>
                <View style={styles.sliderLabelContainer}>
                  {!isOverlayMode && (
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
                  )}
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

            {/* Coach Slider - Now below */}
            <View style={styles.sliderRow}>
              <View style={styles.sliderHeader}>
                <View style={styles.sliderLabelContainer}>
                  {!isOverlayMode && (
                    <TouchableOpacity onPress={() => handlePlay("coach")}>
                      <Ionicons
                        name={
                          status.coach.isPlaying
                            ? "pause-circle"
                            : "play-circle"
                        }
                        size={28}
                        color="#3B82F6"
                      />
                    </TouchableOpacity>
                  )}
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
          </View>

          {/* AI Analysis Button */}
          {aiAnalysisResult && (
            <TouchableOpacity
              onPress={() => setShowAnalysis(true)}
              style={styles.analysisButton}
              activeOpacity={0.7}
            >
              <View style={styles.analysisButtonContent}>
                <Ionicons name="analytics-outline" size={20} color="#6B7280" />
                <Text style={styles.analysisButtonText}>Xem phân tích AI</Text>
              </View>
              <Ionicons name="chevron-up" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Analysis Bottom Sheet */}
      <Modal
        visible={showAnalysis}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAnalysis(false)}
      >
        <View style={styles.analysisModalContainer}>
          <View style={styles.analysisModalContent}>
            <View style={styles.analysisHeader}>
              <Text style={styles.analysisTitle}>Phân tích AI</Text>
              <TouchableOpacity onPress={() => setShowAnalysis(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={true}>
              {aiAnalysisResult && (
                <>
                  {/* Coach Note - Moved to top */}
                  {aiAnalysisResult.coachNote && (
                    <View style={styles.coachNoteContainer}>
                      <Text style={styles.sectionTitle}>Ghi chú từ Coach</Text>
                      <Text style={styles.coachNoteText}>
                        {aiAnalysisResult.coachNote}
                      </Text>
                    </View>
                  )}

                  {/* Score */}
                  {aiAnalysisResult.learnerScore !== null && (
                    <View style={styles.scoreContainer}>
                      <Text style={styles.scoreLabel}>Điểm tổng thể:</Text>
                      <Text style={styles.scoreValue}>
                        {aiAnalysisResult.learnerScore}/100
                      </Text>
                    </View>
                  )}

                  {/* Summary */}
                  {aiAnalysisResult.summary && (
                    <View style={styles.summaryContainer}>
                      <Text style={styles.sectionTitle}>Tóm tắt</Text>
                      <Text style={styles.summaryText}>
                        {aiAnalysisResult.summary}
                      </Text>
                    </View>
                  )}

                  {/* Details by Phase */}
                  {aiAnalysisResult.details &&
                    aiAnalysisResult.details.length > 0 && (
                      <View style={styles.detailsContainer}>
                        <Text style={styles.sectionTitle}>
                          Phân tích theo giai đoạn
                        </Text>
                        {aiAnalysisResult.details.map((detail, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.detailItem}
                            onPress={() => handleAnalysisItemClick(detail)}
                          >
                            <View style={styles.detailHeader}>
                              <Text style={styles.detailType}>
                                {detail.type === "PREPARATION"
                                  ? "1. Tư thế chuẩn bị"
                                  : detail.type === "SWING_AND_CONTACT"
                                  ? "2. Vung vợt"
                                  : "3. Động tác kết thúc"}
                              </Text>
                            </View>
                            {/* Show timestamps */}
                            {(detail.learnerTimestamp !== undefined ||
                              detail.coachTimestamp !== undefined) && (
                              <View style={styles.timestampContainer}>
                                {detail.learnerTimestamp !== undefined && (
                                  <Text style={styles.timestampLabel}>
                                    Học viên:{" "}
                                    {formatTime(detail.learnerTimestamp)}
                                  </Text>
                                )}
                                {detail.coachTimestamp !== undefined && (
                                  <Text style={styles.timestampLabel}>
                                    HLV: {formatTime(detail.coachTimestamp)}
                                  </Text>
                                )}
                              </View>
                            )}
                            <Text style={styles.detailAdvanced}>
                              {detail.advanced}
                            </Text>
                            {detail.strengths &&
                              detail.strengths.length > 0 && (
                                <View style={styles.strengthsContainer}>
                                  <Text style={styles.strengthsLabel}>
                                    Điểm mạnh:
                                  </Text>
                                  {detail.strengths.map((strength, i) => (
                                    <Text key={i} style={styles.strengthText}>
                                      • {strength}
                                    </Text>
                                  ))}
                                </View>
                              )}
                            {detail.weaknesses &&
                              detail.weaknesses.length > 0 && (
                                <View style={styles.weaknessesContainer}>
                                  <Text style={styles.weaknessesLabel}>
                                    ⚠ Điểm yếu:
                                  </Text>
                                  {detail.weaknesses.map((weakness, i) => (
                                    <Text key={i} style={styles.weaknessText}>
                                      • {weakness}
                                    </Text>
                                  ))}
                                </View>
                              )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                  {/* Key Differences */}
                  {aiAnalysisResult.keyDifferents &&
                    aiAnalysisResult.keyDifferents.length > 0 && (
                      <View style={styles.differencesContainer}>
                        <Text style={styles.sectionTitle}>
                          Điểm khác biệt chính
                        </Text>
                        {aiAnalysisResult.keyDifferents.map((diff, index) => (
                          <View key={index} style={styles.differenceItem}>
                            <Text style={styles.differenceAspect}>
                              {diff.aspect}
                            </Text>
                            <Text style={styles.analysisText}>
                              <Text style={{ fontWeight: "bold" }}>HLV:</Text>{" "}
                              {diff.coachTechnique}
                            </Text>
                            <Text style={styles.analysisText}>
                              <Text style={{ fontWeight: "bold" }}>Bạn:</Text>{" "}
                              {diff.learnerTechnique}
                            </Text>
                            <Text style={styles.impactText}>
                              Tác động: {diff.impact}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                  {/* Recommendations */}
                  {aiAnalysisResult.recommendationDrills &&
                    aiAnalysisResult.recommendationDrills.length > 0 && (
                      <View style={styles.recommendationsContainer}>
                        <Text style={styles.sectionTitle}>
                          Khuyến nghị & Bài tập
                        </Text>
                        {aiAnalysisResult.recommendationDrills.map(
                          (drill, index) => (
                            <View key={index} style={styles.recommendationItem}>
                              <Text style={styles.drillTitle}>
                                {index + 1}. {drill.name}
                              </Text>
                              <Text style={styles.drillText}>
                                {drill.description}
                              </Text>
                              <Text style={styles.drillSets}>
                                Số hiệp: {drill.practiceSets}
                              </Text>
                            </View>
                          )
                        )}
                      </View>
                    )}

                  {/* Timestamp */}
                  {aiAnalysisResult.createdAt && (
                    <Text style={styles.timestampText}>
                      Phân tích lúc:{" "}
                      {new Date(aiAnalysisResult.createdAt).toLocaleString()}
                    </Text>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  closeButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  headerTitle: {
    color: "#1F2937",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#059669",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  modeButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  videoContainer: {
    width,
    flex: 1,
    position: "relative",
    backgroundColor: "#000",
  },
  splitViewContainer: { flex: 1, flexDirection: "column" },
  splitVideoWrapper: { flex: 1, position: "relative" },
  splitVideoDivider: { height: 2, backgroundColor: "#059669" },
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
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 10,
    borderWidth: 1,
    borderColor: "#059669",
  },
  videoLabelText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 20,
  },
  loadingText: {
    color: "#10B981",
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
    color: "#059669",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 100,
    textShadowColor: "rgba(5, 150, 105, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  controlsContainer: {
    flexGrow: 0,
    padding: 14,
    paddingBottom: 34,
    justifyContent: "flex-end",
    backgroundColor: "#FFFFFF",
  },
  slidersContainer: {
    gap: 12,
    backgroundColor: "#F9FAFB",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sliderRow: { gap: 4 },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sliderLabelContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  sliderLabel: { fontSize: 13, fontWeight: "600", color: "#374151" },
  timeValue: {
    color: "#059669",
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  durationText: { color: "#9CA3AF", fontSize: 11, fontWeight: "500" },
  analysisButton: {
    marginTop: 12,
    backgroundColor: "#059669",
    borderRadius: 8,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  analysisButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  analysisButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  analysisModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  analysisModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    maxHeight: "85%",
    borderTopWidth: 2,
    borderTopColor: "#059669",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  analysisHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  analysisTitle: { fontSize: 18, fontWeight: "700", color: "#059669" },
  scoreContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    padding: 14,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  scoreLabel: { fontSize: 13, fontWeight: "600", color: "#059669" },
  scoreValue: { fontSize: 24, fontWeight: "700", color: "#059669" },
  summaryContainer: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#059669",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryText: { fontSize: 13, color: "#4B5563", lineHeight: 20 },
  detailsContainer: { marginBottom: 14 },
  detailItem: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  detailType: { fontSize: 13, fontWeight: "700", color: "#059669" },
  detailAdvanced: {
    fontSize: 12,
    color: "#4B5563",
    marginBottom: 8,
    lineHeight: 18,
  },
  strengthsContainer: { marginTop: 8 },
  strengthsLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#047857",
    marginBottom: 6,
  },
  strengthText: {
    fontSize: 12,
    color: "#059669",
    marginLeft: 6,
    lineHeight: 18,
  },
  weaknessesContainer: { marginTop: 8 },
  weaknessesLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D97706",
    marginBottom: 6,
  },
  weaknessText: {
    fontSize: 12,
    color: "#F59E0B",
    marginLeft: 6,
    lineHeight: 18,
  },
  differencesContainer: { marginBottom: 14 },
  differenceItem: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  differenceAspect: {
    fontSize: 13,
    fontWeight: "700",
    color: "#059669",
    marginBottom: 6,
  },
  analysisText: {
    fontSize: 12,
    color: "#4B5563",
    marginBottom: 4,
    lineHeight: 18,
  },
  impactText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 6,
    fontStyle: "italic",
  },
  recommendationsContainer: { marginBottom: 14 },
  recommendationItem: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  drillTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#059669",
    marginBottom: 6,
  },
  drillText: {
    fontSize: 12,
    color: "#4B5563",
    marginBottom: 6,
    lineHeight: 18,
  },
  drillSets: {
    fontSize: 11,
    color: "#9CA3AF",
    fontStyle: "italic",
    fontWeight: "500",
  },
  coachNoteContainer: {
    backgroundColor: "#F0FDF4",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  coachNoteText: {
    fontSize: 13,
    color: "#047857",
    lineHeight: 20,
    fontWeight: "500",
  },
  timestampContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  timestampLabel: {
    fontSize: 11,
    color: "#059669",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: "600",
    borderWidth: 0.5,
    borderColor: "#D1FAE5",
  },
  timestampText: {
    fontSize: 10,
    color: "#9CA3AF",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
    fontWeight: "500",
  },
});

export default VideoOverlayPlayer;
