import { formStyles } from "@/components/common/formStyles";
import credentialService from "@/services/credentialService";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type BaseCredential = {
  id: number;
  name: string;
  description?: string;
  type: string;
  publicUrl?: string;
};

type SelectedCredential = {
  baseCredential: number;
  issuedAt?: string;
  expiredAt?: string;
};

type Props = {
  selectedCredentials: SelectedCredential[];
  onCredentialsChange: (credentials: SelectedCredential[]) => void;
  fieldErrors: Record<string, string>;
  onClearError: (field: string) => void;
};

export const CredentialSelector = ({
  selectedCredentials,
  onCredentialsChange,
  fieldErrors,
  onClearError,
}: Props) => {
  const [baseCredentials, setBaseCredentials] = useState<BaseCredential[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedForEdit, setSelectedForEdit] = useState<SelectedCredential | null>(null);
  const [issuedAtDate, setIssuedAtDate] = useState<Date | null>(null);
  const [expiredAtDate, setExpiredAtDate] = useState<Date | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showIssuedCalendar, setShowIssuedCalendar] = useState(false);
  const [showExpiredCalendar, setShowExpiredCalendar] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const loadBaseCredentials = useCallback(async () => {
    setLoading(true);
    try {
      const data = await credentialService.getBaseCredentials();
      setBaseCredentials(data);
    } catch (error) {
      console.error("Failed to load base credentials:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBaseCredentials();
  }, [loadBaseCredentials]);

  const handleEditCredential = (index: number) => {
    const cred = selectedCredentials[index];
    setSelectedForEdit(cred);
    setIssuedAtDate(cred.issuedAt ? new Date(cred.issuedAt) : null);
    setExpiredAtDate(cred.expiredAt ? new Date(cred.expiredAt) : null);
    setEditingIndex(index);
    setModalVisible(true);
  };

  const handleSaveCredential = () => {
    if (!selectedForEdit) return;

    const updated = [...selectedCredentials];
    const issuedAtStr = issuedAtDate ? formatDateToString(issuedAtDate) : undefined;
    const expiredAtStr = expiredAtDate ? formatDateToString(expiredAtDate) : undefined;

    if (editingIndex !== null) {
      // Edit existing
      updated[editingIndex] = {
        baseCredential: selectedForEdit.baseCredential,
        issuedAt: issuedAtStr,
        expiredAt: expiredAtStr,
      };
    } else {
      // Add new
      updated.push({
        baseCredential: selectedForEdit.baseCredential,
        issuedAt: issuedAtStr,
        expiredAt: expiredAtStr,
      });
    }
    onCredentialsChange(updated);
    setModalVisible(false);
    setSelectedForEdit(null);
    setIssuedAtDate(null);
    setExpiredAtDate(null);
  };

  const handleRemoveCredential = (index: number) => {
    onCredentialsChange(
      selectedCredentials.filter((_, i) => i !== index)
    );
  };

  const getCredentialName = (baseCredentialId: number): string => {
    const found = baseCredentials.find((c) => c.id === baseCredentialId);
    return found?.name || "Unknown";
  };

  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <View style={styles.container}>
      <View style={formStyles.fieldContainer}>
        <Text style={formStyles.label}>Chứng chỉ (Tùy chọn)</Text>
        
        {/* Selected Credentials List */}
        {selectedCredentials.length > 0 && (
          <View style={styles.selectedList}>
            {selectedCredentials.map((cred, index) => (
              <View key={index} style={styles.credentialItem}>
                <View style={styles.credentialInfo}>
                  <Text style={styles.credentialName}>
                    {getCredentialName(cred.baseCredential)}
                  </Text>
                  {cred.issuedAt && (
                    <Text style={styles.credentialDate}>
                      Cấp: {cred.issuedAt}
                    </Text>
                  )}
                  {cred.expiredAt && (
                    <Text style={styles.credentialDate}>
                      Hết hạn: {cred.expiredAt}
                    </Text>
                  )}
                </View>
                <View style={styles.credentialActions}>
                  <Pressable
                    onPress={() => handleEditCredential(index)}
                    style={styles.editButton}
                  >
                    <Ionicons name="pencil" size={16} color="#059669" />
                  </Pressable>
                  <Pressable
                    onPress={() => handleRemoveCredential(index)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash" size={16} color="#DC2626" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Add Credential Button */}
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.addButton}
        >
          <Ionicons name="add-circle" size={20} color="#059669" />
          <Text style={styles.addButtonText}>Thêm chứng chỉ</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for selecting credential */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingIndex !== null ? "Chỉnh sửa chứng chỉ" : "Chọn chứng chỉ"}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Base credentials list (only show if adding new) */}
            {editingIndex === null && (
              <View>
                <Text style={styles.sectionTitle}>Chứng chỉ sẵn có</Text>
                {loading ? (
                  <ActivityIndicator
                    size="large"
                    color="#059669"
                    style={styles.loader}
                  />
                ) : baseCredentials.length === 0 ? (
                  <Text style={styles.emptyText}>Không có chứng chỉ nào</Text>
                ) : (
                  <FlatList
                    data={baseCredentials.filter(
                      (c) =>
                        !selectedCredentials.some(
                          (sc) => sc.baseCredential === c.id
                        )
                    )}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedForEdit({
                            baseCredential: item.id,
                            issuedAt: undefined,
                            expiredAt: undefined,
                          });
                          setIssuedAtDate(null);
                          setExpiredAtDate(null);
                          // Auto-scroll to show the details form
                          setTimeout(() => {
                            scrollViewRef.current?.scrollToEnd({ animated: true });
                          }, 100);
                        }}
                        style={[
                          styles.credentialSelectItem,
                          selectedForEdit?.baseCredential === item.id &&
                            styles.credentialSelectItemSelected,
                        ]}
                      >
                        {item.publicUrl && (
                          <Image
                            source={{ uri: item.publicUrl }}
                            style={styles.credentialImage}
                            resizeMode="cover"
                          />
                        )}
                        <View style={styles.credentialTextContainer}>
                          <Text
                            style={[
                              styles.credentialSelectName,
                              selectedForEdit?.baseCredential === item.id &&
                                styles.credentialSelectNameSelected,
                            ]}
                          >
                            {item.name}
                          </Text>
                          {item.description && (
                            <Text style={styles.credentialSelectDesc}>
                              {item.description}
                            </Text>
                          )}
                        </View>
                        <Ionicons
                          name={
                            selectedForEdit?.baseCredential === item.id
                              ? "checkmark-circle"
                              : "chevron-forward"
                          }
                          size={20}
                          color={
                            selectedForEdit?.baseCredential === item.id
                              ? "#059669"
                              : "#9CA3AF"
                          }
                        />
                      </TouchableOpacity>
                    )}
                    scrollEnabled={false}
                  />
                )}
              </View>
            )}

            {/* Dates form (show when credential is selected or editing) */}
            {selectedForEdit && (
              <View>
                <Text style={styles.sectionTitle}>
                  {editingIndex !== null
                    ? "Chỉnh sửa thông tin"
                    : getCredentialName(selectedForEdit.baseCredential)}
                </Text>

                {/* Issued At */}
                <View style={formStyles.fieldContainer}>
                  <Text style={formStyles.label}>Ngày cấp</Text>
                  <Pressable
                    onPress={() => setShowIssuedCalendar(true)}
                    style={[formStyles.inputWrapper, styles.dateButton]}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#6B7280"
                    />
                    <Text
                      style={[
                        styles.dateButtonText,
                        !issuedAtDate && styles.dateButtonPlaceholder,
                      ]}
                    >
                      {issuedAtDate
                        ? formatDateToString(issuedAtDate)
                        : "Chọn ngày"}
                    </Text>
                  </Pressable>
                  {issuedAtDate && (
                    <TouchableOpacity
                      onPress={() => setIssuedAtDate(null)}
                      style={styles.clearDateButton}
                    >
                      <Text style={styles.clearDateText}>Xóa ngày</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Expired At */}
                <View style={formStyles.fieldContainer}>
                  <Text style={formStyles.label}>Ngày hết hạn</Text>
                  <Pressable
                    onPress={() => setShowExpiredCalendar(true)}
                    style={[formStyles.inputWrapper, styles.dateButton]}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#6B7280"
                    />
                    <Text
                      style={[
                        styles.dateButtonText,
                        !expiredAtDate && styles.dateButtonPlaceholder,
                      ]}
                    >
                      {expiredAtDate
                        ? formatDateToString(expiredAtDate)
                        : "Chọn ngày"}
                    </Text>
                  </Pressable>
                  {expiredAtDate && (
                    <TouchableOpacity
                      onPress={() => setExpiredAtDate(null)}
                      style={styles.clearDateButton}
                    >
                      <Text style={styles.clearDateText}>Xóa ngày</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Buttons */}
                <View style={styles.modalButtonRow}>
                  {editingIndex === null && (
                    <TouchableOpacity
                      onPress={() => setSelectedForEdit(null)}
                      style={styles.backButton}
                    >
                      <Ionicons name="arrow-back" size={18} color="#374151" />
                      <Text style={styles.backButtonText}>Quay lại</Text>
                    </TouchableOpacity>
                  )}
                  <Pressable
                    onPress={handleSaveCredential}
                    style={[
                      styles.saveButton,
                      editingIndex === null && styles.fullButton,
                    ]}
                  >
                    <Text style={styles.saveButtonText}>
                      {editingIndex !== null ? "Cập nhật" : "Thêm"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Issued At Calendar Picker Modal */}
      {Platform.OS === "ios" ? (
        <Modal
          visible={showIssuedCalendar}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowIssuedCalendar(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowIssuedCalendar(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Chọn ngày cấp</Text>
              <View style={{ width: 36 }} />
            </View>
            <View style={styles.calendarContainer}>
              <DateTimePicker
                value={issuedAtDate || new Date()}
                mode="date"
                display="spinner"
                onChange={(event: any, date: any) => {
                  if (date) {
                    setIssuedAtDate(date);
                  }
                }}
                style={styles.datePickerStyle}
                textColor="#111827"
              />
              <View style={styles.datePickerActions}>
                <TouchableOpacity
                  onPress={() => setShowIssuedCalendar(false)}
                >
                  <Text style={styles.datePickerActionText}>Xong</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : (
        showIssuedCalendar && (
          <DateTimePicker
            value={issuedAtDate || new Date()}
            mode="date"
            display="default"
            onChange={(event: any, date: any) => {
              setShowIssuedCalendar(false);
              if (event.type === "set" && date) {
                setIssuedAtDate(date);
              }
            }}
          />
        )
      )}

      {/* Expired At Calendar Picker Modal */}
      {Platform.OS === "ios" ? (
        <Modal
          visible={showExpiredCalendar}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowExpiredCalendar(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowExpiredCalendar(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Chọn ngày hết hạn</Text>
              <View style={{ width: 36 }} />
            </View>
            <View style={styles.calendarContainer}>
              <DateTimePicker
                value={expiredAtDate || new Date()}
                mode="date"
                display="spinner"
                onChange={(event: any, date: any) => {
                  if (date) {
                    setExpiredAtDate(date);
                  }
                }}
                style={styles.datePickerStyle}
                textColor="#111827"
              />
              <View style={styles.datePickerActions}>
                <TouchableOpacity
                  onPress={() => setShowExpiredCalendar(false)}
                >
                  <Text style={styles.datePickerActionText}>Xong</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : (
        showExpiredCalendar && (
          <DateTimePicker
            value={expiredAtDate || new Date()}
            mode="date"
            display="default"
            onChange={(event: any, date: any) => {
              setShowExpiredCalendar(false);
              if (event.type === "set" && date) {
                setExpiredAtDate(date);
              }
            }}
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  selectedList: {
    gap: 8,
    marginBottom: 8,
  },
  credentialItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBEBDA",
  },
  credentialInfo: {
    flex: 1,
    gap: 2,
  },
  credentialName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
  },
  credentialDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  credentialActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#059669",
    backgroundColor: "#F0FDF4",
    gap: 8,
  },
  addButtonText: {
    color: "#059669",
    fontWeight: "600",
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  modalContent: {
    padding: 16,
    gap: 16,
  },
  calendarContainer: {
    minHeight: 400,
    padding: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  credentialSelectItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  credentialImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  credentialTextContainer: {
    flex: 1,
  },
  credentialSelectItemSelected: {
    backgroundColor: "#ECFDF5",
    borderBottomColor: "#059669",
  },
  credentialSelectName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  credentialSelectNameSelected: {
    color: "#059669",
  },
  credentialSelectDesc: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  loader: {
    marginVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    paddingVertical: 20,
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    gap: 4,
  },
  backButtonText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 14,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
  },
  fullButton: {
    flex: 1,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  dateButton: {
    justifyContent: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  dateButtonText: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
    marginLeft: 8,
  },
  dateButtonPlaceholder: {
    color: "#9CA3AF",
  },
  clearDateButton: {
    marginTop: 4,
    paddingVertical: 4,
  },
  clearDateText: {
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "500",
  },
  datePickerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  datePickerActionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#059669",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  datePickerStyle: {
    width: "100%",
    backgroundColor: "#FFFFFF",
  },
});
