import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Animated, Platform } from 'react-native';

interface SimpleSliderProps {
  minimumValue?: number;
  maximumValue?: number;
  value: number;
  onValueChange: (value: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  style?: any;
}

const SimpleSlider: React.FC<SimpleSliderProps> = ({
  minimumValue = 0,
  maximumValue = 100,
  value,
  onValueChange,
  minimumTrackTintColor = '#3B82F6',
  maximumTrackTintColor = '#E2E8F0',
  thumbTintColor = '#3B82F6',
  style,
}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const thumbPosition = useRef(new Animated.Value(0)).current;
  const lastValue = useRef(value);

  // 更新拇指位置
  useEffect(() => {
    if (containerWidth > 0) {
      const percentage = (value - minimumValue) / (maximumValue - minimumValue);
      const position = percentage * (containerWidth - 24); // 24是拇指宽度
      thumbPosition.setValue(position);
      lastValue.current = value;
    }
  }, [value, containerWidth, minimumValue, maximumValue, thumbPosition]);

  // 处理触摸事件
  const handleTouch = useCallback((locationX: number) => {
    if (containerWidth === 0) return;

    // 计算百分比
    const clampedX = Math.max(0, Math.min(locationX, containerWidth));
    const percentage = clampedX / containerWidth;
    
    // 计算新值
    const range = maximumValue - minimumValue;
    const newValue = minimumValue + percentage * range;
    
    // 更新值
    if (Math.abs(newValue - lastValue.current) > 0.1) {
      onValueChange(newValue);
      lastValue.current = newValue;
    }
  }, [containerWidth, minimumValue, maximumValue, onValueChange]);

  // 创建 PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        handleTouch(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt) => {
        handleTouch(evt.nativeEvent.locationX);
      },
      onPanResponderRelease: () => {
        // 可以添加释放后的处理
      },
    })
  ).current;

  // 计算填充宽度
  const fillWidth = containerWidth > 0 
    ? ((value - minimumValue) / (maximumValue - minimumValue)) * containerWidth 
    : 0;

  return (
    <View
      style={[styles.container, style]}
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width);
      }}
    >
      <View style={styles.trackContainer} {...panResponder.panHandlers}>
        {/* 背景轨道 */}
        <View
          style={[
            styles.track,
            { backgroundColor: maximumTrackTintColor },
          ]}
        />
        
        {/* 填充轨道 */}
        <View
          style={[
            styles.trackFill,
            {
              backgroundColor: minimumTrackTintColor,
              width: fillWidth,
            },
          ]}
        />
        
        {/* 拇指 */}
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: thumbTintColor,
              transform: [{ translateX: thumbPosition }],
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 12, // 给拇指留出空间
  },
  trackContainer: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 4,
    borderRadius: 2,
    width: '100%',
  },
  trackFill: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    left: 0,
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    top: 8, // (40 - 24) / 2 = 8，垂直居中
    left: -12, // 拇指宽度的一半，让中心对齐
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
});

export default SimpleSlider;
