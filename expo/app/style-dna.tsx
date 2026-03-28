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
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Camera, RefreshCw, Share2, X, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { useCoin } from '@/contexts/CoinContext';
import { useLanguage } from '@/contexts/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 风格类型定义
const STYLE_TYPES = [
  { id: 'minimal', name: '极简风', nameEn: 'Minimal', color: '#1a1a1a', icon: '⬛' },
  { id: 'japanese', name: '日系风', nameEn: 'Japanese', color: '#fbbf24', icon: '🌸' },
  { id: 'korean', name: '韩系风', nameEn: 'Korean', color: '#ec4899', icon: '💖' },
  { id: 'street', name: '街头风', nameEn: 'Street', color: '#ef4444', icon: '🔥' },
  { id: 'vintage', name: '复古风', nameEn: 'Vintage', color: '#92400e', icon: '📻' },
  { id: 'romantic', name: '浪漫风', nameEn: 'Romantic', color: '#f472b6', icon: '🌹' },
  { id: 'sporty', name: '运动风', nameEn: 'Sporty', color: '#3b82f6', icon: '⚡' },
  { id: 'elegant', name: '优雅风', nameEn: 'Elegant', color: '#8b5cf6', icon: '👑' },
];

// 穿搭人格
const STYLE_PERSONALITIES = [
  { id: 'forest_fairy', name: '都市森女', nameEn: 'Urban Forest Fairy', desc: '你追求自然与都市的完美平衡', descEn: 'You seek perfect balance between nature and urban life', animal: '🦢', animalName: '优雅的天鹅', animalNameEn: 'Elegant Swan' },
  { id: 'cool_hunter', name: '酷感猎手', nameEn: 'Cool Hunter', desc: '你总能发现最前沿的时尚趋势', descEn: 'You always spot the latest fashion trends', animal: '🐆', animalName: '敏锐的豹子', animalNameEn: 'Sharp Leopard' },
  { id: 'romantic_poet', name: '浪漫诗人', nameEn: 'Romantic Poet', desc: '你的穿搭充满了诗意与梦幻', descEn: 'Your style is full of poetry and dreams', animal: '🦋', animalName: '梦幻蝴蝶', animalNameEn: 'Dreamy Butterfly' },
  { id: 'street_artist', name: '街头艺术家', nameEn: 'Street Artist', desc: '你用穿搭表达态度与个性', descEn: 'You express attitude through fashion', animal: '🦅', animalName: '自由的鹰', animalNameEn: 'Free Eagle' },
  { id: 'classic_elite', name: '经典精英', nameEn: 'Classic Elite', desc: '你偏爱永恒经典的时尚单品', descEn: 'You prefer timeless classic pieces', animal: '🦁', animalName: '王者狮子', animalNameEn: 'King Lion' },
  { id: 'sweet_angel', name: '甜美天使', nameEn: 'Sweet Angel', desc: '你的穿搭总是充满甜美气息', descEn: 'Your style is always sweet and lovely', animal: '🐰', animalName: '可爱兔子', animalNameEn: 'Cute Bunny' },
];

// 相似明星
const SIMILAR_CELEBRITIES = [
  { id: 'jennie', name: 'Jennie', styles: ['korean', 'street', 'elegant'] },
  { id: 'lisa', name: 'Lisa', styles: ['street', 'sporty', 'korean'] },
  { id: 'iu', name: 'IU', styles: ['japanese', 'romantic', 'elegant'] },
  { id: 'rose', name: 'Rosé', styles: ['romantic', 'vintage', 'minimal'] },
  { id: 'taylor', name: 'Taylor Swift', styles: ['romantic', 'vintage', 'elegant'] },
  { id: 'zendaya', name: 'Zendaya', styles: ['street', 'elegant', 'vintage'] },
];

interface DNAResult {
  styles: { id: string; percentage: number }[];
  personality: typeof STYLE_PERSONALITIES[0];
  animal: string;
  celebrity: string;
}

