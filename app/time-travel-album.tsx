import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Camera, Share2, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuth } from '@/contexts/AuthContext';
import { useCoin } from '@/contexts/CoinContext';
import { useLanguage } from '@/contexts/LanguageContext';

// 历史场景
const HISTORICAL_SCENES = [
  {
    id: 'ancient_rome',
    name: '古罗马竞技场',
    nameEn: 'Ancient Rome Colosseum',
    icon: '🏛️',
    prompt: 'Transform this person into an ancient Roman citizen wearing traditional toga and sandals, standing in the Colosseum with crowds cheering, golden sunlight, epic historical scene',
    gradient: ['#8B7355', '#D2691E'],
  },
  {
    id: 'shanghai_1920',
    name: '1920上海滩',
    nameEn: '1920s Shanghai',
    icon: '🎭',
    prompt: 'Transform this person into a 1920s Shanghai socialite wearing elegant qipao dress, Art Deco interior, vintage Shanghai Bund backdrop, glamorous old Shanghai atmosphere',
    gradient: ['#2c3e50', '#34495e'],
  },
  {
    id: 'movie_set',
    name: '经典电影剧组',
    nameEn: 'Classic Movie Set',
    icon: '🎬',
    prompt: 'Transform this person into a classic Hollywood golden age movie star, wearing glamorous vintage evening gown or suit, on a vintage movie set with cameras and lights',
    gradient: ['#1a1a2e', '#16213e'],
  },
  {
    id: 'hong_kong_90s',
    name: '90年代香港街头',
    nameEn: '90s Hong Kong Street',
    icon: '📸',
    prompt: 'Transform this person into a 90s Hong Kong street scene, wearing vintage Hong Kong fashion, neon signs, bustling Kowloon street backdrop, nostalgic film photography style',
    gradient: ['#e74c3c', '#c0392b'],
  },
  {
    id: 'space_station',
    name: '太空站',
    nameEn: 'Space Station',
    icon: '🚀',
    prompt: 'Transform this person into an astronaut inside a space station, wearing NASA spacesuit, Earth visible through window, zero gravity environment, cinematic sci-fi lighting',
    gradient: ['#0f0c29', '#302b63'],
  },
  {
    id: 'versailles',
    name: '凡尔赛宫',
    nameEn: 'Palace of Versailles',
    icon: '👑',
    prompt: 'Transform this person into French aristocracy at Palace of Versailles, wearing elaborate 18th century royal court dress, grand hall with chandeliers and mirrors',
    gradient: ['#DAA520', '#B8860B'],
  },
  {
    id: 'woodstock',
    name: '1969伍德斯托克',
    nameEn: '1969 Woodstock',
    icon: '✌️',
    prompt: 'Transform this person into a 1969 Woodstock festival attendee, wearing hippie bohemian clothes, flower crown, peace signs, outdoor music festival atmosphere',
    gradient: ['#9b59b6', '#8e44ad'],
  },
  {
    id: 'ancient_egypt',
    name: '古埃及金字塔',
    nameEn: 'Ancient Egypt Pyramids',
    icon: '🏺',
    prompt: 'Transform this person into ancient Egyptian royalty, wearing traditional Egyptian headdress and gold jewelry, pyramids and Sphinx in background, golden desert light',
    gradient: ['#f39c12', '#e67e22'],
  },
];

const COMMON_PROMPT_PREFIX = '';
const QUALITY_SUFFIX = '. Cinematic photography, dramatic lighting, highly detailed, professional quality, 4K resolution';

