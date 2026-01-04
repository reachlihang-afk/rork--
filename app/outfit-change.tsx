import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';

import { Shirt, Download } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useCoin } from '@/contexts/CoinContext';
import { useVerification } from '@/contexts/VerificationContext';

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

export default function OutfitChangeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { coinBalance, deductCoins } = useCoin();
  const { addOutfitChangeHistory } = useVerification();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingTime, setGeneratingTime] = useState(0);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const convertToBase64 = async (uri: string): Promise<string> => {
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      const base64String = await FileSystem.readAsStringAsync(uri, FileSystem.EncodingType.Base64);
      return base64String;
    }
  };

  const generateOutfitChange = async () => {
    if (!imageUri || !selectedTemplate) {
      Alert.alert(t('common.tip'), t('outfitChange.selectImageAndTemplate'));
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
      const base64Image = await convertToBase64(imageUri);
      
      const response = await fetch('https://toolkit.rork.com/images/edit/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: selectedTemplate.prompt,
          images: [{ type: 'image', image: base64Image }],
          aspectRatio: '3:4',
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error:', response.status, errorData);
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
        await addOutfitChangeHistory(
          imageUri,
          generatedImageUri,
          selectedTemplate.id,
          selectedTemplate.name
        );
      } catch (historyError) {
        console.error('Failed to save to history:', historyError);
      }
      
    } catch (error: any) {
      console.error('Outfit change error:', error);
      const errorMessage = error.message || t('outfitChange.generationFailed');
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
        const { status } = await MediaLibrary.requestPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert(t('errors.permissionDenied'), t('outfitChange.mediaLibraryPermission'));
          return;
        }

        const filename = `outfit-change-${Date.now()}.jpg`;
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;
        
        // 如果是 base64 数据，直接写入文件
        if (resultUri.startsWith('data:')) {
          const base64Data = resultUri.split(',')[1];
          await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } else {
          // 如果是普通 URL，下载文件
          await FileSystem.downloadAsync(resultUri, fileUri);
        }

        const asset = await MediaLibrary.createAssetAsync(fileUri);
        
        try {
          await MediaLibrary.createAlbumAsync('OutfitChange', asset, false);
        } catch (e) {
          // 相册已存在，忽略错误
        }
        
        Alert.alert(t('common.success'), t('outfitChange.downloadSuccess'));
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert(t('common.error'), t('outfitChange.downloadFailed'));
    } finally {
      setIsDownloading(false);
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
          <Text style={styles.sectionTitle}>{t('outfitChange.selectTemplate')}</Text>
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

        {resultUri && (
          <View style={styles.section}>
            <View style={styles.resultHeader}>
              <Text style={styles.sectionTitle}>{t('outfitChange.result')}</Text>
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={downloadImage}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <ActivityIndicator size="small" color="#0066FF" />
                ) : (
                  <>
                    <Download size={18} color="#0066FF" />
                    <Text style={styles.downloadButtonText}>{t('outfitChange.downloadToAlbum')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.resultContainer}>
              <Image source={{ uri: resultUri }} style={styles.resultImage} contentFit="cover" />
            </View>
          </View>
        )}

        <View style={styles.costInfo}>
          <Text style={styles.costText}>
            {t('outfitChange.costPerGeneration', { cost: COST_PER_GENERATION })}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.generateButton,
            (!imageUri || !selectedTemplate || isGenerating) && styles.generateButtonDisabled,
          ]}
          onPress={generateOutfitChange}
          disabled={!imageUri || !selectedTemplate || isGenerating}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
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
  costInfo: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  costText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    fontWeight: '600',
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
});
