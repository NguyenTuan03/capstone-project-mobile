import { StepIndicator } from "@/components/common/StepIndicator";
import { PickleballLevel } from "@/types/user";
import axios from "axios";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { RegistrationStep1 } from "../../components/auth/RegistrationStep1";
import { RegistrationStep2Coach } from "../../components/auth/RegistrationStep2Coach";
import { RegistrationStep2Learner } from "../../components/auth/RegistrationStep2Learner";

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

type Step = 1 | 2;

type SelectedCredential = {
  baseCredential: number;
  issuedAt?: string;
  expiredAt?: string;
  imageUri?: string;
};

const Register = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Basic Info
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"COACH" | "LEARNER">("LEARNER");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [province, setProvince] = useState<number | null>(null);
  const [district, setDistrict] = useState<number | null>(null);

  // Step 2: Coach Info
  const [coachBio, setCoachBio] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [teachingMethods, setTeachingMethods] = useState("");
  const [credentials, setCredentials] = useState<SelectedCredential[]>([]);

  // Step 2: Learner Info
  const [skillLevel, setSkillLevel] = useState<PickleballLevel>(
    PickleballLevel.BEGINNER
  );
  const [learningGoal, setLearningGoal] = useState<PickleballLevel>(
    PickleballLevel.INTERMEDIATE
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const phoneRegex = /^0[0-9]{8,9}$/;

  const validateStep1 = () => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = "Họ và tên không được để trống";
    }

    if (!phoneNumber.trim()) {
      errors.phoneNumber = "Số điện thoại không được để trống";
    } else if (!phoneRegex.test(phoneNumber.trim())) {
      errors.phoneNumber =
        "Số điện thoại không hợp lệ (phải bắt đầu bằng 0 và có 10 chữ số)";
    }

    if (!password) {
      errors.password = "Mật khẩu không được để trống";
    } else if (password.length < 8) {
      errors.password = "Mật khẩu tối thiểu 8 ký tự";
    } else if (
      !/(?=.*[a-z])/.test(password) ||
      !/(?=.*[A-Z])/.test(password) ||
      !/(?=.*\d)/.test(password) ||
      !/(?=.*[@$!%*?&#])/.test(password)
    ) {
      errors.password =
        "Mật khẩu phải có ít nhất 1 chữ thường, 1 chữ hoa, 1 số và 1 ký tự đặc biệt (@$!%*?&)";
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Mật khẩu không khớp";
    }

    if (!province) {
      errors.province = "Tỉnh/Thành phố không được để trống";
    }

    if (!district) {
      errors.district = "Quận/Huyện không được để trống";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors: Record<string, string> = {};

    if (role === "COACH") {
      if (!coachBio.trim()) {
        errors.coachBio = "Giới thiệu bản thân không được để trống";
      }
      if (!yearsOfExperience.trim()) {
        errors.yearsOfExperience = "Số năm kinh nghiệm không được để trống";
      } else if (
        isNaN(Number(yearsOfExperience)) ||
        Number(yearsOfExperience) < 0
      ) {
        errors.yearsOfExperience = "Số năm kinh nghiệm không hợp lệ";
      }
      if (!specialties.trim()) {
        errors.specialties = "Chuyên môn không được để trống";
      }
      if (!teachingMethods.trim()) {
        errors.teachingMethods = "Phương pháp giảng dạy không được để trống";
      }
    } else if (role === "LEARNER") {
      if (!skillLevel) {
        errors.skillLevel = "Trình độ hiện tại không được để trống";
      }
      if (!learningGoal) {
        errors.learningGoal = "Mục tiêu học tập không được để trống";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep1()) return;
    setCurrentStep(2);
    setError(null);
  };

  const handleBack = () => {
    setCurrentStep(1);
    setFieldErrors({});
    setError(null);
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;

    setError(null);
    setSubmitting(true);
    try {
      const formattedPhone = phoneNumber.startsWith("0")
        ? "+84" + phoneNumber.substring(1)
        : phoneNumber;

      if (role === "COACH") {
        // Check if any credentials have images
        const hasCredentialImages = credentials.some((cred) => cred.imageUri);

        if (hasCredentialImages) {
          // Use FormData for multipart upload
          const formData = new FormData();

          // Append text fields
          formData.append("fullName", fullName.trim());
          formData.append("phoneNumber", formattedPhone);
          formData.append("password", password);
          formData.append("province", province!.toString());
          formData.append("district", district!.toString());
          formData.append("bio", coachBio.trim());
          formData.append("yearOfExperience", yearsOfExperience);
          formData.append(
            "specialties",
            JSON.stringify(
              specialties
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s)
            )
          );
          formData.append(
            "teachingMethods",
            JSON.stringify(
              teachingMethods
                .split(",")
                .map((m) => m.trim())
                .filter((m) => m)
            )
          );

          // Append credentials and their images
          credentials.forEach((cred, index) => {
            // Append credential metadata
            formData.append(
              `credentials[${index}][baseCredential]`,
              cred.baseCredential.toString()
            );
            if (cred.issuedAt) {
              formData.append(`credentials[${index}][issuedAt]`, cred.issuedAt);
            }
            if (cred.expiredAt) {
              formData.append(
                `credentials[${index}][expiredAt]`,
                cred.expiredAt
              );
            }

            // Append credential image if exists
            if (cred.imageUri) {
              const filename =
                cred.imageUri.split("/").pop() || `credential_${index}.jpg`;
              const match = /\.(\w+)$/.exec(filename);
              const type = match ? `image/${match[1]}` : "image/jpeg";

              formData.append("credential_image", {
                uri: cred.imageUri,
                name: filename,
                type,
              } as any);
            }
          });

          await axios.post(`${API_URL}/v1/coaches/register`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
        } else {
          // No images, use regular JSON
          const coachData = {
            fullName: fullName.trim(),
            phoneNumber: formattedPhone,
            password: password,
            province: Number(province),
            district: Number(district),
            coach: {
              bio: coachBio.trim(),
              yearOfExperience: Number(yearsOfExperience),
              specialties: specialties
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s),
              teachingMethods: teachingMethods
                .split(",")
                .map((m) => m.trim())
                .filter((m) => m),
              credentials:
                credentials.length > 0
                  ? credentials.map((c) => ({
                      baseCredential: c.baseCredential,
                      issuedAt: c.issuedAt,
                      expiredAt: c.expiredAt,
                    }))
                  : undefined,
            },
          };

          await axios.post(`${API_URL}/v1/coaches/register`, coachData);
        }
      } else {
        const learnerPayload = {
          fullName: fullName.trim(),
          phoneNumber: formattedPhone,
          password: password,
          province: Number(province),
          district: Number(district),
          learner: {
            skillLevel: skillLevel,
            learningGoal: learningGoal,
          },
        };

        await axios.post(`${API_URL}/v1/auth/register`, learnerPayload);
      }

      // Show success toast message
      Toast.show({
        type: "success",
        text1: "Đăng ký thành công!",
        text2: "Vui lòng xác thực số điện thoại của bạn",
        position: "top",
        visibilityTime: 3000,
      });

      // Navigate to phone verification
      router.push({
        pathname: "/(auth)/verify-phone",
        params: { phoneNumber: formattedPhone },
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Đăng ký thất bại";
      setError(errorMessage);
      Toast.show({
        type: "error",
        text1: "Đăng ký thất bại",
        text2: errorMessage,
        position: "top",
        visibilityTime: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tạo Tài Khoản</Text>
          <Text style={styles.subtitle}>
            Bước {currentStep}/2:{" "}
            {currentStep === 1
              ? "Thông tin cơ bản"
              : role === "COACH"
              ? "Thông tin huấn luyện viên"
              : "Thông tin học viên"}
          </Text>
        </View>

        {/* Step Indicator */}
        <StepIndicator
          currentStep={currentStep}
          totalSteps={2}
          stepLabels={["Cơ bản", role === "COACH" ? "HLV" : "Học viên"]}
        />

        {/* Form Card */}
        <View style={styles.card}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Step 1 */}
          {currentStep === 1 && (
            <RegistrationStep1
              fullName={fullName}
              phoneNumber={phoneNumber}
              password={password}
              confirmPassword={confirmPassword}
              role={role}
              showPassword={showPassword}
              showConfirmPassword={showConfirmPassword}
              province={province}
              district={district}
              fieldErrors={fieldErrors}
              onFullNameChange={setFullName}
              onPhoneNumberChange={setPhoneNumber}
              onPasswordChange={setPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onRoleChange={setRole}
              onShowPasswordToggle={() => setShowPassword(!showPassword)}
              onShowConfirmPasswordToggle={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              onProvinceChange={setProvince}
              onDistrictChange={setDistrict}
              onClearError={clearFieldError}
              onNext={handleNext}
            />
          )}

          {/* Step 2: Coach */}
          {currentStep === 2 && role === "COACH" && (
            <RegistrationStep2Coach
              bio={coachBio}
              yearsOfExperience={yearsOfExperience}
              specialties={specialties}
              teachingMethods={teachingMethods}
              credentials={credentials}
              fieldErrors={fieldErrors}
              submitting={submitting}
              onBioChange={setCoachBio}
              onYearsChange={setYearsOfExperience}
              onSpecialtiesChange={setSpecialties}
              onTeachingMethodsChange={setTeachingMethods}
              onCredentialsChange={setCredentials}
              onClearError={clearFieldError}
              onBack={handleBack}
              onSubmit={handleRegister}
            />
          )}

          {/* Step 2: Learner */}
          {currentStep === 2 && role === "LEARNER" && (
            <RegistrationStep2Learner
              skillLevel={skillLevel}
              learningGoal={learningGoal}
              fieldErrors={fieldErrors}
              submitting={submitting}
              onSkillLevelChange={setSkillLevel}
              onLearningGoalChange={setLearningGoal}
              onClearError={clearFieldError}
              onBack={handleBack}
              onSubmit={handleRegister}
            />
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Đã có tài khoản?</Text>
          <Pressable onPress={() => router.replace("/(auth)")}>
            <Text style={styles.footerLink}>Đăng nhập</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 16,
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    color: "#B91C1C",
    fontWeight: "600",
    fontSize: 13,
  },
  footer: {
    alignItems: "center",
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  footerText: {
    color: "#6B7280",
    fontSize: 13,
  },
  footerLink: {
    color: "#059669",
    fontWeight: "700",
    fontSize: 13,
  },
});

export default Register;
