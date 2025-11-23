import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import createAgoraRtcEngine, {
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
  RtcSurfaceView,
} from "react-native-agora";

const appId = "80f438402094488b9075727978258380"; // Replace with your actual App ID

interface VideoConferenceProps {
  isVisible: boolean;
  onClose: () => void;
  channelName: string;
  token: string;
  uid: number;
}

const VideoConference: React.FC<VideoConferenceProps> = ({
  isVisible,
  onClose,
  channelName,
  token,
  uid,
}) => {
  const agoraEngineRef = useRef<IRtcEngine | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setupVideoConference();
    } else {
      leaveChannel();
    }

    return () => {
      leaveChannel();
    };
  }, [isVisible]);

  const getPermission = async () => {
    if (Platform.OS === "android") {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]);
    }
  };

  const setupVideoConference = async () => {
    try {
      await getPermission();
      agoraEngineRef.current = createAgoraRtcEngine();
      const agoraEngine = agoraEngineRef.current;

      agoraEngine.registerEventHandler({
        onJoinChannelSuccess: (_connection, uid) => {
          console.log("Successfully joined channel:", uid);
          setIsJoined(true);
        },
        onUserJoined: (_connection, uid) => {
          console.log("Remote user joined:", uid);
          setRemoteUid((prev) => [...prev, uid]);
        },
        onUserOffline: (_connection, uid) => {
          console.log("Remote user left:", uid);
          setRemoteUid((prev) => prev.filter((id) => id !== uid));
        },
        onError: (errorCode, msg) => {
          console.log("Error code:", errorCode, "Message:", msg);
        },
      });

      agoraEngine.initialize({
        appId: appId,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });

      agoraEngine.enableVideo();
      agoraEngine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

      // Start local preview
      agoraEngine.startPreview();

      // Join the channel
      agoraEngine.joinChannel(token, channelName, uid, {});
    } catch (e) {
      console.error("Error setting up video conference:", e);
      Alert.alert("Error", "Failed to setup video conference");
    }
  };

  const leaveChannel = async () => {
    try {
      agoraEngineRef.current?.leaveChannel();
      agoraEngineRef.current?.release();
      setRemoteUid([]);
      setIsJoined(false);
    } catch (e) {
      console.error("Error leaving channel:", e);
    }
  };

  const toggleMute = () => {
    agoraEngineRef.current?.muteLocalAudioStream(!isMuted);
    setIsMuted(!isMuted);
  };

  const toggleCamera = () => {
    agoraEngineRef.current?.muteLocalVideoStream(!isCameraOff);
    setIsCameraOff(!isCameraOff);
  };

  const switchCamera = () => {
    agoraEngineRef.current?.switchCamera();
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="chevron-down" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Video Call</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.videoContainer}>
          {/* Remote Videos */}
          {isJoined && remoteUid.length > 0 ? (
            <ScrollView
              horizontal
              style={styles.remoteContainer}
              contentContainerStyle={styles.remoteContent}
            >
              {remoteUid.map((remoteUser) => (
                <View key={remoteUser} style={styles.remoteVideoWrapper}>
                  <RtcSurfaceView
                    canvas={{ uid: remoteUser }}
                    style={styles.remoteVideo}
                  />
                  <Text style={styles.remoteUserText}>User {remoteUser}</Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.waitingContainer}>
              <Text style={styles.waitingText}>
                Waiting for others to join...
              </Text>
              <ActivityIndicator
                size="large"
                color="#FFFFFF"
                style={{ marginTop: 20 }}
              />
            </View>
          )}

          {/* Local Video (Floating) */}
          {isJoined && (
            <View style={styles.localVideoWrapper}>
              {!isCameraOff ? (
                <RtcSurfaceView
                  canvas={{ uid: 0 }}
                  style={styles.localVideo}
                  zOrderMediaOverlay={true}
                />
              ) : (
                <View style={[styles.localVideo, styles.cameraOffPlaceholder]}>
                  <Ionicons name="videocam-off" size={24} color="#FFFFFF" />
                </View>
              )}
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              isMuted && styles.controlButtonActive,
            ]}
            onPress={toggleMute}
          >
            <Ionicons
              name={isMuted ? "mic-off" : "mic"}
              size={24}
              color={isMuted ? "#000000" : "#FFFFFF"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.endCallButton]}
            onPress={onClose}
          >
            <Ionicons name="call" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              isCameraOff && styles.controlButtonActive,
            ]}
            onPress={toggleCamera}
          >
            <Ionicons
              name={isCameraOff ? "videocam-off" : "videocam"}
              size={24}
              color={isCameraOff ? "#000000" : "#FFFFFF"}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={switchCamera}>
            <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1F2937",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  videoContainer: {
    flex: 1,
    position: "relative",
  },
  remoteContainer: {
    flex: 1,
  },
  remoteContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  remoteVideoWrapper: {
    width: Dimensions.get("window").width,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  remoteVideo: {
    width: "100%",
    height: "100%",
  },
  remoteUserText: {
    position: "absolute",
    bottom: 20,
    left: 20,
    color: "#FFFFFF",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 8,
    borderRadius: 8,
  },
  localVideoWrapper: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 100,
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#000000",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  localVideo: {
    width: "100%",
    height: "100%",
  },
  cameraOffPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#374151",
  },
  waitingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  waitingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  controlButtonActive: {
    backgroundColor: "#FFFFFF",
  },
  endCallButton: {
    backgroundColor: "#EF4444",
    width: 60,
    height: 60,
    borderRadius: 30,
  },
});

export default VideoConference;
