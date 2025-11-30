import credentialService from "@/services/credentialService";
import storageService from "@/services/storageService";
import { Credential } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CredentialsScreen() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [datePickerType, setDatePickerType] = useState<
    "issuedAt" | "expiresAt"
  >("issuedAt");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "CERTIFICATE" as const,
    issuedAt: "",
    expiresAt: "",
  });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedCredential, setSelectedCredential] =
    useState<Credential | null>(null);
  const [isEditingModal, setIsEditingModal] = useState(false);

  const loadCredentials = async () => {
    try {
      const response = await credentialService.getCredentials();
      setCredentials(response);
    } catch (error) {
      console.error("Failed to load credentials:", error);
      setCredentials([]);
    }
  };

  // Load credentials from API
  useFocusEffect(
    useCallback(() => {
      loadCredentials();
    }, [])
  );

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      if (datePickerType === "issuedAt") {
        setFormData({ ...formData, issuedAt: formattedDate });
      } else {
        setFormData({ ...formData, expiresAt: formattedDate });
      }
    }
  };

  const handleAddCredential = async () => {
    // Validate required fields
    if (!formData.name || !formData.name.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên chứng chỉ");
      return;
    }

    if (!formData.type || !formData.type.trim()) {
      Alert.alert("Lỗi", "Vui lòng chọn loại chứng chỉ");
      return;
    }

    // Convert Vietnamese date format (DD/MM/YYYY) to ISO string
    const dateToISOString = (dateString: string): string | undefined => {
      if (!dateString) return undefined;
      // Format is DD/MM/YYYY from toLocaleDateString("vi-VN")
      const [day, month, year] = dateString.split("/");
      if (day && month && year) {
        // Create ISO format YYYY-MM-DD
        return `${year}-${month}-${day}`;
      }
      return undefined;
    };

    try {
      setIsSaving(true);

      const credentialData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        type: formData.type.trim(),
        issuedAt: dateToISOString(formData.issuedAt),
        expiresAt: dateToISOString(formData.expiresAt),
      };

      // Save to backend - pass the ImagePickerAsset directly (not in credentialData)
      const createdCredential = await credentialService.createCredential(
        credentialData,
        selectedImage || undefined
      );

      

      // Refetch credentials to show the new one
      const updatedCredentials = await credentialService.getCredentials();
      setCredentials(updatedCredentials);

      setShowAddForm(false);
      setSelectedImage(null);
      setFormData({
        name: "",
        description: "",
        type: "CERTIFICATE",
        issuedAt: "",
        expiresAt: "",
      });

      Alert.alert("Thành công", "Chứng chỉ đã được thêm thành công");
      await loadCredentials();
    } catch (error) {
      console.error("Failed to add credential:", error);
      Alert.alert(
        "Lỗi",
        error instanceof Error ? error.message : "Không thể thêm chứng chỉ"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCredential = async (credentialId: string | number) => {
    Alert.alert("Xác nhận xóa", "Bạn có chắc chắn muốn xóa chứng chỉ này?", [
      { text: "Hủy", onPress: () => {} },
      {
        text: "Xóa",
        onPress: async () => {
          try {
            // Use credential ID for deletion
            await credentialService.deleteCredential(String(credentialId));

            // Also update stored user data
            const user = await storageService.getUser();
            if (user?.coach?.[0]) {
              user.coach[0].credentials =
                user.coach[0].credentials?.filter(
                  (cred) => cred.id !== credentialId
                ) || [];
              await storageService.setUser(user);
            }

            Alert.alert("Thành công", "Chứng chỉ đã được xóa");
            await loadCredentials();
          } catch (error) {
            console.error("Failed to delete credential:", error);
            Alert.alert(
              "Lỗi",
              error instanceof Error ? error.message : "Không thể xóa chứng chỉ"
            );
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleUpdateCredential = async (credentialId: string | number) => {
    if (!selectedCredential) return;

    try {
      setIsSaving(true);

      const credentialData = {
        name: selectedCredential.name,
        description: selectedCredential.description,
        type: selectedCredential.type,
        issuedAt: selectedCredential.issuedAt,
        expiresAt: selectedCredential.expiresAt,
      };

      // Update with new image if selected
      await credentialService.updateCredential(
        String(credentialId),
        credentialData,
        selectedImage || undefined
      );

      await loadCredentials();

      setDetailModalVisible(false);
      setSelectedImage(null);
      setSelectedCredential(null);
      setIsEditingModal(false);

      Alert.alert("Thành công", "Chứng chỉ đã được cập nhật");
    } catch (error) {
      console.error("Failed to update credential:", error);
      Alert.alert(
        "Lỗi",
        error instanceof Error ? error.message : "Không thể cập nhật chứng chỉ"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getCredentialIcon = (type: string) => {
    switch (type) {
      case "CERTIFICATE":
        return "document";
      case "PRIZE":
        return "trophy";
      case "ACHIEVEMENT":
        return "star";
      default:
        return "document";
    }
  };

  const getCredentialTypeText = (type: string) => {
    switch (type) {
      case "CERTIFICATE":
        return "Chứng chỉ";
      case "PRIZE":
        return "Giải thưởng";
      case "ACHIEVEMENT":
        return "Thành tựu";
      default:
        return type;
    }
  };

  const getCredentialColor = (type: string) => {
    switch (type) {
      case "CERTIFICATE":
        return "#3B82F6";
      case "PRIZE":
        return "#F59E0B";
      case "ACHIEVEMENT":
        return "#059669";
      default:
        return "#6B7280";
    }
  };

  const renderCredentialCard = ({
    item,
    index,
  }: {
    item: Credential;
    index: number;
  }) => (
    <TouchableOpacity
      style={styles.credentialCard}
      onPress={() => {
        setSelectedCredential(item);
        setDetailModalVisible(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.typeIcon,
              { backgroundColor: getCredentialColor(item.type) + "20" },
            ]}
          >
            <Ionicons
              name={getCredentialIcon(item.type) as any}
              size={20}
              color={getCredentialColor(item.type)}
            />
          </View>
          <View style={styles.cardTitle}>
            <Text style={styles.credentialName}>{item.name}</Text>
            <Text style={styles.credentialType}>
              {getCredentialTypeText(item.type)}
            </Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.credentialDescription}>{item.description}</Text>
        )}

        {item.issuedAt && (
          <View style={styles.dateContainer}>
            <Ionicons name="calendar" size={14} color="#6B7280" />
            <Text style={styles.dateText}>
              Cấp ngày: {new Date(item.issuedAt).toLocaleDateString("vi-VN")}
            </Text>
          </View>
        )}

        {item.expiresAt && (
          <View style={styles.dateContainer}>
            <Ionicons name="calendar" size={14} color="#EF4444" />
            <Text style={[styles.dateText, { color: "#EF4444" }]}>
              Hết hạn: {new Date(item.expiresAt).toLocaleDateString("vi-VN")}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chứng chỉ & Giải thưởng</Text>
        <View style={{ width: 32 }} />
      </View>

      {credentials.length === 0 && !showAddForm ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.emptyState}>
            <Ionicons name="document" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Chưa có chứng chỉ</Text>
            <Text style={styles.emptySubtitle}>
              Thêm chứng chỉ, giải thưởng hoặc thành tựu của bạn để tăng độ tin
              cậy
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddForm(true)}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Thêm chứng chỉ đầu tiên</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={credentials}
          renderItem={renderCredentialCard}
          keyExtractor={(item, index) => `${item.name}-${index}`}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            !showAddForm ? (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddForm(true)}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Thêm chứng chỉ mới</Text>
              </TouchableOpacity>
            ) : null
          }
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Credential Form Modal */}
      {showAddForm && (
        <View style={styles.formOverlay}>
          <ScrollView
            style={styles.formContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Thêm chứng chỉ mới</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddForm(false);
                  setSelectedImage(null);
                  setFormData({
                    name: "",
                    description: "",
                    type: "CERTIFICATE",
                    issuedAt: "",
                    expiresAt: "",
                  });
                }}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Image Upload Section */}
            <Pressable
              style={[
                styles.imageUpload,
                selectedImage && styles.imageUploadActive,
              ]}
              onPress={pickImage}
            >
              {selectedImage ? (
                <View style={styles.imageUploadSelected}>
                  <Text style={styles.imageUploadSelectedText}>
                    <Ionicons name="camera" size={16} color="#059669" /> Hình
                    ảnh đã chọn
                  </Text>
                  <Text style={styles.imageUploadSelectedSubtext}>
                    Nhấn để thay đổi
                  </Text>
                </View>
              ) : (
                <View style={styles.imageUploadEmpty}>
                  <Ionicons name="cloud-upload" size={40} color="#059669" />
                  <Text style={styles.imageUploadText}>
                    Tải lên hình ảnh chứng chỉ
                  </Text>
                  <Text style={styles.imageUploadSubtext}>
                    JPG, PNG (Tối đa 5MB)
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Form Fields */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tên chứng chỉ *</Text>
              <View style={styles.textInputWrapper}>
                <Ionicons name="document" size={18} color="#6B7280" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ví dụ: Pickleball Chuyên nghiệp"
                  placeholderTextColor="#6B7280"
                  value={formData.name}
                  onChangeText={(text) => {
                    
                    setFormData({ ...formData, name: text });
                  }}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Loại chứng chỉ</Text>
              <View style={styles.typeSelector}>
                {["CERTIFICATE", "PRIZE", "ACHIEVEMENT"].map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      styles.typeOption,
                      formData.type === type && styles.typeOptionActive,
                    ]}
                    onPress={() =>
                      setFormData({ ...formData, type: type as any })
                    }
                  >
                    <Ionicons
                      name={getCredentialIcon(type) as any}
                      size={16}
                      color={
                        formData.type === type
                          ? "#FFFFFF"
                          : getCredentialColor(type)
                      }
                    />
                    <Text
                      style={[
                        styles.typeOptionText,
                        formData.type === type && styles.typeOptionTextActive,
                      ]}
                    >
                      {getCredentialTypeText(type)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Mô tả (Tùy chọn)</Text>
              <View
                style={[styles.textInputWrapper, styles.textInputLargeWrapper]}
              >
                <TextInput
                  style={[styles.textInput, styles.textInputLarge]}
                  placeholder="Thêm mô tả chi tiết về chứng chỉ"
                  placeholderTextColor="#6B7280"
                  value={formData.description}
                  onChangeText={(text) =>
                    setFormData({ ...formData, description: text })
                  }
                  multiline={true}
                  numberOfLines={4}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Ngày cấp (Tùy chọn)</Text>
              <TouchableOpacity
                style={styles.textInputWrapper}
                onPress={() => {
                  setDatePickerType("issuedAt");
                  setShowDatePicker(true);
                }}
              >
                <Ionicons name="calendar" size={18} color="#111827" />
                <Text
                  style={[
                    styles.textInput,
                    !formData.issuedAt && styles.inputPlaceholder,
                  ]}
                >
                  {formData.issuedAt || "Chọn ngày"}
                </Text>
              </TouchableOpacity>

              {showDatePicker && datePickerType === "issuedAt" && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  onChange={handleDateChange}
                  textColor="#111827"
                  accentColor="#059669"
                  themeVariant="light"
                />
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Ngày hết hạn (Tùy chọn)</Text>
              <TouchableOpacity
                style={styles.textInputWrapper}
                onPress={() => {
                  setDatePickerType("expiresAt");
                  setShowDatePicker(true);
                }}
              >
                <Ionicons name="calendar" size={18} color="#111827" />
                <Text
                  style={[
                    styles.textInput,
                    !formData.expiresAt && styles.inputPlaceholder,
                  ]}
                >
                  {formData.expiresAt || "Chọn ngày"}
                </Text>
              </TouchableOpacity>

              {showDatePicker && datePickerType === "expiresAt" && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  onChange={handleDateChange}
                  textColor="#111827"
                  accentColor="#059669"
                  themeVariant="light"
                />
              )}
            </View>

            {/* Form Actions */}
            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddForm(false);
                  setSelectedImage(null);
                  setFormData({
                    name: "",
                    description: "",
                    type: "CERTIFICATE",
                    issuedAt: "",
                    expiresAt: "",
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isSaving && styles.submitButtonDisabled,
                ]}
                onPress={handleAddCredential}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Thêm chứng chỉ</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Credential Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView
            style={styles.modalScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Modal Header with Close Button */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setDetailModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedCredential && (
              <>
                {/* Image Container */}
                {!isEditingModal && (
                  <View style={styles.modalImageContainer}>
                    {selectedCredential.publicUrl ? (
                      <Image
                        source={{ uri: selectedCredential.publicUrl }}
                        style={styles.modalImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.modalImagePlaceholder}>
                        <Ionicons
                          name={
                            getCredentialIcon(selectedCredential.type) as any
                          }
                          size={80}
                          color={getCredentialColor(selectedCredential.type)}
                        />
                      </View>
                    )}
                  </View>
                )}

                {/* Credential Details / Edit Form */}
                <View style={styles.modalContent}>
                  {!isEditingModal ? (
                    <>
                      {/* Display Mode */}
                      <View style={styles.modalTitleSection}>
                        <Text style={styles.modalTitle}>
                          {selectedCredential.name}
                        </Text>
                        <View
                          style={[
                            styles.modalBadge,
                            {
                              backgroundColor:
                                getCredentialColor(selectedCredential.type) +
                                "20",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.modalBadgeText,
                              {
                                color: getCredentialColor(
                                  selectedCredential.type
                                ),
                              },
                            ]}
                          >
                            {getCredentialTypeText(selectedCredential.type)}
                          </Text>
                        </View>
                      </View>

                      {/* Description */}
                      {selectedCredential.description && (
                        <View style={styles.modalSection}>
                          <Text style={styles.modalSectionTitle}>Mô tả</Text>
                          <Text style={styles.modalDescription}>
                            {selectedCredential.description}
                          </Text>
                        </View>
                      )}

                      {/* Dates */}
                      <View style={styles.modalDatesSection}>
                        {selectedCredential.issuedAt && (
                          <View style={styles.modalDateItem}>
                            <Ionicons
                              name="calendar"
                              size={18}
                              color="#059669"
                            />
                            <View style={styles.modalDateInfo}>
                              <Text style={styles.modalDateLabel}>
                                Ngày cấp
                              </Text>
                              <Text style={styles.modalDateValue}>
                                {new Date(
                                  selectedCredential.issuedAt
                                ).toLocaleDateString("vi-VN", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </Text>
                            </View>
                          </View>
                        )}

                        {selectedCredential.expiresAt && (
                          <View style={styles.modalDateItem}>
                            <Ionicons
                              name="calendar"
                              size={18}
                              color="#EF4444"
                            />
                            <View style={styles.modalDateInfo}>
                              <Text style={styles.modalDateLabel}>Hết hạn</Text>
                              <Text style={styles.modalDateValue}>
                                {new Date(
                                  selectedCredential.expiresAt
                                ).toLocaleDateString("vi-VN", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </>
                  ) : (
                    <>
                      {/* Edit Mode */}
                      <View style={styles.editFormSection}>
                        {/* Credential Name */}
                        <View style={styles.editFormGroup}>
                          <Text style={styles.editLabel}>Tên chứng chỉ</Text>
                          <View style={styles.editInputWrapper}>
                            <Ionicons
                              name="document"
                              size={18}
                              color="#6B7280"
                            />
                            <TextInput
                              style={styles.editInput}
                              placeholder="Tên chứng chỉ"
                              placeholderTextColor="#6B7280"
                              value={selectedCredential.name}
                              onChangeText={(text) =>
                                setSelectedCredential({
                                  ...selectedCredential,
                                  name: text,
                                })
                              }
                            />
                          </View>
                        </View>

                        {/* Type Selector */}
                        <View style={styles.editFormGroup}>
                          <Text style={styles.editLabel}>Loại chứng chỉ</Text>
                          <View style={styles.editTypeSelector}>
                            {["CERTIFICATE", "PRIZE", "ACHIEVEMENT"].map(
                              (type) => (
                                <Pressable
                                  key={type}
                                  style={[
                                    styles.editTypeOption,
                                    selectedCredential.type === type &&
                                      styles.editTypeOptionActive,
                                  ]}
                                  onPress={() =>
                                    setSelectedCredential({
                                      ...selectedCredential,
                                      type: type as any,
                                    })
                                  }
                                >
                                  <Ionicons
                                    name={getCredentialIcon(type) as any}
                                    size={16}
                                    color={
                                      selectedCredential.type === type
                                        ? "#FFFFFF"
                                        : getCredentialColor(type)
                                    }
                                  />
                                  <Text
                                    style={[
                                      styles.editTypeOptionText,
                                      selectedCredential.type === type &&
                                        styles.editTypeOptionTextActive,
                                    ]}
                                  >
                                    {getCredentialTypeText(type)}
                                  </Text>
                                </Pressable>
                              )
                            )}
                          </View>
                        </View>

                        {/* Description */}
                        <View style={styles.editFormGroup}>
                          <Text style={styles.editLabel}>Mô tả</Text>
                          <View
                            style={[
                              styles.editInputWrapper,
                              styles.editInputLargeWrapper,
                            ]}
                          >
                            <TextInput
                              style={[styles.editInput, styles.editInputLarge]}
                              placeholder="Mô tả chi tiết về chứng chỉ"
                              placeholderTextColor="#6B7280"
                              value={selectedCredential.description || ""}
                              onChangeText={(text) =>
                                setSelectedCredential({
                                  ...selectedCredential,
                                  description: text,
                                })
                              }
                              multiline={true}
                              numberOfLines={4}
                            />
                          </View>
                        </View>

                        {/* Issued Date */}
                        <View style={styles.editFormGroup}>
                          <Text style={styles.editLabel}>Ngày cấp</Text>
                          <TouchableOpacity
                            style={styles.editInputWrapper}
                            onPress={() => {
                              setDatePickerType("issuedAt");
                              setShowDatePicker(true);
                            }}
                          >
                            <Ionicons
                              name="calendar"
                              size={18}
                              color="#111827"
                            />
                            <Text
                              style={[
                                styles.editInput,
                                !selectedCredential.issuedAt &&
                                  styles.inputPlaceholder,
                              ]}
                            >
                              {selectedCredential.issuedAt
                                ? new Date(
                                    selectedCredential.issuedAt
                                  ).toLocaleDateString("vi-VN")
                                : "Chọn ngày"}
                            </Text>
                          </TouchableOpacity>
                          {showDatePicker && datePickerType === "issuedAt" && (
                            <DateTimePicker
                              value={
                                selectedCredential.issuedAt
                                  ? new Date(selectedCredential.issuedAt)
                                  : selectedDate
                              }
                              mode="date"
                              display={
                                Platform.OS === "ios" ? "inline" : "default"
                              }
                              onChange={(event, date) => {
                                if (Platform.OS === "android") {
                                  setShowDatePicker(false);
                                }
                                if (date) {
                                  // Keep issuedAt as a Date object to match the Credential type
                                  setSelectedCredential({
                                    ...selectedCredential,
                                    issuedAt: date,
                                  });
                                }
                              }}
                              textColor="#111827"
                              accentColor="#059669"
                              themeVariant="light"
                            />
                          )}
                        </View>

                        {/* Expiry Date */}
                        <View style={styles.editFormGroup}>
                          <Text style={styles.editLabel}>Ngày hết hạn</Text>
                          <TouchableOpacity
                            style={styles.editInputWrapper}
                            onPress={() => {
                              setDatePickerType("expiresAt");
                              setShowDatePicker(true);
                            }}
                          >
                            <Ionicons
                              name="calendar"
                              size={18}
                              color="#111827"
                            />
                            <Text
                              style={[
                                styles.editInput,
                                !selectedCredential.expiresAt &&
                                  styles.inputPlaceholder,
                              ]}
                            >
                              {selectedCredential.expiresAt
                                ? new Date(
                                    selectedCredential.expiresAt
                                  ).toLocaleDateString("vi-VN")
                                : "Chọn ngày"}
                            </Text>
                          </TouchableOpacity>
                          {showDatePicker && datePickerType === "expiresAt" && (
                            <DateTimePicker
                              value={
                                selectedCredential.expiresAt
                                  ? new Date(selectedCredential.expiresAt)
                                  : selectedDate
                              }
                              mode="date"
                              display={
                                Platform.OS === "ios" ? "inline" : "default"
                              }
                              onChange={(event, date) => {
                                if (Platform.OS === "android") {
                                  setShowDatePicker(false);
                                }
                                if (date) {
                                  // Keep expiresAt as a Date object to match the Credential type
                                  setSelectedCredential({
                                    ...selectedCredential,
                                    expiresAt: date,
                                  });
                                }
                              }}
                              textColor="#111827"
                              accentColor="#059669"
                              themeVariant="light"
                            />
                          )}
                        </View>

                        {/* Image Upload */}
                        <View style={styles.editFormGroup}>
                          <Text style={styles.editLabel}>Hình ảnh</Text>
                          <Pressable
                            style={[
                              styles.imageUpload,
                              selectedImage && styles.imageUploadActive,
                            ]}
                            onPress={pickImage}
                          >
                            {selectedImage ? (
                              <View style={styles.imageUploadSelected}>
                                <Text style={styles.imageUploadSelectedText}>
                                  <Ionicons
                                    name="camera"
                                    size={16}
                                    color="#059669"
                                  />{" "}
                                  Hình ảnh đã chọn
                                </Text>
                                <Text style={styles.imageUploadSelectedSubtext}>
                                  Nhấn để thay đổi
                                </Text>
                              </View>
                            ) : (
                              <View style={styles.imageUploadEmpty}>
                                <Ionicons
                                  name="cloud-upload"
                                  size={40}
                                  color="#059669"
                                />
                                <Text style={styles.imageUploadText}>
                                  Tải lên hình ảnh mới
                                </Text>
                                <Text style={styles.imageUploadSubtext}>
                                  JPG, PNG (Tối đa 5MB)
                                </Text>
                              </View>
                            )}
                          </Pressable>
                        </View>
                      </View>
                    </>
                  )}

                  {/* Actions */}
                  <View style={styles.modalActionsContainer}>
                    {!isEditingModal ? (
                      <>
                        <TouchableOpacity
                          style={styles.modalEditButton}
                          onPress={() => setIsEditingModal(true)}
                        >
                          <Ionicons name="pencil" size={18} color="#FFFFFF" />
                          <Text style={styles.modalEditButtonText}>
                            Chỉnh sửa
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.modalDeleteButton}
                          onPress={() => {
                            setDetailModalVisible(false);
                            handleDeleteCredential(
                              selectedCredential.id || selectedCredential.name
                            );
                          }}
                        >
                          <Ionicons name="trash" size={18} color="#FFFFFF" />
                          <Text style={styles.modalDeleteButtonText}>Xóa</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={styles.modalCancelButton}
                          onPress={() => {
                            setIsEditingModal(false);
                            setSelectedImage(null);
                            // Reload credential to discard changes
                            if (credentials.length > 0) {
                              const updatedCred = credentials.find(
                                (c) => c.id === selectedCredential.id
                              );
                              if (updatedCred) {
                                setSelectedCredential(updatedCred);
                              }
                            }
                          }}
                        >
                          <Text style={styles.modalCancelButtonText}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.modalSaveButton,
                            isSaving && styles.modalSaveButtonDisabled,
                          ]}
                          onPress={() =>
                            handleUpdateCredential(
                              selectedCredential.id || selectedCredential.name
                            )
                          }
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : (
                            <>
                              <Ionicons
                                name="checkmark"
                                size={18}
                                color="#FFFFFF"
                              />
                              <Text style={styles.modalSaveButtonText}>
                                Lưu
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    flex: 1,
    textAlign: "center",
    letterSpacing: 0.3,
  },

  /* Empty State */
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyState: {
    alignItems: "center",
    gap: 18,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "400",
  },

  /* List Content */
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    gap: 12,
  },

  /* Credential Card */
  credentialCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#059669",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardContent: {
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    flex: 1,
    gap: 4,
  },
  credentialName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 0.3,
  },
  credentialType: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  credentialDescription: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
    fontWeight: "400",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "400",
  },

  /* Add Button */
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#059669",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    shadowColor: "#059669",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 3,
    marginTop: 18,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  /* Form Overlay */
  formOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    maxHeight: "90%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 0.3,
  },

  /* Image Upload */
  imageUpload: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 40,
    paddingHorizontal: 20,
    marginBottom: 24,
    alignItems: "center",
    gap: 12,
  },
  imageUploadActive: {
    borderColor: "#059669",
    backgroundColor: "#F0FDF4",
  },
  imageUploadEmpty: {
    alignItems: "center",
    gap: 10,
  },
  imageUploadText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 0.3,
  },
  imageUploadSubtext: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "400",
  },
  imageUploadSelected: {
    alignItems: "center",
    gap: 4,
  },
  imageUploadSelectedText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
    letterSpacing: 0.2,
  },
  imageUploadSelectedSubtext: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "400",
  },

  /* Form Group */
  formGroup: {
    marginBottom: 20,
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  textInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: "#FFFFFF",
  },
  textInputLargeWrapper: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    paddingLeft: 12,
    alignItems: "flex-start",
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    paddingVertical: 0,
  },
  textInputLarge: {
    minHeight: 100,
    paddingTop: 11,
    paddingHorizontal: 0,
    textAlignVertical: "top",
  },
  inputPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: "#6B7280",
  },

  /* Type Selector */
  typeSelector: {
    flexDirection: "row",
    gap: 9,
  },
  typeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  typeOptionActive: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
  },
  typeOptionTextActive: {
    color: "#FFFFFF",
  },

  /* Form Actions */
  formActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.2,
  },
  submitButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#059669",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  /* Detail Modal */
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalScroll: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  modalImageContainer: {
    backgroundColor: "#F9FAFB",
    paddingVertical: 40,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 280,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalImage: {
    width: "100%",
    height: 260,
  },
  modalImagePlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 24,
  },
  modalTitleSection: {
    gap: 14,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 0.3,
  },
  modalBadge: {
    alignSelf: "flex-start",
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 8,
  },
  modalBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  modalSection: {
    gap: 10,
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  modalDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 22,
    fontWeight: "400",
  },
  modalDatesSection: {
    gap: 12,
  },
  modalDateItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13,
    paddingVertical: 12,
    paddingHorizontal: 13,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalDateInfo: {
    flex: 1,
    gap: 3,
  },
  modalDateLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  modalDateValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.2,
  },

  /* Edit Form Section */
  editFormSection: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 24,
    gap: 20,
  },
  editFormGroup: {
    gap: 10,
  },
  editLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  editInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: "#FFFFFF",
  },
  editInputLargeWrapper: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    paddingLeft: 12,
    alignItems: "flex-start",
  },
  editInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    paddingVertical: 0,
  },
  editInputLarge: {
    minHeight: 100,
    paddingTop: 11,
    paddingHorizontal: 0,
    textAlignVertical: "top",
  },
  editTypeSelector: {
    flexDirection: "row",
    gap: 9,
  },
  editTypeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  editTypeOptionActive: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  editTypeOptionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
  },
  editTypeOptionTextActive: {
    color: "#FFFFFF",
  },

  /* Modal Action Buttons */
  modalActionsContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    marginBottom: 32,
  },
  modalEditButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#059669",
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 20,
  },
  modalEditButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  modalDeleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#EF4444",
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 20,
  },
  modalDeleteButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.2,
  },
  modalSaveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#059669",
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  modalSaveButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.7,
  },
  modalSaveButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
});
