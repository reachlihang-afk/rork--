import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system/legacy';
import SimpleSlider from './SimpleSlider';
import { X, Sparkles, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export interface BeautyParams {
  smooth: number;      // 磨皮 0-100
  whiten: number;      // 美白 0-100
  thinFace: number;    // 瘦脸 0-100
  enlargeEyes: number; // 大眼 0-100
  rosy: number;        // 红润 0-100
}

interface BeautyFilterProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  onApply: (beautifiedUri: string, params: BeautyParams) => void;
}

const DEFAULT_PARAMS: BeautyParams = {
  smooth: 50,
  whiten: 30,
  thinFace: 20,
  enlargeEyes: 20,
  rosy: 30,
};

export default function BeautyFilter({ visible, imageUri, onClose, onApply }: BeautyFilterProps) {
  const { t } = useTranslation();
  const [params, setParams] = useState<BeautyParams>(DEFAULT_PARAMS);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleReset = () => {
    setParams(DEFAULT_PARAMS);
  };

  const handleApply = async () => {
    setIsProcessing(true);
    try {
      // 调用美颜API处理图片
      const beautifiedUri = await applyBeautyFilter(imageUri, params);
      onApply(beautifiedUri, params);
    } catch (error) {
      console.error('Beauty filter error:', error);
      Alert.alert(t('common.error'), t('beauty.processingFailed'));
    } finally {
      setIsProcessing(false);
    }
  };

  const updateParam = (key: keyof BeautyParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

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
            <Text style={styles.headerTitleText}>{t('beauty.title')}</Text>
          </View>
          <TouchableOpacity onPress={handleReset} style={styles.headerButton}>
            <Text style={styles.resetText}>{t('beauty.reset')}</Text>
          </TouchableOpacity>
        </View>

        {/* 预览区域 */}
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.previewImage}
            contentFit="contain"
          />
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.processingText}>{t('beauty.processing')}</Text>
            </View>
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
              <SimpleSimpleSlider
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

            {/* 瘦脸 */}
            <View style={styles.controlItem}>
              <View style={styles.controlHeader}>
                <Text style={styles.controlLabel}>{t('beauty.thinFace')}</Text>
                <Text style={styles.controlValue}>{Math.round(params.thinFace)}</Text>
              </View>
              <SimpleSlider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                value={params.thinFace}
                onValueChange={(value) => updateParam('thinFace', value)}
                minimumTrackTintColor="#3B82F6"
                maximumTrackTintColor="#E2E8F0"
                thumbTintColor="#3B82F6"
              />
            </View>

            {/* 大眼 */}
            <View style={styles.controlItem}>
              <View style={styles.controlHeader}>
                <Text style={styles.controlLabel}>{t('beauty.enlargeEyes')}</Text>
                <Text style={styles.controlValue}>{Math.round(params.enlargeEyes)}</Text>
              </View>
              <SimpleSlider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                value={params.enlargeEyes}
                onValueChange={(value) => updateParam('enlargeEyes', value)}
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
          </View>
        </ScrollView>

        {/* 底部按钮 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.applyButton, isProcessing && styles.applyButtonDisabled]}
            onPress={handleApply}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Check size={20} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.applyButtonText}>{t('beauty.apply')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// 美颜处理函数
async function applyBeautyFilter(imageUri: string, params: BeautyParams): Promise<string> {
  try {
    // 转换图片为base64
    let base64: string;
    
    if (Platform.OS === 'web') {
      // Web平台使用FileReader
      const response = await fetch(imageUri);
      const blob = await response.blob();
      base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // 移除 data:image/...;base64, 前缀
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.readAsDataURL(blob);
      });
    } else {
      // React Native平台使用expo-file-system
      if (imageUri.startsWith('data:')) {
        // 如果已经是base64格式
        base64 = imageUri.split(',')[1];
      } else {
        // 从文件URI读取
        base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
    }

    // 构建美颜API请求
    const beautyPrompt = buildBeautyPrompt(params);
    
    const requestBody = {
      prompt: beautyPrompt,
      images: [{ type: 'image', image: base64 }],
      aspectRatio: '3:4',
    };

    // 调用AI API进行美颜处理
    const apiResponse = await fetch('https://toolkit.rork.com/images/edit/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok) {
      throw new Error(`API Error: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    
    if (!data.image || !data.image.base64Data) {
      throw new Error('Invalid response data');
    }

    return `data:${data.image.mimeType};base64,${data.image.base64Data}`;
  } catch (error) {
    console.error('Beauty filter processing error:', error);
    throw error;
  }
}

// 构建美颜prompt
function buildBeautyPrompt(params: BeautyParams): string {
  const effects: string[] = [];
  
  if (params.smooth > 0) {
    const intensity = params.smooth > 70 ? 'strong' : params.smooth > 40 ? 'moderate' : 'subtle';
    effects.push(`Apply ${intensity} skin smoothing and blemish removal to achieve flawless, natural-looking skin texture`);
  }
  
  if (params.whiten > 0) {
    const intensity = params.whiten > 70 ? 'significantly' : params.whiten > 40 ? 'moderately' : 'slightly';
    effects.push(`${intensity} brighten and whiten the skin tone for a radiant, luminous complexion`);
  }
  
  if (params.thinFace > 0) {
    const intensity = params.thinFace > 70 ? 'significantly' : params.thinFace > 40 ? 'moderately' : 'slightly';
    effects.push(`${intensity} slim and contour the face shape for a more defined, V-shaped facial structure`);
  }
  
  if (params.enlargeEyes > 0) {
    const intensity = params.enlargeEyes > 70 ? 'significantly' : params.enlargeEyes > 40 ? 'moderately' : 'slightly';
    effects.push(`${intensity} enlarge the eyes to make them appear brighter, more open and expressive`);
  }
  
  if (params.rosy > 0) {
    const intensity = params.rosy > 70 ? 'strong' : params.rosy > 40 ? 'moderate' : 'subtle';
    effects.push(`Add ${intensity} rosy, healthy blush to the cheeks for a youthful, vibrant appearance`);
  }

  const prompt = `CRITICAL: Apply beauty enhancement effects while maintaining natural appearance and authenticity. 

PRESERVE EXACTLY:
- Overall facial structure and identity
- Hair style, color, and position
- Body pose and framing
- Background and lighting
- Clothing and accessories
- Photo composition

BEAUTY ENHANCEMENTS TO APPLY:
${effects.join('. ')}

IMPORTANT GUIDELINES:
- Keep all enhancements natural and realistic
- Maintain facial recognition and identity
- Do NOT change hairstyle, hair color, or clothing
- Do NOT alter background or photo composition
- Do NOT change facial expression or pose
- Ensure the result looks like a natural, enhanced version of the original person`;

  return prompt;
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
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  controlsContainer: {
    maxHeight: 300,
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

