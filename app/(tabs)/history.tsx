import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Clock, X, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, Pressable, Alert } from 'react-native';
import { useVerification } from '@/contexts/VerificationContext';
import { useTranslation } from 'react-i18next';

export default function HistoryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { outfitChangeHistory, clearOutfitChangeHistory, deleteOutfitChange } = useVerification();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const handleClearOutfitChangeHistory = () => {
    Alert.alert(
      t('history.clearHistory'),
      t('history.clearOutfitChangeConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('history.clearHistory'),
          style: 'destructive',
          onPress: async () => {
            await clearOutfitChangeHistory();
            Alert.alert(t('common.success'), t('history.outfitChangeHistoryCleared'));
          },
        },
      ]
    );
  };

  const handleDeleteOutfitChange = (itemId: string) => {
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

  const renderOutfitChangeHistory = () => {
    if (outfitChangeHistory.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Clock size={48} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>{t('history.noOutfitChangeHistory')}</Text>
          <Text style={styles.emptyText}>{t('history.noOutfitChangeHistoryDesc')}</Text>
        </View>
      );
    }

    return (
      <>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>{t('history.outfitChangeHistory')}</Text>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearOutfitChangeHistory}
          >
            <Trash2 size={18} color="#EF4444" />
            <Text style={styles.clearButtonText}>{t('history.clearHistory')}</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={outfitChangeHistory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.historyItem}
              onPress={() => {
                router.push(`/outfit-change-detail/${item.id}` as any);
              }}
            >
              <Image 
                source={{ uri: item.originalImageUri }}
                style={styles.thumbnailImage}
                contentFit="cover"
              />
              <View style={styles.middleSection}>
                <View style={styles.templateBadgeWrapper}>
                  <View style={[styles.templateBadge, { backgroundColor: getTemplateBadgeColor(item.templateName) }]}>
                    <Text style={styles.templateIcon}>{getTemplateIcon(item.templateName)}</Text>
                    <Text style={styles.templateName} numberOfLines={1}>
                      {item.templateName}
                    </Text>
                  </View>
                </View>
                <Text style={styles.itemDate}>{formatDateTime(item.createdAt)}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteOutfitChange(item.id);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <Image 
                source={{ uri: item.resultImageUri }}
                style={styles.thumbnailImage}
                contentFit="cover"
              />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Modal
        visible={selectedPhoto !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedPhoto(null)}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedPhoto(null)}
            >
              <X size={28} color="#fff" />
            </TouchableOpacity>
            {selectedPhoto && (
              <Image source={{ uri: selectedPhoto }} style={styles.modalImage} contentFit="contain" />
            )}
          </View>
        </Pressable>
      </Modal>

      {renderOutfitChangeHistory()}
    </View>
  );
}

function getTemplateIcon(templateName: string): string {
  const templateIcons: Record<string, string> = {
    '随机装': '🎲',
    'Jennie同款': '💖',
    '正装': '👔',
    '比基尼': '👙',
    '一键穿搭': '✨',
    '运动装': '🏃',
    '婚纱/礼服': '👰',
    '汉服': '🏮',
    '超级英雄': '🦸',
    '新年装-马年': '🐴',
    '老钱风': '💰',
    '网球装': '🎾',
    '财神装': '💸',
    '辣妹装': '🔥',
    '美团外卖装': '🛵',
    '滑雪服': '⛷️',
    '空姐装': '✈️',
    '户外装': '🏔️',
    '牛仔装': '🤠',
    '魔法师装': '🧙',
    '海盗装': '🏴‍☠️',
    '童话公主装': '👸',
    '咖啡师-星巴克': '☕',
    '洛丽塔': '🎀',
    '视觉系': '🦇',
    '朋克装': '🤘',
  };
  return templateIcons[templateName] || '👔';
}

function getTemplateBadgeColor(templateName: string): string {
  const templateColors: Record<string, string> = {
    '随机装': '#F3E8FF',
    'Jennie同款': '#FFE4E6',
    '正装': '#EEF2FF',
    '比基尼': '#FEF3C7',
    '一键穿搭': '#F0F9FF',
    '运动装': '#DCFCE7',
    '婚纱/礼服': '#FFE4E6',
    '汉服': '#FEF3C7',
    '超级英雄': '#DBEAFE',
    '新年装-马年': '#FEE2E2',
    '老钱风': '#FEF9C3',
    '网球装': '#DCFCE7',
    '财神装': '#FEF3C7',
    '辣妹装': '#FECACA',
    '美团外卖装': '#FEF3C7',
    '滑雪服': '#E0F2FE',
    '空姐装': '#E0F2FE',
    '户外装': '#D1FAE5',
    '牛仔装': '#E0E7FF',
    '魔法师装': '#DDD6FE',
    '海盗装': '#374151',
    '童话公主装': '#FDE68A',
    '咖啡师-星巴克': '#FEF3C7',
    '洛丽塔': '#FCE7F3',
    '视觉系': '#E9D5FF',
    '朋克装': '#F3F4F6',
  };
  return templateColors[templateName] || '#EEF2FF';
}

function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    fontWeight: '500',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 255, 0.08)',
  },
  thumbnailImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  middleSection: {
    flex: 1,
    marginHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateBadgeWrapper: {
    marginBottom: 6,
  },
  templateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  templateIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
  },
  itemDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  deleteButton: {
    marginTop: 8,
    padding: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    width: '90%',
    height: '70%',
  },
});
