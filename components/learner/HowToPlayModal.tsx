import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface HowToPlayModalProps {
  visible: boolean;
  onClose: () => void;
}

type Technique = "dink" | "drive" | "drop" | "lob" | "volley";

interface TechniqueData {
  name: string;
  description: string;
  icon: string;
  details: string[];
}

const techniques: Record<Technique, TechniqueData> = {
  dink: {
    name: "Dink",
    description:
      "Cú đánh nhẹ gần lưới vào 'Bếp' của đối thủ - nền tảng của lối chơi pickleball",
    icon: "tennis",
    details: [
      "Dink là một trong những kỹ thuật cơ bản mà người chơi cần phải nắm vững",
      "Di chuyển chân linh hoạt để đặt bản thân vào vị trí tốt nhất để nhận trái bóng",
      "Sử dụng cổ tay linh hoạt để tạo ra cú đánh nhẹ nhàng, chỉ bay qua lưới và rơi xuống",
      "Đòi hỏi khả năng kiểm soát lực đánh cũng như sự linh hoạt để đảm bảo bóng đi đúng hướng",
      "Thay đổi góc đánh để đối thủ bị bối rối, tạo ra những cú đánh đa dạng hơn, khó đánh trả",
    ],
  },
  drive: {
    name: "Drive",
    description: "Cú đánh mạnh, tốc độ cao từ lần nảy - thường từ baseline",
    icon: "lightning-bolt",
    details: [
      "Đây là loại cú đánh đi nhanh, bay thấp, nằm sát với mặt sân khiến đối phương khó đón đỡ",
      "Bí quyết chính là tạo ra lực đánh mạnh và để bóng đi thấp, nhanh",
      "Chuẩn bị: Đứng gần vạch giữa sân để có thể di chuyển được linh hoạt hơn",
      "Động tác xoay hông và vai là yếu tố then chốt - bước chân không thuận lên trước để tạo đà",
      "Kết hợp xoay hông và vai hướng về phía lưới, điểm tiếp xúc bóng lý tưởng ở phía trước cơ thể",
    ],
  },
  drop: {
    name: "Drop",
    description: "Cú đánh từ phía sau sân để rơi mềm vào 'Bếp' của đối thủ",
    icon: "arrow-down",
    details: [
      "Được áp dụng khi bạn đang ở phía sau sân và muốn tiến lên gần lưới",
      "Bóng được đánh với vòng cung cao rồi rơi xuống mềm vào khu vực 'Bếp'",
      "Chuẩn bị: Người chơi đứng ở vị trí trung tâm, bước 1 chân lên trước, 2 chân mở rộng",
      "Quỹ bóng vòng cung cao giúp tạo khoảng thời gian để bạn tiến lên phía trước sân",
      "Đặc biệt hữu ích khi đối thủ ở sâu sân hoặc ở xa lưới",
    ],
  },
  lob: {
    name: "Lốp bóng",
    description: "Cú đánh cao để đẩy đối thủ ra khỏi vị trí gần lưới",
    icon: "arrow-up",
    details: [
      "Lốp bóng là kỹ thuật phòng thủ với vòng cung cực cao, quỹ bóng bay rất cao",
      "Được sử dụng để đẩy đối thủ trở lại baseline nếu họ quá gần lưới",
      "Bóng bay qua đầu đối phương với độ cao lớn, tạo khoảng thời gian dài cho bạn di chuyển",
      "Có thể dẫn đến lỗi overhead từ đối thủ nếu họ cố gắng đánh bóng sở hữu quá cao",
      "Cần điều chỉnh lực sao cho bóng bay cao nhưng vẫn rơi vào sân, không bay ra ngoài",
    ],
  },
  volley: {
    name: "Vô lê",
    description: "Cú đánh trong không khí trước khi bóng nảy - thường gần lưới",
    icon: "flash",
    details: [
      "Vô lê là kỹ thuật được áp dụng khi bóng tới gần người chơi, đòi hỏi kỹ năng và kinh nghiệm",
      "Chuẩn bị: Khi thực hiện kỹ thuật này thì người chơi cần phải đứng ở vị trí gần với vạch kẻ giữa sân",
      "Khi bóng tới gần thì người chơi đưa vợt lên, sử dụng lòng bàn tay, ngón tay để đưa vợt vào vị trí chính xác",
      "Sử dụng lực từ tay vào cán để đánh bóng trở lại sang bên phần sân đối phương",
      "Cần tập trung vào việc đưa cây vợt tới vị trí chính xác, sử dụng lực từ cánh tay để đưa bóng qua chính xác, nhanh chóng",
    ],
  },
};

