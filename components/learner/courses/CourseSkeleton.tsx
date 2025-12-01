import { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    StyleSheet,
    View,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;

const CourseSkeleton = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateShimmer = () => {
      shimmerAnim.setValue(0);
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      }).start(() => {
        animateShimmer();
      });
    };

    animateShimmer();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  const ShimmerOverlay = () => (
    <Animated.View
      style={[
        styles.shimmer,
        {
          transform: [{ translateX }],
        },
      ]}
    />
  );

  return (
    <View style={styles.container}>
      {/* Image Skeleton */}
      <View style={styles.imageSkeletonWrapper}>
        <View style={styles.imageSkeleton}>
          <ShimmerOverlay />
        </View>
      </View>

      {/* Content Skeleton */}
      <View style={styles.contentSkeleton}>
        {/* Title Skeleton */}
        <View style={styles.titleSkeleton}>
          <ShimmerOverlay />
        </View>

        {/* Coach Info Skeleton */}
        <View style={styles.coachRowSkeleton}>
          <View style={styles.avatarSkeleton}>
            <ShimmerOverlay />
          </View>
          <View style={styles.coachNameSkeleton}>
            <ShimmerOverlay />
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Meta Grid Skeleton */}
        <View style={styles.metaGridSkeleton}>
          <View style={styles.metaItemSkeleton}>
            <ShimmerOverlay />
          </View>
          <View style={styles.metaItemSkeleton}>
            <ShimmerOverlay />
          </View>
          <View style={[styles.metaItemSkeleton, { width: "100%" }]}>
            <ShimmerOverlay />
          </View>
        </View>

        {/* Footer Skeleton */}
        <View style={styles.footerSkeleton}>
          <View style={styles.priceSkeleton}>
            <ShimmerOverlay />
          </View>
          <View style={styles.buttonSkeleton}>
            <ShimmerOverlay />
          </View>
        </View>
      </View>
    </View>
  );
};

export default CourseSkeleton;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  imageSkeletonWrapper: {
    height: 180,
    width: "100%",
  },
  imageSkeleton: {
    flex: 1,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  shimmer: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  contentSkeleton: {
    padding: 16,
    gap: 12,
  },
  titleSkeleton: {
    height: 16,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 4,
  },
  coachRowSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  coachNameSkeleton: {
    flex: 1,
    height: 12,
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
    overflow: "hidden",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 4,
  },
  metaGridSkeleton: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metaItemSkeleton: {
    width: "47%",
    height: 32,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  footerSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    gap: 12,
  },
  priceSkeleton: {
    width: 100,
    height: 20,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    overflow: "hidden",
  },
  buttonSkeleton: {
    flex: 1,
    height: 32,
    backgroundColor: "#DCFCE7",
    borderRadius: 8,
    overflow: "hidden",
  },
});
