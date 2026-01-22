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
import { ArrowLeft, Camera, Shuffle, Share2, Download, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuth } from '@/contexts/AuthContext';
import { useCoin } from '@/contexts/CoinContext';
import { useLanguage } from '@/contexts/LanguageContext';

// 反差风格组合
const CONTRAST_PAIRS = [
  {
    id: 'ceo_cute',
    styleA: { 
      name: '霸道总裁', 
      nameEn: 'CEO Boss', 
      icon: '👔',
      prompt: 'powerful corporate CEO in tailored designer suit, confident authoritative pose, luxury office background, sharp professional look, Vogue Business editorial style'
    },
    styleB: { 
      name: '可爱萝莉', 
      nameEn: 'Cute Lolita', 
      icon: '🎀',
      prompt: 'adorable sweet lolita fashion, pastel pink frilly dress with lace details, cute accessories, soft kawaii style, dreamy pastel background'
    },
    gradient: ['#1a1a2e', '#16213e'],
  },
  {
    id: 'cyber_hanfu',
    styleA: { 
      name: '赛博朋克', 
      nameEn: 'Cyberpunk', 
      icon: '🤖',
      prompt: 'futuristic cyberpunk streetwear, neon LED accessories, holographic jacket, tech-enhanced fashion, neon city night background'
    },
    styleB: { 
      name: '古典汉服', 
      nameEn: 'Classic Hanfu', 
      icon: '🏮',
      prompt: 'elegant traditional Chinese Hanfu, flowing silk robes with intricate embroidery, classical hair accessories, ancient palace garden background'
    },
    gradient: ['#0f0c29', '#302b63'],
  },
  {
    id: 'hiphop_gentleman',
    styleA: { 
      name: '街头嘻哈', 
      nameEn: 'Street Hip-hop', 
      icon: '🎤',
      prompt: 'urban hip-hop streetwear, oversized hoodie, chunky sneakers, gold chains, graffiti wall background, confident street style pose'
    },
    styleB: { 
      name: '英伦绅士', 
      nameEn: 'British Gentleman', 
      icon: '🎩',
      prompt: 'classic British gentleman style, tailored tweed suit, bowler hat, pocket watch, vintage London backdrop, refined elegant pose'
    },
    gradient: ['#232526', '#414345'],
  },
  {
    id: 'gothic_forest',
    styleA: { 
      name: '暗黑哥特', 
      nameEn: 'Dark Gothic', 
      icon: '🖤',
      prompt: 'dark gothic fashion, black lace and velvet outfit, dramatic makeup style, mysterious dark atmosphere, Victorian gothic aesthetic'
    },
    styleB: { 
      name: '清新森女', 
      nameEn: 'Forest Fairy', 
      icon: '🌿',
      prompt: 'fresh natural forest girl style, flowy linen dress, flower crown, barefoot in meadow, soft sunlight filtering through trees'
    },
    gradient: ['#1f1c2c', '#928dab'],
  },
  {
    id: 'office_homebody',
    styleA: { 
      name: '职场精英', 
      nameEn: 'Office Elite', 
      icon: '💼',
      prompt: 'polished corporate professional, sharp tailored blazer, elegant pencil skirt or dress pants, modern glass office building background'
    },
    styleB: { 
      name: '居家慵懒', 
      nameEn: 'Cozy Homebody', 
      icon: '🛋️',
      prompt: 'comfortable cozy loungewear, soft oversized sweater, fuzzy slippers, messy bun, warm living room with soft blankets and books'
    },
    gradient: ['#2c3e50', '#3498db'],
  },
];

const COMMON_PROMPT_PREFIX = 'IMPORTANT: Keep face, facial expression, hairstyle, pose, and photo framing EXACTLY as in original. Only change clothing in the EXACT visible areas. If only partial clothing is visible, apply only to that partial area. Do NOT extend or complete the image. ';
const QUALITY_SUFFIX = '. High-end designer quality, premium luxurious fabrics with beautiful texture and drape, impeccable tailoring with perfect fit, sophisticated color palette, elegant refined details, professional fashion editorial photography quality';

