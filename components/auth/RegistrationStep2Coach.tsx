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
    View,
} from "react-native";

type Props = {
  bio: string;
  yearsOfExperience: string;
  specialties: string;
  teachingMethods: string;
  fieldErrors: Record<string, string>;
  submitting: boolean;
  onBioChange: (value: string) => void;
  onYearsChange: (value: string) => void;
  onSpecialtiesChange: (value: string) => void;
  onTeachingMethodsChange: (value: string) => void;
  onClearError: (field: string) => void;
  onBack: () => void;
  onSubmit: () => void;
};

export const RegistrationStep2Coach = ({
  bio,
  yearsOfExperience,
  specialties,
  teachingMethods,
  fieldErrors,
  submitting,
  onBioChange,
  onYearsChange,
  onSpecialtiesChange,
  onTeachingMethodsChange,
  onClearError,
  onBack,
  onSubmit,
}: Props) => {
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
          Chuyên môn (phân cách bằng dấu phẩy)
        </Text>
        <View
          style={[
            formStyles.inputWrapper,
            fieldErrors.specialties && formStyles.inputError,
          ]}
        >
          <Ionicons name="trophy-outline" size={18} color="#6B7280" />
          <TextInput
            style={formStyles.input}
            placeholder="Kỹ thuật cơ bản, Chiến thuật, Thể lực"
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
          Phương pháp giảng dạy (phân cách bằng dấu phẩy)
        </Text>
        <View
          style={[
            formStyles.inputWrapper,
            fieldErrors.teachingMethods && formStyles.inputError,
          ]}
        >
          <Ionicons name="book-outline" size={18} color="#6B7280" />
          <TextInput
            style={formStyles.input}
            placeholder="Thực hành, Lý thuyết, Video"
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
});
