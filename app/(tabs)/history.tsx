import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowRight, Download, Share2, Trash2 } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const { isLoggedIn } = useAuth();
  const { showAlert } = useAlert();
  
  const { outfitChangeHistory, deleteOutfitChange } = useVerification();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // 下拉刷新
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // 模拟刷新延迟
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  }, []);

  // 分组历史记录
  const groupedHistory: GroupedHistory = outfitChangeHistory.reduce(
    (acc, item) => {
      const itemDate = new Date(item.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const resetTime = (date: Date) => {
        const newDate = new Date(date);
        newDate.setHours(0, 0, 0, 0);
        return newDate;
      };

      const itemDay = resetTime(itemDate);
      const todayDay = resetTime(today);
      const yesterdayDay = resetTime(yesterday);

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
    <View key={item.id} style={styles.historyCard}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.templateName || 'Outfit Change'}
          </Text>
          <Text style={styles.cardTime}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
        {isNew(item.createdAt) && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>New</Text>
          </View>
        )}
      </View>

      {/* Images */}
      <TouchableOpacity
        style={styles.imagesContainer}
        onPress={() => router.push(`/outfit-change-detail/${item.id}` as any)}
        activeOpacity={0.9}
      >
        {/* Original Image */}
        <View style={styles.imageWrapper}>
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: item.originalImageUri }}
              style={styles.image}
              contentFit="cover"
              placeholder={require('@/assets/images/icon.png')}
              transition={200}
            />
            <View style={styles.imageLabel}>
              <Text style={styles.imageLabelText}>ORIGINAL</Text>
            </View>
          </View>
        </View>

        {/* Arrow */}
        <View style={styles.arrowContainer}>
          <ArrowRight size={16} color="#9ca3af" strokeWidth={2} />
        </View>

        {/* Result Image */}
        <View style={styles.imageWrapper}>
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: item.resultImageUri }}
              style={styles.image}
              contentFit="cover"
              placeholder={require('@/assets/images/icon.png')}
              transition={200}
            />
            <View style={[styles.imageLabel, styles.imageLabelResult]}>
              <Text style={styles.imageLabelText}>RESULT</Text>
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
            activeOpacity={0.7}
          >
            <Download size={20} color="#374151" strokeWidth={1.5} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              item.isPublishedToSquare && styles.actionButtonPublished
            ]}
            onPress={() => handleShare(item)}
            activeOpacity={0.7}
          >
            <Share2 
              size={20} 
              color={item.isPublishedToSquare ? "#10b981" : "#374151"} 
              strokeWidth={1.5} 
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(item.id)}
          activeOpacity={0.7}
        >
          <Trash2 size={20} color="#9ca3af" strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSection = (title: string, count: number, items: any[]) => {
    if (items.length === 0) return null;

    const transformationText = count === 1 ? 'TRANSFORMATION' : 'TRANSFORMATIONS';

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
          <Text style={styles.sectionCount}>{count} {transformationText}</Text>
        </View>
        <View style={styles.sectionContent}>
          {items.map(item => renderHistoryItem(item))}
        </View>
      </View>
    );
  };

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
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>{t('common.login')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 无历史记录
  if (outfitChangeHistory.length === 0) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.emptyScrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🕐</Text>
            <Text style={styles.emptyTitle}>
              {t('history.noOutfitChangeHistory')}
            </Text>
            <Text style={styles.emptyText}>
              {t('history.noOutfitChangeHistoryDesc')}
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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
  
  // Login Required
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
    fontSize: 20,
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
    paddingVertical: 14,
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
  emptyScrollContent: {
    flexGrow: 1,
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
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
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 1,
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9ca3af',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: '#ffffff',
  },
  
  // History Card
  historyCard: {
    backgroundColor: '#ffffff',
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  
  // Card Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  cardTime: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9ca3af',
  },
  newBadge: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  
  // Images Container
  imagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 8,
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
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  imageLabelResult: {
    left: 'auto',
    right: 8,
  },
  imageLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 0.5,
  },
  arrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Actions
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 12,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPublished: {
    backgroundColor: '#ecfdf5',
  },
});
