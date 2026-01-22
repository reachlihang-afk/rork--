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

// 职业/身份选项
const CAREER_OPTIONS = [
  {
    id: 'astronaut',
    name: 'NASA宇航员',
    nameEn: 'NASA Astronaut',
    icon: '👨‍🚀',
    prompt: 'Transform this person into a NASA astronaut wearing official NASA spacesuit with helmet, inside space shuttle cockpit, Earth visible through window, professional NASA portrait style',
    gradient: ['#0f0c29', '#24243e'],
    badge: '太空探索者',
    badgeEn: 'Space Explorer',
  },
  {
    id: 'f1_driver',
    name: 'F1赛车手',
    nameEn: 'F1 Racing Driver',
    icon: '🏎️',
    prompt: 'Transform this person into a professional F1 racing driver wearing racing suit and helmet, standing next to F1 car in pit lane, Formula 1 racing environment',
    gradient: ['#e74c3c', '#c0392b'],
    badge: '速度之王',
    badgeEn: 'Speed King',
  },
  {
    id: 'chef',
    name: '米其林主厨',
    nameEn: 'Michelin Star Chef',
    icon: '👨‍🍳',
    prompt: 'Transform this person into a Michelin star chef wearing professional white chef uniform and hat, in luxury restaurant kitchen, presenting gourmet dish, professional culinary portrait',
    gradient: ['#f39c12', '#d68910'],
    badge: '美食艺术家',
    badgeEn: 'Culinary Artist',
  },
  {
    id: 'model',
    name: '时装周模特',
    nameEn: 'Fashion Week Model',
    icon: '💃',
    prompt: 'Transform this person into a high fashion runway model, wearing avant-garde designer clothes, walking on fashion week catwalk, dramatic runway lighting, Vogue editorial style',
    gradient: ['#9b59b6', '#8e44ad'],
    badge: '时尚icon',
    badgeEn: 'Fashion Icon',
  },
  {
    id: 'director',
    name: '好莱坞导演',
    nameEn: 'Hollywood Director',
    icon: '🎬',
    prompt: 'Transform this person into a famous Hollywood movie director, sitting in director chair on movie set, holding megaphone, film crew and cameras around, cinematic atmosphere',
    gradient: ['#2c3e50', '#34495e'],
    badge: '光影魔术师',
    badgeEn: 'Film Magician',
  },
  {
    id: 'surgeon',
    name: '顶级外科医生',
    nameEn: 'Top Surgeon',
    icon: '👨‍⚕️',
    prompt: 'Transform this person into a prestigious surgeon wearing surgical gown and mask, in modern hospital operating room, professional medical environment, dramatic lighting',
    gradient: ['#1abc9c', '#16a085'],
    badge: '生命守护者',
    badgeEn: 'Life Guardian',
  },
  {
    id: 'pilot',
    name: '民航机长',
    nameEn: 'Airline Captain',
    icon: '✈️',
    prompt: 'Transform this person into an airline captain wearing professional pilot uniform with captain hat, in Boeing 787 cockpit, professional aviation portrait',
    gradient: ['#3498db', '#2980b9'],
    badge: '蓝天使者',
    badgeEn: 'Sky Ambassador',
  },
  {
    id: 'rockstar',
    name: '摇滚巨星',
    nameEn: 'Rock Star',
    icon: '🎸',
    prompt: 'Transform this person into a famous rock star, wearing leather jacket and rock fashion, performing on stage with guitar, concert lighting and crowd, epic rock concert atmosphere',
    gradient: ['#e74c3c', '#9b59b6'],
    badge: '音乐传奇',
    badgeEn: 'Music Legend',
  },
];

const COMMON_PROMPT_PREFIX = 'IMPORTANT: Keep face, facial expression, hairstyle, pose, and photo framing EXACTLY as in original. Only change clothing in the EXACT visible areas. If only partial clothing is visible, apply only to that partial area. Do NOT extend or complete the image. ';
const QUALITY_SUFFIX = '. High-end designer quality, premium luxurious fabrics with beautiful texture and drape, impeccable tailoring with perfect fit, sophisticated color palette, elegant refined details, professional fashion editorial photography quality';