export default function StyleDNAScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isLoggedIn } = useAuth();
  const { canUseOutfitChange, useOutfitChange } = useCoin();
  const { currentLanguage } = useLanguage();

  const [userImages, setUserImages] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DNAResult | null>(null);

  // 上传照片
  const handleUploadPhoto = useCallback(async () => {
    if (userImages.length >= 5) {
      Alert.alert(t('common.tip'), currentLanguage === 'zh' ? '最多上传5张照片' : 'Maximum 5 photos');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!pickerResult.canceled && pickerResult.assets[0]) {
      setUserImages(prev => [...prev, pickerResult.assets[0].uri]);
      setResult(null);
    }
  }, [userImages.length, currentLanguage, t]);

  // 删除照片
  const handleRemovePhoto = useCallback((index: number) => {
    setUserImages(prev => prev.filter((_, i) => i !== index));
    setResult(null);
  }, []);

  // 模拟AI分析（实际应该调用后端API进行图像分析）
  const analyzeStyle = useCallback((): DNAResult => {
    // 随机生成风格占比（实际应该是AI分析结果）
    const shuffledStyles = [...STYLE_TYPES].sort(() => Math.random() - 0.5);
    let remaining = 100;
    const styles = shuffledStyles.slice(0, 4).map((style, index) => {
      const percentage = index === 3 ? remaining : Math.floor(Math.random() * (remaining - (3 - index) * 5)) + 5;
      remaining -= percentage;
      return { id: style.id, percentage };
    }).sort((a, b) => b.percentage - a.percentage);

    // 根据主要风格选择人格
    const mainStyleId = styles[0].id;
    const personality = STYLE_PERSONALITIES[Math.floor(Math.random() * STYLE_PERSONALITIES.length)];

    // 匹配相似明星
    const matchingCelebrity = SIMILAR_CELEBRITIES.find(c => c.styles.includes(mainStyleId)) || SIMILAR_CELEBRITIES[0];

    return {
      styles,
      personality,
      animal: personality.animal,
      celebrity: matchingCelebrity.name,
    };
  }, []);

  // 开始分析
  const handleAnalyze = useCallback(async () => {
    if (userImages.length === 0) {
      Alert.alert(t('common.tip'), currentLanguage === 'zh' ? '请至少上传1张照片' : 'Please upload at least 1 photo');
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
        currentLanguage === 'zh' ? '穿搭DNA检测需要消耗10钻石' : 'Style DNA costs 10 diamonds',
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('profile.recharge'), onPress: () => router.push('/recharge' as any) }
        ]
      );
      return;
    }

    setIsAnalyzing(true);

    // 模拟分析延迟
    setTimeout(async () => {
      const analysisResult = analyzeStyle();
      setResult(analysisResult);
      await useOutfitChange();
      setIsAnalyzing(false);
    }, 2500);
  }, [userImages.length, isLoggedIn, canUseOutfitChange, useOutfitChange, analyzeStyle, currentLanguage, t, router]);

  // 分享结果
  const handleShare = useCallback(async () => {
    if (!result) return;

    const personality = result.personality;
    const mainStyle = STYLE_TYPES.find(s => s.id === result.styles[0].id);
    
    const shareMessage = currentLanguage === 'zh' 
      ? `🧬 我的穿搭DNA检测结果：\n\n我是「${personality.name}」${personality.animal}\n主要风格：${mainStyle?.name} ${result.styles[0].percentage}%\n灵魂动物：${personality.animalName}\n最相似明星：${result.celebrity}\n\n来测测你的穿搭DNA吧！`
      : `🧬 My Style DNA Result:\n\nI am「${personality.nameEn}」${personality.animal}\nMain Style: ${mainStyle?.nameEn} ${result.styles[0].percentage}%\nSpirit Animal: ${personality.animalNameEn}\nMost Similar Celebrity: ${result.celebrity}\n\nDiscover your Style DNA!`;

    try {
      await Share.share({ message: shareMessage });
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [result, currentLanguage]);

  // 重新测试
  const handleRetry = useCallback(() => {
    setResult(null);
    setUserImages([]);
  }, []);

  // 未登录提示
  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={['#7c3aed', '#a855f7']} style={styles.gradientBg}>
          <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {currentLanguage === 'zh' ? '穿搭DNA' : 'Style DNA'}
            </Text>
            <View style={styles.headerPlaceholder} />
          </View>
          <View style={styles.loginPrompt}>
            <Text style={styles.loginPromptIcon}>🧬</Text>
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
      
      <LinearGradient colors={['#7c3aed', '#a855f7']} style={styles.gradientBg}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {currentLanguage === 'zh' ? '穿搭DNA' : 'Style DNA'}
          </Text>
          {result ? (
            <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
              <RefreshCw size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerPlaceholder} />
          )}
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!result ? (
            <>
              {/* 说明文字 */}
              <View style={styles.introSection}>
                <Text style={styles.introTitle}>
                  {currentLanguage === 'zh' ? '发现你的穿搭人格' : 'Discover Your Style Personality'}
                </Text>
                <Text style={styles.introDesc}>
                  {currentLanguage === 'zh' 
                    ? '上传1-5张你的日常穿搭照片，AI将分析你的穿搭DNA' 
                    : 'Upload 1-5 photos of your daily outfits, AI will analyze your Style DNA'}
                </Text>
              </View>

              {/* 照片上传区域 */}
              <View style={styles.photosGrid}>
                {userImages.map((uri, index) => (
                  <View key={index} style={styles.photoItem}>
                    <Image source={{ uri }} style={styles.photoImage} contentFit="cover" />
                    <TouchableOpacity 
                      style={styles.photoRemoveButton}
                      onPress={() => handleRemovePhoto(index)}
                    >
                      <X size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                {userImages.length < 5 && (
                  <TouchableOpacity style={styles.addPhotoButton} onPress={handleUploadPhoto}>
                    <Plus size={28} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.addPhotoText}>
                      {userImages.length === 0 
                        ? (currentLanguage === 'zh' ? '添加照片' : 'Add Photo')
                        : `${userImages.length}/5`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* 提示 */}
              <View style={styles.tipSection}>
                <Text style={styles.tipTitle}>💡 {currentLanguage === 'zh' ? '小贴士' : 'Tips'}</Text>
                <Text style={styles.tipText}>
                  {currentLanguage === 'zh' 
                    ? '• 上传全身穿搭照效果更好\n• 不同场景的照片能让分析更准确\n• 清晰的照片能得到更好的结果'
                    : '• Full body outfit photos work better\n• Different scenarios make analysis more accurate\n• Clear photos get better results'}
                </Text>
              </View>
            </>
          ) : (
            /* 结果展示 */
            <View style={styles.resultContainer}>
              {/* DNA图表 */}
              <View style={styles.dnaChart}>
                <Text style={styles.dnaChartTitle}>
                  {currentLanguage === 'zh' ? '🧬 你的穿搭DNA' : '🧬 Your Style DNA'}
                </Text>
                {result.styles.map((style, index) => {
                  const styleInfo = STYLE_TYPES.find(s => s.id === style.id);
                  return (
                    <View key={style.id} style={styles.dnaBarContainer}>
                      <View style={styles.dnaBarLabel}>
                        <Text style={styles.dnaBarIcon}>{styleInfo?.icon}</Text>
                        <Text style={styles.dnaBarName}>
                          {currentLanguage === 'zh' ? styleInfo?.name : styleInfo?.nameEn}
                        </Text>
                      </View>
                      <View style={styles.dnaBarTrack}>
                        <View 
                          style={[
                            styles.dnaBarFill, 
                            { width: `${style.percentage}%`, backgroundColor: styleInfo?.color }
                          ]} 
                        />
                      </View>
                      <Text style={styles.dnaBarPercentage}>{style.percentage}%</Text>
                    </View>
                  );
                })}
              </View>

              {/* 穿搭人格 */}
              <View style={styles.personalityCard}>
                <Text style={styles.personalityAnimal}>{result.personality.animal}</Text>
                <Text style={styles.personalityName}>
                  {currentLanguage === 'zh' ? result.personality.name : result.personality.nameEn}
                </Text>
                <Text style={styles.personalityDesc}>
                  {currentLanguage === 'zh' ? result.personality.desc : result.personality.descEn}
                </Text>
                <View style={styles.personalityDivider} />
                <View style={styles.personalityInfo}>
                  <View style={styles.personalityInfoItem}>
                    <Text style={styles.personalityInfoLabel}>
                      {currentLanguage === 'zh' ? '灵魂动物' : 'Spirit Animal'}
                    </Text>
                    <Text style={styles.personalityInfoValue}>
                      {result.personality.animal} {currentLanguage === 'zh' ? result.personality.animalName : result.personality.animalNameEn}
                    </Text>
                  </View>
                  <View style={styles.personalityInfoItem}>
                    <Text style={styles.personalityInfoLabel}>
                      {currentLanguage === 'zh' ? '最相似明星' : 'Similar Celebrity'}
                    </Text>
                    <Text style={styles.personalityInfoValue}>⭐ {result.celebrity}</Text>
                  </View>
                </View>
              </View>

              {/* 分享按钮 */}
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Share2 size={20} color="#7c3aed" />
                <Text style={styles.shareButtonText}>
                  {currentLanguage === 'zh' ? '分享我的穿搭DNA' : 'Share My Style DNA'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* 底部按钮 */}
        {!result && (
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.costInfo}>
              <Text style={styles.costText}>💎 10</Text>
            </View>
            <TouchableOpacity
              style={[styles.analyzeButton, (userImages.length === 0 || isAnalyzing) && styles.analyzeButtonDisabled]}
              onPress={handleAnalyze}
              disabled={userImages.length === 0 || isAnalyzing}
            >
              {isAnalyzing ? (
                <View style={styles.analyzingContent}>
                  <ActivityIndicator color="#7c3aed" />
                  <Text style={styles.analyzingText}>
                    {currentLanguage === 'zh' ? '分析中...' : 'Analyzing...'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.analyzeButtonText}>
                  {currentLanguage === 'zh' ? '🧬 开始检测' : '🧬 Start Analysis'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
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
  retryButton: {
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
  introSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  introDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  photoItem: {
    width: (SCREEN_WIDTH - 60) / 3,
    aspectRatio: 3/4,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoRemoveButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    width: (SCREEN_WIDTH - 60) / 3,
    aspectRatio: 3/4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    marginTop: 8,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  tipSection: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  resultContainer: {
    gap: 20,
  },
  dnaChart: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 20,
  },
  dnaChartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  dnaBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dnaBarLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  dnaBarIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  dnaBarName: {
    fontSize: 12,
    color: '#374151',
  },
  dnaBarTrack: {
    flex: 1,
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  dnaBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  dnaBarPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    width: 36,
    textAlign: 'right',
  },
  personalityCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  personalityAnimal: {
    fontSize: 56,
    marginBottom: 12,
  },
  personalityName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  personalityDesc: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  personalityDivider: {
    width: 60,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginVertical: 20,
  },
  personalityInfo: {
    width: '100%',
    gap: 12,
  },
  personalityInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  personalityInfoLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  personalityInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7c3aed',
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
    backgroundColor: 'rgba(0,0,0,0.2)',
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
  analyzeButton: {
    flex: 1,
    marginLeft: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  analyzeButtonDisabled: {
    opacity: 0.5,
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7c3aed',
  },
  analyzingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  analyzingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7c3aed',
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
    color: '#7c3aed',
  },
});
