import { DAYS_OF_WEEK, DAYS_OF_WEEK_VI } from "@/components/common/AppEnum";
import { get } from "@/services/http/httpService";
import { LearningFormat, Schedule } from "@/types/course";
import { Subject } from "@/types/subject";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Province = {
  id: number;
  name: string;
};

type District = {
  id: number;
  name: string;
};

type CourseFormData = {
  subjectId: number | null;
  learningFormat: LearningFormat;
  minParticipants: string;
  maxParticipants: string;
  pricePerParticipant: string;
  startDate: string;
  address: string;
  province: Province | null;
  district: District | null;
  schedules: Schedule[];
};

type CreateEditCourseModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    subjectId: number;
    learningFormat: LearningFormat;
    minParticipants: number;
    maxParticipants: number;
    pricePerParticipant: number;
    startDate: string;
    address: string;
    province: number;
    district: number;
    schedules?: Schedule[];
  }) => Promise<void>;
  mode?: "create" | "edit";
  initialData?: Partial<CourseFormData>;
  subjectFilter?: string;
};

export default function CreateEditCourseModal({
  visible,
  onClose,
  onSubmit,
  mode = "create",
  initialData,
  subjectFilter = "status_eq_PUBLISHED",
}: CreateEditCourseModalProps) {
  const insets = useSafeAreaInsets();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(
    initialData?.subjectId || null
  );
  const [learningFormat, setLearningFormat] = useState<LearningFormat>(
    initialData?.learningFormat || "GROUP"
  );
  const [minParticipants, setMinParticipants] = useState(
    initialData?.minParticipants || ""
  );
  const [maxParticipants, setMaxParticipants] = useState(
    initialData?.maxParticipants || ""
  );
  const [pricePerParticipant, setPricePerParticipant] = useState(
    initialData?.pricePerParticipant || ""
  );
  const [startDate, setStartDate] = useState(initialData?.startDate || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    initialData?.province || null
  );
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    initialData?.district || null
  );
  const [schedules, setSchedules] = useState<Schedule[]>(
    initialData?.schedules || []
  );

  // UI states
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [editingScheduleIndex, setEditingScheduleIndex] = useState<
    number | null
  >(null);
  const [tempSchedule, setTempSchedule] = useState<Schedule>({
    dayOfWeek: "Monday",
    startTime: "09:00",
    endTime: "11:00",
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    if (visible) {
      fetchSubjects();
      fetchProvinces();
      if (initialData) {
        // Reset form with initial data
        setSelectedSubjectId(initialData.subjectId || null);
        setLearningFormat(initialData.learningFormat || "GROUP");
        setMinParticipants(initialData.minParticipants || "");
        setMaxParticipants(initialData.maxParticipants || "");
        setPricePerParticipant(initialData.pricePerParticipant || "");
        setStartDate(initialData.startDate || "");
        setAddress(initialData.address || "");
        setSelectedProvince(initialData.province || null);
        setSelectedDistrict(initialData.district || null);
        setSchedules(initialData.schedules || []);
      } else {
        // Reset form for create mode
        setSelectedSubjectId(null);
        setLearningFormat("GROUP");
        setMinParticipants("");
        setMaxParticipants("");
        setPricePerParticipant("");
        setStartDate("");
        setAddress("");
        setSelectedProvince(null);
        setSelectedDistrict(null);
        setSchedules([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initialData, subjectFilter]);

  useEffect(() => {
    if (selectedProvince) {
      fetchDistricts(selectedProvince.id);
    } else {
      setDistricts([]);
      setSelectedDistrict(null);
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (learningFormat === "INDIVIDUAL") {
      setMinParticipants("1");
      setMaxParticipants("1");
    }
  }, [learningFormat]);

  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const url = subjectFilter
        ? `/v1/subjects?filter=${subjectFilter}`
        : "/v1/subjects";
      const res = await get<{ items: Subject[] }>(url);
      setSubjects(res.data.items || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách môn học:", error);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchProvinces = async () => {
    try {
      setLoadingProvinces(true);
      const res = await get<Province[]>("/v1/provinces");
      setProvinces(res.data || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách tỉnh/thành phố:", error);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const fetchDistricts = async (provinceId: number) => {
    try {
      setLoadingDistricts(true);
      const res = await get<District[]>(
        `/v1/provinces/${provinceId}/districts`
      );
      setDistricts(res.data || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách quận/huyện:", error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const handleAddSchedule = () => {
    setTempSchedule({
      dayOfWeek: "Monday",
      startTime: "09:00",
      endTime: "11:00",
    });
    setEditingScheduleIndex(null);
    setShowScheduleModal(true);
  };

  const handleEditSchedule = (index: number) => {
    setTempSchedule(schedules[index]);
    setEditingScheduleIndex(index);
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = () => {
    if (!tempSchedule.startTime || !tempSchedule.endTime) {
      return;
    }

    const formatTime = (time: string) => {
      if (time.length === 5) return `${time}:00`;
      return time;
    };

    const newSchedule: Schedule = {
      dayOfWeek: tempSchedule.dayOfWeek,
      startTime: formatTime(tempSchedule.startTime),
      endTime: formatTime(tempSchedule.endTime),
    };

    if (editingScheduleIndex !== null) {
      const updated = [...schedules];
      updated[editingScheduleIndex] = newSchedule;
      setSchedules(updated);
    } else {
      setSchedules([...schedules, newSchedule]);
    }
    setShowScheduleModal(false);
  };

  const handleDeleteSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation với thông báo lỗi
    if (!selectedSubjectId) {
      console.error("Validation error: Chưa chọn môn học");
      return;
    }
    if (learningFormat === "GROUP") {
      if (!minParticipants || !maxParticipants) {
        console.error("Validation error: Chưa nhập số lượng học viên");
        return;
      }
      if (parseInt(minParticipants) > parseInt(maxParticipants)) {
        console.error("Validation error: Số học viên tối thiểu lớn hơn tối đa");
        return;
      }
    }
    if (!pricePerParticipant) {
      console.error("Validation error: Chưa nhập giá");
      return;
    }
    if (!startDate) {
      console.error("Validation error: Chưa chọn ngày bắt đầu");
      return;
    }
    if (!address) {
      console.error("Validation error: Chưa nhập địa chỉ");
      return;
    }
    if (!selectedProvince || !selectedDistrict) {
      console.error("Validation error: Chưa chọn tỉnh/thành phố và quận/huyện");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        subjectId: selectedSubjectId,
        learningFormat,
        minParticipants: parseInt(minParticipants),
        maxParticipants: parseInt(maxParticipants),
        pricePerParticipant: parseInt(pricePerParticipant.replace(/,/g, "")),
        startDate: new Date(startDate).toISOString(),
        address,
        province: selectedProvince.id,
        district: selectedDistrict.id,
        schedules: schedules.length > 0 ? schedules : undefined,
      };

      console.log("Payload gửi từ modal:", payload);

      await onSubmit(payload);
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
      // Không cần throw lại vì parent component đã xử lý error
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {mode === "edit" ? "Chỉnh sửa khóa học" : "Tạo Khóa Học"}
            </Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {/* Subject Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Môn học <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowSubjectModal(true)}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    !selectedSubject && styles.placeholderText,
                  ]}
                >
                  {selectedSubject ? selectedSubject.name : "Chọn môn học"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Learning Format */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Hình thức học <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setLearningFormat("GROUP")}
                >
                  <View style={styles.radio}>
                    {learningFormat === "GROUP" && (
                      <View style={styles.radioSelected} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>Nhóm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setLearningFormat("INDIVIDUAL")}
                >
                  <View style={styles.radio}>
                    {learningFormat === "INDIVIDUAL" && (
                      <View style={styles.radioSelected} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>Cá nhân</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Participants */}
            {learningFormat === "GROUP" && (
              <View style={styles.section}>
                <Text style={styles.label}>
                  Số lượng học viên <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.row}>
                  <View
                    style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}
                  >
                    <Text style={styles.inputLabel}>Tối thiểu</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="1"
                      value={minParticipants}
                      onChangeText={setMinParticipants}
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Tối đa</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="10"
                      value={maxParticipants}
                      onChangeText={setMaxParticipants}
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Price */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Giá mỗi học viên (VNĐ) <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.priceInputContainer}>
                <TouchableOpacity
                  style={styles.priceButton}
                  onPress={() => {
                    const currentValue =
                      parseInt(pricePerParticipant.replace(/,/g, "")) || 0;
                    const newValue = Math.max(0, currentValue - 10000);
                    setPricePerParticipant(newValue.toString());
                  }}
                >
                  <Ionicons name="remove" size={20} color="#059669" />
                </TouchableOpacity>
                <TextInput
                  style={styles.priceInput}
                  placeholder="1,500,000"
                  value={pricePerParticipant.replace(
                    /\B(?=(\d{3})+(?!\d))/g,
                    ","
                  )}
                  onChangeText={(text) => {
                    const numericValue = text.replace(/,/g, "");
                    setPricePerParticipant(numericValue);
                  }}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  style={styles.priceButton}
                  onPress={() => {
                    const currentValue =
                      parseInt(pricePerParticipant.replace(/,/g, "")) || 0;
                    const newValue = currentValue + 10000;
                    setPricePerParticipant(newValue.toString());
                  }}
                >
                  <Ionicons name="add" size={20} color="#059669" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Start Date */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Ngày bắt đầu <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => {
                  if (startDate) {
                    setSelectedDate(new Date(startDate));
                  } else {
                    setSelectedDate(new Date());
                  }
                  setShowDatePicker(true);
                }}
              >
                <Text
                  style={[
                    styles.dateInputText,
                    !startDate && styles.placeholderText,
                  ]}
                >
                  {startDate
                    ? new Date(startDate).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })
                    : "Chọn ngày bắt đầu"}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#059669" />
              </TouchableOpacity>
              {Platform.OS === "ios" && showDatePicker && (
                <Modal
                  visible={showDatePicker}
                  transparent
                  animationType="slide"
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <View style={styles.datePickerModal}>
                    <View style={styles.datePickerContainer}>
                      <View style={styles.datePickerHeader}>
                        <TouchableOpacity
                          onPress={() => setShowDatePicker(false)}
                          style={styles.datePickerCancelButton}
                        >
                          <Text style={styles.datePickerCancelText}>Hủy</Text>
                        </TouchableOpacity>
                        <Text style={styles.datePickerTitle}>Chọn ngày</Text>
                        <TouchableOpacity
                          onPress={() => {
                            const formattedDate = selectedDate
                              .toISOString()
                              .split("T")[0];
                            setStartDate(formattedDate);
                            setShowDatePicker(false);
                          }}
                          style={styles.datePickerConfirmButton}
                        >
                          <Text style={styles.datePickerConfirmText}>
                            Xác nhận
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display="spinner"
                        onChange={(event, date) => {
                          if (date) {
                            setSelectedDate(date);
                          }
                        }}
                        minimumDate={new Date()}
                      />
                    </View>
                  </View>
                </Modal>
              )}
              {Platform.OS === "android" && showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) {
                      setSelectedDate(date);
                      const formattedDate = date.toISOString().split("T")[0];
                      setStartDate(formattedDate);
                    }
                  }}
                  minimumDate={new Date()}
                />
              )}
            </View>

            {/* Address */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Địa chỉ <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="123 Main St, City, Country"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Province & District */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Tỉnh/Thành phố & Quận/Huyện{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Tỉnh/Thành phố</Text>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setShowProvinceModal(true)}
                    disabled={loadingProvinces}
                  >
                    <Text
                      style={[
                        styles.selectButtonText,
                        !selectedProvince && styles.placeholderText,
                      ]}
                    >
                      {selectedProvince
                        ? selectedProvince.name
                        : loadingProvinces
                        ? "Đang tải..."
                        : "Chọn tỉnh/thành phố"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Quận/Huyện</Text>
                  <TouchableOpacity
                    style={[
                      styles.selectButton,
                      !selectedProvince && styles.selectButtonDisabled,
                    ]}
                    onPress={() => {
                      if (selectedProvince) {
                        setShowDistrictModal(true);
                      }
                    }}
                    disabled={!selectedProvince || loadingDistricts}
                  >
                    <Text
                      style={[
                        styles.selectButtonText,
                        !selectedDistrict && styles.placeholderText,
                      ]}
                    >
                      {loadingDistricts
                        ? "Đang tải..."
                        : selectedDistrict
                        ? selectedDistrict.name
                        : "Chọn quận/huyện"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Schedules */}
            <View style={styles.section}>
              <View style={styles.scheduleHeader}>
                <Text style={styles.label}>Lịch học (Tùy chọn)</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddSchedule}
                >
                  <Ionicons name="add" size={20} color="#059669" />
                  <Text style={styles.addButtonText}>Thêm lịch</Text>
                </TouchableOpacity>
              </View>

              {schedules.map((schedule, index) => {
                const dayIndex = DAYS_OF_WEEK.indexOf(schedule.dayOfWeek);
                const dayName =
                  dayIndex >= 0
                    ? DAYS_OF_WEEK_VI[dayIndex]
                    : schedule.dayOfWeek;
                return (
                  <View key={index} style={styles.scheduleItem}>
                    <View style={styles.scheduleInfo}>
                      <Text style={styles.scheduleText}>
                        {dayName}: {schedule.startTime} - {schedule.endTime}
                      </Text>
                    </View>
                    <View style={styles.scheduleActions}>
                      <TouchableOpacity
                        onPress={() => handleEditSchedule(index)}
                        style={styles.scheduleActionButton}
                      >
                        <Ionicons name="pencil" size={18} color="#059669" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteSchedule(index)}
                        style={styles.scheduleActionButton}
                      >
                        <Ionicons name="trash" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              {schedules.length === 0 && (
                <Text style={styles.hint}>Chưa có lịch học nào được thêm</Text>
              )}
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                submitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === "edit" ? "Cập nhật" : "Tạo"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Subject Selection Modal */}
          <Modal
            visible={showSubjectModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowSubjectModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chọn môn học</Text>
                  <TouchableOpacity
                    onPress={() => setShowSubjectModal(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#111827" />
                  </TouchableOpacity>
                </View>
                {loadingSubjects ? (
                  <ActivityIndicator size="large" color="#059669" />
                ) : (
                  <ScrollView>
                    {subjects.map((subject) => (
                      <TouchableOpacity
                        key={subject.id}
                        style={[
                          styles.modalItem,
                          selectedSubjectId === subject.id &&
                            styles.modalItemSelected,
                        ]}
                        onPress={() => {
                          setSelectedSubjectId(subject.id);
                          setShowSubjectModal(false);
                        }}
                      >
                        <Text style={styles.modalItemText}>{subject.name}</Text>
                        {selectedSubjectId === subject.id && (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color="#059669"
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>

          {/* Schedule Modal */}
          <Modal
            visible={showScheduleModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowScheduleModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {editingScheduleIndex !== null
                      ? "Chỉnh sửa lịch"
                      : "Thêm lịch học"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowScheduleModal(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#111827" />
                  </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                  <View style={styles.section}>
                    <Text style={styles.label}>Thứ trong tuần</Text>
                    <View style={styles.daySelector}>
                      {DAYS_OF_WEEK.map((day, index) => (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.dayButton,
                            tempSchedule.dayOfWeek === day &&
                              styles.dayButtonSelected,
                          ]}
                          onPress={() =>
                            setTempSchedule({
                              ...tempSchedule,
                              dayOfWeek: day,
                            })
                          }
                        >
                          <Text
                            style={[
                              styles.dayButtonText,
                              tempSchedule.dayOfWeek === day &&
                                styles.dayButtonTextSelected,
                            ]}
                          >
                            {DAYS_OF_WEEK_VI[index]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.label}>Giờ bắt đầu</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="09:00"
                      value={tempSchedule.startTime}
                      onChangeText={(text) =>
                        setTempSchedule({ ...tempSchedule, startTime: text })
                      }
                      placeholderTextColor="#9CA3AF"
                    />
                    <Text style={styles.hint}>
                      Định dạng: HH:mm (ví dụ: 09:00)
                    </Text>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.label}>Giờ kết thúc</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="11:00"
                      value={tempSchedule.endTime}
                      onChangeText={(text) =>
                        setTempSchedule({ ...tempSchedule, endTime: text })
                      }
                      placeholderTextColor="#9CA3AF"
                    />
                    <Text style={styles.hint}>
                      Định dạng: HH:mm (ví dụ: 11:00)
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.saveButton]}
                    onPress={handleSaveSchedule}
                  >
                    <Text style={styles.saveButtonText}>Lưu</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Province Selection Modal */}
          <Modal
            visible={showProvinceModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowProvinceModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chọn tỉnh/thành phố</Text>
                  <TouchableOpacity
                    onPress={() => setShowProvinceModal(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#111827" />
                  </TouchableOpacity>
                </View>
                {loadingProvinces ? (
                  <ActivityIndicator size="large" color="#059669" />
                ) : (
                  <ScrollView>
                    {provinces.map((province) => (
                      <TouchableOpacity
                        key={province.id}
                        style={[
                          styles.modalItem,
                          selectedProvince?.id === province.id &&
                            styles.modalItemSelected,
                        ]}
                        onPress={() => {
                          setSelectedProvince(province);
                          setShowProvinceModal(false);
                        }}
                      >
                        <Text style={styles.modalItemText}>
                          {province.name}
                        </Text>
                        {selectedProvince?.id === province.id && (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color="#059669"
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>

          {/* District Selection Modal */}
          <Modal
            visible={showDistrictModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowDistrictModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chọn quận/huyện</Text>
                  <TouchableOpacity
                    onPress={() => setShowDistrictModal(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#111827" />
                  </TouchableOpacity>
                </View>
                {loadingDistricts ? (
                  <ActivityIndicator size="large" color="#059669" />
                ) : (
                  <ScrollView>
                    {districts.map((district) => (
                      <TouchableOpacity
                        key={district.id}
                        style={[
                          styles.modalItem,
                          selectedDistrict?.id === district.id &&
                            styles.modalItemSelected,
                        ]}
                        onPress={() => {
                          setSelectedDistrict(district);
                          setShowDistrictModal(false);
                        }}
                      >
                        <Text style={styles.modalItemText}>
                          {district.name}
                        </Text>
                        {selectedDistrict?.id === district.id && (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color="#059669"
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>
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
    backgroundColor: "#F9FAFB",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  required: {
    color: "#EF4444",
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
  },
  selectButtonDisabled: {
    opacity: 0.5,
    backgroundColor: "#F3F4F6",
  },
  selectButtonText: {
    fontSize: 16,
    color: "#111827",
  },
  placeholderText: {
    color: "#9CA3AF",
  },
  radioGroup: {
    flexDirection: "row",
    gap: 16,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#059669",
  },
  radioLabel: {
    fontSize: 16,
    color: "#111827",
  },
  row: {
    flexDirection: "row",
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111827",
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priceButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#059669",
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  priceInput: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111827",
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
  },
  dateInputText: {
    fontSize: 16,
    color: "#111827",
    flex: 1,
  },
  datePickerModal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  datePickerContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  datePickerCancelButton: {
    padding: 8,
  },
  datePickerCancelText: {
    fontSize: 16,
    color: "#6B7280",
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  datePickerConfirmButton: {
    padding: 8,
  },
  datePickerConfirmText: {
    fontSize: 16,
    color: "#059669",
    fontWeight: "600",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  hint: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#059669",
  },
  addButtonText: {
    color: "#059669",
    fontSize: 14,
    fontWeight: "600",
  },
  scheduleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleText: {
    fontSize: 14,
    color: "#111827",
  },
  scheduleActions: {
    flexDirection: "row",
    gap: 8,
  },
  scheduleActionButton: {
    padding: 4,
  },
  footer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  submitButton: {
    backgroundColor: "#059669",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
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
  modalItemText: {
    fontSize: 16,
    color: "#111827",
  },
  daySelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  dayButtonSelected: {
    backgroundColor: "#D1FAE5",
    borderColor: "#059669",
  },
  dayButtonText: {
    fontSize: 14,
    color: "#6B7280",
  },
  dayButtonTextSelected: {
    color: "#059669",
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#059669",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    margin: 16,
    marginTop: 24,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
