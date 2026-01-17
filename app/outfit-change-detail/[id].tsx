import React, { useState } from 'react';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowLeft, Share2, Download, MoreHorizontal, Sparkles, RefreshCw } from 'lucide-react-native';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, useColorScheme, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVerification } from '@/contexts/VerificationContext';
import { useSquare } from '@/contexts/SquareContext';
import { useAuth } from '@/contexts/AuthContext';
import { saveToGallery } from '@/utils/share';
import { useTranslation } from 'react-i18next';

export default function OutfitChangeDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { outfitChangeHistory, deleteOutfitChange } = useVerification();
  const { publishPost, posts } = useSquare();
  const { user } = useAuth();
  
  const [viewMode, setViewMode] = useState<'original' | 'result'>('result');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const outfitItem = outfitChangeHistory.find(item => item.id === id);

  if (!outfitItem) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, isDark && styles.textDark]}>
            {t('history.noRecords')}
          </Text>
        </View>
      </View>
    );
  }

  const published = posts.some(
    p => p.postType === 'outfitChange' && p.outfitChangeId === outfitItem.id
  );

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

  const handleShare = async () => {
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
          { text: t('profile.editProfile'), onPress: () => router.push('/edit-profile' as any) },
        ]
      );
      return;
    }

    if (isPublishing) return;

    if (published) {
      Alert.alert(t('common.tip'), t('square.alreadyPublished'));
      return;
    }

    Alert.alert(
      t('square.publishToSquare'),
      t('square.publishConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            try {
              setIsPublishing(true);
              await publishPost({
                postType: 'outfitChange',
                userId: user.userId,
                userNickname: user.nickname || user.userId,
                userAvatar: user.avatar,
                originalImageUri: outfitItem.originalImageUri,
                resultImageUri: outfitItem.resultImageUri,
                templateName: outfitItem.templateName,
                outfitChangeId: outfitItem.id,
              });
              
              Alert.alert(t('common.success'), t('square.publishSuccess'));
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

  const handleRegenerate = () => {
    Alert.alert(
      t('outfitChange.regenerate'),
      t('outfitChange.regenerateConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => {
            router.push('/outfit-change' as any);
          },
        },
      ]
    );
  };

  const handleMore = () => {
    Alert.alert(
      t('common.options'),
      '',
      [
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
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
          },
        },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const displayedImage = viewMode === 'original' 
    ? outfitItem.originalImageUri 
    : outfitItem.resultImageUri;

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <ArrowLeft size={24} color={isDark ? '#fff' : '#1a1a1a'} strokeWidth={2} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>
          {t('outfitChange.result').toUpperCase()}
        </Text>
        
        <TouchableOpacity 
          onPress={handleMore}
          style={styles.headerButton}
        >
          <MoreHorizontal size={24} color={isDark ? '#fff' : '#1a1a1a'} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* View Mode Toggle */}
        <View style={[styles.toggleContainer, isDark && styles.toggleContainerDark]}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'original' && styles.toggleButtonActive
            ]}
            onPress={() => setViewMode('original')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.toggleText,
              viewMode === 'original' && styles.toggleTextActive,
              isDark && viewMode !== 'original' && styles.toggleTextDark
            ]}>
              {t('history.original')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'result' && styles.toggleButtonActive
            ]}
            onPress={() => setViewMode('result')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.toggleText,
              viewMode === 'result' && styles.toggleTextActive,
              isDark && viewMode !== 'result' && styles.toggleTextDark
            ]}>
              {t('history.result')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Image */}
        <View style={[styles.imageContainer, isDark && styles.imageContainerDark]}>
          <Image 
            source={{ uri: displayedImage }}
            style={styles.mainImage}
            contentFit="cover"
          />
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <View>
              <Text style={[styles.title, isDark && styles.textDark]}>
                {t('outfitChange.transformationComplete')}
              </Text>
              <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
                {outfitItem.templateName?.toUpperCase()} • {t('outfitChange.smartCasual').toUpperCase()}
              </Text>
            </View>
            
            <View style={[styles.matchBadge, isDark && styles.matchBadgeDark]}>
              <Sparkles size={16} color={isDark ? '#fff' : '#1a1a1a'} strokeWidth={2.5} />
              <Text style={[styles.matchText, isDark && styles.textDark]}>
                98% {t('outfitChange.match')}
              </Text>
            </View>
          </View>

          {/* Style Tags */}
          <View style={styles.tagsContainer}>
            <View style={[styles.tag, isDark && styles.tagDark]}>
              <Text style={[styles.tagText, isDark && styles.textDark]}>
                {outfitItem.templateName}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Actions */}
      <View style={[styles.fixedBottom, isDark && styles.fixedBottomDark]}>
        <View style={styles.gradientContainer}>
          <LinearGradient
            colors={[isDark ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0)', isDark ? '#000000' : '#ffffff']}
            style={styles.gradient}
          />
        </View>
        
        <View style={styles.actionsContainer}>
          <View style={styles.primaryActions}>
            <TouchableOpacity
              style={[styles.shareButton, isPublishing && styles.buttonDisabled]}
              onPress={handleShare}
              disabled={isPublishing}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#1a1a1a', '#000000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                {isPublishing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Share2 size={20} color="#fff" strokeWidth={2.5} />
                    <Text style={styles.shareButtonText}>{t('common.share')}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, isDark && styles.saveButtonDark, isSaving && styles.buttonDisabled]}
              onPress={handleDownload}
              disabled={isSaving}
              activeOpacity={0.9}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={isDark ? '#fff' : '#1a1a1a'} />
              ) : (
                <>
                  <Download size={20} color={isDark ? '#fff' : '#1a1a1a'} strokeWidth={2.5} />
                  <Text style={[styles.saveButtonText, isDark && styles.textDark]}>
                    {t('common.save')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.regenerateButton}
            onPress={handleRegenerate}
            disabled={isRegenerating}
            activeOpacity={0.7}
          >
            <RefreshCw 
              size={18} 
              color={isDark ? '#9ca3af' : '#71717a'} 
              strokeWidth={2.5} 
            />
            <Text style={[styles.regenerateText, isDark && styles.regenerateTextDark]}>
              {t('outfitChange.regenerateThisLook').toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  containerDark: {
    backgroundColor: '#000000',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    paddingBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 2,
  },
  
  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 200,
  },
  
  // Toggle
  toggleContainer: {
    width: 280,
    height: 40,
    backgroundColor: '#f4f4f5',
    borderRadius: 20,
    padding: 4,
    flexDirection: 'row',
    alignSelf: 'center',
    marginBottom: 32,
  },
  toggleContainerDark: {
    backgroundColor: '#18181b',
  },
  toggleButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    position: 'relative',
  },
  toggleButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71717a',
  },
  toggleTextActive: {
    color: '#1a1a1a',
    fontWeight: '700',
  },
  toggleTextDark: {
    color: '#9ca3af',
  },
  
  // Main Image
  imageContainer: {
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 32,
    backgroundColor: '#f9fafb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainerDark: {
    backgroundColor: '#18181b',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  
  // Info Section
  infoSection: {
    gap: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#09090b',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717a',
    letterSpacing: 1,
  },
  subtitleDark: {
    color: '#9ca3af',
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  matchBadgeDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  matchText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  
  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tagDark: {
    backgroundColor: '#18181b',
    borderColor: '#3f3f46',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#09090b',
  },
  
  // Fixed Bottom
  fixedBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
  },
  fixedBottomDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  gradientContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: -1,
  },
  gradient: {
    flex: 1,
  },
  actionsContainer: {
    gap: 12,
  },
  primaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  saveButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  saveButtonDark: {
    backgroundColor: '#18181b',
    borderColor: '#3f3f46',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#09090b',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 40,
  },
  regenerateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717a',
    letterSpacing: 1,
  },
  regenerateTextDark: {
    color: '#9ca3af',
  },
  
  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#71717a',
  },
  
  // Text colors
  textDark: {
    color: '#ffffff',
  },
});
