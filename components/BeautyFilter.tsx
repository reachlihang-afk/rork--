import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import SimpleSlider from './SimpleSlider';
import { X, Sparkles, Check, RotateCcw } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export interface BeautyParams {
  smooth: number;      // 磨皮 0-100
  whiten: number;      // 美白 0-100
  rosy: number;        // 红润 0-100
  contrast: number;    // 对比度 0-100
}

interface BeautyFilterProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  onApply: (beautifiedUri: string, params: BeautyParams) => void;
}

const DEFAULT_PARAMS: BeautyParams = {
  smooth: 40,
  whiten: 30,
  rosy: 25,
  contrast: 50,
};

export default function BeautyFilter({ visible, imageUri, onClose, onApply }: BeautyFilterProps) {
  const { t } = useTranslation();
  const [params, setParams] = useState<BeautyParams>(DEFAULT_PARAMS);
  const [isApplying, setIsApplying] = useState(false);
  const [previewUri, setPreviewUri] = useState<string>(imageUri);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  
  // 防抖定时器引用
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // 当 imageUri 改变时重置预览
  useEffect(() => {
    setPreviewUri(imageUri);
    setParams(DEFAULT_PARAMS);
  }, [imageUri]);
  
  // 实时预览 - 使用防抖机制
  useEffect(() => {
    if (!visible || !imageUri) return;
    
    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // 设置新的防抖定时器
    debounceTimerRef.current = setTimeout(async () => {
      setIsGeneratingPreview(true);
      try {
        const newPreviewUri = await generatePreview(imageUri, params);
        setPreviewUri(newPreviewUri);
      } catch (error) {
        console.error('Preview generation error:', error);
      } finally {
        setIsGeneratingPreview(false);
      }
    }, 150); // 150ms 防抖延迟，平衡响应速度和性能
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [params, imageUri, visible]);

  // 重置参数
  const handleReset = useCallback(() => {
    setParams(DEFAULT_PARAMS);
  }, []);

  // 应用美颜效果
  const handleApply = useCallback(async () => {
    setIsApplying(true);
    try {
      // 最终应用时使用高质量处理
      const beautifiedUri = await processBeautyFilter(imageUri, params);
      onApply(beautifiedUri, params);
    } catch (error) {
      console.error('Beauty filter application error:', error);
      // 如果处理失败，返回当前预览或原图
      onApply(previewUri || imageUri, params);
    } finally {
      setIsApplying(false);
    }
  }, [imageUri, params, previewUri, onApply]);

  // 更新参数
  const updateParam = useCallback((key: keyof BeautyParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  // Web 平台的 CSS 滤镜样式
  const getWebImageStyle = useCallback(() => {
    const brightness = 1 + (params.whiten / 100) * 0.3;
    const contrast = 0.8 + (params.contrast / 100) * 0.4;
    const saturate = 1 + (params.rosy / 100) * 0.5;
    const blur = (params.smooth / 100) * 1.5;
    
    return {
      width: '100%',
      height: '100%',
      objectFit: 'contain' as const,
      filter: `brightness(${brightness}) contrast(${contrast}) saturate(${saturate}) blur(${blur}px)`,
    };
  }, [params]);

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* 顶部工具栏 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <X size={24} color="#0F172A" strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Sparkles size={20} color="#3B82F6" />
            <Text style={styles.headerTitleText}>{t('beauty.smartBeauty')}</Text>
          </View>
          <TouchableOpacity onPress={handleReset} style={styles.headerButton}>
            <RotateCcw size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* 预览区域 - 实时显示滤镜效果 */}
        <View style={styles.previewContainer}>
          {Platform.OS === 'web' ? (
            // Web 平台使用 CSS filter 实时预览
            <img 
              src={imageUri} 
              style={getWebImageStyle()}
              alt="Beauty preview"
            />
          ) : (
            // Native 平台显示处理后的预览图
            <Image
              source={{ uri: previewUri }}
              style={styles.previewImage}
              contentFit="contain"
              transition={100}
            />
          )}
          
          {/* 预览加载指示器 */}
          {isGeneratingPreview && Platform.OS !== 'web' && (
            <View style={styles.previewLoading}>
              <ActivityIndicator size="small" color="#3B82F6" />
            </View>
          )}
        </View>

        {/* 美颜参数控制 */}
        <ScrollView
          style={styles.controlsContainer}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        >
          <View style={styles.controls}>
            {/* 磨皮 */}
            <View style={styles.controlItem}>
              <View style={styles.controlHeader}>
                <View style={styles.controlLabelContainer}>
                  <Text style={styles.controlEmoji}>🪞</Text>
                  <Text style={styles.controlLabel}>{t('beauty.smooth')}</Text>
                </View>
                <Text style={styles.controlValue}>{Math.round(params.smooth)}</Text>
              </View>
              <SimpleSlider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                value={params.smooth}
                onValueChange={(value) => updateParam('smooth', value)}
                minimumTrackTintColor="#ec4899"
                maximumTrackTintColor="#E2E8F0"
                thumbTintColor="#ec4899"
              />
            </View>

            {/* 美白 */}
            <View style={styles.controlItem}>
              <View style={styles.controlHeader}>
                <View style={styles.controlLabelContainer}>
                  <Text style={styles.controlEmoji}>✨</Text>
                  <Text style={styles.controlLabel}>{t('beauty.whiten')}</Text>
                </View>
                <Text style={styles.controlValue}>{Math.round(params.whiten)}</Text>
              </View>
              <SimpleSlider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                value={params.whiten}
                onValueChange={(value) => updateParam('whiten', value)}
                minimumTrackTintColor="#f59e0b"
                maximumTrackTintColor="#E2E8F0"
                thumbTintColor="#f59e0b"
              />
            </View>

            {/* 红润 */}
            <View style={styles.controlItem}>
              <View style={styles.controlHeader}>
                <View style={styles.controlLabelContainer}>
                  <Text style={styles.controlEmoji}>🌸</Text>
                  <Text style={styles.controlLabel}>{t('beauty.rosy')}</Text>
                </View>
                <Text style={styles.controlValue}>{Math.round(params.rosy)}</Text>
              </View>
              <SimpleSlider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                value={params.rosy}
                onValueChange={(value) => updateParam('rosy', value)}
                minimumTrackTintColor="#ef4444"
                maximumTrackTintColor="#E2E8F0"
                thumbTintColor="#ef4444"
              />
            </View>

            {/* 对比度 */}
            <View style={styles.controlItem}>
              <View style={styles.controlHeader}>
                <View style={styles.controlLabelContainer}>
                  <Text style={styles.controlEmoji}>🎨</Text>
                  <Text style={styles.controlLabel}>{t('beauty.contrast')}</Text>
                </View>
                <Text style={styles.controlValue}>{Math.round(params.contrast)}</Text>
              </View>
              <SimpleSlider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                value={params.contrast}
                onValueChange={(value) => updateParam('contrast', value)}
                minimumTrackTintColor="#8b5cf6"
                maximumTrackTintColor="#E2E8F0"
                thumbTintColor="#8b5cf6"
              />
            </View>
          </View>
        </ScrollView>

        {/* 底部按钮 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.applyButton, isApplying && styles.applyButtonDisabled]}
            onPress={handleApply}
            disabled={isApplying}
          >
            {isApplying ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.applyButtonText}>{t('beauty.processing')}</Text>
              </>
            ) : (
              <>
                <Check size={20} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.applyButtonText}>{t('beauty.applyBeauty')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// 生成预览图（低质量快速处理）
async function generatePreview(imageUri: string, params: BeautyParams): Promise<string> {
  if (Platform.OS === 'web') {
    return await processBeautyFilterWeb(imageUri, params, true);
  } else {
    return await processBeautyFilterNative(imageUri, params, true);
  }
}

// 处理美颜滤镜（应用时调用，高质量）
async function processBeautyFilter(imageUri: string, params: BeautyParams): Promise<string> {
  if (Platform.OS === 'web') {
    return await processBeautyFilterWeb(imageUri, params, false);
  } else {
    return await processBeautyFilterNative(imageUri, params, false);
  }
}

// Web平台美颜处理
async function processBeautyFilterWeb(imageUri: string, params: BeautyParams, isPreview: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        // 预览时使用较小尺寸以提高性能
        const scale = isPreview ? Math.min(1, 600 / Math.max(img.width, img.height)) : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Cannot get canvas context'));
          return;
        }

        // 应用CSS滤镜效果
        const brightness = 1 + (params.whiten / 100) * 0.3;
        const contrast = 0.8 + (params.contrast / 100) * 0.4;
        const saturate = 1 + (params.rosy / 100) * 0.5;
        const blur = (params.smooth / 100) * 1.5;
        
        ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturate}) blur(${blur}px)`;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // 高质量模式下应用磨皮效果
        if (!isPreview && params.smooth > 10) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const smoothedData = applySkinSmoothing(imageData, params.smooth / 100);
          ctx.putImageData(smoothedData, 0, 0);
        }

        // 转换为base64
        const quality = isPreview ? 0.7 : 0.92;
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUri;
  });
}

// Native平台美颜处理（使用 Canvas 模拟）
async function processBeautyFilterNative(imageUri: string, params: BeautyParams, isPreview: boolean): Promise<string> {
  try {
    // 首先调整图片大小以提高处理速度
    const resizeWidth = isPreview ? 400 : 1080;
    
    const resized = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: resizeWidth } }],
      { compress: isPreview ? 0.6 : 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    // 由于 expo-image-manipulator 不支持复杂滤镜，
    // 我们使用 Canvas API 通过 WebView 或直接模拟效果
    // 这里使用简化的处理方式
    
    // 对于 Native 平台，我们可以通过调整图片的亮度/对比度来模拟部分效果
    // 完整的美颜效果需要使用专门的图像处理库
    
    return resized.uri;
  } catch (error) {
    console.error('Native beauty filter error:', error);
    return imageUri;
  }
}

// 磨皮算法 - 简化的双边滤波
function applySkinSmoothing(imageData: ImageData, intensity: number): ImageData {
  const { data, width, height } = imageData;
  const output = new ImageData(width, height);
  const radius = Math.ceil(intensity * 3); // 减小半径以提高性能
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // 获取周围像素的平均值
      let r = 0, g = 0, b = 0, count = 0;
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nidx = (ny * width + nx) * 4;
            r += data[nidx];
            g += data[nidx + 1];
            b += data[nidx + 2];
            count++;
          }
        }
      }
      
      // 混合原始和平滑后的颜色
      const smoothR = r / count;
      const smoothG = g / count;
      const smoothB = b / count;
      
      const blendFactor = intensity * 0.6;
      output.data[idx] = data[idx] * (1 - blendFactor) + smoothR * blendFactor;
      output.data[idx + 1] = data[idx + 1] * (1 - blendFactor) + smoothG * blendFactor;
      output.data[idx + 2] = data[idx + 2] * (1 - blendFactor) + smoothB * blendFactor;
      output.data[idx + 3] = data[idx + 3];
    }
  }
  
  return output;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerButton: {
    padding: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewLoading: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 20,
  },
  controlsContainer: {
    maxHeight: 320,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  controls: {
    padding: 20,
  },
  controlItem: {
    marginBottom: 16,
  },
  controlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  controlLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlEmoji: {
    fontSize: 16,
  },
  controlLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
  },
  controlValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    minWidth: 30,
    textAlign: 'right',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  applyButton: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonDisabled: {
    opacity: 0.6,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
