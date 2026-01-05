import React, { useRef, useState, useEffect } from 'react';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { CheckCircle2, AlertTriangle, XCircle, ArrowLeft, Trash2, Share2, Upload, Copy, Eye, EyeOff, Download } from 'lucide-react-native';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useVerification } from '@/contexts/VerificationContext';
import { useSquare } from '@/contexts/SquareContext';
import { useAuth } from '@/contexts/AuthContext';
import { captureRef } from 'react-native-view-shot';
import ShareableVerificationResult from '@/components/ShareableVerificationResult';
import { saveToGallery } from '@/utils/share';
import { useTranslation } from 'react-i18next';

export default function ResultScreen() {
  const { t } = useTranslation();
  const { id, viewOnly } = useLocalSearchParams<{ id: string; viewOnly?: string }>();
  const isViewOnly = viewOnly === 'true';
  const router = useRouter();
  const { verificationHistory, deleteVerification, updateVerificationDescription } = useVerification();
  const { posts, publishPost, updatePostDescription, isPublished } = useSquare();
  const { user } = useAuth();
  const shareViewRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showShareView, setShowShareView] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [description, setDescription] = useState<string>('');
  const [isDescriptionChanged, setIsDescriptionChanged] = useState(false);

  const historyItem = verificationHistory.find(item => item.result.id === id);
  const published = historyItem ? isPublished(historyItem.result.id) : false;

  useEffect(() => {
    if (historyItem?.result.description) {
      setDescription(historyItem.result.description);
    }
  }, [historyItem]);

  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    setIsDescriptionChanged(text !== (historyItem?.result.description || ''));
  };

  const handleSaveDescription = async () => {
    if (!historyItem || !isDescriptionChanged) return;
    
    try {
      await updateVerificationDescription(historyItem.result.id, description);
      
      if (published) {
        await updatePostDescription(historyItem.result.id, description);
      }
      
      setIsDescriptionChanged(false);
      Alert.alert(t('common.success'), t('square.descriptionUpdated'));
    } catch (error) {
      console.error('Failed to update description:', error);
      Alert.alert(t('common.error'), t('profile.updateFailed'));
    }
  };

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
            const result = await deleteVerification(id!);
            if (result.success) {
              router.back();
            } else {
              Alert.alert(t('common.error'), result.message || t('errors.uploadError'));
            }
          },
        },
      ]
    );
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

    if (isPublishing || !historyItem) return;

    if (published) {
      const post = posts.find(p => p.verificationResultId === historyItem.result.id);
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

    if (isDescriptionChanged) {
      await updateVerificationDescription(historyItem.result.id, description);
      setIsDescriptionChanged(false);
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
              const postId = await publishPost({
                postType: 'verification',
                userId: user.userId,
                userNickname: user.nickname || user.userId,
                userAvatar: user.avatar,
                verificationResultId: historyItem.result.id,
                credibilityScore: historyItem.result.credibilityScore,
                verdict: historyItem.result.verdict,
                referencePhotoUri: historyItem.request.referencePhotos[0]?.uri || '',
                editedPhotoUri: historyItem.request.editedPhotoUri,
                photoSource: historyItem.request.photoSource,
                description: description || undefined,
              });
              router.push({
                pathname: '/(tabs)/square',
                params: { highlightPostId: postId },
              });
            } catch {
              Alert.alert(t('common.error'), t('square.publishFailed'));
            } finally {
              setIsPublishing(false);
            }
          },
        },
      ]
    );
  };

  const handleCopyVerificationCode = async () => {
    try {
      await Clipboard.setStringAsync(result.verificationCode);
      Alert.alert(t('common.success'), t('result.verificationCodeCopied'));
    } catch (error) {
      console.error('Failed to copy verification code:', error);
      Alert.alert(t('common.error'), t('errors.uploadError'));
    }
  };

  const handleSave = async () => {
    if (isSharing || !historyItem) return;
    
    try {
      setIsSharing(true);
      setShowShareView(true);
      
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (!shareViewRef.current) {
        throw new Error('Share view not ready');
      }

      console.log('Starting capture...');
      const uri = await captureRef(shareViewRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      console.log('Captured image URI:', uri);

      if (!uri || uri.length === 0) {
        throw new Error('Empty capture result');
      }

      setShowShareView(false);

      const saved = await saveToGallery(uri);
      if (saved) {
        Alert.alert(t('common.success'), t('result.saveSuccess'));
      } else {
        Alert.alert(t('common.error'), t('result.saveFailed'));
      }
    } catch (error) {
      console.error('Failed to capture and save:', error);
      Alert.alert(t('common.error'), t('result.saveFailed'));
      setShowShareView(false);
    } finally {
      setIsSharing(false);
    }
  };

  const handleShare = async () => {
    if (!historyItem) return;
    
    const shareText = `验证结果：${formatScore(result.credibilityScore)}分\n验证码：${result.verificationCode}\n\n使用验照神探查看完整报告`;
    
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(shareText);
        Alert.alert(t('common.success'), '验证信息已复制到剪贴板');
      } else {
        const Share = await import('react-native').then(m => m.Share);
        await Share.share({
          message: shareText,
        });
      }
    } catch (error) {
      console.error('Failed to share:', error);
      Alert.alert(t('common.error'), t('result.shareFailed'));
    }
  };

  if (!historyItem) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('history.noVerificationHistory')}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { result, request } = historyItem;
  const verdictConfig = getVerdictConfig(result.verdict, result.subjectType || 'person', t);

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: t('result.title'),
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ padding: 8 }}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              activeOpacity={0.6}
            >
              <ArrowLeft size={24} color="#0F172A" strokeWidth={2} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            !isViewOnly ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity
                  onPress={handlePublishToSquare}
                  style={{ padding: 8 }}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  activeOpacity={0.6}
                  disabled={isPublishing}
                >
                  {isPublishing ? (
                    <ActivityIndicator size="small" color="#0066FF" />
                  ) : (
                    <Share2 size={20} color={published ? '#10B981' : '#0066FF'} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  style={{ padding: 8 }}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  activeOpacity={0.6}
                  disabled={isSharing}
                >
                  {isSharing ? (
                    <ActivityIndicator size="small" color="#0066FF" />
                  ) : (
                    <Download size={20} color="#0066FF" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDelete}
                  style={{ marginRight: 0, padding: 8 }}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  activeOpacity={0.6}
                >
                  <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ) : null
          ),
        }} 
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!isViewOnly && (
        <View style={styles.verificationCodeCard}>
        <View style={styles.verificationCodeHeader}>
          <Text style={styles.verificationCodeTitle}>🔑 {t('result.verificationCode')}</Text>
          <Text style={styles.verificationCodeHint}>{t('result.shareVerificationCode')}</Text>
        </View>
        <TouchableOpacity 
          style={styles.verificationCodeReveal}
          onPress={() => setShowVerificationCode(!showVerificationCode)}
          activeOpacity={0.7}
        >
          <View style={styles.verificationCodeRevealContent}>
            {showVerificationCode ? (
              <Eye size={24} color="#0066FF" />
            ) : (
              <EyeOff size={24} color="#94A3B8" />
            )}
            <Text style={styles.verificationCodeRevealText}>
              {showVerificationCode ? t('result.hideCode') : t('result.showCode')}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.verificationCodeContent}>
          <Text style={styles.verificationCodeText}>
            {showVerificationCode ? result.verificationCode : '••••••'}
          </Text>
          {showVerificationCode && (
            <TouchableOpacity 
              style={styles.copyButton}
              onPress={handleCopyVerificationCode}
              activeOpacity={0.7}
            >
              <Copy size={20} color="#fff" />
              <Text style={styles.copyButtonText}>{t('result.copyVerificationCode')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      )}

      <View style={styles.scoreSection}>
        <View style={[styles.scoreCircle, { backgroundColor: verdictConfig.bgColor }]}>
          <Text style={[styles.scoreValue, { color: getScoreColor(result.credibilityScore) }]}>
            {formatScore(result.credibilityScore)}
          </Text>
          <Text style={[styles.scoreLabel, { color: getScoreColor(result.credibilityScore) }]} numberOfLines={2}>{t('result.credibilityScore')}</Text>
        </View>
        
        <Text style={[styles.scoreTag, { color: getScoreColor(result.credibilityScore) }]}>
          {getScoreTagConfig(result.credibilityScore, t).label}
        </Text>
        
        <View style={[styles.verdictBadge, { backgroundColor: verdictConfig.badgeBg }]}>
          {verdictConfig.icon}
          <Text style={[styles.verdictText, { color: verdictConfig.color }]} numberOfLines={2}>
            {verdictConfig.label}
          </Text>
        </View>

        <Text style={styles.verdictDescription} numberOfLines={4}>{verdictConfig.description}</Text>
      </View>

      <View style={styles.imageSection}>
        <View style={styles.imageTitleRow}>
          <Text style={styles.sectionTitle}>{t('result.editedPhoto')}</Text>
          <View style={[styles.sourceBadge, request.photoSource === 'camera' ? styles.sourceBadgeCamera : styles.sourceBadgeLibrary]}>
            <Text style={styles.sourceBadgeText}>
              {request.photoSource === 'camera' ? '📷 ' + t('verify.takePhoto') : '📁 ' + t('upload.selectPhoto')}
            </Text>
          </View>
        </View>
        <Image 
          source={{ uri: request.editedPhotoUri }}
          style={styles.verifiedImage}
          contentFit="contain"
        />
        {request.photoSource === 'library' && (
          <View style={styles.libraryWarning}>
            <AlertTriangle size={20} color="#F59E0B" />
            <Text style={styles.libraryWarningText}>{t('result.libraryPhotoWarning')}</Text>
          </View>
        )}
      </View>

      {result.metadataWarnings && result.metadataWarnings.length > 0 && (
        <View style={styles.metadataWarningSection}>
          <Text style={styles.metadataWarningTitle}>⚠️ {t('common.error')}</Text>
          {result.metadataWarnings.map((warning, index) => (
            <Text key={index} style={styles.metadataWarningText}>• {warning}</Text>
          ))}
          <Text style={styles.metadataWarningNote}>
            {t('result.metadataWarning')}
          </Text>
        </View>
      )}

      <View style={styles.analysisSection}>
        <Text style={styles.sectionTitle}>{t('result.analysis')}</Text>
        
        <View style={styles.analysisCard}>
          <View style={styles.analysisItem}>
            <View style={styles.analysisHeader}>
              <Text style={styles.analysisLabel}>{t('result.facialSimilarity')}</Text>
              <Text style={styles.analysisValue}>{result.analysis.facialSimilarity.toFixed(1)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${result.analysis.facialSimilarity}%`, backgroundColor: getProgressColor(result.analysis.facialSimilarity) }
                ]} 
              />
            </View>
          </View>

          <View style={styles.analysisItem}>
            <View style={styles.analysisHeader}>
              <Text style={styles.analysisLabel}>{t('result.skinTexture')}</Text>
              <Text style={styles.analysisValue}>{result.analysis.skinTexture.toFixed(1)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${result.analysis.skinTexture}%`, backgroundColor: getProgressColor(result.analysis.skinTexture) }
                ]} 
              />
            </View>
          </View>

          <View style={styles.analysisItem}>
            <View style={styles.analysisHeader}>
              <Text style={styles.analysisLabel}>{t('result.proportions')}</Text>
              <Text style={styles.analysisValue}>{result.analysis.proportions.toFixed(1)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${result.analysis.proportions}%`, backgroundColor: getProgressColor(result.analysis.proportions) }
                ]} 
              />
            </View>
          </View>

          <View style={styles.analysisItem}>
            <View style={styles.analysisHeader}>
              <Text style={styles.analysisLabel}>{t('result.lighting')}</Text>
              <Text style={styles.analysisValue}>{result.analysis.lighting.toFixed(1)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${result.analysis.lighting}%`, backgroundColor: getProgressColor(result.analysis.lighting) }
                ]} 
              />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.referenceSection}>
        <Text style={styles.sectionTitle}>{t('result.referencePhotos')}</Text>
        {request.referencePhotos.map(photo => (
          <View key={photo.id} style={styles.referenceItem}>
            <Image 
              source={{ uri: photo.uri }}
              style={styles.referenceImageLarge}
              contentFit="contain"
            />
          </View>
        ))}
      </View>

      {!isViewOnly && (
        <View style={styles.descriptionSection}>
        <Text style={styles.sectionTitle}>{t('square.postDescription')}</Text>
        <TextInput
          style={styles.descriptionInput}
          placeholder={t('square.postDescriptionPlaceholder')}
          placeholderTextColor="#94A3B8"
          value={description}
          onChangeText={handleDescriptionChange}
          multiline
          numberOfLines={3}
          maxLength={200}
        />
        <View style={styles.descriptionActions}>
          <Text style={styles.descriptionCharCount}>{description.length}/200</Text>
          {isDescriptionChanged && (
            <TouchableOpacity
              style={styles.saveDescriptionButton}
              onPress={handleSaveDescription}
              activeOpacity={0.7}
            >
              <Text style={styles.saveDescriptionButtonText}>{t('common.save')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerDate}>
          {t('result.completedAt')}：{new Date(result.completedAt).toLocaleString('en-US')}
        </Text>
        {request.metadata && (
          <View style={styles.metadataSection}>
            <Text style={styles.metadataTitle}>📸 {t('common.tip')}</Text>
            <Text style={styles.metadataText}>{t('result.completedAt')}: {request.metadata.timestamp}</Text>
            <Text style={styles.metadataText}>{t('verify.takePhoto')}: {request.metadata.cameraType}</Text>
            <Text style={[styles.metadataStatus, result.metadataValid ? styles.metadataValid : styles.metadataInvalid]}>
              {result.metadataValid ? '✓ ' + t('common.success') : '✗ ' + t('common.error')}
            </Text>
          </View>
        )}
      </View>

      {!isViewOnly && (
        <TouchableOpacity 
          style={[styles.publishButton, published && styles.publishedButton]} 
          onPress={handlePublishToSquare}
          disabled={isPublishing}
          activeOpacity={0.8}
        >
          {isPublishing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Upload size={20} color="#fff" />
              <Text style={styles.publishButtonText}>
                {published ? t('square.published') : t('square.publishToSquare')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.bottomBackButton} onPress={() => router.back()}>
        <ArrowLeft size={24} color="#fff" strokeWidth={2} />
        <Text style={styles.bottomBackButtonText}>{t('common.back')}</Text>
      </TouchableOpacity>
      </ScrollView>

      <Modal visible={showShareView} transparent={false} animationType="none">
        <View style={{ flex: 1 }}>
          <ShareableVerificationResult
            ref={shareViewRef}
            historyItem={historyItem}
          />
        </View>
      </Modal>
    </>
  );
}

function getSubjectName(subjectType: string, t: any): string {
  const subjectNames: Record<string, string> = {
    'person': t('result.subjectTypePerson'),
    'dog': t('result.subjectTypeDog'),
    'cat': t('result.subjectTypeCat'),
    'animal': t('result.subjectTypeAnimal'),
    'building': t('result.subjectTypeBuilding'),
    'object': t('result.subjectTypeObject'),
    'other': t('result.subjectTypeOther'),
  };
  return subjectNames[subjectType] || subjectNames['other'];
}

function getVerdictConfig(verdict: string, subjectType: string, t: any) {
  const subjectName = getSubjectName(subjectType, t);
  
  const configs: Record<string, any> = {
    'authentic': {
      label: t('result.verdictAuthentic'),
      description: t('result.verdictAuthenticDesc', { subject: subjectName }),
      color: '#15803D',
      bgColor: '#DCFCE7',
      badgeBg: '#BBF7D0',
      icon: <CheckCircle2 size={20} color="#15803D" />,
    },
    'slightly-edited': {
      label: t('result.verdictSlightlyEdited'),
      description: t('result.verdictSlightlyEditedDesc', { subject: subjectName }),
      color: '#A16207',
      bgColor: '#FEF3C7',
      badgeBg: '#FDE68A',
      icon: <AlertTriangle size={20} color="#A16207" />,
    },
    'heavily-edited': {
      label: t('result.verdictHeavilyEdited'),
      description: t('result.verdictHeavilyEditedDesc', { subject: subjectName }),
      color: '#C2410C',
      bgColor: '#FED7AA',
      badgeBg: '#FCA5A5',
      icon: <AlertTriangle size={20} color="#C2410C" />,
    },
    'suspicious': {
      label: t('result.verdictSuspicious'),
      description: t('result.verdictSuspiciousDesc', { subject: subjectName }),
      color: '#DC2626',
      bgColor: '#FEE2E2',
      badgeBg: '#FECACA',
      icon: <XCircle size={20} color="#DC2626" />,
    },
  };
  return configs[verdict] || configs['suspicious'];
}

function getProgressColor(value: number): string {
  if (value >= 80) return '#15803D';
  if (value >= 60) return '#A16207';
  if (value >= 40) return '#C2410C';
  return '#DC2626';
}

function formatScore(score: number): string {
  if (score % 1 === 0) {
    return `${score}/10`;
  }
  return `${score.toFixed(1)}/10`;
}

function getScoreColor(score: number): string {
  if (score < 7.5) {
    return '#DC2626';
  } else if (score < 8.5) {
    return '#F97316';
  } else if (score < 9) {
    return '#CA8A04';
  } else {
    return '#15803D';
  }
}

function getScoreTagConfig(score: number, t: any) {
  if (score < 2) {
    return { label: t('result.scoreTagDifferentSubject'), color: '#DC2626' };
  } else if (score < 7.5) {
    return { label: t('result.scoreTagFake'), color: '#DC2626' };
  } else if (score < 8.5) {
    return { label: t('result.scoreTagObviousEdit'), color: '#F97316' };
  } else if (score < 9) {
    return { label: t('result.scoreTagSlightEdit'), color: '#CA8A04' };
  } else {
    return { label: t('result.scoreTagMatch'), color: '#15803D' };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
  },
  bottomBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#0066FF',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 20,
    marginHorizontal: 40,
    marginBottom: 40,
    marginTop: 20,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  bottomBackButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  verificationCodeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#E0F2FE',
  },
  verificationCodeHeader: {
    marginBottom: 16,
  },
  verificationCodeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  verificationCodeHint: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  verificationCodeReveal: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  verificationCodeRevealContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verificationCodeRevealText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0066FF',
  },
  verificationCodeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  verificationCodeText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0066FF',
    letterSpacing: 8,
    flex: 1,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0066FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  scoreCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: -2,
  },
  scoreTag: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: -0.3,
    flexShrink: 1,
    paddingHorizontal: 16,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  verdictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  verdictText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  verdictDescription: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 22,
  },
  imageSection: {
    marginBottom: 32,
  },
  imageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  sourceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sourceBadgeCamera: {
    backgroundColor: '#DCFCE7',
  },
  sourceBadgeLibrary: {
    backgroundColor: '#FEF3C7',
  },
  sourceBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  libraryWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  libraryWarningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  verifiedImage: {
    width: '100%',
    height: 400,
    backgroundColor: '#E2E8F0',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  analysisSection: {
    marginBottom: 32,
  },
  analysisCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  analysisItem: {
    marginBottom: 20,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  analysisLabel: {
    fontSize: 15,
    color: '#64748B',
  },
  analysisValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  referenceSection: {
    marginBottom: 32,
  },
  referenceItem: {
    alignItems: 'center',
    marginBottom: 12,
  },
  referenceImageLarge: {
    width: '100%',
    height: 300,
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerDate: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
  },
  metadataSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    width: '100%',
  },
  metadataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  metadataText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  metadataStatus: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  metadataValid: {
    color: '#15803D',
  },
  metadataInvalid: {
    color: '#DC2626',
  },
  metadataWarningSection: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  metadataWarningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 12,
  },
  metadataWarningText: {
    fontSize: 14,
    color: '#78350F',
    marginBottom: 6,
    lineHeight: 20,
  },
  metadataWarningNote: {
    fontSize: 13,
    color: '#92400E',
    marginTop: 8,
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#64748B',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#10B981',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 20,
    marginHorizontal: 40,
    marginBottom: 12,
    marginTop: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  publishButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  publishedButton: {
    backgroundColor: '#64748B',
    shadowColor: '#64748B',
  },
  descriptionSection: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  descriptionInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#0F172A',
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  descriptionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  descriptionCharCount: {
    fontSize: 13,
    color: '#94A3B8',
  },
  saveDescriptionButton: {
    backgroundColor: '#0066FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveDescriptionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
