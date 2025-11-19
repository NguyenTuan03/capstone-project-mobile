import { Ionicons } from "@expo/vector-icons";
import type { FC } from "react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, TouchableOpacity } from "react-native";

import type { Course } from "@/types/course";
import { formatPrice } from "@/utils/courseUtilFormat";

type RevenueTooltipProps = {
  course: Course;
  platformFee: number;
};

const RevenueTooltipComponent: FC<RevenueTooltipProps> = ({
  course,
  platformFee,
}) => {
  const [visible, setVisible] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const tooltipAnim = useRef(new Animated.Value(0)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const startPulse = useCallback(() => {
    pulseLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoopRef.current.start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    if (pulseLoopRef.current) {
      pulseLoopRef.current.stop();
      pulseLoopRef.current = null;
    }
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [pulseAnim]);

  useEffect(() => {
    startPulse();
    return () => {
      stopPulse();
    };
  }, [startPulse, stopPulse]);

  useEffect(() => {
    if (visible) {
      stopPulse();
      Animated.timing(tooltipAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(tooltipAnim, {
        toValue: 0,
        duration: 120,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) startPulse();
      });
    }
  }, [startPulse, stopPulse, tooltipAnim, visible]);

  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  const tooltipTranslateY = tooltipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });

  return (
    <>
      <AnimatedTouchable
        activeOpacity={0.8}
        style={{
          flexDirection: "row",
          alignItems: "center",
          transform: [{ scale: pulseAnim }],
        }}
        onPress={() => setVisible((v) => !v)}
      >
        <Ionicons name="trending-up" size={18} color="#059669" />
        <Text style={{ fontSize: 12, color: "#6B7280", marginLeft: 6 }}>
          Doanh thu
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "bold",
            color: "#059669",
            marginLeft: 8,
          }}
        >
          {formatPrice(course.totalEarnings)}
        </Text>
      </AnimatedTouchable>

      <Animated.View
        pointerEvents={visible ? "auto" : "none"}
        style={{
          position: "absolute",
          bottom: 44,
          right: 0,
          backgroundColor: "#111827",
          padding: 10,
          borderRadius: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 6,
          maxWidth: 220,
          opacity: tooltipAnim,
          transform: [{ translateY: tooltipTranslateY }],
        }}
      >
        <Text style={{ color: "#F9FAFB", fontSize: 12 }}>
          Đã trừ phí nền tảng
        </Text>
        <Text
          style={{
            color: "#cf2d2dff",
            fontSize: 13,
            fontWeight: "700",
            marginTop: 4,
          }}
        >
          {`- ${platformFee}%`}
        </Text>
        <TouchableOpacity
          onPress={() => setVisible(false)}
          style={{ marginTop: 6 }}
        >
          <Text style={{ color: "#9CA3AF", fontSize: 11, textAlign: "right" }}>
            Đóng
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
};

const RevenueTooltip = memo(RevenueTooltipComponent);
RevenueTooltip.displayName = "RevenueTooltip";

export default RevenueTooltip;
