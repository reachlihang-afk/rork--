import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useVerification } from '@/contexts/VerificationContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useCoin } from '@/contexts/CoinContext';
import { LinearGradient } from 'expo-linear-gradient';

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
  const { user, isLoggedIn } = useAuth();
  const { coinBalance } = useCoin();

  // 获取模板的翻译名称和副标题
  const getTemplateName = (id: string) => {
    return t(`outfitChange.templates.${id}`, id);
  };

  // 点击金币/钻石的处理
  const handleCoinClick = () => {
    if (isLoggedIn) {
      // 已登录,跳转到充值页面
      router.push('/recharge' as any);
    } else {
      // 未登录,跳转到个人中心(登录页面)
      router.push('/(tabs)/profile' as any);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header - 移除应用名称,只保留右侧功能区 */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.coinContainer}
            onPress={handleCoinClick}
            activeOpacity={0.7}
          >
            <Text style={styles.coinText}>💎 {coinBalance}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card - 直接点击进入换装页面 */}
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
                <Text style={styles.heroTitle}>{t('home.oneClickOutfit')}</Text>
                <Text style={styles.heroSubtitle}>{t('home.transformInstantly')}</Text>
              </View>
              <View style={styles.heroImageContainer}>
                {/* 根据登录状态显示头像或爱心 */}
                {isLoggedIn && user?.avatar ? (
                  <Image 
                    source={{ uri: user.avatar }} 
                    style={styles.heroAvatar}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.heroImagePlaceholder}>
                    <Text style={styles.heroImagePlaceholderIcon}>❤️</Text>
                  </View>
                )}
              </View>
            </View>
            
            {/* 圆形开始按钮 */}
            <View style={styles.heroStartButtonContainer}>
              <View style={styles.heroStartButton}>
                <LinearGradient
                  colors={['#ffffff', '#f0f0f0']}
                  style={styles.heroStartButtonGradient}
                >
                  <Text style={styles.heroStartButtonIcon}>▶</Text>
                </LinearGradient>
              </View>
            </View>
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
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
    minHeight: 260, // 增大高度
  },
  heroGradient: {
    padding: 32, // 增大内边距
    minHeight: 260,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24, // 增加底部间距
  },
  heroLeft: {
    flex: 1,
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
    borderRadius: 40,
  },
  heroAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroImagePlaceholderIcon: {
    fontSize: 32,
  },
  
  // 圆形开始按钮
  heroStartButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  heroStartButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  heroStartButtonGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  heroStartButtonIcon: {
    fontSize: 28,
    color: '#0F172A',
    fontWeight: '900',
    marginLeft: 4, // 微调播放图标位置
  },

  uploadButtonContainer: {
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
  uploadIconContainer: {
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
  uploadText: {
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
