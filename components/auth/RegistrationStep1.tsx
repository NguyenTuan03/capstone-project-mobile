import { formStyles } from "@/components/common/formStyles";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  fullName: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  role: "COACH" | "LEARNER";
  showPassword: boolean;
  showConfirmPassword: boolean;
  fieldErrors: Record<string, string>;
  onFullNameChange: (value: string) => void;
  onPhoneNumberChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onRoleChange: (role: "COACH" | "LEARNER") => void;
  onShowPasswordToggle: () => void;
  onShowConfirmPasswordToggle: () => void;
  onClearError: (field: string) => void;
  onNext: () => void;
};

export const RegistrationStep1 = ({
  fullName,
  phoneNumber,
  password,
  confirmPassword,
  role,
  showPassword,
  showConfirmPassword,
  fieldErrors,
  onFullNameChange,
  onPhoneNumberChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onRoleChange,
  onShowPasswordToggle,
  onShowConfirmPasswordToggle,
  onClearError,
  onNext,
}: Props) => {
  return (
    <>
      {/* Role Selection */}
      <View style={formStyles.fieldContainer}>
        <Text style={formStyles.label}>Đăng ký với vai trò</Text>
        <View style={formStyles.roleContainer}>
          <TouchableOpacity
            style={[
              formStyles.roleButton,
              role === "LEARNER" && formStyles.roleButtonActive,
            ]}
            onPress={() => onRoleChange("LEARNER")}
          >
            <View style={formStyles.radioOuter}>
              {role === "LEARNER" && <View style={formStyles.radioInner} />}
            </View>
            <Ionicons
              name="school-outline"
              size={24}
              color={role === "LEARNER" ? "#059669" : "#6B7280"}
            />
            <Text
              style={[
                formStyles.roleText,
                role === "LEARNER" && formStyles.roleTextActive,
              ]}
            >
              Học viên
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              formStyles.roleButton,
              role === "COACH" && formStyles.roleButtonActive,
            ]}
            onPress={() => onRoleChange("COACH")}
          >
            <View style={formStyles.radioOuter}>
              {role === "COACH" && <View style={formStyles.radioInner} />}
            </View>
            <Ionicons
              name="person-outline"
              size={24}
              color={role === "COACH" ? "#059669" : "#6B7280"}
            />
            <Text
              style={[
                formStyles.roleText,
                role === "COACH" && formStyles.roleTextActive,
              ]}
            >
              Huấn luyện viên
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Full Name */}
      <View style={formStyles.fieldContainer}>
        <Text style={formStyles.label}>Họ và tên</Text>
        <View
          style={[
            formStyles.inputWrapper,
            fieldErrors.fullName && formStyles.inputError,
          ]}
        >
          <Ionicons name="person-outline" size={18} color="#6B7280" />
          <TextInput
            style={formStyles.input}
            placeholder="Nguyễn Văn A"
            value={fullName}
            onChangeText={(text) => {
              onFullNameChange(text);
              if (fieldErrors.fullName) {
                onClearError("fullName");
              }
            }}
            autoCapitalize="words"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        {fieldErrors.fullName ? (
          <Text style={formStyles.errorFieldText}>{fieldErrors.fullName}</Text>
        ) : null}
      </View>

      {/* Phone Number */}
      <View style={formStyles.fieldContainer}>
        <Text style={formStyles.label}>Số điện thoại</Text>
        <View
          style={[
            formStyles.inputWrapper,
            fieldErrors.phoneNumber && formStyles.inputError,
          ]}
        >
          <Ionicons name="call-outline" size={18} color="#6B7280" />
          <TextInput
            style={formStyles.input}
            placeholder="0123456789"
            value={phoneNumber}
            onChangeText={(text) => {
              onPhoneNumberChange(text);
              if (fieldErrors.phoneNumber) {
                onClearError("phoneNumber");
              }
            }}
            keyboardType="phone-pad"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        {fieldErrors.phoneNumber ? (
          <Text style={formStyles.errorFieldText}>
            {fieldErrors.phoneNumber}
          </Text>
        ) : null}
      </View>

      {/* Password */}
      <View style={formStyles.fieldContainer}>
        <Text style={formStyles.label}>Mật khẩu</Text>
        <View
          style={[
            formStyles.inputWrapper,
            fieldErrors.password && formStyles.inputError,
          ]}
        >
          <Ionicons name="lock-closed-outline" size={18} color="#6B7280" />
          <TextInput
            style={formStyles.input}
            placeholder="••••••••"
            value={password}
            onChangeText={(text) => {
              onPasswordChange(text);
              if (fieldErrors.password) {
                onClearError("password");
              }
            }}
            secureTextEntry={!showPassword}
            placeholderTextColor="#9CA3AF"
          />
          <Pressable onPress={onShowPasswordToggle} hitSlop={8}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={18}
              color="#6B7280"
            />
          </Pressable>
        </View>
        {fieldErrors.password ? (
          <Text style={formStyles.errorFieldText}>{fieldErrors.password}</Text>
        ) : null}
      </View>

      {/* Confirm Password */}
      <View style={formStyles.fieldContainer}>
        <Text style={formStyles.label}>Xác nhận mật khẩu</Text>
        <View
          style={[
            formStyles.inputWrapper,
            fieldErrors.confirmPassword && formStyles.inputError,
          ]}
        >
          <Ionicons name="lock-closed-outline" size={18} color="#6B7280" />
          <TextInput
            style={formStyles.input}
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={(text) => {
              onConfirmPasswordChange(text);
              if (fieldErrors.confirmPassword) {
                onClearError("confirmPassword");
              }
            }}
            secureTextEntry={!showConfirmPassword}
            placeholderTextColor="#9CA3AF"
          />
          <Pressable onPress={onShowConfirmPasswordToggle} hitSlop={8}>
            <Ionicons
              name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
              size={18}
              color="#6B7280"
            />
          </Pressable>
        </View>
        {fieldErrors.confirmPassword ? (
          <Text style={formStyles.errorFieldText}>
            {fieldErrors.confirmPassword}
          </Text>
        ) : null}
      </View>

      {/* Next Button */}
      <Pressable onPress={onNext} style={styles.nextButtonWrapper}>
        <LinearGradient
          colors={["#059669", "#047857"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={formStyles.submitButton}
        >
          <Text style={formStyles.submitButtonText}>Tiếp theo</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </LinearGradient>
      </Pressable>
    </>
  );
};

const styles = StyleSheet.create({
  nextButtonWrapper: {
    marginTop: 6,
  },
});
