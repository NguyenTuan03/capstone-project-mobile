import { CredentialSelector } from "@/components/auth/CredentialSelector";
import { formStyles } from "@/components/common/formStyles";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

const SPECIALTIES_LIST = [
  "Kỹ thuật cơ bản",
  "Kỹ thuật nâng cao",
  "Đánh đơn",
  "Đánh đôi",
  "Thể lực & Di chuyển",
  "Tâm lý thi đấu",
  "Sửa lỗi kỹ thuật",
  "Pickleball cho trẻ em",
];

const TEACHING_METHODS_LIST = [
  "Thực hành trên sân",
  "Phân tích video",
  "Bài tập tình huống",
  "Thi đấu tập",
  "Lý thuyết & Chiến thuật",
  "Cá nhân hóa",
  "Nhóm nhỏ",
];

type SelectedCredential = {
  baseCredential: number;
  issuedAt?: string;
  expiredAt?: string;
  imageUri?: string;
};

type Props = {
  bio: string;
  yearsOfExperience: string;
  specialties: string;
  teachingMethods: string;
  credentials: SelectedCredential[];
  fieldErrors: Record<string, string>;
  submitting: boolean;
  onBioChange: (value: string) => void;
  onYearsChange: (value: string) => void;
  onSpecialtiesChange: (value: string) => void;
  onTeachingMethodsChange: (value: string) => void;
  onCredentialsChange: (value: SelectedCredential[]) => void;
  onClearError: (field: string) => void;
  onBack: () => void;
  onSubmit: () => void;
};

