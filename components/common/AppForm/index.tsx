// components/common/AppForm.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

type FieldItem = {
  name: string;
  label: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  leftIcon?: React.ReactNode;
};

type AppFormProps = {
  title: string;
  subtitle?: string;
  items: FieldItem[];
  onSubmit: (values: Record<string, string>) => Promise<void>;
  submitting: boolean;
  error?: string | null;
  submitText: string;
  footer?: React.ReactNode;
  skipValidation?: boolean;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
// Vietnamese phone number validation: must start with 0 and have 9-10 digits
const phoneRegex = /^0[0-9]{8,9}$/;

export default function AppForm({
  title,
  subtitle,
  items,
  onSubmit,
  submitting,
  error,
  submitText,
  footer,
  skipValidation = false,
}: AppFormProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // refs để next focus
  const inputsRef = useRef<(TextInput | null)[]>([]);

  const canSubmit = useMemo(() => !submitting, [submitting]);

  const handleChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const emailField = items.find((i) => i.keyboardType === "email-address");
    if (emailField) {
      const v = (formValues[emailField.name] || "").trim();
      if (!v) nextErrors[emailField.name] = "Email không được để trống";
      else if (!emailRegex.test(v))
        nextErrors[emailField.name] = "Email không hợp lệ";
    }
    const phoneField = items.find((i) => i.keyboardType === "phone-pad");
    if (phoneField) {
      const v = (formValues[phoneField.name] || "").trim();
      if (!v) nextErrors[phoneField.name] = "Số điện thoại không được để trống";
      else if (!phoneRegex.test(v))
        nextErrors[phoneField.name] = "Số điện thoại không hợp lệ (phải bắt đầu bằng 0 và có 10 chữ số)";
    }
    const passField = items.find((i) => i.secureTextEntry);
    if (passField) {
      const v = (formValues[passField.name] || "").trim();
      if (!v) nextErrors[passField.name] = "Password không được để trống";
      else if (v.length < 6) nextErrors[passField.name] = "Tối thiểu 6 ký tự";
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (!skipValidation && !validate()) return;
    onSubmit(formValues);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
          {/* Header */}
          <View style={{ paddingTop: 50, paddingHorizontal: 16, gap: 6 }}>
            <Text style={{ fontSize: 17, fontWeight: "700" }}>{title}</Text>
            {subtitle ? (
              <Text style={{ color: "#6b7280", fontSize: 13 }}>{subtitle}</Text>
            ) : null}
          </View>

          {/* Card */}
          <View
            style={{
              marginTop: 16,
              marginHorizontal: 16,
              backgroundColor: "#fff",
              borderRadius: 8,
              padding: 12,
              gap: 10,
              shadowColor: "#000",
              shadowOpacity: 0.06,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
            }}
          >
            {error ? (
              <View
                style={{
                  backgroundColor: "#fef2f2",
                  padding: 10,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: "#fecaca",
                }}
              >
                <Text style={{ color: "#b91c1c", fontWeight: "600", fontSize: 13 }}>
                  {error}
                </Text>
              </View>
            ) : null}

            {items.map((item, idx) => {
              const isPassword = !!item.secureTextEntry;
              const value = formValues[item.name] || "";
              const hasError = !!fieldErrors[item.name];

              return (
                <View key={item.name} style={{ gap: 4 }}>
                  <Text style={{ fontWeight: "600", fontSize: 13 }}>{item.label}</Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: hasError ? "#ef4444" : "#e5e7eb",
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      backgroundColor: "#fafafa",
                    }}
                  >
                    {/* Left icon */}
                    <View style={{ paddingRight: 8 }}>
                      {item.leftIcon ? (
                        item.leftIcon
                      ) : item.keyboardType === "email-address" ? (
                        <Ionicons
                          name="mail-outline"
                          size={18}
                          color="#6b7280"
                        />
                      ) : item.keyboardType === "phone-pad" ? (
                        <Ionicons
                          name="call-outline"
                          size={18}
                          color="#6b7280"
                        />
                      ) : isPassword ? (
                        <Ionicons
                          name="lock-closed-outline"
                          size={18}
                          color="#6b7280"
                        />
                      ) : (
                        <Ionicons
                          name="text-outline"
                          size={18}
                          color="#6b7280"
                        />
                      )}
                    </View>

                    <TextInput
                      ref={(r) => {
                        inputsRef.current[idx] = r;
                      }}
                      value={value}
                      onChangeText={(val) => handleChange(item.name, val)}
                      placeholder={item.placeholder}
                      secureTextEntry={isPassword && !showPassword}
                      autoCapitalize={item.autoCapitalize || "none"}
                      keyboardType={item.keyboardType || "default"}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        fontSize: 14,
                      }}
                      placeholderTextColor="#9ca3af"
                      returnKeyType={idx === items.length - 1 ? "go" : "next"}
                      onSubmitEditing={() => {
                        if (idx === items.length - 1) {
                          handleSubmit();
                        } else {
                          inputsRef.current[idx + 1]?.focus?.();
                        }
                      }}
                    />

                    {/* Toggle password */}
                    {isPassword ? (
                      <Pressable
                        onPress={() => setShowPassword((v) => !v)}
                        style={{ padding: 6 }}
                        hitSlop={8}
                      >
                        <Ionicons
                          name={
                            showPassword ? "eye-off-outline" : "eye-outline"
                          }
                          size={18}
                          color="#6b7280"
                        />
                      </Pressable>
                    ) : null}
                  </View>

                  {hasError ? (
                    <Text style={{ color: "#ef4444", fontSize: 12 }}>
                      {fieldErrors[item.name]}
                    </Text>
                  ) : null}
                </View>
              );
            })}

            {/* Submit Button (Gradient) */}
            <Pressable
              disabled={!canSubmit}
              onPress={handleSubmit}
              style={{ marginTop: 4 }}
            >
              <LinearGradient
                colors={
                  submitting ? ["#9CA3AF", "#9CA3AF"] : ["#059669", "#047857"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 13,
                  borderRadius: 8,
                  alignItems: "center",
                  shadowColor: "#059669",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{ color: "#fff", fontWeight: "700", fontSize: 15, letterSpacing: 0.3 }}
                  >
                    {submitText}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          {/* Footer */}
          <View
            style={{ alignItems: "center", marginTop: 12, marginBottom: 24 }}
          >
            {footer}
          </View>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
