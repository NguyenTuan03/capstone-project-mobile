import { Court } from "@/types/court";
import { formatPrice } from "@/utils/priceFormat";
import { Ionicons } from "@expo/vector-icons";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type CourtSelectionModalProps = {
  visible: boolean;
  onClose: () => void;
  courts: Court[];
  selectedCourt: Court | null;
  onSelectCourt: (court: Court) => void;
  loading: boolean;
};

export default function CourtSelectionModal({
  visible,
  onClose,
  courts,
  selectedCourt,
  onSelectCourt,
  loading,
}: CourtSelectionModalProps) {
  const handleSelectCourt = (court: Court) => {
    onSelectCourt(court);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn sân</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#059669" />
            </View>
          ) : courts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>
                Không có sân nào tại vị trí này
              </Text>
            </View>
          ) : (
            <ScrollView>
              {courts.map((court) => (
                <TouchableOpacity
                  key={court.id}
                  style={[
                    styles.modalItem,
                    selectedCourt?.id === court.id && styles.modalItemSelected,
                  ]}
                  onPress={() => handleSelectCourt(court)}
                >
                  <View style={styles.courtItemContent}>
                    <Text style={styles.modalItemText}>{court.name}</Text>

                    <View style={styles.courtDetailRow}>
                      <Ionicons name="location" size={12} color="#6B7280" />
                      <Text style={styles.courtDetailText}>
                        {court.address}
                      </Text>
                    </View>

                    <View style={styles.courtDetailRow}>
                      <Ionicons name="business" size={12} color="#6B7280" />
                      <Text style={styles.courtDetailText}>
                        {court?.province?.name} - {court?.district?.name}
                      </Text>
                    </View>

                    {court?.phoneNumber && (
                      <View style={styles.courtDetailRow}>
                        <Ionicons name="call" size={12} color="#6B7280" />
                        <Text style={styles.courtDetailText}>
                          {court.phoneNumber}
                        </Text>
                      </View>
                    )}

                    <View style={styles.courtDetailRow}>
                      <Ionicons name="cash" size={12} color="#059669" />
                      <Text style={styles.courtPriceText}>
                        {formatPrice(court.pricePerHour)} VNĐ/giờ
                      </Text>
                    </View>
                  </View>
                  {selectedCourt?.id === court.id && (
                    <Ionicons name="checkmark" size={20} color="#059669" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  modalCloseButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 12,
    textAlign: "center",
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalItemSelected: {
    backgroundColor: "#F0FDF4",
  },
  courtItemContent: {
    flex: 1,
  },
  modalItemText: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "600",
    marginBottom: 8,
  },
  courtAddressText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  courtDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  courtDetailText: {
    fontSize: 12,
    color: "#6B7280",
    flex: 1,
  },
  courtPriceText: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "700",
  },
});