export const RegistrationStep2Coach = ({
  bio,
  yearsOfExperience,
  specialties,
  teachingMethods,
  credentials,
  fieldErrors,
  submitting,
  onBioChange,
  onYearsChange,
  onSpecialtiesChange,
  onTeachingMethodsChange,
  onCredentialsChange,
  onClearError,
  onBack,
  onSubmit,
}: Props) => {
  const toggleSelection = (
    currentValue: string,
    item: string,
    onChange: (val: string) => void
  ) => {
    const items = currentValue
      ? currentValue.split(",").map((i) => i.trim())
      : [];

    if (items.includes(item)) {
      const newItems = items.filter((i) => i !== item);
      onChange(newItems.join(", "));
    } else {
      const newItems = [...items, item];
      onChange(newItems.join(", "));
    }
  };

  const renderChips = (
    list: string[],
    currentValue: string,
    onChange: (val: string) => void
  ) => {
    const currentItems = currentValue
      ? currentValue.split(",").map((i) => i.trim())
      : [];

    return (
      <View style={styles.chipContainer}>
        {list.map((item) => {
          const isSelected = currentItems.includes(item);
          return (
            <TouchableOpacity
              key={item}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => toggleSelection(currentValue, item, onChange)}
            >
              <Text
                style={[styles.chipText, isSelected && styles.chipTextSelected]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <>
      {/* Bio */}
      <View style={formStyles.fieldContainer}>
        <Text style={formStyles.label}>Giới thiệu bản thân</Text>
        <View
          style={[
            formStyles.inputWrapper,
            fieldErrors.coachBio && formStyles.inputError,
            styles.textAreaWrapper,
          ]}
        >
          <Ionicons
            name="document-text-outline"
            size={18}
            color="#6B7280"
            style={styles.textAreaIcon}
          />
          <TextInput
            style={[formStyles.input, formStyles.textArea]}
            placeholder="Tôi có X năm kinh nghiệm trong..."
            value={bio}
            onChangeText={(text) => {
              onBioChange(text);
              if (fieldErrors.coachBio) {
                onClearError("coachBio");
              }
            }}
            multiline
            numberOfLines={4}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        {fieldErrors.coachBio ? (
          <Text style={formStyles.errorFieldText}>{fieldErrors.coachBio}</Text>
        ) : null}
      </View>

      {/* Years of Experience */}
      <View style={formStyles.fieldContainer}>
        <Text style={formStyles.label}>Số năm kinh nghiệm</Text>
        <View
          style={[
            formStyles.inputWrapper,
            fieldErrors.yearsOfExperience && formStyles.inputError,
          ]}
        >
          <Ionicons name="calendar-outline" size={18} color="#6B7280" />
          <TextInput
            style={formStyles.input}
            placeholder="5"
            value={yearsOfExperience}
            onChangeText={(text) => {
              onYearsChange(text);
              if (fieldErrors.yearsOfExperience) {
                onClearError("yearsOfExperience");
              }
            }}
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        {fieldErrors.yearsOfExperience ? (
          <Text style={formStyles.errorFieldText}>
            {fieldErrors.yearsOfExperience}
          </Text>
        ) : null}
      </View>

      {/* Specialties */}
      <View style={formStyles.fieldContainer}>
        <Text style={formStyles.label}>
          Chuyên môn (chọn hoặc nhập thêm)
        </Text>
        {renderChips(SPECIALTIES_LIST, specialties, (val) => {
          onSpecialtiesChange(val);
          if (fieldErrors.specialties) {
            onClearError("specialties");
          }
        })}
        <View
          style={[
            formStyles.inputWrapper,
            fieldErrors.specialties && formStyles.inputError,
          ]}
        >
          <Ionicons name="trophy-outline" size={18} color="#6B7280" />
          <TextInput
            style={formStyles.input}
            placeholder="Nhập thêm chuyên môn khác..."
            value={specialties}
            onChangeText={(text) => {
              onSpecialtiesChange(text);
              if (fieldErrors.specialties) {
                onClearError("specialties");
              }
            }}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        {fieldErrors.specialties ? (
          <Text style={formStyles.errorFieldText}>
            {fieldErrors.specialties}
          </Text>
        ) : null}
      </View>

      {/* Teaching Methods */}
      <View style={formStyles.fieldContainer}>
        <Text style={formStyles.label}>
          Phương pháp giảng dạy (chọn hoặc nhập thêm)
        </Text>
        {renderChips(TEACHING_METHODS_LIST, teachingMethods, (val) => {
          onTeachingMethodsChange(val);
          if (fieldErrors.teachingMethods) {
            onClearError("teachingMethods");
          }
        })}
        <View
          style={[
            formStyles.inputWrapper,
            fieldErrors.teachingMethods && formStyles.inputError,
          ]}
        >
          <Ionicons name="book-outline" size={18} color="#6B7280" />
          <TextInput
            style={formStyles.input}
            placeholder="Nhập thêm phương pháp khác..."
            value={teachingMethods}
            onChangeText={(text) => {
              onTeachingMethodsChange(text);
              if (fieldErrors.teachingMethods) {
                onClearError("teachingMethods");
              }
            }}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        {fieldErrors.teachingMethods ? (
          <Text style={formStyles.errorFieldText}>
            {fieldErrors.teachingMethods}
          </Text>
        ) : null}
      </View>

      {/* Credentials Selector */}
      <CredentialSelector
        selectedCredentials={credentials}
        onCredentialsChange={onCredentialsChange}
        fieldErrors={fieldErrors}
        onClearError={onClearError}
      />

      {/* Buttons */}
      <View style={formStyles.buttonRow}>
        <TouchableOpacity onPress={onBack} style={formStyles.backButton}>
          <Ionicons name="arrow-back" size={18} color="#374151" />
          <Text style={formStyles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>

        <Pressable disabled={submitting} onPress={onSubmit} style={styles.submitButtonWrapper}>
          <LinearGradient
            colors={
              submitting ? ["#9CA3AF", "#9CA3AF"] : ["#059669", "#047857"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={formStyles.submitButton}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={formStyles.submitButtonText}>Hoàn thành</Text>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  textAreaWrapper: {
    alignItems: "flex-start",
  },
  textAreaIcon: {
    marginTop: 12,
  },
  submitButtonWrapper: {
    flex: 1,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipSelected: {
    backgroundColor: "#ECFDF5",
    borderColor: "#059669",
  },
  chipText: {
    fontSize: 13,
    color: "#4B5563",
  },
  chipTextSelected: {
    color: "#059669",
    fontWeight: "600",
  },
  optionalText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "400",
  },
  imageHelperText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 12,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
  },
  removeImageButton: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  addImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#059669",
    borderStyle: "dashed",
    backgroundColor: "#ECFDF5",
  },
  addImageText: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
  },
});