export default function WhatIfIAmScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoggedIn } = useAuth();
  const { canUseOutfitChange, useOutfitChange } = useCoin();
  const { currentLanguage } = useLanguage();

  const [userImage, setUserImage] = useState<string | null>(null);
  const [selectedCareer, setSelectedCareer] = useState(CAREER_OPTIONS[0]);
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
      
      console.log('[WhatIfIAm] Image compressed, base64 length:', base64.length);
      return base64;
    } catch (error) {
      console.error('[WhatIfIAm] Compression error:', error);
      // 压缩失败时直接转换
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    }
  };

  // 生成职业照片
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
        currentLanguage === 'zh' ? '如果我是需要消耗10钻石' : 'What If I Am costs 10 diamonds',
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
      const prompt = COMMON_PROMPT_PREFIX + 'Change the outfit to: ' + selectedCareer.prompt + QUALITY_SUFFIX;

      const requestBody = {
        prompt,
        images: [{ type: 'image', image: base64Image }],
        aspectRatio: '3:4',
      };

      console.log('[WhatIfIAm] Sending request to API...');
      const response = await fetch('https://toolkit.rork.com/images/edit/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[WhatIfIAm] API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[WhatIfIAm] API Error:', response.status, errorText);
        throw new Error(`Generation failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('[WhatIfIAm] API response data:', JSON.stringify(data).substring(0, 200));
      const resultUrl = data.images?.[0]?.url || data.output?.[0]?.url || data.image;
      
      setResult(resultUrl);
      await useOutfitChange();

    } catch (error) {
      console.error('Generation error:', error);
      Alert.alert(t('common.error'), currentLanguage === 'zh' ? '生成失败，请重试' : 'Generation failed, please try again');
    } finally {
      setIsGenerating(false);
    }
  }, [userImage, isLoggedIn, selectedCareer, canUseOutfitChange, useOutfitChange, currentLanguage, t, router]);

  // 分享结果
  const handleShare = useCallback(async () => {
    if (!result) return;

    const shareMessage = currentLanguage === 'zh' 
      ? `🌟 如果我是${selectedCareer.name}...\n「${selectedCareer.badge}」\n来看看我的平行人生吧！`
      : `🌟 What if I am a ${selectedCareer.nameEn}...\n「${selectedCareer.badgeEn}」\nCheck out my parallel life!`;

    try {
      await Share.share({ message: shareMessage });
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [result, selectedCareer, currentLanguage]);

  // 未登录提示
  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={['#ea580c', '#f97316']} style={styles.gradientBg}>
          <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {currentLanguage === 'zh' ? '如果我是' : 'What If I Am'}
            </Text>
            <View style={styles.headerPlaceholder} />
          </View>
          <View style={styles.loginPrompt}>
            <Text style={styles.loginPromptIcon}>🌟</Text>
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
      
      <LinearGradient colors={selectedCareer.gradient} style={styles.gradientBg}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {currentLanguage === 'zh' ? '如果我是' : 'What If I Am'}
          </Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 当前选择的职业 */}
          <View style={styles.currentCareer}>
            <Text style={styles.currentCareerIcon}>{selectedCareer.icon}</Text>
            <Text style={styles.currentCareerName}>
              {currentLanguage === 'zh' ? `如果我是${selectedCareer.name}...` : `What if I am a ${selectedCareer.nameEn}...`}
            </Text>
            <View style={styles.careerBadge}>
              <Text style={styles.careerBadgeText}>
                {currentLanguage === 'zh' ? selectedCareer.badge : selectedCareer.badgeEn}
              </Text>
            </View>
          </View>

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

          {/* 职业选择 */}
          <Text style={styles.sectionTitle}>
            {currentLanguage === 'zh' ? '🌟 选择职业/身份' : '🌟 Choose Career/Identity'}
          </Text>
          
          <View style={styles.careersGrid}>
            {CAREER_OPTIONS.map((career) => (
              <TouchableOpacity
                key={career.id}
                style={[
                  styles.careerCard,
                  selectedCareer.id === career.id && styles.careerCardSelected
                ]}
                onPress={() => {
                  setSelectedCareer(career);
                  setResult(null);
                }}
                activeOpacity={0.8}
              >
                <LinearGradient colors={career.gradient} style={styles.careerCardGradient}>
                  <Text style={styles.careerIcon}>{career.icon}</Text>
                  <Text style={styles.careerName}>
                    {currentLanguage === 'zh' ? career.name : career.nameEn}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* 生成结果 */}
          {result && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>
                {currentLanguage === 'zh' ? '✨ 平行人生' : '✨ Parallel Life'}
              </Text>
              
              {/* 简历卡片 */}
              <View style={styles.resumeCard}>
                <Image source={{ uri: result }} style={styles.resultImage} contentFit="cover" />
                <View style={styles.resumeInfo}>
                  <Text style={styles.resumeTitle}>
                    {currentLanguage === 'zh' ? selectedCareer.name : selectedCareer.nameEn}
                  </Text>
                  <View style={styles.resumeBadge}>
                    <Text style={styles.resumeBadgeText}>
                      {currentLanguage === 'zh' ? selectedCareer.badge : selectedCareer.badgeEn}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Share2 size={20} color="#fff" />
                <Text style={styles.shareButtonText}>
                  {currentLanguage === 'zh' ? '分享平行人生' : 'Share Parallel Life'}
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
              <ActivityIndicator color="#ea580c" />
            ) : (
              <Text style={styles.generateButtonText}>
                {currentLanguage === 'zh' ? '🌟 开始变身' : '🌟 Transform'}
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
  currentCareer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  currentCareerIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  currentCareerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  careerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  careerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
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
  careersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  careerCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  careerCardSelected: {
    borderColor: '#fff',
  },
  careerCardGradient: {
    padding: 16,
    alignItems: 'center',
  },
  careerIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  careerName: {
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
  resumeCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  resultImage: {
    width: '100%',
    aspectRatio: 3/4,
  },
  resumeInfo: {
    padding: 16,
    alignItems: 'center',
  },
  resumeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  resumeBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resumeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
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
    color: '#ea580c',
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
    color: '#ea580c',
  },
});
