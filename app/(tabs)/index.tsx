import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Sparkles, Camera, Plus, Bell } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useVerification } from '@/contexts/VerificationContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useCoin } from '@/contexts/CoinContext';
import { LinearGradient } from 'expo-linear-gradient';

// 模板数据
const TEMPLATES = [
  { id: 'jennie', name: 'Jennie', subtitle: 'K-Pop Style', icon: '💖', badge: 'HOT', imageUri: null },
  { id: 'princess', name: 'Princess', subtitle: 'Fairytale', icon: '👑', imageUri: null },
  { id: 'random', name: 'Random', subtitle: 'Surprise Me', icon: '✨', isSpecial: true },
  { id: 'cyberpunk', name: 'Cyberpunk', subtitle: 'Futuristic', icon: '🤖', imageUri: null },
  { id: 'sports', name: 'Sports', subtitle: 'Energetic', icon: '🎾', imageUri: null },
  { id: 'vintage', name: '90s Vintage', subtitle: 'Classic', icon: '🎞️', imageUri: null },
];

const CATEGORIES = [
  { id: 'featured', name: 'Featured', active: true },
  { id: 'trendy', name: 'Trendy 🔥', active: false },
  { id: 'sports', name: 'Sports 🎾', active: false },
  { id: 'kpop', name: 'K-Pop 🎤', active: false },
  { id: 'vintage', name: 'Vintage 🎞️', active: false },
];

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { coinBalance, addCoins } = useCoin();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bai Bian Xing Jun</Text>
        <View style={styles.headerRight}>
          <View style={styles.coinContainer}>
            <Text style={styles.coinText}>💎 {coinBalance}</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => router.push('/recharge' as any)}
            >
              <Plus size={14} color="#fff" strokeWidth={3} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={20} color="#64748B" strokeWidth={2} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
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
                  <Text style={styles.aiPoweredText}>AI Powered</Text>
                </View>
                <Text style={styles.heroTitle}>One-click{'\n'}Outfit Swap</Text>
                <Text style={styles.heroSubtitle}>Transform your look instantly.</Text>
              </View>
              <View style={styles.heroImageContainer}>
                <View style={styles.heroImagePlaceholder}>
                  <Text style={styles.heroImagePlaceholderIcon}>👔</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.uploadButton}>
              <View style={styles.uploadIconContainer}>
                <Camera size={20} color="#0F172A" strokeWidth={2.5} />
              </View>
              <Text style={styles.uploadText}>Upload Your Selfie</Text>
            </TouchableOpacity>
          </LinearGradient>
        </TouchableOpacity>

        {/* Templates Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Templates</Text>
            <TouchableOpacity onPress={() => router.push('/outfit-change' as any)}>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Category Pills */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContent}
          >
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryPill, category.active && styles.categoryPillActive]}
              >
                <Text style={[styles.categoryText, category.active && styles.categoryTextActive]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Template Grid */}
          <View style={styles.templateGrid}>
            {TEMPLATES.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[styles.templateCard, template.isSpecial && styles.templateCardSpecial]}
                onPress={() => router.push('/outfit-change' as any)}
                activeOpacity={0.9}
              >
                {template.isSpecial ? (
                  <View style={styles.randomTemplate}>
                    <Text style={styles.randomIcon}>🎲</Text>
                    <Text style={styles.randomLabel}>Try Luck</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.templateImageContainer}>
                      {template.imageUri ? (
                        <Image
                          source={{ uri: template.imageUri }}
                          style={styles.templateImage}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={styles.templateImagePlaceholder}>
                          <Text style={styles.templatePlaceholderIcon}>{template.icon}</Text>
                        </View>
                      )}
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
                    <Text style={styles.templateName}>{template.name}</Text>
                    <Text style={styles.templateSubtitle}>{template.subtitle}</Text>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 4,
    gap: 6,
  },
  coinText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  addButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
  uploadButton: {
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
    marginBottom: 12,
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
  categoryScroll: {
    marginBottom: 16,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  categoryContent: {
    gap: 10,
    paddingRight: 20,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
    filter: 'grayscale(100%) contrast(125%)',
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
    lineHeight: 16,
  },
  templateSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
});