export default function TimeTravelAlbumScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoggedIn } = useAuth();
  const { canUseOutfitChange, useOutfitChange } = useCoin();
  const { currentLanguage } = useLanguage();

  const [userImage, setUserImage] = useState<string | null>(null);
  const [selectedScene, setSelectedScene] = useState(HISTORICAL_SCENES[0]);
  const [result, setResult] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // 上传照片
  const handleUploadPhoto = useCallback(async () => {
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!pickerResult.canceled && pickerResult.assets[0]) {
      setUserImage(pickerResult.assets[0].uri);
      setResult(null);
    }
  }, []);

  // 压缩并转换图片为Base64
  const convertToBase64 = async (uri: string): Promise<string> => {
    try {
      // 先压缩图片
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      // 转换为Base64
      const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('[TimeTravelAlbum] Image compressed, base64 length:', base64.length);
      return base64;
    } catch (error) {
      console.error('[TimeTravelAlbum] Compression error:', error);
      // 压缩失败时直接转换
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    }
  };

  // 生成穿越照片
  const handleGenerate = useCallback(async () => {
    if (!userImage) {
      Alert.alert(t('common.tip'), currentLanguage === 'zh' ? '请先上传照片' : 'Please upload a photo first');
      return;
    }

    if (!isLoggedIn) {
      Alert.alert(t('common.tip'), t('outfitChange.loginRequired'));
      router.push('/(tabs)/profile' as any);
      return;
    }

    const canUse = await canUseOutfitChange();
    if (!canUse) {
      Alert.alert(
        t('common.tip'),
        currentLanguage === 'zh' ? '穿越相册需要消耗10钻石' : 'Time Travel costs 10 diamonds',
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('profile.recharge'), onPress: () => router.push('/recharge' as any) }
        ]
      );
      return;
    }

    setIsGenerating(true);

    try {
      const base64Image = await convertToBase64(userImage);
      const prompt = COMMON_PROMPT_PREFIX + selectedScene.prompt + QUALITY_SUFFIX;

      const response = await fetch('https://api.rfrm.app/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer rk-9IkXUdcuC9ET9p6xVgJv5nW67cXUmyPqzUkVAwlpLdc',
        },
        body: JSON.stringify({
          prompt,
          images: [{ type: 'image', image: base64Image }],
          aspectRatio: '3:4',
        }),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const data = await response.json();
      const resultUrl = data.images?.[0]?.url || data.output?.[0]?.url;
      
      setResult(resultUrl);
      await useOutfitChange();

    } catch (error) {
      console.error('Generation error:', error);
      Alert.alert(t('common.error'), currentLanguage === 'zh' ? '生成失败，请重试' : 'Generation failed, please try again');
    } finally {
      setIsGenerating(false);
    }
  }, [userImage, isLoggedIn, selectedScene, canUseOutfitChange, useOutfitChange, currentLanguage, t, router]);

  // 分享结果
  const handleShare = useCallback(async () => {
    if (!result) return;

    const shareMessage = currentLanguage === 'zh' 
      ? `🕰️ 我穿越到了${selectedScene.name}！\n来看看我的穿越照片吧~`
      : `🕰️ I traveled to ${selectedScene.nameEn}!\nCheck out my time travel photo~`;

    try {
      await Share.share({ message: shareMessage });
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [result, selectedScene, currentLanguage]);

  // 未登录提示
  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={['#0f766e', '#14b8a6']} style={styles.gradientBg}>
          <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {currentLanguage === 'zh' ? '穿越相册' : 'Time Travel Album'}
            </Text>
            <View style={styles.headerPlaceholder} />
          </View>
          <View style={styles.loginPrompt}>
            <Text style={styles.loginPromptIcon}>🕰️</Text>
            <Text style={styles.loginPromptTitle}>{t('outfitChange.loginRequired')}</Text>
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => router.push('/(tabs)/profile' as any)}
            >
              <Text style={styles.loginButtonText}>{t('common.login')}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <LinearGradient colors={selectedScene.gradient} style={styles.gradientBg}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {currentLanguage === 'zh' ? '穿越相册' : 'Time Travel Album'}
          </Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 上传区域 */}
          <TouchableOpacity
            style={styles.uploadArea}
            onPress={handleUploadPhoto}
            activeOpacity={0.8}
          >
            {userImage ? (
              <>
                <Image source={{ uri: userImage }} style={styles.uploadedImage} contentFit="cover" />
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => {
                    setUserImage(null);
                    setResult(null);
                  }}
                >
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Camera size={32} color="#fff" />
                <Text style={styles.uploadText}>
                  {currentLanguage === 'zh' ? '点击上传照片' : 'Tap to upload photo'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* 历史场景选择 */}
          <Text style={styles.sectionTitle}>
            {currentLanguage === 'zh' ? '🕰️ 选择穿越目的地' : '🕰️ Choose Destination'}
          </Text>
          
          <View style={styles.scenesGrid}>
            {HISTORICAL_SCENES.map((scene) => (
              <TouchableOpacity
                key={scene.id}
                style={[
                  styles.sceneCard,
                  selectedScene.id === scene.id && styles.sceneCardSelected
                ]}
                onPress={() => {
                  setSelectedScene(scene);
                  setResult(null);
                }}
                activeOpacity={0.8}
              >
                <LinearGradient colors={scene.gradient} style={styles.sceneCardGradient}>
                  <Text style={styles.sceneIcon}>{scene.icon}</Text>
                  <Text style={styles.sceneName}>
                    {currentLanguage === 'zh' ? scene.name : scene.nameEn}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* 生成结果 */}
          {result && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>
                {currentLanguage === 'zh' ? '🎉 穿越成功！' : '🎉 Time Travel Success!'}
              </Text>
              <Image source={{ uri: result }} style={styles.resultImage} contentFit="cover" />
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Share2 size={20} color="#fff" />
                <Text style={styles.shareButtonText}>
                  {currentLanguage === 'zh' ? '分享穿越照片' : 'Share Time Travel Photo'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* 底部按钮 */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.costInfo}>
            <Text style={styles.costText}>💎 10</Text>
          </View>
          <TouchableOpacity
            style={[styles.generateButton, (!userImage || isGenerating) && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={!userImage || isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color="#0f766e" />
            ) : (
              <Text style={styles.generateButtonText}>
                {currentLanguage === 'zh' ? '🕰️ 开始穿越' : '🕰️ Start Travel'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBg: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  uploadArea: {
    aspectRatio: 3/4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 24,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    marginTop: 12,
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  scenesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  sceneCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  sceneCardSelected: {
    borderColor: '#fff',
  },
  sceneCardGradient: {
    padding: 16,
    alignItems: 'center',
  },
  sceneIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  sceneName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  resultContainer: {
    marginTop: 8,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  resultImage: {
    aspectRatio: 3/4,
    borderRadius: 16,
    marginBottom: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  costInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  costText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  generateButton: {
    flex: 1,
    marginLeft: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f766e',
  },
  loginPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loginPromptIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  loginPromptTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f766e',
  },
});