const rules = [
  {
    id: "1",
    title: "Giao Bóng Chéo Sân",
    description:
      "Giao bóng phải thực hiện từ dưới thắt lưng, chéo sân vào khu vực giao bóng đối thủ",
    icon: "target-account",
    details: [
      "Người giao bóng phải đứng phía sau vạch baseline (vạch biên cuối sân)",
      "Cú giao bóng phải từ dưới lên (underhand), không được trên đầu (overhand)",
      "Bóng phải vượt qua lưới và chạm đất chéo sân vào khu vực giao bóng đối thủ",
      "Nếu giao bóng sai khu vực hoặc không qua lưới, đó là lỗi",
    ],
  },
  {
    id: "2",
    title: "Quy Tắc Hai Lần Nảy",
    description:
      "Bóng phải nảy ít nhất một lần ở mỗi bên trước khi có thể vô lê",
    icon: "repeat",
    details: [
      "Sau khi giao bóng, bóng phải nảy một lần ở sân đối phương",
      "Đối phương phải để bóng nảy lên rồi trả bóng, bóng phải nảy một lần ở sân giao bóng",
      "Sau đó, cả hai đội có thể vô lê (đánh trước khi bóng nảy)",
      "Quy tắc này tạo sự công bằng và yêu cầu phản xạ nhanh",
    ],
  },
  {
    id: "3",
    title: "Khu Vực không thể vô lê (Kitchen)",
    description: "Vùng 7 feet từ lưới - không được vô lê (đánh trước khi nảy)",
    icon: "close-circle",
    details: [
      "Khu vực 'Bếp' (2.13m) từ lưới ở cả hai bên sân",
      "Không được đánh bóng trên không (vô lê) khi đứng trong khu vực này",
      "Người chơi CÓ THỂ bước vào 'Bếp' nếu bóng đã nảy trước đó",
      "Vi phạm quy tắc này: đối phương ghi điểm",
    ],
  },
  {
    id: "4",
    title: "Chỉ Bên Phát Bóng Ghi Điểm",
    description: "Chỉ đội giao bóng mới có quyền ghi điểm khi thắng điểm",
    icon: "trophy",
    details: [
      "Nếu đội giao bóng thắng điểm, họ ghi 1 điểm và tiếp tục giao bóng",
      "Nếu đội nhận bóng thắng điểm, quyền giao bóng chuyển sang họ nhưng không ghi điểm",
      "Quy tắc này tạo sự cân bằng và khiến trò chơi thêm phần chiến thuật",
      "Mỗi đội phải giữ quyền giao bóng để có cơ hội ghi điểm",
    ],
  },
  {
    id: "5",
    title: "Thắng 11 Điểm (hoặc 15, 21)",
    description:
      "Đội đầu tiên đạt điểm thắng và dẫn trước ít nhất 2 điểm là người chiến thắng",
    icon: "numeric-11",
    details: [
      "Thông thường thắng tại 11 điểm, nhưng có thể 15 hoặc 21 điểm tùy quy định",
      "Phải dẫn trước ít nhất 2 điểm để thắng (ví dụ: 11-9 hoặc 12-10)",
      "Nếu hai bên sát điểm (10-10), tiếp tục chơi đến khi ai dẫn 2 điểm",
      "Ví dụ có thể là 12-10, 15-13, 21-19, v.v.",
    ],
  },
  {
    id: "6",
    title: "Chạm Lưới & Lỗi Khác",
    description:
      "Không được chạm lưới, đánh bóng hai lần, hoặc đánh ra ngoài biên",
    icon: "alert-circle",
    details: [
      "Chạm lưới bằng cơ thể hoặc vợt khi đánh hoặc di chuyển = lỗi",
      "Đánh bóng hai lần trong một lượt (Double Hit) = lỗi",
      "Đánh bóng ra ngoài biên sân hoặc không qua lưới = lỗi",
      "Vi phạm bất kỳ lỗi nào: đối phương ghi điểm",
    ],
  },
];

