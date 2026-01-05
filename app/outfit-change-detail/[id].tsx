import React, { useState } from 'react';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowLeft, Trash2, Download, Share2, X } from 'lucide-react-native';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { useVerification } from '@/contexts/VerificationContext';
import { useSquare } from '@/contexts/SquareContext';
import { useAuth } from '@/contexts/AuthContext';
import { saveToGallery } from '@/utils/share';
import { useTranslation } from 'react-i18next';

type ZoomableImageProps = {
  uri: string;
  onClose: () => void;
  t: any;
};

function ZoomableImage({ uri, t }: ZoomableImageProps) {
  const [saving, setSaving] = useState(false);

  const handleLongPress = async () => {
    if (saving) return;
    
    try {
      setSaving(true);
      const success = await saveToGallery(uri);
      if (success) {
        Alert.alert(t('common.success'), t('outfitChange.downloadSuccess'));
      } else {
        Alert.alert(t('common.error'), t('outfitChange.downloadFailed'));
      }
    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert(t('common.error'), t('outfitChange.downloadFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[zoomStyles.container, { backgroundColor: 'rgba(0, 0, 0, 0.95)' }]}>
      <TouchableOpacity
        style={{
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        activeOpacity={1}
        onLongPress={handleLongPress}
        delayLongPress={500}
      >
        <Image source={{ uri }} style={zoomStyles.image} contentFit="contain" />
        {saving && (
          <View style={zoomStyles.savingOverlay}>
            <Text style={zoomStyles.savingText}>{t('common.saving')}...</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function OutfitChangeDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { outfitChangeHistory, deleteOutfitChange } = useVerification();
  const { publishPost, posts } = useSquare();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedImageType, setSelectedImageType] = useState<'original' | 'result'>('original');

  const outfitItem = outfitChangeHistory.find(item => item.id === id);

  if (!outfitItem) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: t('history.outfitChangeRecords'),
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                <ArrowLeft size={24} color="#1F2937" />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('history.noRecords')}</Text>
        </View>
      </View>
    );
  }

  const published = posts.some(
    p => p.postType === 'outfitChange' && p.outfitChangeId === outfitItem.id
  );

  const handleDelete = async () => {
    Alert.alert(
      t('history.deleteRecord'),
      t('history.deleteRecordConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteOutfitChange(id!);
              router.back();
            } catch (error) {
              Alert.alert(t('common.error'), t('errors.uploadError'));
            }
          },
        },
      ]
    );
  };

  const handleDownload = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);
      const success = await saveToGallery(outfitItem.resultImageUri);
      if (success) {
        Alert.alert(t('common.success'), t('outfitChange.downloadSuccess'));
      } else {
        Alert.alert(t('common.error'), t('outfitChange.downloadFailed'));
      }
    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert(t('common.error'), t('outfitChange.downloadFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleImagePress = (uri: string, type: 'original' | 'result') => {
    setSelectedImageUri(uri);
    setSelectedImageType(type);
    setImageViewerVisible(true);
  };

  const handlePublishToSquare = async () => {
    if (!user) {
      Alert.alert(t('common.tip'), t('square.loginRequired'));
      return;
    }

    if (!user.nickname) {
      Alert.alert(
        t('common.tip'),
        t('square.nicknameRequired'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('profile.editProfile'), onPress: () => router.push('/edit-profile') },
        ]
      );
      return;
    }

    if (isPublishing) return;

    if (published) {
      const post = posts.find(p => p.outfitChangeId === outfitItem.id);
      if (post) {
        router.push({
          pathname: '/(tabs)/square',
          params: { highlightPostId: post.id },
        });
      } else {
        router.push('/(tabs)/square');
      }
      return;
    }

    if (outfitItem.allowSquarePublish === false) {
      Alert.alert(t('common.tip'), t('square.publishDisabledByPrivacy'));
      return;
    }

    Alert.alert(
      t('square.publishToSquare'),
      t('square.publishSuccessPrompt'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          onPress: async () => {
            try {
              setIsPublishing(true);
              const postId = await publishPost({
                postType: 'outfitChange',
                userId: user.userId,
                userNickname: user.nickname || user.userId,
                userAvatar: user.avatar,
                originalImageUri: outfitItem.originalImageUri,
                resultImageUri: outfitItem.resultImageUri,
                templateName: outfitItem.templateName,
                outfitChangeId: outfitItem.id,
              });
              
              Alert.alert(
                t('square.publishSuccess'),
                t('square.publishSuccessPrompt'),
                [
                  { text: t('common.no'), style: 'cancel' },
                  {
                    text: t('common.yes'),
                    onPress: () => {
                      router.push({
                        pathname: '/(tabs)/square',
                        params: { highlightPostId: postId },
                      });
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Publish failed:', error);
              Alert.alert(t('common.error'), t('square.publishFailed'));
            } finally {
              setIsPublishing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('history.outfitChangeRecords'),
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <ArrowLeft size={24} color="#0F172A" strokeWidth={2} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              <TouchableOpacity onPress={handlePublishToSquare} style={styles.headerButton} disabled={isPublishing}>
                {isPublishing ? (
                  <ActivityIndicator size="small" color="#0066FF" />
                ) : (
                  <Share2 size={20} color={published ? '#10B981' : '#0066FF'} />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDownload} style={styles.headerButton} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator size="small" color="#0066FF" />
                ) : (
                  <Download size={20} color="#0066FF" />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
                <Trash2 size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('history.outfitChangeRecords')}</Text>
          
          <View style={styles.templateInfo}>
            <View style={styles.templateBadge}>
              <Text style={styles.templateBadgeText}>👔 {outfitItem.templateName}</Text>
            </View>
            <Text style={styles.dateText}>
              {new Date(outfitItem.createdAt).toLocaleString()}
            </Text>
          </View>

          <View style={styles.imagesContainer}>
            <View style={styles.imageSection}>
              <Text style={styles.imageLabel}>{t('history.original')}</Text>
              <TouchableOpacity onPress={() => handleImagePress(outfitItem.originalImageUri, 'original')} activeOpacity={0.9}>
                <Image
                  source={{ uri: outfitItem.originalImageUri }}
                  style={styles.image}
                  contentFit="contain"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.arrowContainer}>
              <Text style={styles.arrowText}>→</Text>
            </View>

            <View style={styles.imageSection}>
              <Text style={styles.imageLabel}>{t('history.result')}</Text>
              <TouchableOpacity onPress={() => handleImagePress(outfitItem.resultImageUri, 'result')} activeOpacity={0.9}>
                <Image
                  source={{ uri: outfitItem.resultImageUri }}
                  style={styles.image}
                  contentFit="contain"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={[styles.actionButton, isSaving && styles.actionButtonDisabled]}
            onPress={handleDownload}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Download size={20} color="#fff" />
            )}
            <Text style={styles.actionButtonText}>{t('outfitChange.downloadToAlbum')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.actionButtonSecondary,
              (isPublishing || published) && styles.actionButtonDisabled,
            ]}
            onPress={handlePublishToSquare}
            disabled={isPublishing || published}
          >
            {isPublishing ? (
              <ActivityIndicator size="small" color="#0066FF" />
            ) : (
              <Share2 size={20} color={published ? '#10B981' : '#0066FF'} />
            )}
            <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
              {published ? t('square.published') : t('square.publishToSquare')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={imageViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setImageViewerVisible(false);
          setSelectedImageUri(null);
        }}
      >
        <View style={imageViewerStyles.container}>
          <TouchableOpacity
            style={imageViewerStyles.closeButton}
            onPress={() => {
              setImageViewerVisible(false);
              setSelectedImageUri(null);
            }}
            activeOpacity={0.8}
          >
            <X size={28} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={imageViewerStyles.content}>
            {selectedImageUri && (
              <>
                <View style={imageViewerStyles.labelContainer} pointerEvents="none">
                  <View style={imageViewerStyles.labelBadge}>
                    <Text style={imageViewerStyles.labelText}>
                      {selectedImageType === 'original' ? t('history.original') : t('history.result')}
                    </Text>
                  </View>
                </View>

                <ZoomableImage uri={selectedImageUri} onClose={() => {}} t={t} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  templateInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  templateBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  templateBadgeText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 13,
    color: '#64748B',
  },
  imagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imageSection: {
    flex: 1,
    alignItems: 'center',
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    aspectRatio: 0.75,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  arrowContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 28,
    color: '#0066FF',
    fontWeight: 'bold',
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066FF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonSecondary: {
    backgroundColor: '#EEF2FF',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  actionButtonTextSecondary: {
    color: '#0066FF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
  },
});

const zoomStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  savingOverlay: {
    position: 'absolute',
    bottom: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  savingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

const imageViewerStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  labelBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  labelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