export default function ContrastChallengeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isLoggedIn } = useAuth();
  const { coinBalance, canUseOutfitChange, useOutfitChange } = useCoin();
  const { currentLanguage } = useLanguage();

  const [userImage, setUserImage] = useState<string | null>(null);
  const [selectedPair, setSelectedPair] = useState(CONTRAST_PAIRS[0]);
  const [resultA, setResultA] = useState<string | null>(null);
  const [resultB, setResultB] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<'none' | 'styleA' | 'styleB' | 'done'>('none');

  // 随机切换风格组合
  const shufflePair = useCallback(() => {
    const currentIndex = CONTRAST_PAIRS.findIndex(p => p.id === selectedPair.id);
    const nextIndex = (currentIndex + 1) % CONTRAST_PAIRS.length;
    setSelectedPair(CONTRAST_PAIRS[nextIndex]);
    setResultA(null);
    setResultB(null);
    setGenerationStep('none');
  }, [selectedPair]);

  // 上传照片
  const handleUploadPhoto = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUserImage(result.assets[0].uri);
      setResultA(null);
      setResultB(null);
      setGenerationStep('none');
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
      
      console.log('[ContrastChallenge] Image compressed, base64 length:', base64.length);
      return base64;
    } catch (error) {
      console.error('[ContrastChallenge] Compression error:', error);
      // 压缩失败时直接转换
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    }
  };

  // 生成单个风格
  const generateStyle = async (style: typeof CONTRAST_PAIRS[0]['styleA'], base64Image: string): Promise<string> => {
    const prompt = COMMON_PROMPT_PREFIX + 'Change the outfit to: ' + style.prompt + QUALITY_SUFFIX;
    
    const requestBody = {
      prompt,
      images: [{ type: 'image', image: base64Image }],
      aspectRatio: '3:4',
    };

    console.log('[ContrastChallenge] Sending request to API...');
    const response = await fetch('https://toolkit.rork.com/images/edit/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log('[ContrastChallenge] API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ContrastChallenge] API Error:', response.status, errorText);
      throw new Error(`Generation failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('[ContrastChallenge] API response data:', JSON.stringify(data).substring(0, 200));
    return data.images?.[0]?.url || data.output?.[0]?.url || data.image;
  };

  // 开始生成对比图
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

    // 需要消耗2次（两个风格）
    const canUse = await canUseOutfitChange();
    if (!canUse) {
      Alert.alert(
        t('common.tip'),
        currentLanguage === 'zh' ? '反差萌挑战需要消耗20钻石（两种风格）' : 'Contrast Challenge costs 20 diamonds (2 styles)',
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('profile.recharge'), onPress: () => router.push('/recharge' as any) }
        ]
      );
      return;
    }

    setIsGenerating(true);
    setGenerationStep('styleA');

    try {
      const base64Image = await convertToBase64(userImage);

      // 生成风格A
      const resultUrlA = await generateStyle(selectedPair.styleA, base64Image);
      setResultA(resultUrlA);
      await useOutfitChange();
      setGenerationStep('styleB');

      // 生成风格B
      const resultUrlB = await generateStyle(selectedPair.styleB, base64Image);
      setResultB(resultUrlB);
      await useOutfitChange();
      setGenerationStep('done');

    } catch (error) {
      console.error('Generation error:', error);
      Alert.alert(t('common.error'), currentLanguage === 'zh' ? '生成失败，请重试' : 'Generation failed, please try again');
      setGenerationStep('none');
    } finally {
      setIsGenerating(false);
    }
  }, [userImage, isLoggedIn, selectedPair, canUseOutfitChange, useOutfitChange, currentLanguage, t, router]);

  // 分享结果
  const handleShare = useCallback(async () => {
    if (!resultA || !resultB) return;

    const shareMessage = currentLanguage === 'zh' 
      ? `一张脸，两种人生 🎭\n${selectedPair.styleA.name} vs ${selectedPair.styleB.name}\n你觉得我更适合哪种？`
      : `One face, two lives 🎭\n${selectedPair.styleA.nameEn} vs ${selectedPair.styleB.nameEn}\nWhich suits me better?`;

    try {
      await Share.share({
        message: shareMessage,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [resultA, resultB, selectedPair, currentLanguage]);

  // 未登录提示
  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {currentLanguage === 'zh' ? '反差萌挑战' : 'Contrast Challenge'}
          </Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.gradientBg}>
          <View style={styles.loginPrompt}>
            <Text style={styles.loginPromptIcon}>🎭</Text>
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
      
      <LinearGradient colors={selectedPair.gradient} style={styles.gradientBg}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {currentLanguage === 'zh' ? '反差萌挑战' : 'Contrast Challenge'}
          </Text>
          <TouchableOpacity onPress={shufflePair} style={styles.shuffleButton}>
            <Shuffle size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 风格组合显示 */}
          <View style={styles.pairDisplay}>
            <View style={styles.styleBox}>
              <Text style={styles.styleIcon}>{selectedPair.styleA.icon}</Text>
              <Text style={styles.styleName}>
                {currentLanguage === 'zh' ? selectedPair.styleA.name : selectedPair.styleA.nameEn}
              </Text>
            </View>
            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
            </View>
            <View style={styles.styleBox}>
              <Text style={styles.styleIcon}>{selectedPair.styleB.icon}</Text>
              <Text style={styles.styleName}>
                {currentLanguage === 'zh' ? selectedPair.styleB.name : selectedPair.styleB.nameEn}
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
                    setResultA(null);
                    setResultB(null);
                    setGenerationStep('none');
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

          {/* 生成结果展示 */}
          {(resultA || resultB || isGenerating) && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>
                {currentLanguage === 'zh' ? '🎭 你的反差造型' : '🎭 Your Contrast Looks'}
              </Text>
              
              <View style={styles.resultsRow}>
                {/* 风格A结果 */}
                <View style={styles.resultCard}>
                  <Text style={styles.resultLabel}>
                    {selectedPair.styleA.icon} {currentLanguage === 'zh' ? selectedPair.styleA.name : selectedPair.styleA.nameEn}
                  </Text>
                  {resultA ? (
                    <Image source={{ uri: resultA }} style={styles.resultImage} contentFit="cover" />
                  ) : generationStep === 'styleA' ? (
                    <View style={styles.generatingPlaceholder}>
                      <ActivityIndicator color="#fff" size="large" />
                      <Text style={styles.generatingText}>
                        {currentLanguage === 'zh' ? '生成中...' : 'Generating...'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.emptyResultPlaceholder}>
                      <Text style={styles.emptyResultText}>?</Text>
                    </View>
                  )}
                </View>

                {/* 风格B结果 */}
                <View style={styles.resultCard}>
                  <Text style={styles.resultLabel}>
                    {selectedPair.styleB.icon} {currentLanguage === 'zh' ? selectedPair.styleB.name : selectedPair.styleB.nameEn}
                  </Text>
                  {resultB ? (
                    <Image source={{ uri: resultB }} style={styles.resultImage} contentFit="cover" />
                  ) : generationStep === 'styleB' ? (
                    <View style={styles.generatingPlaceholder}>
                      <ActivityIndicator color="#fff" size="large" />
                      <Text style={styles.generatingText}>
                        {currentLanguage === 'zh' ? '生成中...' : 'Generating...'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.emptyResultPlaceholder}>
                      <Text style={styles.emptyResultText}>?</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* 分享按钮 */}
              {generationStep === 'done' && (
                <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                  <Share2 size={20} color="#fff" />
                  <Text style={styles.shareButtonText}>
                    {currentLanguage === 'zh' ? '分享给好友投票' : 'Share for voting'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>

        {/* 底部生成按钮 */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.costInfo}>
            <Text style={styles.costText}>💎 20</Text>
            <Text style={styles.costLabel}>
              {currentLanguage === 'zh' ? '(两种风格)' : '(2 styles)'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.generateButton, (!userImage || isGenerating) && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={!userImage || isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color="#1a1a1a" />
            ) : (
              <Text style={styles.generateButtonText}>
                {currentLanguage === 'zh' ? '✨ 开始挑战' : '✨ Start Challenge'}
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
  shuffleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  pairDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  styleBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    minWidth: 100,
  },
  styleIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  styleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  vsContainer: {
    marginHorizontal: 16,
  },
  vsText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#f59e0b',
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
  resultsContainer: {
    marginTop: 8,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  resultsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  resultCard: {
    flex: 1,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultImage: {
    aspectRatio: 3/4,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  generatingPlaceholder: {
    aspectRatio: 3/4,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatingText: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  emptyResultPlaceholder: {
    aspectRatio: 3/4,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyResultText: {
    fontSize: 48,
    color: 'rgba(255,255,255,0.3)',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
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
    gap: 4,
  },
  costText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  costLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
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
    color: '#1a1a1a',
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
    color: '#1a1a1a',
  },
});
