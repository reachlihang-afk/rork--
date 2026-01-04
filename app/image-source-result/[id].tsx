import React, { useRef, useState } from 'react';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Search, Share2 } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Linking, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVerification } from '@/contexts/VerificationContext';
import { useSquare } from '@/contexts/SquareContext';
import { useAuth } from '@/contexts/AuthContext';
import { captureRef } from 'react-native-view-shot';
import ShareableImageSourceResult from '@/components/ShareableImageSourceResult';
import { saveToGallery } from '@/utils/share';
import { useTranslation } from 'react-i18next';

export default function ImageSourceResultScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { imageSourceHistory } = useVerification();
  const { publishPost } = useSquare();
  const { user } = useAuth();
  const shareViewRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showShareView, setShowShareView] = useState(false);

  const record = imageSourceHistory.find((item) => item.id === id);

  const handleShare = async () => {
    if (isSharing || !record || !user) {
      if (!user) {
        Alert.alert(t('common.tip'), t('square.loginRequired'));
      }
      return;
    }
    
    try {
      setIsSharing(true);

      // 发布到广场
      const postId = await publishPost({
        userId: user.userId,
        userNickname: user.nickname || user.userId,
        userAvatar: user.avatar,
        postType: 'imageSource',
        imageSourceId: record.id,
        imageUri: record.imageUri,
        keywords: record.analysis.keywords,
        entityInfo: record.analysis.entityInfo,
        pinnedCommentId: undefined,
      });

      Alert.alert(
        t('common.success'),
        t('square.publishSuccess'),
        [
          {
            text: t('common.confirm'),
            onPress: () => {
              // 跳转到广场并定位到该帖子
              router.push({
                pathname: '/(tabs)/square',
                params: { postId },
              } as any);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to publish to square:', error);
      Alert.alert(t('common.error'), t('square.publishFailed'));
    } finally {
      setIsSharing(false);
    }
  };

  if (!record) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            activeOpacity={0.6}
          >
            <ArrowLeft size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('imageSource.title')}</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('history.noImageSourceHistory')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const searchWithKeywords = (keywords: string) => {
    const encoded = encodeURIComponent(keywords);
    Linking.openURL(`https://www.google.com/search?q=${encoded}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          activeOpacity={0.6}
        >
          <ArrowLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('imageSource.detailTitle')}</Text>
        <TouchableOpacity
          onPress={handleShare}
          style={styles.shareButton}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          activeOpacity={0.6}
          disabled={isSharing}
        >
          {isSharing ? (
            <ActivityIndicator size="small" color="#0066FF" />
          ) : (
            <>
              <Share2 size={20} color="#0066FF" />
              <Text style={styles.shareButtonText}>{t('square.publishToSquare')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: record.imageUri }} style={styles.image} contentFit="cover" />
        </View>

        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>
            {t('result.completedAt')}: {new Date(record.createdAt).toLocaleString('en-US')}
          </Text>
        </View>

        {record.analysis.entityInfo && (record.analysis.entityInfo.name || record.analysis.entityInfo.introduction) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {record.analysis.entityInfo.type === 'person' && t('imageSource.entityTypePerson')}
              {record.analysis.entityInfo.type === 'animal' && t('imageSource.entityTypeAnimal')}
              {record.analysis.entityInfo.type === 'plant' && t('imageSource.entityTypePlant')}
              {record.analysis.entityInfo.type === 'other' && t('imageSource.entityTypeOther')}
            </Text>
            <View style={styles.entityCard}>
              {record.analysis.entityInfo.name && (
                <Text style={styles.entityName}>{record.analysis.entityInfo.name}</Text>
              )}
              {record.analysis.entityInfo.introduction && (
                <Text style={styles.entityIntro}>{record.analysis.entityInfo.introduction}</Text>
              )}
            </View>
          </View>
        )}

        {record.analysis.keywords.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('imageSource.keywords')}</Text>
            <View style={styles.keywordsContainer}>
              {record.analysis.keywords.map((keyword, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.keywordChip}
                  onPress={() => searchWithKeywords(keyword)}
                >
                  <Text style={styles.keywordText}>{keyword}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.searchAllButton}
              onPress={() => searchWithKeywords(record.analysis.keywords.join(' '))}
            >
              <Search size={16} color="#0066FF" />
              <Text style={styles.searchAllText}>{t('home.lookupVerification')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {record.analysis.possibleSources.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('imageSource.possibleSources')}</Text>
            <View style={styles.card}>
              {record.analysis.possibleSources.map((source, index) => (
                <View key={index} style={styles.sourceItem}>
                  <Text style={styles.sourceBullet}>•</Text>
                  <Text style={styles.sourceText}>{source}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.bottomBackButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#0066FF" />
          <Text style={styles.bottomBackText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showShareView} transparent={false} animationType="none">
        <View style={{ flex: 1 }}>
          <ShareableImageSourceResult
            ref={shareViewRef}
            record={record}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
    flexShrink: 1,
    paddingHorizontal: 8,
  },
  placeholder: {
    width: 32,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066FF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
  },
  imageContainer: {
    marginBottom: 16,
  },
  image: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  dateContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
    flexShrink: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  keywordChip: {
    backgroundColor: '#E6F0FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  keywordText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0066FF',
  },
  searchAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#0066FF',
  },
  searchAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066FF',
  },
  sourceItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  sourceBullet: {
    fontSize: 15,
    color: '#0066FF',
    marginRight: 8,
    fontWeight: '700',
  },
  sourceText: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    flexShrink: 1,
  },
  entityCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0066FF',
  },
  entityName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    flexShrink: 1,
  },
  entityIntro: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    flexShrink: 1,
  },
  bottomBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#0066FF',
  },
  bottomBackText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
  },

});