export default function HowToPlayModal({
  visible,
  onClose,
}: HowToPlayModalProps) {
  const [selectedTechnique, setSelectedTechnique] = useState<Technique>("dink");
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Hướng Dẫn Chơi Pickleball</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Techniques Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Các Loại Cú Đánh & Chuyển Động
            </Text>

            {/* Technique Selector */}
            <View style={styles.techniqueSelector}>
              {(Object.keys(techniques) as Technique[]).map((tech) => (
                <TouchableOpacity
                  key={tech}
                  style={[
                    styles.techniqueButton,
                    selectedTechnique === tech && styles.techniqueButtonActive,
                  ]}
                  onPress={() => setSelectedTechnique(tech)}
                >
                  <MaterialCommunityIcons
                    name={techniques[tech].icon as any}
                    size={20}
                    color={selectedTechnique === tech ? "#fff" : "#059669"}
                  />
                  <Text
                    style={[
                      styles.techniqueButtonText,
                      selectedTechnique === tech &&
                        styles.techniqueButtonTextActive,
                    ]}
                  >
                    {techniques[tech].name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Technique Details */}
            <View style={styles.techniqueDetails}>
              <View style={styles.techHeaderRow}>
                <View
                  style={[styles.techIconBox, { backgroundColor: "#DCFCE7" }]}
                >
                  <MaterialCommunityIcons
                    name={techniques[selectedTechnique].icon as any}
                    size={24}
                    color="#059669"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.techName}>
                    {techniques[selectedTechnique].name}
                  </Text>
                  <Text style={styles.techDescription}>
                    {techniques[selectedTechnique].description}
                  </Text>
                </View>
              </View>

              <Text style={styles.techDetailsTitle}>Chi Tiết:</Text>
              {techniques[selectedTechnique].details.map((detail, idx) => (
                <View key={idx} style={styles.detailItem}>
                  <View style={styles.detailDot} />
                  <Text style={styles.detailText}>{detail}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Basic Rules Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Các Quy Tắc Cơ Bản</Text>

            {rules.map((rule) => (
              <View key={rule.id} style={styles.ruleCard}>
                <TouchableOpacity
                  style={styles.ruleHeader}
                  onPress={() =>
                    setExpandedRule(expandedRule === rule.id ? null : rule.id)
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.ruleIconContainer}>
                    <MaterialCommunityIcons
                      name={rule.icon as any}
                      size={20}
                      color="#fff"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.ruleTitle}>{rule.title}</Text>
                    <Text style={styles.ruleDescription}>
                      {rule.description}
                    </Text>
                  </View>
                  <Ionicons
                    name={
                      expandedRule === rule.id ? "chevron-up" : "chevron-down"
                    }
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>

                {expandedRule === rule.id && rule.details && (
                  <View style={styles.ruleDetails}>
                    {rule.details.map((detail: string, idx: number) => (
                      <View key={idx} style={styles.detailItem}>
                        <View style={styles.detailDot} />
                        <Text style={styles.detailText}>{detail}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Court Dimensions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kích Thước Sân</Text>
            <View style={styles.courtInfoGrid}>
              <View style={styles.courtInfoCard}>
                <MaterialCommunityIcons
                  name="ruler-square"
                  size={20}
                  color="#059669"
                />
                <Text style={styles.courtInfoLabel}>Chiều Rộng</Text>
                <Text style={styles.courtInfoValue}>6.1 Mét</Text>
              </View>
              <View style={styles.courtInfoCard}>
                <MaterialCommunityIcons
                  name="ruler"
                  size={20}
                  color="#059669"
                />
                <Text style={styles.courtInfoLabel}>Chiều Dài</Text>
                <Text style={styles.courtInfoValue}>13.4 Mét</Text>
              </View>
              <View style={styles.courtInfoCard}>
                <MaterialCommunityIcons
                  name="network"
                  size={20}
                  color="#059669"
                />
                <Text style={styles.courtInfoLabel}>Lưới Cao</Text>
                <Text style={styles.courtInfoValue}>86 Cm</Text>
              </View>
              <View style={styles.courtInfoCard}>
                <MaterialCommunityIcons
                  name="square"
                  size={20}
                  color="#DC2626"
                />
                <Text style={styles.courtInfoLabel}>Khu vực &quot;Bếp&quot;</Text>
                <Text style={styles.courtInfoValue}>2.13 Mét</Text>
              </View>
            </View>
          </View>

          {/* Tips */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mẹo Cho Người Mới</Text>
            <View style={styles.tipsList}>
              {[
                "Di chuyển lên 'Bếp' sau khi trả bóng phục vụ",
                "Giữ paddle ở vị trí sẵn sàng trước ngực",
                "Sử dụng nắm tay lỏng cho cú chạm",
                "Gập gối và hạ thấp để có sức mạnh",
              ].map((tip, idx) => (
                <View key={idx} style={styles.tipItem}>
                  <View style={styles.tipNumber}>
                    <Text style={styles.tipNumberText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitleRow: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 0.3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#059669",
    marginBottom: 14,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  techniqueSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  techniqueButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
  },
  techniqueButtonActive: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  techniqueButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
    letterSpacing: 0.2,
  },
  techniqueButtonTextActive: {
    color: "#fff",
  },
  techniqueDetails: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    marginTop: 12,
  },
  techHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  techIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  techName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.2,
    marginBottom: 3,
  },
  techDescription: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "400",
  },
  techDetailsTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  detailDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#059669",
    marginTop: 6,
    marginRight: 8,
    flexShrink: 0,
  },
  detailText: {
    flex: 1,
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
    lineHeight: 18,
  },
  ruleCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  ruleHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    justifyContent: "space-between",
  },
  ruleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    flexShrink: 0,
  },
  ruleTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.2,
  },
  ruleDescription: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "400",
  },
  ruleDetails: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  courtInfoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  courtInfoCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  courtInfoLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 8,
    marginBottom: 4,
  },
  courtInfoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#059669",
    letterSpacing: 0.2,
  },
  tipsList: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tipNumber: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    flexShrink: 0,
  },
  tipNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
    lineHeight: 16,
    paddingTop: 2,
  },
});
