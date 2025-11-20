import type { FC } from "react";
import { Text, View } from "react-native";

import styles from "./styles";

const CoursesHeader: FC = () => (
  <View style={styles.headerSection}>
    <View style={styles.headerContent}>
      <Text style={styles.headerTitle}>Khám Phá Khóa Học</Text>
      <Text style={styles.headerSubtitle}>
        Tìm khóa học pickleball tốt nhất cho bạn
      </Text>
    </View>
  </View>
);

export default CoursesHeader;

