import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ContentScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />
      {/* <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => router.push("/(coach)/settings" as any)}
      >
        <Ionicons name="settings" size={18} color="#059669" />
      </TouchableOpacity> */}
      <ScrollView
        style={{ flex: 1, backgroundColor: "#fff" }}
        contentContainerStyle={{ padding: 20, paddingTop: 60 }}
      >
        <View style={{ alignItems: "center", marginBottom: 30 }}>
          <View
            style={{
              backgroundColor: "#D1F7C4",
              borderRadius: 100,
              width: 100,
              height: 100,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image
              source={{
                uri: "https://cdn-icons-png.flaticon.com/512/4140/4140048.png",
              }}
              style={{ width: 70, height: 70 }}
            />
          </View>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginTop: 15 }}>
            Coach001
          </Text>
          <Text style={{ color: "gray", marginTop: 4 }}>
            Coach001@gmail.com
          </Text>
        </View>

        {/* Inventories */}
        <Text style={{ color: "gray", fontSize: 13, marginBottom: 10 }}>
          Quản lý bài giảng
        </Text>

        <View
          style={{
            backgroundColor: "#F6F6F6",
            borderRadius: 16,
            paddingVertical: 10,
            marginBottom: 20,
          }}
        >
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#EAEAEA",
            }}
            // onPress={() => router.push("/(coach)/course/create" as any)}
            onPress={() => router.push("/(coach)/menu/subject" as any)}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="book-outline" size={22} color="#000" />
              <Text style={{ marginLeft: 10, fontSize: 16 }}>Tạo môn học</Text>
            </View>
            <MaterialIcons name="navigate-next" size={24} color="black" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
              paddingHorizontal: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="school" size={22} color="#000" />
              <Text style={{ marginLeft: 10, fontSize: 16 }}>Tạo bài học</Text>
            </View>
            <MaterialIcons name="navigate-next" size={24} color="black" />
          </TouchableOpacity>
        </View>

        <Text style={{ color: "gray", fontSize: 13, marginBottom: 10 }}>
          Cá nhân
        </Text>
        <View
          style={{
            backgroundColor: "#F6F6F6",
            borderRadius: 16,
            paddingVertical: 10,
            marginBottom: 20,
          }}
        >
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
              paddingHorizontal: 16,
            }}
            onPress={() => router.push("/(coach)/menu/profile" as any)}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="person-circle-outline" size={22} color="#000" />
              <Text style={{ marginLeft: 10, fontSize: 16 }}>
                Thông tin cá nhân
              </Text>
            </View>
            <MaterialIcons name="navigate-next" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
              paddingHorizontal: 16,
            }}
            onPress={() => router.push("/(coach)/menu/analytics" as any)}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="bar-chart-outline" size={22} color="#000" />
              <Text style={{ marginLeft: 10, fontSize: 16 }}>
                Hiệu suất giảng dạy
              </Text>
            </View>
            <MaterialIcons name="navigate-next" size={24} color="black" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
              paddingHorizontal: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="wallet-outline" size={22} color="#000" />
              <Text style={{ marginLeft: 10, fontSize: 16 }}>
                Quản lý thanh toán
              </Text>
            </View>
            <MaterialIcons name="navigate-next" size={24} color="black" />
          </TouchableOpacity>
        </View>

        <View
          style={{
            backgroundColor: "#F6F6F6",
            borderRadius: 16,
            paddingVertical: 10,
          }}
        >
          {/* Logout */}
          <TouchableOpacity
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              borderTopColor: "#EAEAEA",
            }}
          >
            <MaterialIcons name="logout" size={24} color="red" />
            <Text style={{ color: "red", fontWeight: "500", marginLeft: 10 }}>
              Đăng xuất
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 8,
  },
  subDescription: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
  settingsButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#D1FAE5",
    padding: 10,
    borderRadius: 12,
  },
});
