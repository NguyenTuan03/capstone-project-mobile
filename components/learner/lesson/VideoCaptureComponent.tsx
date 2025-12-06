import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Video } from "expo-av";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface VideoCaptureComponentProps {
  duration: number; // Duration in seconds (e.g., 3, 5, 10)
  onVideoCapture: (videoUri: string, videoName: string, recordedDuration: number) => void;
  onCancel?: () => void;
}

type CaptureState = "idle" | "counting" | "recording" | "preview";

const VideoCaptureComponent: React.FC<VideoCaptureComponentProps> = ({
  duration,
  onVideoCapture,
  onCancel,
}) => {
  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [captureState, setCaptureState] = useState<CaptureState>("idle");
  const [countdown, setCountdown] = useState(3);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [previewVideoUri, setPreviewVideoUri] = useState<string | null>(null);
  const [previewVideoName, setPreviewVideoName] = useState<string | null>(null);

  // Request camera permission on mount
  useEffect(() => {
    if (permission?.granted === false) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleRecordingError = React.useCallback(() => {
    setCaptureState("idle");
    setCountdown(3);
    setRecordingDuration(0);
  }, []);

  const handleRecordingComplete = React.useCallback(
    async (videoPath: string) => {
      // Show preview immediately with the recorded video
      setPreviewVideoUri(videoPath);
      setPreviewVideoName(`video_${Date.now()}.mp4`);
      setCaptureState("preview");
      setCountdown(3);
      setRecordingDuration(0);

      // Save video to file system in background
      try {
        const timestamp = Date.now();
        const fileName = `video_${timestamp}.mp4`;
        
        // Try to get FileSystem directories dynamically
        const FileSystemAny = FileSystem as any;
        const cacheDir = FileSystemAny.cacheDirectory;
        const docDir = FileSystemAny.documentDirectory;
        const baseDir = cacheDir || docDir;

        if (baseDir) {
          const videoDirectory = `${baseDir}videos/`;

          // Ensure directory exists
          await FileSystem.makeDirectoryAsync(videoDirectory, {
            intermediates: true,
          });

          const newPath = `${videoDirectory}${fileName}`;
          await FileSystem.moveAsync({
            from: videoPath,
            to: newPath,
          });

          // Update with saved path
          setPreviewVideoUri(`file://${newPath}`);
          setPreviewVideoName(fileName);
        }
      } catch (error) {
 "Error saving video:", error);
        // Keep preview with original path if save fails
      }
    },
    []
  );

  const startRecording = React.useCallback(async () => {
    try {
      if (!cameraRef.current) return;

      setCaptureState("recording");
      setRecordingDuration(0);

      await cameraRef.current.recordAsync({
        maxDuration: duration,
      }).then(async (video: any) => {
        if (video?.uri) {
          await handleRecordingComplete(video.uri);
        } else {
          handleRecordingError();
        }
      }).catch((error: any) => {
 "Recording error:", error);
        handleRecordingError();
      });
    } catch (error) {
 "Error starting recording:", error);
      handleRecordingError();
    }
  }, [duration, handleRecordingComplete, handleRecordingError]);

  const stopRecording = React.useCallback(async () => {
    try {
      if (cameraRef.current) {
        await cameraRef.current.stopRecording();
      }
    } catch (error) {
 "Error stopping recording:", error);
      handleRecordingError();
    }
  }, [handleRecordingError]);

  const startCountdown = () => {
    setCaptureState("counting");
    setCountdown(3);
  };

  // Countdown timer (3, 2, 1)
  useEffect(() => {
    if (captureState !== "counting") return;

    if (countdown > 0) {
      timerRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else {
      // Start recording after countdown finishes
      startRecording();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [countdown, captureState, startRecording]);

  // Recording timer
  useEffect(() => {
    if (captureState !== "recording") return;

    if (recordingDuration < duration) {
      timerRef.current = setTimeout(() => {
        setRecordingDuration(recordingDuration + 1);
      }, 1000);
    } else {
      // Auto stop recording when duration is reached
      stopRecording();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [recordingDuration, captureState, duration, stopRecording]);

  const handleCancel = () => {
    if (captureState === "counting" || captureState === "recording") {
      if (timerRef.current) clearTimeout(timerRef.current);
      try {
        cameraRef.current?.stopRecording();
      } catch (error) {
 "Error cancelling recording:", error);
      }
    }
    setCaptureState("idle");
    setCountdown(3);
    setRecordingDuration(0);
    onCancel?.();
  };

  const handleAcceptVideo = () => {
    if (previewVideoUri && previewVideoName) {
      onVideoCapture(previewVideoUri, previewVideoName, recordingDuration);
      setPreviewVideoUri(null);
      setPreviewVideoName(null);
      setCaptureState("idle");
      setCountdown(3);
      setRecordingDuration(0);
    }
  };

  const handleRetakeVideo = () => {
    setPreviewVideoUri(null);
    setPreviewVideoName(null);
    setCaptureState("idle");
    setCountdown(3);
    setRecordingDuration(0);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <MaterialCommunityIcons name="camera-off" size={48} color="#EF4444" />
          <Text style={styles.permissionText}>
            Đang yêu cầu camera permission...
          </Text>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <MaterialCommunityIcons name="camera-off" size={48} color="#EF4444" />
          <Text style={styles.permissionText}>
            Camera permission được yêu cầu
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={requestPermission}
          >
            <Text style={styles.retryButtonText}>Cấp quyền</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Show Camera when not in preview mode */}
      {captureState !== "preview" && (
        <>
          <CameraView
            ref={cameraRef}
            facing="front"
            style={styles.camera}
            mode="video"
          />

          {/* Countdown Overlay */}
          {captureState === "counting" && (
            <View style={styles.countdownOverlay}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          )}

          {/* Recording Indicator */}
          {captureState === "recording" && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingTime}>
                {recordingDuration} / {duration}s
              </Text>
            </View>
          )}

          {/* Controls */}
          {captureState === "idle" && (
            <View style={styles.controlsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.captureButton}
                onPress={startCountdown}
                activeOpacity={0.8}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>

              <View style={{ width: 50 }} />
            </View>
          )}

          {/* Stop Recording Button */}
          {captureState === "recording" && (
            <View style={styles.controlsContainer}>
              <TouchableOpacity
                style={[styles.stopButton]}
                onPress={stopRecording}
                activeOpacity={0.8}
              >
                <View style={styles.stopButtonInner} />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Video Preview Screen */}
      {captureState === "preview" && previewVideoUri && (
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Xem lại video</Text>
          </View>

          <View style={styles.videoPlayerContainer}>
            <Video
              source={{ uri: previewVideoUri }}
              style={styles.videoPlayer}
              resizeMode={"contain" as any}
              isLooping={false}
              shouldPlay={true}
              useNativeControls={true}
            />
          </View>

          <View style={styles.previewControlsContainer}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={handleRetakeVideo}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="reload" size={24} color="#FFFFFF" />
              <Text style={styles.retakeButtonText}>Quay lại</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAcceptVideo}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color="#FFFFFF"
              />
              <Text style={styles.acceptButtonText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  camera: {
    flex: 1,
  },
  controlsContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
  },
  stopButton: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  stopButtonInner: {
    width: 40,
    height: 40,
    backgroundColor: "#FFFFFF",
  },
  cancelButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  countdownOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  countdownText: {
    fontSize: 120,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  recordingIndicator: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    opacity: 0.8,
  },
  recordingTime: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  processingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  processingText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
  },
  permissionText: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#059669",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3.5,
    elevation: 3,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 12,
  },
  previewContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
    flexDirection: "column",
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  previewHeader: {
    alignItems: "center",
    paddingTop: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  videoPlayerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  videoPlayer: {
    width: "100%",
    height: 300,
    borderRadius: 10,
  },
  previewMessage: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  previewControlsContainer: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: "center",
  },
  retakeButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(255, 165, 0, 0.8)",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#FFA500",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  retakeButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  acceptButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#059669",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});

export default VideoCaptureComponent;
