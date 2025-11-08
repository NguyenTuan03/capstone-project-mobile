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
  keyboardType?: "default" | "email-address" | "numeric";
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
          <View style={{ paddingTop: 80, paddingHorizontal: 20, gap: 8 }}>
            <Text style={{ fontSize: 28, fontWeight: "800" }}>{title}</Text>
            {subtitle ? (
              <Text style={{ color: "#6b7280" }}>{subtitle}</Text>
            ) : null}
          </View>

          {/* Card */}
          <View
            style={{
              marginTop: 20,
              marginHorizontal: 20,
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 18,
              gap: 14,
              shadowColor: "#000",
              shadowOpacity: 0.06,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 4,
            }}
          >
            {error ? (
              <View
                style={{
                  backgroundColor: "#fef2f2",
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#fecaca",
                }}
              >
                <Text style={{ color: "#b91c1c", fontWeight: "600" }}>
                  {error}
                </Text>
              </View>
            ) : null}

            {items.map((item, idx) => {
              const isPassword = !!item.secureTextEntry;
              const value = formValues[item.name] || "";
              const hasError = !!fieldErrors[item.name];

              return (
                <View key={item.name} style={{ gap: 6 }}>
                  <Text style={{ fontWeight: "600" }}>{item.label}</Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1.5,
                      borderColor: hasError ? "#ef4444" : "#e5e7eb",
                      borderRadius: 12,
                      paddingHorizontal: 12,
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
                        paddingVertical: 12,
                        fontSize: 16,
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
                  submitting ? ["#93c5fd", "#93c5fd"] : ["#2563eb", "#7c3aed"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}
                  >
                    {submitText}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          {/* Footer */}
          <View
            style={{ alignItems: "center", marginTop: 16, marginBottom: 32 }}
          >
            {footer}
          </View>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
