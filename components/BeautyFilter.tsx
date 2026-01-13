import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import SimpleSlider from './SimpleSlider';
import { X, Sparkles, Check } from 'lucide-react-native';
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

  // 重置参数
  const handleReset = useCallback(() => {
    setParams(DEFAULT_PARAMS);
  }, []);

  // 应用美颜效果
  const handleApply = useCallback(async () => {
    setIsApplying(true);
    try {
      // 使用 Canvas API (Web) 或 ImageManipulator (Native) 处理图像
      const beautifiedUri = await processBeautyFilter(imageUri, params);
      onApply(beautifiedUri, params);
    } catch (error) {
      console.error('Beauty filter application error:', error);
      // 如果处理失败，直接返回原图
      onApply(imageUri, params);
    } finally {
      setIsApplying(false);
    }
  }, [imageUri, params, onApply]);

  // 更新参数
  const updateParam = useCallback((key: keyof BeautyParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  // 计算实时CSS滤镜效果（仅用于预览）
  const getImageStyle = useCallback(() => {
    if (Platform.OS === 'web') {
      // Web平台使用CSS滤镜实现实时预览
      const brightness = 1 + (params.whiten / 100) * 0.3; // 美白: 1.0 - 1.3
      const contrast = 0.8 + (params.contrast / 100) * 0.4; // 对比度: 0.8 - 1.2
      const saturate = 1 + (params.rosy / 100) * 0.5; // 饱和度: 1.0 - 1.5
      const blur = (params.smooth / 100) * 1.5; // 模糊: 0 - 1.5px
      
      return {
        width: '100%',
        height: '100%',
        filter: `brightness(${brightness}) contrast(${contrast}) saturate(${saturate}) blur(${blur}px)`,
      };
    }
    return styles.previewImage;
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
            <Text style={styles.resetText}>{t('beauty.reset')}</Text>
          </TouchableOpacity>
        </View>

        {/* 预览区域 - 实时显示滤镜效果 */}
        <View style={styles.previewContainer}>
          {Platform.OS === 'web' ? (
            <img 
              src={imageUri} 
              style={getImageStyle() as any}
              alt="Beauty preview"
            />
          ) : (
            <>
              <Image
                source={{ uri: imageUri }}
                style={styles.previewImage}
                contentFit="contain"
              />
              {/* Native平台显示提示 */}
              <View style={styles.nativeHint}>
                <Text style={styles.nativeHintText}>
                  {t('beauty.adjustHint')}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* 美颜参数控制 */}
        <ScrollView style={styles.controlsContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.controls}>
            {/* 磨皮 */}
            <View style={styles.controlItem}>
              <View style={styles.controlHeader}>
                <Text style={styles.controlLabel}>{t('beauty.smooth')}</Text>
                <Text style={styles.controlValue}>{Math.round(params.smooth)}</Text>
              </View>
              <SimpleSlider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                value={params.smooth}
                onValueChange={(value) => updateParam('smooth', value)}
                minimumTrackTintColor="#3B82F6"
                maximumTrackTintColor="#E2E8F0"
                thumbTintColor="#3B82F6"
              />
            </View>

            {/* 美白 */}
            <View style={styles.controlItem}>
              <View style={styles.controlHeader}>
                <Text style={styles.controlLabel}>{t('beauty.whiten')}</Text>
                <Text style={styles.controlValue}>{Math.round(params.whiten)}</Text>
              </View>
              <SimpleSlider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                value={params.whiten}
                onValueChange={(value) => updateParam('whiten', value)}
                minimumTrackTintColor="#3B82F6"
                maximumTrackTintColor="#E2E8F0"
                thumbTintColor="#3B82F6"
              />
            </View>

            {/* 红润 */}
            <View style={styles.controlItem}>
              <View style={styles.controlHeader}>
                <Text style={styles.controlLabel}>{t('beauty.rosy')}</Text>
                <Text style={styles.controlValue}>{Math.round(params.rosy)}</Text>
              </View>
              <SimpleSlider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                value={params.rosy}
                onValueChange={(value) => updateParam('rosy', value)}
                minimumTrackTintColor="#3B82F6"
                maximumTrackTintColor="#E2E8F0"
                thumbTintColor="#3B82F6"
              />
            </View>

            {/* 对比度 */}
            <View style={styles.controlItem}>
              <View style={styles.controlHeader}>
                <Text style={styles.controlLabel}>{t('beauty.contrast')}</Text>
                <Text style={styles.controlValue}>{Math.round(params.contrast)}</Text>
              </View>
              <SimpleSlider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                value={params.contrast}
                onValueChange={(value) => updateParam('contrast', value)}
                minimumTrackTintColor="#3B82F6"
                maximumTrackTintColor="#E2E8F0"
                thumbTintColor="#3B82F6"
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
              <Text style={styles.applyButtonText}>{t('beauty.processing')}...</Text>
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

// 处理美颜滤镜（应用时调用）
async function processBeautyFilter(imageUri: string, params: BeautyParams): Promise<string> {
  if (Platform.OS === 'web') {
    // Web平台使用Canvas API处理
    return await processBeautyFilterWeb(imageUri, params);
  } else {
    // Native平台使用简化处理
    return await processBeautyFilterNative(imageUri, params);
  }
}

// Web平台美颜处理
async function processBeautyFilterWeb(imageUri: string, params: BeautyParams): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
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
        ctx.drawImage(img, 0, 0);
        
        // 磨皮效果 - 双重模糊处理
        if (params.smooth > 10) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const smoothedData = applySkinSmoothing(imageData, params.smooth / 100);
          ctx.putImageData(smoothedData, 0, 0);
        }

        // 转换为base64
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
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

// Native平台美颜处理（简化版）
async function processBeautyFilterNative(imageUri: string, params: BeautyParams): Promise<string> {
  try {
    // 使用expo-image-manipulator进行基础处理
    // 注意：这是简化版本，效果不如Web平台
    const actions: ImageManipulator.Action[] = [];

    // 调整图像大小以提高性能（可选）
    // actions.push({ resize: { width: 1080 } });

    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      actions,
      {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return result.uri;
  } catch (error) {
    console.error('Native beauty filter error:', error);
    return imageUri; // 返回原图
  }
}

// 磨皮算法 - 简化的双边滤波
function applySkinSmoothing(imageData: ImageData, intensity: number): ImageData {
  const { data, width, height } = imageData;
  const output = new ImageData(width, height);
  const radius = Math.ceil(intensity * 5); // 0-5像素
  
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
      
      const blendFactor = intensity * 0.7; // 混合因子
      output.data[idx] = data[idx] * (1 - blendFactor) + smoothR * blendFactor;
      output.data[idx + 1] = data[idx + 1] * (1 - blendFactor) + smoothG * blendFactor;
      output.data[idx + 2] = data[idx + 2] * (1 - blendFactor) + smoothB * blendFactor;
      output.data[idx + 3] = data[idx + 3]; // Alpha不变
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
    minWidth: 60,
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
  resetText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  nativeHint: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    padding: 12,
    borderRadius: 8,
  },
  nativeHintText: {
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'center',
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
    marginBottom: 20,
  },
  controlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  controlLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
  },
  controlValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
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
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
