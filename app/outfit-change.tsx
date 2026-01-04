import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';

import { Shirt, Download, Share2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useCoin } from '@/contexts/CoinContext';
import { useVerification } from '@/contexts/VerificationContext';
import { useSquare } from '@/contexts/SquareContext';
import { useAuth } from '@/contexts/AuthContext';

type Template = {
  id: string;
  name: string;
  nameEn: string;
  prompt: string;
  icon: string;
};

const templates: Template[] = [
  {
    id: 'christmas',
    name: '圣诞装',
    nameEn: 'Christmas',
    prompt: 'Change the outfit to Christmas style clothing - Santa outfit, festive sweater, or holiday themed clothes with red and green colors',
    icon: '🎄',
  },
  {
    id: 'bikini',
    name: '比基尼',
    nameEn: 'Bikini',
    prompt: 'Change the outfit to a bikini swimsuit, beach style',
    icon: '👙',
  },
  {
    id: 'formal',
    name: '正装',
    nameEn: 'Formal',
    prompt: 'Change the outfit to formal business attire - suit and tie for men or professional dress for women',
    icon: '👔',
  },
  {
    id: 'beggar',
    name: '乞丐装',
    nameEn: 'Beggar Outfit',
    prompt: 'Change the outfit to beggar or tattered clothing - worn-out, ragged clothes with patches and tears',
    icon: '🥺',
  },
  {
    id: 'sport',
    name: '运动装',
    nameEn: 'Sportswear',
    prompt: 'Change the outfit to athletic sportswear - sports jersey, athletic pants, or gym clothes',
    icon: '🏃',
  },
  {
    id: 'wedding',
    name: '婚纱/礼服',
    nameEn: 'Wedding',
    prompt: 'Change the outfit to elegant wedding attire - wedding dress for women or formal tuxedo for men',
    icon: '👰',
  },
  {
    id: 'traditional',
    name: '汉服',
    nameEn: 'Hanfu',
    prompt: 'Change the outfit to traditional Chinese Hanfu clothing with elegant ancient style',
    icon: '🏮',
  },
  {
    id: 'superhero',
    name: '超级英雄',
    nameEn: 'Superhero',
    prompt: 'Change the outfit to a superhero costume with cape and heroic style',
    icon: '🦸',
  },
  {
    id: 'newyear-horse',
    name: '新年装-马年',
    nameEn: 'New Year - Year of Horse',
    prompt: 'Change the outfit to Chinese New Year festive clothing with horse year theme - red and gold colors, traditional patterns with horse motifs',
    icon: '🐴',
  },
];

type OutfitMode = 'template' | 'custom';

