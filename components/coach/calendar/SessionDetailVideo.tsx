import { Ionicons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface Props {
  session: any;
  course: any;
  styles: any;
}

const SessionDetailVideo: React.FC<Props> = ({ session, course, styles }) => {
  const videos = session?.videos || course?.videos || [];
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  // playback state (kept minimal here; UI controls can be wired later)

  // Create a player instance for the selected video using the expo-video hook.
  const player = useVideoPlayer(selectedVideo?.publicUrl || null, undefined as any);
  // The native view expects a numeric shared object id or null — extract it if present.
  const playerId = (player && (((player as any).__expo_shared_object_id__ ?? (typeof player === 'number' ? player : null)))) || null;

  const openPlayer = (video: any) => {
    // toggle inline player for this video
    if (selectedVideo && selectedVideo.id === video.id) {
      setSelectedVideo(null);
      setCurrentTime(0);
      setDuration(0);
    } else {
      setSelectedVideo(video);
      setIsBuffering(false);
      setCurrentTime(0);
      setDuration(0);
    }
  };

  if (!videos || videos.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={localStyles.headerIcon}>
          <Ionicons name="play-circle-outline" size={20} color="#059669" />
        </View>
        <Text style={styles.sectionTitle}>Video hướng dẫn</Text>
        <View style={localStyles.badgeContainer}>
          <Text style={localStyles.badgeText}>{videos.length}</Text>
        </View>
      </View>

      <View style={styles.sectionContent}>
        {videos.map((video: any, index: number) => (
          <React.Fragment key={video.id || index}>
            <TouchableOpacity
              style={localStyles.videoCard}
              activeOpacity={0.7}
              onPress={() => openPlayer(video)}
            >
              <View style={localStyles.videoThumbnail}>
                {video.thumbnailUrl ? (
                  <Image
                    source={{ uri: video.thumbnailUrl }}
                    style={localStyles.thumbnailImage}
                  />
                ) : (
                  <View style={localStyles.defaultThumbnail}>
                    <Ionicons name="play" size={28} color="#6B7280" />
                  </View>
                )}
                <View style={localStyles.playOverlay}>
                  <Ionicons name="play" size={20} color="#FFFFFF" />
                </View>
              </View>

              <View style={localStyles.videoInfo}>
                <Text style={localStyles.videoTitle} numberOfLines={2}>{video.title}</Text>
                {video.description && (
                  <Text style={localStyles.videoDescription} numberOfLines={2}>
                    {video.description}
                  </Text>
                )}
                <View style={localStyles.videoMeta}>
                  <View style={localStyles.videoMetaItem}>
                    <Ionicons name="time-outline" size={13} color="#6B7280" />
                    <Text style={localStyles.videoMetaText}>
                      {Math.floor(video.duration / 60)}:
                      {(video.duration % 60).toString().padStart(2, "0")}
                    </Text>
                  </View>
                  {video.drillName && (
                    <View style={localStyles.videoMetaItem}>
                      <Ionicons
                        name="football-outline"
                        size={13}
                        color="#6B7280"
                      />
                      <Text style={localStyles.videoMetaText}>
                        {video.drillName}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {selectedVideo &&
              selectedVideo.id === video.id &&
              selectedVideo.publicUrl && (
                <View style={localStyles.inlinePlayer}>
                  {playerId ? (
                    <VideoView player={playerId as any} style={localStyles.video} />
                  ) : (
                    <View style={[localStyles.video, { justifyContent: 'center', alignItems: 'center' }]}> 
                      <Text style={{ color: '#fff' }}>Preparing player…</Text>
                    </View>
                  )}

                  {isBuffering && (
                    <View style={localStyles.buffering}>
                      <ActivityIndicator size="small" color="#fff" />
                    </View>
                  )}

                  <View style={localStyles.timeRow}>
                    <Text style={localStyles.timeText}>
                      {formatTime(currentTime)}
                    </Text>
                    <Text style={localStyles.timeText}>
                      {formatTime(duration)}
                    </Text>
                  </View>
                </View>
              )}
          </React.Fragment>
        ))}
      </View>

      {/* Inline player: appears under the selected video item (not fullscreen)
          Also render a Modal-based popup for the selected video so it sits above
          any surrounding UI/stacking (fixes case where native VideoView renders
          behind the detail modal). */}

      {selectedVideo && selectedVideo.publicUrl && (
        <Modal
          visible={true}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setSelectedVideo(null)}
        >
          <TouchableWithoutFeedback onPress={() => setSelectedVideo(null)}>
            <View style={localStyles.modalBackdrop} />
          </TouchableWithoutFeedback>

          <View style={localStyles.modalWrapper} pointerEvents="box-none">
            <View style={localStyles.modalContent}>
              <TouchableOpacity
                style={localStyles.closeButton}
                onPress={() => setSelectedVideo(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color="#FFF" />
              </TouchableOpacity>

              {playerId ? (
                <VideoView player={playerId as any} style={localStyles.video} />
              ) : (
                <View style={[localStyles.video, { justifyContent: 'center', alignItems: 'center' }]}> 
                  <Text style={{ color: '#fff' }}>Preparing player…</Text>
                </View>
              )}

              {isBuffering && (
                <View style={localStyles.buffering}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}

              <View style={localStyles.timeRow}>
                <Text style={localStyles.timeText}>{formatTime(currentTime)}</Text>
                <Text style={localStyles.timeText}>{formatTime(duration)}</Text>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

function formatTime(sec: number) {
  if (!sec || isNaN(sec)) return "0:00";
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  const m = Math.floor(sec / 60).toString();
  return `${m}:${s}`;
}

const localStyles = StyleSheet.create({
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  videoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  videoThumbnail: {
    width: 100,
    height: 100,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  defaultThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  videoInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 19,
    marginBottom: 4,
  },
  videoDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 6,
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  videoMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  videoMetaText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  inlinePlayer: {
    width: "100%",
    height: 200,
    backgroundColor: "#000",
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  buffering: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  timeRow: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeText: {
    color: "#fff",
    fontSize: 12,
  },
  modalBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '95%',
    maxWidth: 900,
    height: 240,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    zIndex: 10,
    padding: 6,
  },
});

export default SessionDetailVideo;
