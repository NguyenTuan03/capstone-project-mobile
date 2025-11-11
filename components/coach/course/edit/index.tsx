import React from "react";
import { StyleSheet, Text, View } from "react-native";

const EditTab: React.FC = () => {
  return (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chỉnh sửa thông tin khóa học</Text>
        <Text style={{ color: "#6B7280", fontSize: 14, marginTop: 8 }}>
          Form chỉnh sửa đang được hiển thị trong modal
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContent: { flex: 1 },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
});

export default EditTab;


