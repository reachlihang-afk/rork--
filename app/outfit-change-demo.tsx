// Demo版本 - 一键换装页面新UI
// 用于验证设计和交互逻辑

import { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Switch,
  useColorScheme,
  Platform 
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Sparkles, Lock, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

type TabType = 'template' | 'custom' | 'pro';

// Demo模板数据
const DEMO_TEMPLATES = [
  { id: 'random', name: '随机装', icon: '🎲', gradient: ['#f3f4f6', '#e5e7eb'] },
  { id: 'old-money', name: '老钱风', icon: '🧥', gradient: ['#f3f4f6', '#d1d5db'] },
  { id: 'spice-girl', name: '辣妹装', icon: '🔥', gradient: ['#fb923c', '#ef4444'] },
  { id: 'lolita', name: '洛丽塔', icon: '🎀', gradient: ['#fbb6ce', '#f472b6'] },
  { id: 'punk', name: '朋克装', icon: '🎸', gradient: ['#a78bfa', '#7c3aed'] },
  { id: 'sports', name: '运动装', icon: '💪', gradient: ['#60a5fa', '#3b82f6'] },
  { id: 'tennis', name: '网球装', icon: '🎾', gradient: ['#34d399', '#059669'] },
  { id: 'ski', name: '滑雪服', icon: '⛷️', gradient: ['#22d3ee', '#06b6d4'] },
  { id: 'bikini', name: '比基尼', icon: '👙', gradient: ['#fbbf24', '#f59e0b'] },
];

export default function OutfitChangeDemoScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [selectedTab, setSelectedTab] = useState<TabType>('template');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [keepFaceFeatures, setKeepFaceFeatures] = useState(true);
  const [beautyFilter, setBeautyFilter] = useState(false);
  const [showAllTemplates, setShowAllTemplates] = useState(false);

  // 上传照片
  const handleUploadPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('需要相册权限');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setUserImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('上传失败:', error);
    }
  };

  // 拍照
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('需要相机权限');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setUserImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('拍照失败:', error);
    }
  };

  const displayedTemplates = showAllTemplates ? DEMO_TEMPLATES : DEMO_TEMPLATES.slice(0, 6);

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Stack.Screen 
        options={{
          title: t('outfitChange.outfitSwap'),
          headerShown: true,
        }}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 步骤1: 上传照片 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
              {t('outfitChange.whoIsSwapping')}
            </Text>
            <Text style={styles.stepLabel}>{t('outfitChange.step1')}</Text>
          </View>

          <TouchableOpacity
            style={[styles.uploadArea, isDark && styles.uploadAreaDark]}
            onPress={handleUploadPhoto}
            activeOpacity={0.7}
          >
            {userImage ? (
              <>
                <Image source={{ uri: userImage }} style={styles.uploadedImage} contentFit="cover" />
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => setUserImage(null)}
                >
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <View style={styles.cameraIcon}>
                  <Camera size={32} color={isDark ? '#fff' : '#1a1a1a'} strokeWidth={1.5} />
                </View>
                <Text style={[styles.uploadTitle, isDark && styles.textDark]}>
                  {t('outfitChange.uploadPhoto')}
                </Text>
                <Text style={styles.uploadSubtitle}>
                  {t('outfitChange.tapToSnap')}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.privacyNote}>
            <Lock size={12} color="#9ca3af" />
            <Text style={styles.privacyText}>
              {t('outfitChange.photosProcessed')}
            </Text>
          </View>
        </View>

        {/* 步骤2: 选择风格 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
              {t('outfitChange.selectStyle')}
            </Text>
            <Text style={styles.stepLabel}>{t('outfitChange.step2')}</Text>
          </View>

          {/* Tab选择器 */}
          <View style={[styles.tabContainer, isDark && styles.tabContainerDark]}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'template' && styles.tabActive]}
              onPress={() => setSelectedTab('template')}
            >
              <Text style={[
                styles.tabText,
                selectedTab === 'template' && styles.tabTextActive
              ]}>
                {t('outfitChange.templateSwap')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, selectedTab === 'custom' && styles.tabActive]}
              onPress={() => setSelectedTab('custom')}
            >
              <Text style={[
                styles.tabText,
                selectedTab === 'custom' && styles.tabTextActive
              ]}>
                {t('outfitChange.customOutfitTab')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, selectedTab === 'pro' && styles.tabActive]}
              onPress={() => setSelectedTab('pro')}
            >
              <Text style={[
                styles.tabText,
                selectedTab === 'pro' && styles.tabTextActive
              ]}>
                {t('outfitChange.proStyle')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Template Swap内容 */}
          {selectedTab === 'template' && (
            <View style={styles.tabContent}>
              <View style={styles.trendingHeader}>
                <Text style={[styles.trendingTitle, isDark && styles.textDark]}>
                  {t('outfitChange.trendingStyles')}
                </Text>
                <View style={styles.freeAttemptsTag}>
                  <Sparkles size={14} color="#1a1a1a" />
                  <Text style={styles.freeAttemptsText}>
                    {t('outfitChange.freeAttempts')}: 5/5
                  </Text>
                </View>
              </View>

              {/* 模板网格 */}
              <View style={styles.templateGrid}>
                {displayedTemplates.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={[
                      styles.templateCard,
                      isDark && styles.templateCardDark,
                      selectedTemplate === template.id && styles.templateCardSelected
                    ]}
                    onPress={() => setSelectedTemplate(template.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.templateIcon}>
                      <Text style={styles.templateIconText}>{template.icon}</Text>
                    </View>
                    <Text style={[styles.templateName, isDark && styles.textDark]}>
                      {template.name}
                    </Text>
                    <Text style={styles.templateEmoji}>{template.icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 更多模板按钮 */}
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => setShowAllTemplates(!showAllTemplates)}
              >
                <Text style={[styles.moreButtonText, isDark && styles.textDark]}>
                  {showAllTemplates ? t('outfitChange.showLess') : t('outfitChange.moreTemplates')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Custom Outfit内容 */}
          {selectedTab === 'custom' && (
            <View style={styles.tabContent}>
              <Text style={[styles.customTitle, isDark && styles.textDark]}>
                {t('outfitChange.referenceClothing')}
              </Text>
              <View style={styles.customUploadRow}>
                <TouchableOpacity style={[styles.customUploadCard, isDark && styles.customUploadCardDark]}>
                  <Camera size={24} color="#9ca3af" />
                  <Text style={styles.customUploadTitle}>
                    {t('outfitChange.uploadClothing1')}
                  </Text>
                  <Text style={styles.customUploadBadge}>
                    {t('outfitChange.required')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.customUploadCard, isDark && styles.customUploadCardDark]}>
                  <Camera size={24} color="#9ca3af" />
                  <Text style={styles.customUploadTitle}>
                    {t('outfitChange.uploadClothing2')}
                  </Text>
                  <Text style={styles.customUploadBadgeOptional}>
                    {t('outfitChange.optional')}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.uploadHintBox}>
                <Text style={styles.uploadHintText}>
                  ℹ️ {t('outfitChange.uploadHint')}
                </Text>
              </View>
            </View>
          )}

          {/* Pro Style内容 */}
          {selectedTab === 'pro' && (
            <View style={styles.tabContent}>
              <Text style={[styles.proTitle, isDark && styles.textDark]}>
                精选达人穿搭
              </Text>
              
              {/* Jennie示例卡片 */}
              <TouchableOpacity
                style={[styles.influencerCard, isDark && styles.influencerCardDark]}
                onPress={() => router.push('/influencer-collection-demo' as any)}
              >
                <View style={styles.influencerAvatar}>
                  <Text style={styles.influencerAvatarText}>👱‍♀️</Text>
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>✓</Text>
                  </View>
                </View>
                <View style={styles.influencerInfo}>
                  <Text style={[styles.influencerName, isDark && styles.textDark]}>
                    Jennie Kim
                  </Text>
                  <Text style={styles.influencerDesc}>
                    Chanel Muse & K-Pop Icon
                  </Text>
                  <View style={styles.influencerTags}>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>24 LOOKS</Text>
                    </View>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>K-POP</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>

              <Text style={styles.comingSoon}>更多达人即将上线...</Text>
            </View>
          )}
        </View>

        {/* 选项区域 */}
        <View style={[styles.optionsSection, isDark && styles.optionsSectionDark]}>
          <View style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <View style={[styles.optionIcon, isDark && styles.optionIconDark]}>
                <Text>👤</Text>
              </View>
              <View>
                <Text style={[styles.optionTitle, isDark && styles.textDark]}>
                  {t('outfitChange.keepFaceFeatures')}
                </Text>
                <Text style={styles.optionSubtitle}>
                  {t('outfitChange.preserveIdentity')}
                </Text>
              </View>
            </View>
            <Switch
              value={keepFaceFeatures}
              onValueChange={setKeepFaceFeatures}
              trackColor={{ false: '#e5e7eb', true: '#1a1a1a' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <View style={[styles.optionIcon, isDark && styles.optionIconDark]}>
                <Sparkles size={20} color={isDark ? '#fff' : '#1a1a1a'} />
              </View>
              <View>
                <Text style={[styles.optionTitle, isDark && styles.textDark]}>
                  {t('outfitChange.beautyFilter')}
                </Text>
                <Text style={styles.optionSubtitle}>
                  {t('outfitChange.enhanceSkin')}
                </Text>
              </View>
            </View>
            <Switch
              value={beautyFilter}
              onValueChange={setBeautyFilter}
              trackColor={{ false: '#e5e7eb', true: '#1a1a1a' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* 固定底部按钮 */}
      <View style={styles.fixedBottom}>
        <View style={styles.gradientContainer}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', isDark ? '#121212' : '#ffffff']}
            style={styles.gradient}
          />
        </View>
        <TouchableOpacity
          style={[styles.generateButton, !userImage && styles.generateButtonDisabled]}
          disabled={!userImage}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#1a1a1a', '#000000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.generateGradient}
          >
            <Sparkles size={20} color="#fff" strokeWidth={2.5} />
            <Text style={styles.generateButtonText}>
              {t('outfitChange.startGenerating')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  textDark: {
    color: '#f0f0f0',
  },

  // 上传区域
  uploadArea: {
    aspectRatio: 3 / 4,
    maxHeight: 400,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
    position: 'relative',
  },
  uploadAreaDark: {
    borderColor: '#404040',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  cameraIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  privacyText: {
    fontSize: 11,
    color: '#9ca3af',
  },

  // Tab切换
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  tabContainerDark: {
    backgroundColor: '#1e1e1e',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  // Tab内容
  tabContent: {
    marginTop: 8,
  },
  trendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  trendingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4b5563',
  },
  freeAttemptsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  freeAttemptsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  // 模板网格
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  templateCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  templateCardDark: {
    backgroundColor: '#1e1e1e',
    borderColor: 'rgba(255,255,255,0.05)',
  },
  templateCardSelected: {
    borderColor: '#1a1a1a',
    borderWidth: 2,
  },
  templateIcon: {
    marginBottom: 8,
  },
  templateIconText: {
    fontSize: 32,
  },
  templateName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  templateEmoji: {
    fontSize: 10,
    opacity: 0.8,
    marginTop: 4,
  },

  // 更多按钮
  moreButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  moreButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  // Custom Outfit
  customTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  customUploadRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  customUploadCard: {
    flex: 1,
    aspectRatio: 4 / 5,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  customUploadCardDark: {
    borderColor: '#404040',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  customUploadTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 12,
    marginBottom: 8,
  },
  customUploadBadge: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
  },
  customUploadBadgeOptional: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
  },
  uploadHintBox: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  uploadHintText: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 18,
  },

  // Pro Style
  proTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  influencerCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  influencerCardDark: {
    backgroundColor: '#1e1e1e',
    borderColor: 'rgba(255,255,255,0.05)',
  },
  influencerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  influencerAvatarText: {
    fontSize: 32,
  },
  verifiedBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    color: '#ffffff',
    fontSize: 14,
  },
  influencerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  influencerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  influencerDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  influencerTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4b5563',
  },
  comingSoon: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 24,
  },

  // 选项区域
  optionsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 24,
  },
  optionsSectionDark: {
    backgroundColor: '#1e1e1e',
    borderColor: 'rgba(255,255,255,0.05)',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIconDark: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },

  // 固定底部
  fixedBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  gradientContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: -1,
  },
  gradient: {
    flex: 1,
  },
  generateButton: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});
