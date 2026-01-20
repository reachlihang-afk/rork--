import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Heart, Sparkles } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useSquare } from '@/contexts/SquareContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const { posts } = useSquare();

  // 获取热门作品
  const featuredWorks = useMemo(() => {
    return [...posts]
      .filter(post => post.resultImageUri)
      .sort((a, b) => b.likes.length - a.likes.length)
      .slice(0, 8);
  }, [posts]);

  // 瀑布流分列
  const { leftColumn, rightColumn } = useMemo(() => {
    const left: typeof featuredWorks = [];
    const right: typeof featuredWorks = [];
    featuredWorks.forEach((work, index) => {
      if (index % 2 === 0) left.push(work);
      else right.push(work);
    });
    return { leftColumn: left, rightColumn: right };
  }, [featuredWorks]);

  const getCardHeight = (index: number, isLeft: boolean) => {
    const heights = isLeft ? [200, 260, 180, 240] : [240, 180, 260, 200];
    return heights[index % heights.length];
  };

  const renderWorkCard = (work: typeof featuredWorks[0], index: number, isLeft: boolean) => {
    const height = getCardHeight(index, isLeft);
    return (
      <TouchableOpacity
        key={work.id}
        style={[styles.workCard, { marginBottom: 12 }]}
        onPress={() => router.push('/(tabs)/square' as any)}
        activeOpacity={0.9}
      >
        <View style={[styles.workImageContainer, { height }]}>
          <Image
            source={{ uri: work.resultImageUri }}
            style={styles.workImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.workGradient}
          />
          <View style={styles.workOverlay}>
            <View style={styles.workUserRow}>
              <View style={styles.workUserAvatar}>
                {work.userAvatar ? (
                  <Image
                    source={{ uri: work.userAvatar }}
                    style={styles.workUserAvatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.workUserAvatarPlaceholder}>👤</Text>
                )}
              </View>
              <Text style={styles.workUserName} numberOfLines={1}>
                {work.userNickname || '用户'}
              </Text>
            </View>
            <View style={styles.workStats}>
              <View style={styles.workStat}>
                <Heart size={12} color="#fff" fill={work.likes.length > 0 ? "#fff" : "transparent"} />
                <Text style={styles.workStatText}>{work.likes.length}</Text>
              </View>
            </View>
          </View>
        </View>
        {work.templateName && (
          <View style={styles.workFooter}>
            <Text style={styles.workTemplateName} numberOfLines={1}>
              {work.templateName}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
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
                <Text style={styles.heroTitle}>{t('home.oneClickOutfit')}</Text>
                <Text style={styles.heroSubtitle}>{t('home.transformInstantly')}</Text>
              </View>
              <View style={styles.heroImageContainer}>
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
            
            <View style={styles.heroStartButtonContainer}>
              <View style={styles.heroStartButton}>
                <LinearGradient
                  colors={['#ffffff', '#f8f8f8']}
                  style={styles.heroStartButtonGradient}
                >
                  <Text style={styles.heroStartButtonText}>{t('home.start')}</Text>
                </LinearGradient>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* 精选效果 - 瀑布流 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Sparkles size={18} color="#f59e0b" strokeWidth={2.5} />
              <Text style={styles.sectionTitle}>精选效果</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/square' as any)}>
              <Text style={styles.viewAllLink}>查看更多</Text>
            </TouchableOpacity>
          </View>

          {featuredWorks.length > 0 ? (
            <View style={styles.waterfallContainer}>
              <View style={styles.waterfallColumn}>
                {leftColumn.map((work, index) => renderWorkCard(work, index, true))}
              </View>
              <View style={styles.waterfallColumn}>
                {rightColumn.map((work, index) => renderWorkCard(work, index, false))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyWorks}>
              <Text style={styles.emptyWorksIcon}>✨</Text>
              <Text style={styles.emptyWorksText}>精选作品即将上线</Text>
              <TouchableOpacity 
                style={styles.tryButton}
                onPress={() => router.push('/outfit-change' as any)}
              >
                <Text style={styles.tryButtonText}>立即体验换装</Text>
              </TouchableOpacity>
            </View>
          )}
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
  scrollView: { flex: 1 },
  content: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  
  // Hero Card
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
  heroGradient: {
    padding: 24,
    minHeight: 200,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroLeft: { flex: 1, paddingRight: 16 },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  heroImageContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,  // 正圆形
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: '#1E293B',
    // 去掉倾斜效果
  },
  heroImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatar: { width: '100%', height: '100%' },
  heroImagePlaceholderIcon: {
    fontSize: 24,
    textAlign: 'center',
  },
  heroStartButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  heroStartButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  heroStartButtonGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStartButtonText: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '700',
  },

  // Section
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },

  // 瀑布流
  waterfallContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  waterfallColumn: { flex: 1 },
  workCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  workImageContainer: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
  },
  workImage: { width: '100%', height: '100%' },
  workGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  workOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  workUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  workUserAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  workUserAvatarImage: { width: '100%', height: '100%' },
  workUserAvatarPlaceholder: { fontSize: 12 },
  workUserName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  workStats: {
    flexDirection: 'row',
    gap: 12,
  },
  workStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workStatText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  workFooter: { padding: 10 },
  workTemplateName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },

  // 空状态
  emptyWorks: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  emptyWorksIcon: { fontSize: 48, marginBottom: 12 },
  emptyWorksText: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20,
  },
  tryButton: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  tryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
