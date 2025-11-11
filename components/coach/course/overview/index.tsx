import { Course } from "@/types/course";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
type Props = {
  course: Course;
  progress: number; // 0..100
  formatPrice: (v: number | string) => string | number;
  formatSchedule: (schedules: any[]) => string;
};
const StatCard = ({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  footer,
}: {
  icon: any;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  footer?: React.ReactNode;
}) => {
  return (
    <View style={styles.statCard}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {footer ? (
        <View style={{ marginTop: 8, alignSelf: "stretch" }}>{footer}</View>
      ) : null}
    </View>
  );
};

const ProgressBar = ({ value = 0 }: { value: number }) => {
  const v = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.progressOuter}>
      <View style={[styles.progressInner, { width: `${v}%` }]} />
    </View>
  );
};

const Section = ({
  title,
  children,
  rightHint,
}: {
  title: string;
  children: React.ReactNode;
  rightHint?: React.ReactNode | string;
}) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {rightHint ? (
        typeof rightHint === "string" ? (
          <Text style={styles.sectionHint}>{rightHint}</Text>
        ) : (
          rightHint
        )
      ) : null}
    </View>
    {children}
  </View>
);

const InfoRow = ({
  label,
  value,
  icon,
  multiline,
  valueStyle,
}: {
  label: string;
  value: string;
  icon?: any;
  multiline?: boolean;
  valueStyle?: any;
}) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLabelWrap}>
      {icon ? (
        <Ionicons
          name={icon}
          size={15}
          color="#6B7280"
          style={{ marginRight: 6 }}
        />
      ) : null}
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text
      style={[styles.infoValue, valueStyle]}
      numberOfLines={multiline ? undefined : 2}
    >
      {value || "—"}
    </Text>
  </View>
);

const ChipRow = ({ chips }: { chips: string[] }) => (
  <View style={styles.chipRow}>
    {chips.filter(Boolean).map((c, idx) => (
      <View style={styles.chip} key={`${c}-${idx}`}>
        <Ionicons name="pricetag-outline" size={11} color="#2563EB" />
        <Text style={styles.chipText}>{c}</Text>
      </View>
    ))}
  </View>
);
const statusMap = (status: string) => {
  const map: Record<string, { text: string; color: string }> = {
    APPROVED: { text: "Đã duyệt", color: "#16A34A" },
    PENDING: { text: "Chờ duyệt", color: "#F59E0B" },
    REJECTED: { text: "Từ chối", color: "#DC2626" },
  };
  const found = map[status] || { text: status, color: "#6B7280" };
  return (
    <Text
      style={[styles.badge, { color: found.color, borderColor: found.color }]}
    >
      {found.text}
    </Text>
  );
};

const levelMap = (lv?: string) => {
  const map: Record<string, string> = {
    BEGINNER: "Cơ bản",
    INTERMEDIATE: "Trung cấp",
    ADVANCED: "Nâng cao",
  };
  return map[lv ?? ""] ?? lv ?? "";
};

const formatFormat = (f?: string) => {
  const map: Record<string, string> = {
    GROUP: "Học nhóm",
    PRIVATE: "1-1",
    ONLINE: "Online",
  };
  return map[f ?? ""] ?? f ?? "";
};

export const OverviewTab: React.FC<Props> = ({
  course,
  progress,
  formatPrice,
  formatSchedule,
}) => {
  const [descExpanded] = useState(false);

  const dateRange = useMemo(() => {
    const start = course?.startDate
      ? new Date(course.startDate).toLocaleDateString("vi-VN")
      : "";
    const end = course?.endDate
      ? new Date(course.endDate).toLocaleDateString("vi-VN")
      : "";
    return end ? `${start} – ${end}` : start;
  }, [course?.startDate, course?.endDate]);

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* === KPI Cards === */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="people"
          iconBg="#EEF2FF"
          iconColor="#3B82F6"
          label="Học viên"
          value={`${course.currentParticipants}/${course.maxParticipants}`}
        />
        <StatCard
          icon="book"
          iconBg="#ECFDF5"
          iconColor="#10B981"
          label="Buổi học"
          value={String(course.totalSessions ?? 0)}
        />
        <StatCard
          icon="time"
          iconBg="#FFFBEB"
          iconColor="#F59E0B"
          label="Tiến độ"
          value={`${progress ?? 0}%`}
          footer={<ProgressBar value={progress ?? 0} />}
        />
        <StatCard
          icon="cash"
          iconBg="#ECFDF5"
          iconColor="#059669"
          label="Doanh thu"
          value={String(formatPrice(course.totalEarnings ?? 0))}
        />
      </View>

      {/* === Course Info === */}
      <Section
        title="Thông tin khóa học"
        rightHint={course?.status ? statusMap(course.status) : undefined}
      >
        <InfoRow
          label="Môn học"
          icon="tennisball-outline"
          value={course?.subject?.name}
        />
        <InfoRow
          label="Lịch học"
          icon="calendar-outline"
          value={formatSchedule(course?.schedules ?? [])}
        />
        <InfoRow label="Thời gian" icon="time-outline" value={dateRange} />
        <InfoRow
          label="Địa điểm"
          icon="location-outline"
          value={[
            course?.address,
            course?.district?.name,
            course?.province?.name,
          ]
            .filter(Boolean)
            .join("\n")}
          multiline
        />
        <InfoRow
          label="Học phí"
          icon="card-outline"
          value={`${formatPrice(course?.pricePerParticipant)}/người`}
          valueStyle={{ color: "#059669", fontWeight: "600" }}
        />
        <InfoRow
          label="Sĩ số"
          icon="people-outline"
          value={`Tối thiểu: ${course?.minParticipants}  •  Tối đa: ${course?.maxParticipants}`}
        />
        {!!course?.level && (
          <ChipRow
            chips={[
              levelMap(course.level),
              formatFormat(course.learningFormat),
            ]}
          />
        )}
      </Section>

      {/* === Description === */}
      <Section title="Mô tả">
        <View style={styles.descriptionBox}>
          <Text
            style={styles.descriptionText}
            numberOfLines={descExpanded ? undefined : 4}
          >
            {course?.description || "—"}
          </Text>
        </View>
      </Section>

      <View style={{ height: 16 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  tabContent: { flex: 1 },

  /* Section */
  section: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    // subtle shadow
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  sectionHint: { fontSize: 11, color: "#6B7280" },

  /* KPI grid */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 10,
    paddingTop: 10,
    marginBottom: 10,
  },
  statCard: {
    width: "47.6%",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 10,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  iconWrap: {
    borderRadius: 8,
    padding: 7,
    marginBottom: 7,
  },
  statLabel: { fontSize: 11, color: "#6B7280", fontWeight: "500" },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginTop: 3,
  },

  /* Progress */
  progressOuter: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    overflow: "hidden",
  },
  progressInner: {
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 999,
  },

  /* Info rows */
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 8,
  },
  infoLabel: { fontSize: 13, color: "#6B7280" },
  infoValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },

  /* Description */
  descriptionBox: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  descriptionText: { fontSize: 13, color: "#374151", lineHeight: 19 },
  seeMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    alignSelf: "flex-start",
  },
  seeMoreText: { fontSize: 12, color: "#2563EB", fontWeight: "600" },

  /* Chips */
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  chipText: { fontSize: 11, color: "#1D4ED8", fontWeight: "600" },

  /* Badge */
  badge: {
    fontSize: 11,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    fontWeight: "600",
  },
});
