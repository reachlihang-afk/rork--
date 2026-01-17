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
  useColorScheme,
  Platform 
} from 'react-native';
import { useVerification } from '@/contexts/VerificationContext';
import { useTranslation } from 'react-i18next';
import { saveToGallery } from '@/utils/share';

interface GroupedHistory {
  today: any[];
  yesterday: any[];
  older: any[];
}

export default function HistoryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
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
        Alert.alert(t('common.success'), t('outfitChange.downloadSuccess'));
      } else {
        Alert.alert(t('common.error'), t('outfitChange.downloadFailed'));
      }
    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert(t('common.error'), t('outfitChange.downloadFailed'));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleShare = (item: any) => {
    // 跳转到详情页，详情页有分享功能
    router.push(`/outfit-change-detail/${item.id}` as any);
  };

  const handleDelete = (itemId: string) => {
    Alert.alert(
      t('history.deleteRecord'),
      t('history.deleteRecordConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteOutfitChange(itemId);
          },
        },
      ]
    );
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
      style={[
        styles.historyCard,
        isDark && styles.historyCardDark
      ]}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={[styles.cardTitle, isDark && styles.textDark]}>
            {item.templateName}
          </Text>
          <Text style={[styles.cardTime, isDark && styles.subtitleDark]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
        {isNew(item.createdAt) && (
          <View style={[styles.newBadge, isDark && styles.newBadgeDark]}>
            <Text style={[styles.newBadgeText, isDark && styles.newBadgeTextDark]}>
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
          <View style={[styles.imageContainer, isDark && styles.imageContainerDark]}>
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
            color={isDark ? '#52525b' : '#d1d5db'} 
            strokeWidth={2.5}
          />
        </View>

        {/* Result Image */}
        <View style={styles.imageWrapper}>
          <View style={[styles.imageContainer, isDark && styles.imageContainerDark]}>
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
              color={isDark ? '#d4d4d8' : '#111827'} 
              strokeWidth={2}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShare(item)}
          >
            <Share2 
              size={22} 
              color={isDark ? '#d4d4d8' : '#111827'} 
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
        <View style={[styles.sectionHeader, isDark && styles.sectionHeaderDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            {title.toUpperCase()}
          </Text>
          <Text style={[styles.sectionCount, isDark && styles.subtitleDark]}>
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
      <View style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🕐</Text>
          <Text style={[styles.emptyTitle, isDark && styles.textDark]}>
            {t('history.noOutfitChangeHistory')}
          </Text>
          <Text style={[styles.emptyText, isDark && styles.subtitleDark]}>
            {t('history.noOutfitChangeHistoryDesc')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
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
    backgroundColor: '#fafafa',
  },
  containerDark: {
    backgroundColor: '#000000',
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
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(250, 250, 250, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionHeaderDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderBottomColor: '#27272a',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 1.5,
  },
  sectionTitleDark: {
    color: '#ffffff',
  },
  sectionCount: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9ca3af',
    letterSpacing: 1,
  },
  sectionContent: {
    paddingHorizontal: Platform.OS === 'web' ? 16 : 0,
    paddingVertical: Platform.OS === 'web' ? 16 : 0,
  },
  
  // History Card
  historyCard: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    ...Platform.select({
      web: {
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
        overflow: 'hidden',
      },
      default: {
        borderRadius: 0,
      },
    }),
  },
  historyCardDark: {
    backgroundColor: '#1a1a1a',
    borderBottomColor: '#27272a',
    ...Platform.select({
      web: {
        borderColor: '#27272a',
      },
    }),
  },
  
  // Card Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  cardTime: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9ca3af',
  },
  newBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  newBadgeDark: {
    backgroundColor: '#ffffff',
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  newBadgeTextDark: {
    color: '#000000',
  },
  
  // Images Container
  imagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  imageWrapper: {
    flex: 1,
  },
  imageContainer: {
    aspectRatio: 3 / 4,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#f9fafb',
    position: 'relative',
  },
  imageContainerDark: {
    backgroundColor: '#27272a',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageLabel: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  imageLabelResult: {
    left: 'auto',
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  imageLabelText: {
    fontSize: 9,
    fontWeight: '500',
    color: '#ffffff',
    letterSpacing: 1,
  },
  arrowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -4,
    zIndex: 10,
  },
  
  // Actions
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginTop: 4,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  
  // Text colors
  textDark: {
    color: '#ffffff',
  },
  subtitleDark: {
    color: '#71717a',
  },
});
