import React, { useCallback, useEffect, useState } from "react";
import {
    Animated,
    Dimensions,
    PanResponder,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  minValue: number;
  maxValue: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  minLabel?: string;
  maxLabel?: string;
}

const THUMB_SIZE = 28;
const TRACK_HEIGHT = 4;

export default function RangeSlider({
  min,
  max,
  step = 1,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minLabel = "Tối thiểu",
  maxLabel = "Tối đa",
}: RangeSliderProps) {
  const screenWidth = Dimensions.get("window").width - 56; // Account for padding
  const trackWidth = screenWidth - THUMB_SIZE;

  const getPositionFromValue = useCallback(
    (value: number) => {
      return ((value - min) / (max - min)) * trackWidth;
    },
    [min, max, trackWidth]
  );

  const getValueFromPosition = useCallback(
    (position: number) => {
      let value = (position / trackWidth) * (max - min) + min;
      value = Math.round(value / step) * step;
      return Math.max(min, Math.min(max, value));
    },
    [min, max, step, trackWidth]
  );

  const [minThumbX] = useState(
    new Animated.Value(getPositionFromValue(minValue))
  );
  const [maxThumbX] = useState(
    new Animated.Value(getPositionFromValue(maxValue))
  );

  // Update animated values when minValue or maxValue changes (from parent)
  useEffect(() => {
    minThumbX.setValue(getPositionFromValue(minValue));
  }, [minValue, minThumbX, getPositionFromValue]);

  useEffect(() => {
    maxThumbX.setValue(getPositionFromValue(maxValue));
  }, [maxValue, maxThumbX, getPositionFromValue]);

  const minPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, { dx }) => {
      const currentX = getPositionFromValue(minValue) + dx;
      const nextValue = getValueFromPosition(currentX);

      if (nextValue < maxValue) {
        onMinChange(nextValue);
        minThumbX.setValue(getPositionFromValue(nextValue));
      }
    },
  });

  const maxPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, { dx }) => {
      const currentX = getPositionFromValue(maxValue) + dx;
      const nextValue = getValueFromPosition(currentX);

      if (nextValue > minValue) {
        onMaxChange(nextValue);
        maxThumbX.setValue(getPositionFromValue(nextValue));
      }
    },
  });

  const minThumbPosition = getPositionFromValue(minValue);
  const maxThumbPosition = getPositionFromValue(maxValue);
  const selectedTrackWidth =
    maxThumbPosition - minThumbPosition + THUMB_SIZE / 2;

  return (
    <View style={styles.container}>
      <View style={styles.valuesContainer}>
        <View style={styles.valueBox}>
          <Text style={styles.valueLabel}>{minLabel}</Text>
          <Text style={styles.valueText}>{minValue}</Text>
        </View>
        <View style={styles.rangeText}>
          <Text style={styles.rangeValue}>
            {minValue} - {maxValue}
          </Text>
        </View>
        <View style={styles.valueBox}>
          <Text style={styles.valueLabel}>{maxLabel}</Text>
          <Text style={styles.valueText}>{maxValue}</Text>
        </View>
      </View>

      <View style={styles.sliderContainer}>
        {/* Background track */}
        <View
          style={[
            styles.track,
            {
              width: trackWidth + THUMB_SIZE,
            },
          ]}
        />

        {/* Selected track highlight */}
        <View
          style={[
            styles.selectedTrack,
            {
              left: minThumbPosition + THUMB_SIZE / 2,
              width: selectedTrackWidth,
            },
          ]}
        />

        {/* Min thumb */}
        <Animated.View
          style={[
            styles.thumb,
            {
              left: minThumbPosition,
            },
          ]}
          {...minPanResponder.panHandlers}
        >
          <View style={styles.thumbInner} />
        </Animated.View>

        {/* Max thumb */}
        <Animated.View
          style={[
            styles.thumb,
            {
              left: maxThumbPosition,
            },
          ]}
          {...maxPanResponder.panHandlers}
        >
          <View style={styles.thumbInner} />
        </Animated.View>
      </View>

      {/* Labels for min and max range */}
      <View style={styles.labelsContainer}>
        <Text style={styles.minLabel}>{min}</Text>
        <Text style={styles.maxLabel}>{max}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  valuesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  valueBox: {
    flex: 1,
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  valueLabel: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  valueText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
    marginTop: 2,
  },
  rangeText: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rangeValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  sliderContainer: {
    height: THUMB_SIZE,
    justifyContent: "center",
    marginVertical: 12,
    position: "relative",
  },
  track: {
    height: TRACK_HEIGHT,
    backgroundColor: "#E5E7EB",
    borderRadius: TRACK_HEIGHT / 2,
    alignSelf: "center",
  },
  selectedTrack: {
    height: TRACK_HEIGHT,
    backgroundColor: "#059669",
    borderRadius: TRACK_HEIGHT / 2,
    position: "absolute",
    top: (THUMB_SIZE - TRACK_HEIGHT) / 2,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    position: "absolute",
    top: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  thumbInner: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: "#059669",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  labelsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginTop: 4,
  },
  minLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  maxLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
  },
});
