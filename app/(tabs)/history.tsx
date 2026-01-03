import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Clock, X, Trash2, Image as ImageIcon } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, ScrollView, Pressable, Alert } from 'react-native';
import { useVerification } from '@/contexts/VerificationContext';
import { useTranslation } from 'react-i18next';

type TabType = 'verification' | 'imageSource';

export default function HistoryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { verificationHistory, imageSourceHistory, clearHistory, clearImageSourceHistory, deleteVerification, deleteImageSource } = useVerification();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('verification');

  const handleClearVerificationHistory = () => {
    Alert.alert(
      t('history.clearHistory'),
      t('history.clearHistoryConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('history.clearHistory'),
          style: 'destructive',
          onPress: async () => {
            await clearHistory();
            Alert.alert(t('common.success'), t('history.historyCleared'));
          },
        },
      ]
    );
  };

  const handleClearImageSourceHistory = () => {
    Alert.alert(
      t('history.clearHistory'),
      t('history.clearImageSourceConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('history.clearHistory'),
          style: 'destructive',
          onPress: async () => {
            await clearImageSourceHistory();
            Alert.alert(t('common.success'), t('history.imageSourceHistoryCleared'));
          },
        },
      ]
    );
  };

  const handleDeleteVerification = (itemId: string) => {
    Alert.alert(
      t('history.deleteRecord'),
      t('history.deleteRecordConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteVerification(itemId);
          },
        },
      ]
    );
  };

  const renderVerificationHistory = () => {
    if (verificationHistory.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Clock size={48} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>{t('history.noVerificationHistory')}</Text>
          <Text style={styles.emptyText}>{t('history.noVerificationHistoryDesc')}</Text>
        </View>
      );
    }

    return (
      <>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>{t('history.verificationHistory')}</Text>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearVerificationHistory}>
            <Trash2 size={18} color="#DC2626" />
            <Text style={styles.clearButtonText} numberOfLines={1}>{t('history.clearHistory')}</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={verificationHistory}
          keyExtractor={(item) => item.result.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push({
                  pathname: '/result/[id]' as any,
                  params: { id: item.result.id },
                })}
              >
                <View style={styles.card}>
                  <View style={styles.imageColumn}>
                    <Image 
                      source={{ uri: item.request.referencePhotos[0]?.uri || item.request.editedPhotoUri }}
                      style={styles.image}
                      contentFit="cover"
                    />
                    <View style={[styles.verdictBadge, getVerdictStyle(item.result.verdict)]}>
                      <Text style={[styles.verdictText, getVerdictTextStyle(item.result.verdict)]} numberOfLines={1}>
                        {getVerdictLabel(item.result.verdict, t)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <View style={styles.scoreContainer}>
                        <Text style={styles.scoreLabel}>{t('history.similarityScore')}</Text>
                        <Text style={[styles.scoreText, { color: getScoreColor(item.result.credibilityScore) }]}>
                          {item.result.credibilityScore.toFixed(1)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.referencePhotosRow}>
                      <Text style={styles.referenceLabel}>{t('history.referencePhotosLabel')}</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.referenceScroll}>
                        <TouchableOpacity
                          onPress={() => setSelectedPhoto(item.request.editedPhotoUri)}
                        >
                          <Image
                            source={{ uri: item.request.editedPhotoUri }}
                            style={styles.referenceThumbnail}
                            contentFit="cover"
                          />
                        </TouchableOpacity>
                      </ScrollView>
                    </View>
                    <View style={styles.analysisRow}>
                      <View style={styles.analysisItem}>
                        <Text style={styles.analysisLabel}>{t('history.facialSimilarity')}</Text>
                        <Text style={styles.analysisValue}>
                          {item.result.analysis.facialSimilarity.toFixed(0)}%
                        </Text>
                      </View>
                      <View style={styles.analysisItem}>
                        <Text style={styles.analysisLabel}>{t('history.skinTexture')}</Text>
                        <Text style={styles.analysisValue}>
                          {item.result.analysis.skinTexture.toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.dateText}>
                      {new Date(item.result.completedAt).toLocaleString('zh-CN')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteCornerButton}
                onPress={() => handleDeleteVerification(item.result.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Trash2 size={14} color="#DC2626" />
              </TouchableOpacity>
            </View>
          )}
        />
      </>
    );
  };

  const handleDeleteImageSource = (itemId: string) => {
    Alert.alert(
      t('history.deleteRecord'),
      t('history.deleteImageSourceConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteImageSource(itemId);
          },
        },
      ]
    );
  };

  const renderImageSourceHistory = () => {
    if (imageSourceHistory.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <ImageIcon size={48} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>{t('history.noImageSourceHistory')}</Text>
          <Text style={styles.emptyText}>{t('history.noImageSourceHistoryDesc')}</Text>
        </View>
      );
    }

    return (
      <>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>{t('history.imageSourceHistory')}</Text>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearImageSourceHistory}>
            <Trash2 size={18} color="#DC2626" />
            <Text style={styles.clearButtonText} numberOfLines={1}>{t('history.clearHistory')}</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={imageSourceHistory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push({
                  pathname: '/image-source-result/[id]' as any,
                  params: { id: item.id },
                })}
              >
                <View style={styles.sourceCard}>
                  <Image 
                    source={{ uri: item.imageUri }}
                    style={styles.sourceImage}
                    contentFit="cover"
                  />
                  <View style={styles.sourceCardContent}>
                    {item.analysis.entityInfo && (item.analysis.entityInfo.name || item.analysis.entityInfo.introduction) && (
                      <View style={styles.entityInfoBox}>
                        {item.analysis.entityInfo.name && (
                          <Text style={styles.entityNameSmall} numberOfLines={1}>
                            {item.analysis.entityInfo.name}
                          </Text>
                        )}
                        {item.analysis.entityInfo.introduction && (
                          <Text style={styles.entityIntroSmall} numberOfLines={2}>
                            {item.analysis.entityInfo.introduction}
                          </Text>
                        )}
                      </View>
                    )}

                    <Text style={styles.dateText}>
                      {new Date(item.createdAt).toLocaleString('zh-CN')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteCornerButton}
                onPress={() => handleDeleteImageSource(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Trash2 size={14} color="#DC2626" />
              </TouchableOpacity>
            </View>
          )}
        />
      </>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'verification' && styles.activeTab]}
          onPress={() => setActiveTab('verification')}
        >
          <Text style={[styles.tabText, activeTab === 'verification' && styles.activeTabText]} numberOfLines={1}>
            {t('history.verificationHistory')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'imageSource' && styles.activeTab]}
          onPress={() => setActiveTab('imageSource')}
        >
          <Text style={[styles.tabText, activeTab === 'imageSource' && styles.activeTabText]} numberOfLines={1}>
            {t('history.imageSourceHistory')}
          </Text>
        </TouchableOpacity>
      </View>

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
              <Image
                source={{ uri: selectedPhoto }}
                style={styles.fullImage}
                contentFit="contain"
              />
            )}
          </View>
        </Pressable>
      </Modal>

      {activeTab === 'verification' ? renderVerificationHistory() : renderImageSourceHistory()}
    </View>
  );
}

