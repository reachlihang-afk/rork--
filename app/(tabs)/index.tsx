import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Sparkles, Camera } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { useVerification } from '@/contexts/VerificationContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useCoin } from '@/contexts/CoinContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

// 最新的4个模板
const LATEST_TEMPLATES = [
  { id: 'jennie', icon: '💖', badge: 'HOT' },
  { id: 'fairytale-princess', icon: '👸', badge: null },
  { id: 'random', icon: '✨', isSpecial: true, badge: null },
  { id: 'starbucks-barista', icon: '☕', badge: null },
];

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { coinBalance } = useCoin();
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  // 获取模板的翻译名称和副标题
  const getTemplateName = (id: string) => {
    return t(`outfitChange.templates.${id}`, id);
  };

  // 拍照功能
  const handleTakePhoto = async () => {
    if (isTakingPhoto) return;
    
    try {
      setIsTakingPhoto(true);
      
      // 请求相机权限
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.tip'), '需要相机权限才能拍照');
        return;
      }

      // 启动相机
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        // 跳转到换装页面并传递照片URI
        router.push({
          pathname: '/outfit-change' as any,
          params: { photoUri }
        });
      }
    } catch (error) {
      console.error('拍照失败:', error);
      Alert.alert(t('common.error'), '拍照失败，请重试');
    } finally {
      setIsTakingPhoto(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header - 移除应用名称,只保留右侧功能区 */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <View style={styles.headerRight}>
          <View style={styles.coinContainer}>
            <Text style={styles.coinText}>💎 {coinBalance}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <TouchableOpacity 
          style={styles.heroCard}
          onPress={() => router.push('/outfit-change' as any)}
          activeOpacity={0.95}
        >
          <LinearGradient
            colors={['#0F172A', '#1E293B', '#030712']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroLeft}>
                <View style={styles.aiPoweredBadge}>
                  <Sparkles size={14} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.aiPoweredText}>{t('home.aiPowered')}</Text>
                </View>
                <Text style={styles.heroTitle}>{t('home.oneClickOutfit')}</Text>
                <Text style={styles.heroSubtitle}>{t('home.transformInstantly')}</Text>
              </View>
              <View style={styles.heroImageContainer}>
                <View style={styles.heroImagePlaceholder}>
                  <Text style={styles.heroImagePlaceholderIcon}>👔</Text>
                </View>
              </View>
            </View>
            
            {/* 拍照按钮 */}
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={handleTakePhoto}
              disabled={isTakingPhoto}
            >
              <View style={styles.cameraIconContainer}>
                <Camera size={20} color="#0F172A" strokeWidth={2.5} />
              </View>
              <Text style={styles.cameraText}>
                {isTakingPhoto ? t('common.loading') : t('home.takeSelfie')}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </TouchableOpacity>

        {/* Templates Section - 只显示标题和View All */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.templates')}</Text>
            <TouchableOpacity onPress={() => router.push('/outfit-change' as any)}>
              <Text style={styles.viewAllLink}>{t('home.viewAll')}</Text>
            </TouchableOpacity>
          </View>

          {/* Template Grid - 只显示最新4个模板 */}
          <View style={styles.templateGrid}>
            {LATEST_TEMPLATES.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[styles.templateCard, template.isSpecial && styles.templateCardSpecial]}
                onPress={() => router.push('/outfit-change' as any)}
                activeOpacity={0.9}
              >
                {template.isSpecial ? (
                  <View style={styles.randomTemplate}>
                    <Text style={styles.randomIcon}>🎲</Text>
                    <Text style={styles.randomLabel}>{getTemplateName(template.id)}</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.templateImageContainer}>
                      <View style={styles.templateImagePlaceholder}>
                        <Text style={styles.templatePlaceholderIcon}>{template.icon}</Text>
                      </View>
                      {template.badge && (
                        <View style={styles.hotBadge}>
                          <Text style={styles.hotBadgeText}>{template.badge}</Text>
                        </View>
                      )}
                    </View>
                  </>
                )}
                <View style={styles.templateFooter}>
                  <View style={styles.templateIcon}>
                    <Text style={styles.templateIconText}>{template.icon}</Text>
                  </View>
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName} numberOfLines={2}>
                      {getTemplateName(template.id)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerSpacer: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  coinText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  heroGradient: {
    padding: 24,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heroLeft: {
    flex: 1,
  },
  aiPoweredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
    gap: 4,
  },
  aiPoweredText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 30,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  heroImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ rotate: '3deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImagePlaceholderIcon: {
    fontSize: 32,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 12,
  },
  cameraIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cameraText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  templateCard: {
    width: '47.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  templateCardSpecial: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  templateImageContainer: {
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    marginBottom: 10,
    position: 'relative',
  },
  templateImage: {
    width: '100%',
    height: '100%',
  },
  templateImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templatePlaceholderIcon: {
    fontSize: 48,
  },
  hotBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  hotBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  randomTemplate: {
    aspectRatio: 3 / 4,
    borderRadius: 12,
    backgroundColor: 'rgba(248, 250, 252, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 8,
  },
  randomIcon: {
    fontSize: 36,
  },
  randomLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  templateFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  templateIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateIconText: {
    fontSize: 18,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
});
