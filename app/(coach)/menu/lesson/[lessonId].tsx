import { post, put } from "@/services/http/httpService";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function LessonDetailScreen() {
  const { lessonId, lessonName } = useLocalSearchParams<{
    lessonId: string;
    lessonName: string;
  }>();
  const [activeTab, setActiveTab] = useState<"VIDEO LESSON" | "QUIZZ">(
    "VIDEO LESSON"
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#FFFFFF", paddingHorizontal: 20 }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 16,
        }}
      >
        <TouchableOpacity>
          <Ionicons name="arrow-back" size={24} color="#059669" />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 18,
            fontWeight: "600",
            color: "#111827",
          }}
        >
          {lessonName}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <Text
        style={{
          fontSize: 24,
          fontWeight: "700",
          textAlign: "center",
          marginBottom: 4,
          color: "#111827",
        }}
      >
        Description
      </Text>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          marginBottom: 24,
        }}
      >
        {["VIDEO LESSON", "QUIZZ"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab as "VIDEO LESSON" | "QUIZZ")}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 20,
              backgroundColor: activeTab === tab ? "#059669" : "transparent",
            }}
          >
            <Text
              style={{
                fontWeight: "600",
                color: activeTab === tab ? "#ffff" : "#6B7280",
              }}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === "VIDEO LESSON" ? (
          <>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "600", color: "#6B7280" }}>
                Step 1
              </Text>
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  padding: 16,
                  shadowColor: "#000",
                  shadowOpacity: 0.05,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 16,
                    marginBottom: 4,
                    color: "#111827",
                  }}
                >
                  Make an observation
                </Text>
                <Text style={{ color: "#6B7280", fontSize: 14 }}>Video 1</Text>
              </View>
            </View>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "600", color: "#6B7280" }}>
                Step 2
              </Text>
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  padding: 16,
                  shadowColor: "#000",
                  shadowOpacity: 0.05,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 16,
                    marginBottom: 4,
                    color: "#111827",
                  }}
                >
                  Ask a question
                </Text>
                <Text style={{ color: "#6B7280", fontSize: 14 }}>Video 2</Text>
              </View>
            </View>
          </>
        ) : (
          <View
            style={{
              backgroundColor: "#F9FAFB",
              borderRadius: 12,
              padding: 20,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16, color: "#111827", marginBottom: 8, alignItems: "flex-start", }}>
                Ready to test your knowledge on this topic?
            </Text>
            <View
              style={{
                backgroundColor: "#E0E7FF",
                borderRadius: 50,
                padding: 20,
                marginBottom: 16,
              }}
            >
              <Ionicons
                name="document-text-outline"
                size={32}
                color="#4F46E5"
              />
            </View>
            <Text style={{ fontWeight: "700", fontSize: 18, marginBottom: 8 }}>
              The Scientific Method
            </Text>
            <Text
              style={{
                color: "#6B7280",
                fontSize: 14,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              Let’s put your memory on our first topic to test.
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: "#4F46E5",
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>BEGIN →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