export default function OutfitChangeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { coinBalance, deductCoins } = useCoin();
  const { addOutfitChangeHistory } = useVerification();
  const { publishPost } = useSquare();
  const { user } = useAuth();
  const [mode, setMode] = useState<OutfitMode>('template');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [customOutfitImages, setCustomOutfitImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingTime, setGeneratingTime] = useState(0);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [resultHistoryId, setResultHistoryId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const COST_PER_GENERATION = 200;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setResultUri(null);
    }
  };

  const pickCustomOutfitImage = async () => {
    if (customOutfitImages.length >= 3) {
      Alert.alert(t('common.tip'), t('outfitChange.maxImagesReached'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.6, // 降低质量以减小文件大小
      allowsMultipleSelection: true,
      selectionLimit: 3 - customOutfitImages.length,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri);
      setCustomOutfitImages(prev => [...prev, ...newImages].slice(0, 3));
      setResultUri(null);
    }
  };

  const removeCustomOutfitImage = (index: number) => {
    setCustomOutfitImages(prev => prev.filter((_, i) => i !== index));
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(t('errors.permissionDenied'), '需要相机权限');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setResultUri(null);
    }
  };

  const compressImageWeb = async (blob: Blob, maxWidth: number = 800, quality: number = 0.7): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (Platform.OS !== 'web') {
        resolve(blob);
        return;
      }
      
      const img = document.createElement('img') as HTMLImageElement;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 等比例缩放
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (compressedBlob) => {
            if (compressedBlob) {
              console.log('[compressImageWeb] Original size:', blob.size, 'Compressed size:', compressedBlob.size);
              resolve(compressedBlob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(blob);
    });
  };

  const convertToBase64 = async (uri: string, compress: boolean = true): Promise<string> => {
    if (Platform.OS === 'web') {
      try {
        console.log('[convertToBase64] Converting web image:', uri.substring(0, 100));
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        let blob = await response.blob();
        console.log('[convertToBase64] Original blob size:', blob.size, 'bytes');
        
        // 压缩图片（针对自定义穿搭模式）
        if (compress && blob.size > 500000) { // 如果大于500KB则压缩
          console.log('[convertToBase64] Compressing image...');
          blob = await compressImageWeb(blob, 800, 0.7);
        }
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            const base64Data = base64.split(',')[1];
            console.log('[convertToBase64] Conversion complete, base64 length:', base64Data.length);
            resolve(base64Data);
          };
          reader.onerror = (error) => {
            console.error('[convertToBase64] FileReader error:', error);
            reject(error);
          };
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('[convertToBase64] Web conversion error:', error);
        throw new Error('图片转换失败，请重新选择图片');
      }
    } else {
      const base64String = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64String;
    }
  };

  const generateOutfitChange = async () => {
    if (!imageUri) {
      Alert.alert(t('common.tip'), t('outfitChange.selectImage'));
      return;
    }

    if (mode === 'template' && !selectedTemplate) {
      Alert.alert(t('common.tip'), t('outfitChange.selectTemplate'));
      return;
    }

    if (mode === 'custom' && customOutfitImages.length === 0) {
      Alert.alert(t('common.tip'), t('outfitChange.selectOutfitImages'));
      return;
    }

    if (coinBalance < COST_PER_GENERATION) {
      Alert.alert(t('common.tip'), t('outfitChange.insufficientCoins'));
      return;
    }

    setIsGenerating(true);
    setResultUri(null);
    setGeneratingTime(0);

    // 开始计时
    const startTime = Date.now();
    const timer = setInterval(() => {
      setGeneratingTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    try {
      console.log('[OutfitChange] Starting generation, mode:', mode);
      const base64Image = await convertToBase64(imageUri, mode === 'custom'); // 自定义模式启用压缩
      console.log('[OutfitChange] Main image converted, size:', base64Image.length);
      
      let requestBody;
      if (mode === 'template') {
        requestBody = {
          prompt: selectedTemplate!.prompt,
          images: [{ type: 'image', image: base64Image }],
          aspectRatio: '3:4',
        };
        console.log('[OutfitChange] Template mode request body prepared');
      } else {
        // 自定义穿搭模式
        console.log('[OutfitChange] Custom mode, converting', customOutfitImages.length, 'outfit images');
        
        try {
          const outfitBase64Images = await Promise.all(
            customOutfitImages.map(async (uri, index) => {
              console.log(`[OutfitChange] Converting outfit image ${index + 1}/${customOutfitImages.length}`);
              const base64 = await convertToBase64(uri, true); // 启用压缩
              console.log(`[OutfitChange] Outfit image ${index + 1} converted, size:`, base64.length);
              return base64;
            })
          );
          
          const prompt = `IMPORTANT: Keep the person's face, facial features, hairstyle, and body structure exactly the same as in the original image. Only apply the clothing items, accessories, shoes, bags, and hats from the reference images to the VISIBLE body parts in the original image. Do not change or regenerate the person's identity or appearance. Only modify the clothing on the parts that are already visible in the original photo. If a clothing item (like shoes) requires body parts not visible in the original image, DO NOT add those body parts - simply ignore that item. Maintain the original photo's composition, framing, and the person's exact appearance.`;
          
          requestBody = {
            prompt: prompt,
            images: [
              { type: 'image', image: base64Image },
              ...outfitBase64Images.map(img => ({ type: 'reference', image: img }))
            ],
            aspectRatio: '3:4',
          };
          console.log('[OutfitChange] Custom mode request body prepared with', requestBody.images.length, 'images');
        } catch (conversionError) {
          console.error('[OutfitChange] Error converting outfit images:', conversionError);
          throw new Error('图片转换失败，请重试');
        }
      }
      
      console.log('[OutfitChange] Sending request to API...');
      const response = await fetch('https://toolkit.rork.com/images/edit/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      console.log('[OutfitChange] API response received, status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[OutfitChange] API Error:', response.status, errorData);
        
        if (response.status === 413) {
          throw new Error('图片过大，请选择较小的图片或减少图片数量');
        }
        
        throw new Error(`生成失败: HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.image || !data.image.base64Data) {
        console.error('Invalid response data:', data);
        throw new Error('生成失败: 服务器返回数据格式错误');
      }

      const generatedImageUri = `data:${data.image.mimeType};base64,${data.image.base64Data}`;
      
      setResultUri(generatedImageUri);
      await deductCoins(COST_PER_GENERATION);
      
      // 保存到历史记录
      try {
        const templateId = mode === 'template' ? selectedTemplate!.id : 'custom-outfit';
        const templateName = mode === 'template' ? selectedTemplate!.name : t('outfitChange.customOutfit');
        
        const historyId = await addOutfitChangeHistory(
          imageUri,
          generatedImageUri,
          templateId,
          templateName
        );
        setResultHistoryId(historyId);
      } catch (historyError) {
        console.error('Failed to save to history:', historyError);
      }
      
    } catch (error: any) {
      console.error('[OutfitChange] Generation error:', error);
      let errorMessage = t('outfitChange.generationFailed');
      
      if (error.message === 'Failed to fetch') {
        errorMessage = '网络连接失败，请检查网络连接后重试';
        console.error('[OutfitChange] Network error - Failed to fetch');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      clearInterval(timer);
      setIsGenerating(false);
      setGeneratingTime(0);
    }
  };

  const downloadImage = async () => {
    if (!resultUri) return;

    setIsDownloading(true);

    try {
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = resultUri;
        link.download = `outfit-change-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Alert.alert(t('common.success'), t('outfitChange.downloadSuccess'));
      } else {
        // 请求相册权限
        console.log('Requesting media library permission...');
        const { status } = await MediaLibrary.requestPermissionsAsync();
        
        if (status !== 'granted') {
          console.error('Media library permission denied');
          Alert.alert(t('errors.permissionDenied'), t('outfitChange.mediaLibraryPermission'));
          return;
        }

        console.log('Permission granted, preparing to save image...');

        // 如果是 base64 数据 URL，需要先保存为临时文件
        let fileUri = resultUri;
        if (resultUri.startsWith('data:')) {
          const filename = `outfit-change-${Date.now()}.jpg`;
          fileUri = `${FileSystem.cacheDirectory}${filename}`;
          
          console.log('Converting base64 to file:', fileUri);
          const base64Data = resultUri.split(',')[1];
          await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          console.log('File saved to cache directory');
        }

        // 使用 saveToLibraryAsync 直接保存到相册
        console.log('Saving to gallery:', fileUri);
        await MediaLibrary.saveToLibraryAsync(fileUri);
        console.log('Image saved to gallery successfully');
        Alert.alert(t('common.success'), t('outfitChange.downloadSuccess'));
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert(t('common.error'), t('outfitChange.downloadFailed'));
    } finally {
      setIsDownloading(false);
    }
  };

  const publishToSquare = async () => {
    if (!resultUri || !imageUri || !user || !resultHistoryId) {
      if (!user) {
        Alert.alert(t('common.tip'), t('square.loginRequired'));
      }
      return;
    }

    const templateName = mode === 'template' 
      ? (selectedTemplate?.name || '') 
      : t('outfitChange.customOutfit');

    setIsPublishing(true);
    try {
      const postId = await publishPost({
        userId: user.userId,
        userNickname: user.nickname || user.userId,
        userAvatar: user.avatar,
        postType: 'outfitChange',
        outfitChangeId: resultHistoryId,
        originalImageUri: imageUri,
        resultImageUri: resultUri,
        templateName: templateName,
        pinnedCommentId: undefined,
      });

      Alert.alert(
        t('common.success'),
        t('square.publishSuccessPrompt'),
        [
          {
            text: t('common.no'),
            style: 'cancel',
          },
          {
            text: t('common.yes'),
            onPress: () => {
              router.push({
                pathname: '/(tabs)/square',
                params: { postId },
              } as any);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to publish to square:', error);
      Alert.alert(t('common.error'), t('square.publishFailed'));
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t('outfitChange.title'),
          headerStyle: { backgroundColor: '#fff' },
          headerRight: () => (
            <TouchableOpacity 
              style={styles.headerRightContainer}
              onPress={() => router.push('/recharge' as any)}
              activeOpacity={0.7}
            >
              <View style={styles.coinBadge}>
                <Text style={styles.coinIcon}>💰</Text>
                <Text style={styles.coinText}>{coinBalance}</Text>
              </View>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('outfitChange.uploadImage')}</Text>
          <Text style={styles.sectionDesc}>{t('outfitChange.uploadImageDesc')}</Text>
          
          {imageUri ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />
              <TouchableOpacity style={styles.reuploadButton} onPress={pickImage}>
                <Text style={styles.reuploadText}>{t('outfitChange.reupload')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadButtons}>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Text style={styles.uploadIcon}>📁</Text>
                <Text style={styles.uploadButtonText}>{t('upload.selectPhoto')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                <Text style={styles.uploadIcon}>📷</Text>
                <Text style={styles.uploadButtonText}>{t('upload.takePhoto')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('outfitChange.selectMode')}</Text>
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'template' && styles.modeButtonActive]}
              onPress={() => {
                setMode('template');
                setResultUri(null);
              }}
            >
              <Text style={[styles.modeButtonText, mode === 'template' && styles.modeButtonTextActive]}>
                {t('outfitChange.templateMode')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'custom' && styles.modeButtonActive]}
              onPress={() => {
                setMode('custom');
                setResultUri(null);
              }}
            >
              <Text style={[styles.modeButtonText, mode === 'custom' && styles.modeButtonTextActive]}>
                {t('outfitChange.customMode')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {mode === 'template' ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('outfitChange.selectTemplate')}</Text>
              <View style={styles.costBadge}>
                <Text style={styles.costBadgeText}>💰 {COST_PER_GENERATION}</Text>
              </View>
            </View>
            <Text style={styles.sectionDesc}>{t('outfitChange.selectTemplateDesc')}</Text>
            
            <View style={styles.templatesGrid}>
            {templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.templateCard,
                  selectedTemplate?.id === template.id && styles.templateCardSelected,
                ]}
                onPress={() => setSelectedTemplate(template)}
                disabled={isGenerating}
              >
                <Text style={styles.templateIcon}>{template.icon}</Text>
                <Text style={styles.templateName}>{t(`outfitChange.templates.${template.id}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('outfitChange.uploadOutfitImages')}</Text>
              <View style={styles.costBadge}>
                <Text style={styles.costBadgeText}>💰 {COST_PER_GENERATION}</Text>
              </View>
            </View>
            <Text style={styles.sectionDesc}>{t('outfitChange.uploadOutfitImagesDesc')}</Text>
            
            <View style={styles.outfitImagesContainer}>
              {customOutfitImages.map((uri, index) => (
                <View key={index} style={styles.outfitImageItem}>
                  <Image source={{ uri }} style={styles.outfitImagePreview} contentFit="cover" />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeCustomOutfitImage(index)}
                  >
                    <Text style={styles.removeImageText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              
              {customOutfitImages.length < 3 && (
                <TouchableOpacity
                  style={styles.addOutfitImageButton}
                  onPress={pickCustomOutfitImage}
                  disabled={isGenerating}
                >
                  <Text style={styles.addOutfitImageIcon}>+</Text>
                  <Text style={styles.addOutfitImageText}>{t('outfitChange.addImage')}</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {customOutfitImages.length > 0 && (
              <Text style={styles.imageCountText}>
                {t('outfitChange.imageCount', { count: customOutfitImages.length, max: 3 })}
              </Text>
            )}
          </View>
        )}

        {resultUri && (
          <View style={styles.section}>
            <View style={styles.resultHeader}>
              <Text style={styles.sectionTitle}>{t('outfitChange.result')}</Text>
              <View style={styles.resultActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={publishToSquare}
                  disabled={isPublishing}
                >
                  {isPublishing ? (
                    <ActivityIndicator size="small" color="#0066FF" />
                  ) : (
                    <>
                      <Share2 size={16} color="#0066FF" />
                      <Text style={styles.actionButtonText}>{t('square.publishToSquare')}</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={downloadImage}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <ActivityIndicator size="small" color="#0066FF" />
                  ) : (
                    <>
                      <Download size={16} color="#0066FF" />
                      <Text style={styles.actionButtonText}>{t('outfitChange.downloadToAlbum')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.resultContainer}>
              <Image source={{ uri: resultUri }} style={styles.resultImage} contentFit="cover" />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.generateButton,
            (
              !imageUri || 
              isGenerating || 
              (mode === 'template' && !selectedTemplate) || 
              (mode === 'custom' && customOutfitImages.length === 0)
            ) && styles.generateButtonDisabled,
          ]}
          onPress={generateOutfitChange}
          disabled={
            !imageUri || 
            isGenerating || 
            (mode === 'template' && !selectedTemplate) || 
            (mode === 'custom' && customOutfitImages.length === 0)
          }
        >
          {isGenerating ? (
            <View style={styles.generatingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.generateButtonText}>
                {t('outfitChange.generating')} {generatingTime}s
              </Text>
            </View>
          ) : (
            <Text style={styles.generateButtonText}>{t('outfitChange.generate')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerRightContainer: {
    marginRight: 10,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFF9E6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
    gap: 4,
  },
  coinIcon: {
    fontSize: 16,
  },
  coinText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4AF37',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0066FF',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066FF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  costBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  costBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  sectionDesc: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 20,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  imagePreview: {
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  reuploadButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  reuploadText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  templateCard: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  templateCardSelected: {
    borderColor: '#0066FF',
    backgroundColor: '#EFF6FF',
  },
  templateIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  templateName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
  },
  resultContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  resultImage: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  generateButton: {
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  generatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  modeButtonActive: {
    borderColor: '#0066FF',
    backgroundColor: '#F0F9FF',
  },
  modeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  modeButtonTextActive: {
    color: '#0066FF',
  },
  outfitImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  outfitImageItem: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  outfitImagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  addOutfitImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addOutfitImageIcon: {
    fontSize: 32,
    color: '#94A3B8',
  },
  addOutfitImageText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  imageCountText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});