function getVerdictLabel(verdict: string, t: any): string {
  const labels: Record<string, string> = {
    'authentic': t('verdict.authenticShort'),
    'slightly-edited': t('verdict.slightlyEditedShort'),
    'heavily-edited': t('verdict.heavilyEditedShort'),
    'suspicious': t('verdict.suspiciousShort'),
  };
  return labels[verdict] || verdict;
}

function getVerdictStyle(verdict: string) {
  const styles: Record<string, object> = {
    'authentic': { backgroundColor: '#DCFCE7' },
    'slightly-edited': { backgroundColor: '#FEF3C7' },
    'heavily-edited': { backgroundColor: '#FED7AA' },
    'suspicious': { backgroundColor: '#FEE2E2' },
  };
  return styles[verdict] || {};
}

function getVerdictTextStyle(verdict: string) {
  const styles: Record<string, object> = {
    'authentic': { color: '#15803D' },
    'slightly-edited': { color: '#A16207' },
    'heavily-edited': { color: '#C2410C' },
    'suspicious': { color: '#DC2626' },
  };
  return styles[verdict] || {};
}

function getScoreColor(score: number): string {
  if (score < 7.5) {
    return '#DC2626';
  }
  if (score < 9) {
    return '#CA8A04';
  }
  return '#15803D';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  cardWrapper: {
    marginBottom: 16,
    position: 'relative',
  },
  deleteCornerButton: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.1)',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 18,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#0066FF',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: -0.2,
    flexShrink: 1,
    paddingHorizontal: 4,
  },
  activeTabText: {
    color: '#0066FF',
    fontWeight: '700',
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
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
    flexShrink: 1,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#E6F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },
  list: {
    padding: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 255, 0.08)',
  },
  imageColumn: {
    alignItems: 'center',
  },
  image: {
    width: 130,
    height: 150,
    backgroundColor: '#E2E8F0',
    borderTopLeftRadius: 20,
  },
  cardContent: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  scoreText: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  verdictBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    width: 130,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
  },
  verdictText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
    flexShrink: 1,
  },
  analysisRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  analysisItem: {
    flex: 1,
  },
  analysisLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  analysisValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  referencePhotosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  referenceLabel: {
    fontSize: 12,
    color: '#64748B',
    marginRight: 8,
  },
  referenceScroll: {
    flex: 1,
  },
  referenceThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    marginRight: 6,
  },
  sourceCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 255, 0.08)',
  },
  sourceImage: {
    width: 130,
    height: 170,
    backgroundColor: '#E2E8F0',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  sourceCardContent: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
  },
  entityInfoBox: {
    marginBottom: 8,
  },
  entityNameSmall: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  entityIntroSmall: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  keywordsBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  keywordsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  keywordsPreview: {
    flex: 1,
    fontSize: 12,
    color: '#0066FF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: -50,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  fullImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
});
