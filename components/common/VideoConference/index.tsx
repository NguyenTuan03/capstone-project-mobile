import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    createAgoraRtcEngine
} from "react-native-agora";

interface VideoConferenceProps {
  isVisible: boolean;
  onClose: () => void;
  channelName: string;
  token: string;
  uid: number;
  agoraAppId: string;
  userName?: string;
}

const VideoConference: React.FC<VideoConferenceProps> = ({
  isVisible,
  onClose,
  channelName,
  token,
  uid,
  agoraAppId,
  userName = "Bạn",
}) => {
  const rtcEngineRef = useRef<any>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [remoteUsers, setRemoteUsers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const handleCloseCallback = useCallback(onClose, [onClose]);

  // Initialize Agora Engine
  useEffect(() => {
    if (!isVisible) return;

    const initializeAgoraEngine = async () => {
      try {
        setLoading(true);
        console.log("[VideoConference] Initializing Agora with appId:", agoraAppId?.substring(0, 8) + "...");

        // Create RTC Engine instance
        const engine = createAgoraRtcEngine();
        rtcEngineRef.current = engine;

        // Initialize engine
        engine.initialize({
          appId: agoraAppId,
          logConfig: {
            filePath: "",
            level: 0,
          },
        });
        console.log("[VideoConference] Agora engine initialized");

        // Register event handler using registerEventHandler
        engine.registerEventHandler({
          onUserJoined: (connection: any, remoteUid: number) => {
            console.log(`[VideoConference] User ${remoteUid} joined`);
            setRemoteUsers((prev) => {
              if (!prev.includes(remoteUid)) {
                return [...prev, remoteUid];
              }
              return prev;
            });
          },
          onUserOffline: (connection: any, remoteUid: number, reason: number) => {
            console.log(`[VideoConference] User ${remoteUid} offline, reason: ${reason}`);
            setRemoteUsers((prev) => prev.filter((id) => id !== remoteUid));
          },
          onJoinChannelSuccess: (connection: any, elapsed: number) => {
            console.log(`[VideoConference] Joined channel ${channelName} after ${elapsed}ms`);
            console.log(`[VideoConference] Audio enabled: ${isAudioEnabled}, Video enabled: ${isVideoEnabled}`);
            setLoading(false);
          },
          onError: (errorCode: number, errorMsg: string) => {
            console.error(`[VideoConference] Agora error: ${errorCode} - ${errorMsg}`);
            Alert.alert(
              "Lỗi kết nối",
              `Không thể kết nối: ${errorMsg}`
            );
          },
          onConnectionLost: (connection: any) => {
            console.log("[VideoConference] Connection lost");
          },
          onConnectionInterrupted: (connection: any) => {
            console.log("[VideoConference] Connection interrupted");
          },
        });
        console.log("[VideoConference] Event handlers registered");

        // Enable audio
        console.log("[VideoConference] Enabling audio...");
        engine.enableAudio();
        engine.enableLocalAudio(true);

        // Enable video
        console.log("[VideoConference] Enabling video...");
        engine.enableVideo();

        // Set video encoder configuration
        engine.setVideoEncoderConfiguration({
          dimensions: {
            width: 360,
            height: 640,
          },
          frameRate: 15,
          bitrate: 1130,
          orientationMode: 0,
          mirrorMode: 0,
        });
        console.log("[VideoConference] Video configuration set");

        // Set client role (0 = Audience, 1 = Broadcaster)
        engine.setClientRole(1);
        console.log("[VideoConference] Client role set to Broadcaster");

        // Join channel
        console.log("[VideoConference] Joining channel:", channelName);
        engine.joinChannel(token, channelName, uid, {
          autoSubscribeAudio: true,
          autoSubscribeVideo: true,
        });
        console.log("[VideoConference] Join channel request sent");
      } catch (error) {
        console.error("[VideoConference] Failed to initialize Agora:", error);
        Alert.alert("Lỗi", `Không thể khởi tạo video conference: ${String(error).substring(0, 100)}`);
        handleCloseCallback();
      }
    };

    initializeAgoraEngine();

    return () => {
      // Cleanup on unmount
      if (rtcEngineRef.current) {
        try {
          rtcEngineRef.current.leaveChannel();
          rtcEngineRef.current.release();
        } catch (e) {
          console.error("Error during cleanup:", e);
        }
      }
    };
  }, [isVisible, agoraAppId, channelName, token, uid, handleCloseCallback, isAudioEnabled, isVideoEnabled]);

  const handleToggleAudio = async () => {
    if (!rtcEngineRef.current) return;
    try {
      const newState = !isAudioEnabled;
      rtcEngineRef.current.muteLocalAudioStream(!newState);
      setIsAudioEnabled(newState);
      console.log(`Audio ${newState ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Failed to toggle audio:", error);
    }
  };

  const handleToggleVideo = async () => {
    if (!rtcEngineRef.current) return;
    try {
      const newState = !isVideoEnabled;
      rtcEngineRef.current.muteLocalVideoStream(!newState);
      setIsVideoEnabled(newState);
      console.log(`Video ${newState ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Failed to toggle video:", error);
    }
  };

  const handleLeaveChannel = async () => {
    if (!rtcEngineRef.current) return;
    try {
      rtcEngineRef.current.leaveChannel();
      handleCloseCallback();
    } catch (error) {
      console.error("Failed to leave channel:", error);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleLeaveChannel}
    >
      <View style={styles.container}>
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Đang kết nối...</Text>
            <Text style={styles.loadingSubtext}>Vui lòng chờ...</Text>
          </View>
        )}

        {/* Main Content Area */}
        {!loading && (
          <>
            {/* Remote Videos or Empty State */}
            {remoteUsers.length > 0 ? (
              <View style={styles.remoteVideosContainer}>
                {remoteUsers.map((remoteUid) => (
                  <View key={remoteUid} style={styles.remoteVideoWrapper}>
                    <View style={styles.remoteVideoPlaceholder}>
                      <Ionicons
                        name="person-circle"
                        size={48}
                        color="#D1D5DB"
                      />
                      <Text style={styles.remoteUserText}>
                        Người tham gia {remoteUid}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <Ionicons
                  name="people-outline"
                  size={48}
                  color="#9CA3AF"
                  style={{ marginBottom: 12 }}
                />
                <Text style={styles.emptyStateText}>
                  Đang chờ người khác tham gia...
                </Text>
              </View>
            )}

            {/* Local Camera View (Floating) */}
            {isVideoEnabled ? (
              <View style={styles.localVideoContainer}>
                <View style={styles.cameraActiveIndicator}>
                  <Ionicons
                    name="videocam"
                    size={40}
                    color="#059669"
                  />
                  <Text style={styles.cameraActiveText}>Camera đang hoạt động</Text>
                </View>
                <View style={styles.userInfoBadge}>
                  <Text style={styles.userInfoText}>{userName}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.localVideoContainer}>
                <View style={styles.localVideoPlaceholder}>
                  <Ionicons
                    name="videocam-off"
                    size={32}
                    color="#EF4444"
                  />
                  <Text style={styles.cameraOffText}>Camera tắt</Text>
                </View>
                <View style={styles.userInfoBadge}>
                  <Text style={styles.userInfoText}>{userName}</Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* Control Panel */}
        <View style={styles.controlPanel}>
          <TouchableOpacity
            style={[styles.controlButton, !isAudioEnabled && styles.buttonDisabled]}
            onPress={handleToggleAudio}
          >
            <Ionicons
              name={isAudioEnabled ? "mic" : "mic-off"}
              size={24}
              color={isAudioEnabled ? "#FFFFFF" : "#EF4444"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, !isVideoEnabled && styles.buttonDisabled]}
            onPress={handleToggleVideo}
          >
            <Ionicons
              name={isVideoEnabled ? "videocam" : "videocam-off"}
              size={24}
              color={isVideoEnabled ? "#FFFFFF" : "#EF4444"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.endCallButton]}
            onPress={handleLeaveChannel}
          >
            <Ionicons name="call" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.channelName}>{channelName}</Text>
          <Text style={styles.participantCount}>
            {remoteUsers.length + 1} người tham gia
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    flex: 1,
    backgroundColor: "#000000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  loadingText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  loadingSubtext: {
    fontSize: 12,
    color: "#D1D5DB",
    fontWeight: "400",
    marginTop: 8,
  },
  header: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  channelName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  participantCount: {
    fontSize: 12,
    color: "#D1D5DB",
    fontWeight: "500",
  },
  localVideoContainer: {
    position: "absolute",
    bottom: 90,
    right: 12,
    width: 100,
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    zIndex: 5,
    backgroundColor: "#1F2937",
    borderWidth: 2,
    borderColor: "#059669",
  },
  localVideoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#374151",
  },
  userInfoBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: "rgba(5, 150, 105, 0.9)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  userInfoText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "700",
    textAlign: "center",
  },
  remoteVideosContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    gap: 12,
    marginTop: 60,
  },
  remoteVideoWrapper: {
    width: "45%",
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1F2937",
    borderWidth: 1,
    borderColor: "#374151",
  },
  remoteVideoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#374151",
  },
  remoteUserBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  remoteUserText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
    textAlign: "center",
  },
  controlPanel: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 24,
    paddingTop: 16,
    gap: 24,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: "rgba(239, 68, 68, 0.3)",
  },
  endCallButton: {
    backgroundColor: "#EF4444",
  },
  cameraActiveIndicator: {
    flex: 1,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  cameraActiveText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  cameraOffText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "600",
    marginTop: 8,
  },
});

export default VideoConference;
