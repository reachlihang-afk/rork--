import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ShieldCheck, Sparkles, SearchX } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useVerification } from '@/contexts/VerificationContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { referencePhotos, verificationHistory, outfitChangeHistory } = useVerification();
  const { user } = useAuth();

  const hasReferencePhotos = referencePhotos.length > 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconEmoji}>👔</Text>
          </View>
          <Text style={styles.title}>{t('home.title')}</Text>
          <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
          {user && (
            <Text style={styles.welcomeText} numberOfLines={1} ellipsizeMode="tail">
              {t('home.welcome', { name: user.nickname || user.userId })}
            </Text>
          )}
        </View>



        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/outfit-change' as any)}
          >
            <View style={styles.quickActionIcon}>
              <Text style={styles.actionIconText}>👔</Text>
            </View>
            <Text style={styles.quickActionTitle} numberOfLines={2}>{t('home.outfitChange')}</Text>
            <Text style={styles.quickActionDescription} numberOfLines={3}>{t('home.outfitChangeDesc')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => {
              if (hasReferencePhotos) {
                router.push('/verify-photo' as any);
              } else {
                router.push('/upload-reference' as any);
              }
            }}
          >
            <View style={styles.quickActionIcon}>
              <ShieldCheck size={24} color="#0066FF" />
            </View>
            <Text style={styles.quickActionTitle} numberOfLines={2}>{t('home.photoVerification')}</Text>
            <Text style={styles.quickActionDescription} numberOfLines={3}>{t('home.photoVerificationDesc')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/image-source' as any)}
          >
            <View style={styles.quickActionIcon}>
              <SearchX size={24} color="#0066FF" />
            </View>
            <Text style={styles.quickActionTitle} numberOfLines={2}>{t('home.findSource')}</Text>
            <Text style={styles.quickActionDescription} numberOfLines={3}>{t('home.findSourceDesc')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/lookup-verification' as any)}
          >
            <View style={styles.quickActionIcon}>
              <Text style={styles.actionIconText}>🔍</Text>
            </View>
            <Text style={styles.quickActionTitle} numberOfLines={2}>{t('home.lookupVerification')}</Text>
            <Text style={styles.quickActionDescription} numberOfLines={3}>{t('home.lookupVerificationDesc')}</Text>
          </TouchableOpacity>
        </View>

        {outfitChangeHistory.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home.outfitHistory')}</Text>
              <TouchableOpacity onPress={() => router.push('/history' as any)}>
                <Text style={styles.viewAllText}>{t('home.viewAll')}</Text>
              </TouchableOpacity>
            </View>
            {outfitChangeHistory.slice(0, 3).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recentCard}
                onPress={() => {
                  // 可以添加查看详情页面
                }}
              >
                <Image 
                  source={{ uri: item.originalImageUri }}
                  style={styles.recentImage}
                  contentFit="cover"
                />
                <View style={styles.recentContent}>
                  <Text style={styles.recentTemplateName}>
                    {item.templateName}
                  </Text>
                  <Text style={styles.recentDate}>
                    {formatDateTime(item.createdAt)}
                  </Text>
                </View>
                <Image 
                  source={{ uri: item.resultImageUri }}
                  style={styles.recentResultImage}
                  contentFit="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function getVerdictText(verdict: string, t: any): string {
  const verdicts: Record<string, string> = {
    'authentic': t('verdict.authenticShort'),
    'slightly-edited': t('verdict.slightlyEditedShort'),
    'heavily-edited': t('verdict.heavilyEditedShort'),
    'suspicious': t('verdict.suspiciousShort'),
  };
  return verdicts[verdict] || verdict;
}

function getScoreColor(score: number): string {
  if (score >= 9) {
    return '#15803D';
  } else if (score >= 7.5) {
    return '#CA8A04';
  }
  return '#DC2626';
}

function formatScore(score: number): string {
  if (score % 1 === 0) {
    return score.toString();
  }
  return score.toFixed(1);
}

function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  iconEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 22,
    fontWeight: '500',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 255, 0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 24,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    minHeight: 160,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 255, 0.08)',
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E6F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIconText: {
    fontSize: 24,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  quickActionDescription: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
    flexShrink: 1,
  },
  statValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0066FF',
    marginBottom: 6,
    letterSpacing: -1.5,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  divider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionCardPrimary: {
    backgroundColor: '#0066FF',
    shadowColor: '#0066FF',
    shadowOpacity: 0.3,
    borderColor: '#0066FF',
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E6F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconEmoji: {
    fontSize: 24,
  },
  actionIconDisabled: {
    backgroundColor: '#F1F5F9',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  actionTitlePrimary: {
    color: '#fff',
  },
  actionTitleDisabled: {
    color: '#94A3B8',
  },
  actionDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    fontWeight: '500',
  },
  actionDescriptionPrimary: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  actionDescriptionDisabled: {
    color: '#CBD5E1',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  recentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 255, 0.08)',
  },
  recentImage: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
  },
  recentContent: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  recentScore: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  recentVerdict: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 12,
    alignSelf: 'center',
  },
  recentResultImage: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    marginLeft: 12,
  },
  recentTemplateName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0066FF',
  },
  recentDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  welcomeText: {
    fontSize: 14,
    color: '#0066FF',
    marginTop: 10,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
