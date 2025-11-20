import { Ionicons } from "@expo/vector-icons";
import type { FC } from "react";
import { memo } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import type { Course } from "@/types/course";
import { convertDayOfWeekToVietnamese } from "@/utils/scheduleFormat";

import {
    formatCoursePrice,
    getLevelInVietnamese,
    getStatusColor,
    getStatusInVietnamese,
} from "./helpers";
import styles from "./styles";

type CourseDetailModalProps = {
  visible: boolean;
  course: Course | null;
  coachRatings: Record<number, number>;
  processingPaymentId: number | null;
  onClose: () => void;
  onRegister: (courseId: number) => void;
  bottomInset: number;
};

const CourseDetailModalComponent: FC<CourseDetailModalProps> = ({
  visible,
  course,
  coachRatings,
  processingPaymentId,
  onClose,
  onRegister,
  bottomInset,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View
        style={[
          styles.courseModalContent,
          { paddingBottom: bottomInset + 20 },
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.courseModalHeader}>
            <Text style={styles.courseModalTitle}>Chi tiết khóa học</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {course && (
            <View style={styles.courseDetailContent}>
              <View style={styles.imageContainer}>
                <Image
                  source={{
                    uri: "https://via.placeholder.com/400x200?text=Course",
                  }}
                  style={styles.courseDetailImage}
                />
                <View style={styles.statusBadgeOverlay}>
                  <View style={[styles.badge, styles.badgePrimary]}>
                    <Text style={styles.badgeText}>
                      {course.learningFormat === "INDIVIDUAL" ? "Cá nhân" : "Nhóm"}
                    </Text>
                  </View>
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelBadgeText}>
                      {getLevelInVietnamese(course.level)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.courseInfoSection}>
                <View>
                  <Text style={styles.courseDetailTitle} numberOfLines={3}>
                    {course.name}
                  </Text>
                  <View style={styles.coachRow}>
                    <Text style={styles.courseDetailCoach} numberOfLines={1}>
                      {course.createdBy?.fullName || "Huấn luyện viên"}
                    </Text>
                    {course.createdBy?.id &&
                      coachRatings[course.createdBy.id] !== undefined && (
                        <Ionicons
                          name="star"
                          size={14}
                          color="#FBBF24"
                          style={{ marginLeft: 6 }}
                        />
                      )}
                  </View>
                </View>

                <View style={styles.quickInfoRow}>
                  <View style={styles.quickInfoItem}>
                    <Ionicons name="location" size={14} color="#059669" />
                    <Text style={styles.quickInfoText} numberOfLines={2}>
                      {course.court?.address || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.quickInfoItem}>
                    <Ionicons name="calendar" size={14} color="#059669" />
                    <Text style={styles.quickInfoText}>
                      {course.totalSessions} buổi
                    </Text>
                  </View>
                </View>

                {course.description && (
                  <View style={styles.descriptionSection}>
                    <View style={styles.descriptionHeader}>
                      <Ionicons
                        name="document-text"
                        size={14}
                        color="#059669"
                      />
                      <Text style={styles.descriptionTitle}>Mô tả</Text>
                    </View>
                    <Text style={styles.descriptionText}>
                      {course.description}
                    </Text>
                  </View>
                )}

                {course.learningFormat === "GROUP" && (
                  <View style={styles.participantsSection}>
                    <View style={styles.participantRow}>
                      <View style={styles.participantColumn}>
                        <Text style={styles.participantLabel}>Hiện tại</Text>
                        <Text style={styles.participantValue}>
                          {course.currentParticipants}
                        </Text>
                      </View>
                      <View style={styles.participantDivider} />
                      <View style={styles.participantColumn}>
                        <Text style={styles.participantLabel}>Tối thiểu</Text>
                        <Text style={styles.participantValue}>
                          {course.minParticipants}
                        </Text>
                      </View>
                      <View style={styles.participantDivider} />
                      <View style={styles.participantColumn}>
                        <Text style={styles.participantLabel}>Tối đa</Text>
                        <Text style={styles.participantValue}>
                          {course.maxParticipants}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {course.learningFormat === "INDIVIDUAL" && (
                  <View style={styles.individualCourseInfo}>
                    <Ionicons name="person" size={16} color="#059669" />
                    <Text style={styles.individualCourseText}>
                      Khóa học cá nhân
                    </Text>
                  </View>
                )}

                {course.currentParticipants === 0 &&
                  course.learningFormat === "GROUP" && (
                    <View style={styles.warningSection}>
                      <Ionicons
                        name="alert-circle"
                        size={16}
                        color="#F59E0B"
                      />
                      <Text style={styles.warningText}>
                        Chưa có học viên đăng ký {"\n"} Hãy là người đầu tiên!
                      </Text>
                    </View>
                  )}

                <View
                  style={[
                    styles.statusBadgeSection,
                    {
                      backgroundColor: `${getStatusColor(course.status)}20`,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(course.status) },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.statusLabel}>Trạng thái khóa học</Text>
                    <Text
                      style={[
                        styles.statusValue,
                        { color: getStatusColor(course.status) },
                      ]}
                    >
                      {getStatusInVietnamese(course.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardLabel}>Chủ đề</Text>
                    <Text style={styles.detailCardValue} numberOfLines={2}>
                      {course.subject?.name || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardLabel}>Bắt đầu</Text>
                    <Text style={styles.detailCardValue}>
                      {new Date(course.startDate).toLocaleDateString("vi-VN", {
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardLabel}>Trình độ</Text>
                    <Text style={styles.detailCardValue}>
                      {getLevelInVietnamese(course.level)}
                    </Text>
                  </View>
                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardLabel}>Tổng buổi</Text>
                    <Text style={styles.detailCardValue}>
                      {course.totalSessions}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Tiến độ</Text>
                    <Text style={styles.progressValue}>
                      {Math.round(course.progressPct)}%
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${course.progressPct}%` },
                      ]}
                    />
                  </View>
                </View>

                {course.schedules && course.schedules.length > 0 && (
                  <View style={styles.scheduleSection}>
                    <Text style={styles.sectionTitle}>Lịch học</Text>
                    <View style={styles.scheduleList}>
                      {course.schedules.slice(0, 2).map((schedule, idx) => (
                        <View key={idx} style={styles.scheduleItem}>
                          <Text style={styles.scheduleDay}>
                            {convertDayOfWeekToVietnamese(schedule.dayOfWeek)}
                          </Text>
                          <Text style={styles.scheduleTime}>
                            {schedule.startTime} - {schedule.endTime}
                          </Text>
                        </View>
                      ))}
                      {course.schedules.length > 2 && (
                        <Text style={styles.moreSchedules}>
                          +{course.schedules.length - 2} buổi khác
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                <View style={styles.priceSectionLarge}>
                  <View>
                    <Text style={styles.priceSectionLabel}>Giá khóa học</Text>
                    <Text style={styles.priceSectionValue}>
                      {formatCoursePrice(course.pricePerParticipant)}
                    </Text>
                  </View>
                  <View style={styles.priceInfo}>
                    <Text style={styles.priceInfoText}>
                      {course.maxParticipants - course.currentParticipants > 0
                        ? `${
                            course.maxParticipants - course.currentParticipants
                          } chỗ còn`
                        : "Đã đủ học viên"}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    styles.registerBtn,
                    processingPaymentId === course.id &&
                      styles.primaryBtnDisabled,
                    course.maxParticipants - course.currentParticipants <= 0 &&
                      styles.disabledBtn,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => onRegister(course.id)}
                  disabled={
                    processingPaymentId === course.id ||
                    course.maxParticipants - course.currentParticipants <= 0
                  }
                >
                  {processingPaymentId === course.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : course.maxParticipants - course.currentParticipants <= 0 ? (
                    <Text style={styles.primaryBtnText}>
                      Khóa học đã đủ học viên
                    </Text>
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#FFFFFF"
                      />
                      <Text style={styles.primaryBtnText}>Đăng ký ngay</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

const CourseDetailModal = memo(CourseDetailModalComponent);
CourseDetailModal.displayName = "CourseDetailModal";

export default CourseDetailModal;

