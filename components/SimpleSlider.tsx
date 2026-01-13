import React from 'react';
import { View, Text, StyleSheet, PanResponder, Animated } from 'react-native';

interface SimpleSliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  onValueChange: (value: number) => void;
  style?: any;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
}

export default function SimpleSlider({
  value,
  minimumValue,
  maximumValue,
  onValueChange,
  style,
  minimumTrackTintColor = '#3B82F6',
  maximumTrackTintColor = '#E2E8F0',
  thumbTintColor = '#3B82F6',
}: SimpleSliderProps) {
  const [sliderWidth, setSliderWidth] = React.useState(0);
  const thumbPosition = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (sliderWidth > 0) {
      const range = maximumValue - minimumValue;
      const thumbPos = ((value - minimumValue) / range) * (sliderWidth - 24);
      thumbPosition.setValue(thumbPos);
    }
  }, [value, sliderWidth, minimumValue, maximumValue]);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        handleTouch(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt) => {
        handleTouch(evt.nativeEvent.locationX);
      },
    })
  ).current;

  const handleTouch = (x: number) => {
    if (sliderWidth === 0) return;
    
    const clampedX = Math.max(0, Math.min(x, sliderWidth));
    const percentage = clampedX / sliderWidth;
    const range = maximumValue - minimumValue;
    const newValue = minimumValue + percentage * range;
    
    onValueChange(newValue);
  };

  const fillWidth = sliderWidth > 0 ? ((value - minimumValue) / (maximumValue - minimumValue)) * sliderWidth : 0;

  return (
    <View
      style={[styles.container, style]}
      onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <View style={styles.track}>
        <View style={[styles.trackBackground, { backgroundColor: maximumTrackTintColor }]} />
        <View style={[styles.trackFill, { width: fillWidth, backgroundColor: minimumTrackTintColor }]} />
        <Animated.View
          style={[
            styles.thumb,
            { backgroundColor: thumbTintColor, left: thumbPosition },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    position: 'relative',
  },
  trackBackground: {
    height: '100%',
    borderRadius: 2,
  },
  trackFill: {
    position: 'absolute',
    height: '100%',
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    top: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});

