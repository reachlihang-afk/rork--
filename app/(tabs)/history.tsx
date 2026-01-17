import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowRight, Download, Share2, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Platform 
} from 'react-native';
import { useVerification } from '@/contexts/VerificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useAlert } from '@/contexts/AlertContext';
import { saveToGallery } from '@/utils/share';

interface GroupedHistory {
  today: any[];
  yesterday: any[];
  older: any[];
}

export default function HistoryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { showAlert } = useAlert();
  
  const { outfitChangeHistory, deleteOutfitChange } = useVerification();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // 分组历史记录
  const groupedHistory: GroupedHistory = outfitChangeHistory.reduce(
    (acc, item) => {
      const itemDate = new Date(item.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // 重置时间到0点用于比较日期
      const resetTime = (date: Date) => {
        date.setHours(0, 0, 0, 0);
        return date;
      };

      const itemDay = resetTime(new Date(itemDate));
      const todayDay = resetTime(new Date(today));
      const yesterdayDay = resetTime(new Date(yesterday));

      if (itemDay.getTime() === todayDay.getTime()) {
        acc.today.push(item);
      } else if (itemDay.getTime() === yesterdayDay.getTime()) {
        acc.yesterday.push(item);
      } else {
        acc.older.push(item);
      }

      return acc;
    },
    { today: [], yesterday: [], older: [] } as GroupedHistory
  );

  const handleDownload = async (itemId: string, resultImageUri: string) => {
    if (downloadingId) return;

    try {
      setDownloadingId(itemId);
      const success = await saveToGallery(resultImageUri);
      if (success) {
        showAlert({
          type: 'success',
          title: t('common.success'),
          message: t('outfitChange.downloadSuccess')
        });
      } else {
        showAlert({
          type: 'error',
          title: t('common.error'),
          message: t('outfitChange.downloadFailed')
        });
      }
    } catch (error) {
      console.error('Download failed:', error);
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: t('outfitChange.downloadFailed')
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleShare = (item: any) => {
    // 跳转到详情页，详情页有分享功能
    router.push(`/outfit-change-detail/${item.id}` as any);
  };

  const handleDelete = (itemId: string) => {
    showAlert({
      type: 'confirm',
      title: t('history.deleteRecord'),
      message: t('history.deleteRecordConfirm'),
      confirmText: t('common.delete'),
      onConfirm: async () => {
        await deleteOutfitChange(itemId);
      }
    });
  };

  const isNew = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    return diff < 3600000; // 1小时内算新记录
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const renderHistoryItem = (item: any) => (
    <View 
      key={item.id}
      style={styles.historyCard}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardTitle}>
            {item.templateName}
          </Text>
          <Text style={styles.cardTime}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
        {isNew(item.createdAt) && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>
              {t('history.new').toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Images */}
      <TouchableOpacity
        style={styles.imagesContainer}
        onPress={() => router.push(`/outfit-change-detail/${item.id}` as any)}
        activeOpacity={0.95}
      >
        {/* Original Image */}
        <View style={styles.imageWrapper}>
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: item.originalImageUri }}
              style={styles.image}
              contentFit="cover"
            />
            <View style={styles.imageLabel}>
              <Text style={styles.imageLabelText}>
                {t('history.original').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Arrow */}
        <View style={styles.arrowContainer}>
          <ArrowRight 
            size={14} 
            color="#d1d5db" 
            strokeWidth={2.5}
          />
        </View>

        {/* Result Image */}
        <View style={styles.imageWrapper}>
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: item.resultImageUri }}
              style={styles.image}
              contentFit="cover"
            />
            <View style={[styles.imageLabel, styles.imageLabelResult]}>
              <Text style={styles.imageLabelText}>
                {t('history.result').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDownload(item.id, item.resultImageUri)}
            disabled={downloadingId === item.id}
          >
            <Download 
              size={22} 
              color="#111827" 
              strokeWidth={2}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShare(item)}
          >
            <Share2 
              size={22} 
              color="#111827" 
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(item.id)}
        >
          <Trash2 
            size={22} 
            color="#9ca3af" 
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSection = (title: string, count: number, items: any[]) => {
    if (items.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {title.toUpperCase()}
          </Text>
          <Text style={styles.sectionCount}>
            {count} {t('history.transformations').toUpperCase()}
          </Text>
        </View>

        <View style={styles.sectionContent}>
          {items.map(item => renderHistoryItem(item))}
        </View>
      </View>
    );
  };

  if (outfitChangeHistory.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🕐</Text>
          <Text style={styles.emptyTitle}>
            {t('history.noOutfitChangeHistory')}
          </Text>
          <Text style={styles.emptyText}>
            {t('history.noOutfitChangeHistoryDesc')}
          </Text>
        </View>
      </View>
    );
  }

  // 未登录时显示登录提示
  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.loginRequiredContainer}>
          <Text style={styles.loginRequiredIcon}>📋</Text>
          <Text style={styles.loginRequiredTitle}>{t('history.loginRequired')}</Text>
          <Text style={styles.loginRequiredSubtitle}>{t('history.loginRequiredDesc')}</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/profile')}
          >
            <Text style={styles.loginButtonText}>{t('common.login')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderSection(t('history.today'), groupedHistory.today.length, groupedHistory.today)}
        {renderSection(t('history.yesterday'), groupedHistory.yesterday.length, groupedHistory.yesterday)}
        {renderSection(t('history.older'), groupedHistory.older.length, groupedHistory.older)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loginRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loginRequiredIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  loginRequiredTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  loginRequiredSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 24,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Section
  section: {
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4b5563',
    letterSpacing: 1.5,
  },
  sectionCount: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9ca3af',
    letterSpacing: 1,
  },
  sectionContent: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  
  // History Card
  historyCard: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  
  // Card Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  cardTime: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9ca3af',
  },
  newBadge: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  
  // Images Container
  imagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  imageWrapper: {
    flex: 1,
  },
  imageContainer: {
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageLabel: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  imageLabelResult: {
    left: 'auto',
    right: 8,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
  },
  imageLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
  arrowContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Actions
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 16,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f9fafb',
  },
});
