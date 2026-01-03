import { Image } from 'expo-image';
import { useRouter, Stack } from 'expo-router';
import { Search, AlertCircle, ArrowLeft, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, Keyboard } from 'react-native';
import { useVerification } from '@/contexts/VerificationContext';
import { useTranslation } from 'react-i18next';
import type { ReferencePhoto, VerificationHistory } from '@/types/verification';

export default function LookupVerificationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { verificationHistory, deviceId } = useVerification();
  const [code, setCode] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [foundResult, setFoundResult] = useState<VerificationHistory | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const hiddenInputRef = useRef<TextInput | null>(null);

  const normalizedCode = useMemo(() => code.replace(/\D/g, '').slice(0, 4), [code]);
  const lastSearchedCodeRef = useRef<string | null>(null);

  useEffect(() => {
    if (normalizedCode.length !== 4) {
      setFoundResult(null);
      setCodeError(null);
      return;
    }

    if (lastSearchedCodeRef.current === normalizedCode) {
      return;
    }

    const run = async () => {
      try {
        setIsSearching(true);
        setCodeError(null);
        lastSearchedCodeRef.current = normalizedCode;

        console.log('🔍 Lookup verification code:', normalizedCode);
        console.log('📋 verificationHistory length:', verificationHistory.length);
        console.log('🔑 Current device ID:', deviceId);

        const found = verificationHistory.find(
          item => {
            const codeMatch = String(item.result.verificationCode ?? '').trim() === normalizedCode;
            const deviceMatch = item.result.deviceId === deviceId;
            console.log('Checking item:', {
              code: item.result.verificationCode,
              codeMatch,
              itemDeviceId: item.result.deviceId,
              currentDeviceId: deviceId,
              deviceMatch,
            });
            return codeMatch && deviceMatch;
          }
        );

        if (found) {
          console.log('✅ Found verification history item:', {
            resultId: found.result.id,
            requestId: found.request.id,
            code: found.result.verificationCode,
          });
          setFoundResult(found);
          setCodeError(null);
        } else {
          console.log('❌ Code not found:', normalizedCode);
          setFoundResult(null);
          setCodeError('验证码错误，请输入正确验证码');
        }
      } catch (e) {
        console.error('Lookup failed:', e);
        setFoundResult(null);
        setCodeError(t('errors.uploadError'));
        Alert.alert(t('common.error'), t('errors.uploadError'));
      } finally {
        setIsSearching(false);
      }
    };

    Keyboard.dismiss();
    run();
  }, [normalizedCode, verificationHistory, deviceId, t]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('home.lookupVerification'),
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
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Search size={32} color="#0066FF" />
        </View>
        <Text style={styles.title}>{t('home.lookupVerification')}</Text>
        <Text style={styles.description}>
          {t('home.lookupVerificationDesc')}
        </Text>
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>{t('profile.verificationCode')}</Text>

        <TouchableOpacity
          style={styles.codeRow}
          activeOpacity={0.9}
          onPress={() => hiddenInputRef.current?.focus()}
          testID="lookup-code-row"
        >
          {Array.from({ length: 4 }).map((_, idx) => {
            const char = normalizedCode[idx] ?? '';
            const isActive = idx === normalizedCode.length;
            return (
              <View
                key={idx}
                style={[
                  styles.codeCell,
                  (isActive || (normalizedCode.length === 4 && idx === 3)) && styles.codeCellActive,
                  codeError ? styles.codeCellError : null,
                ]}
                testID={`lookup-code-cell-${idx}`}
              >
                <Text style={styles.codeCellText} testID={`lookup-code-digit-${idx}`}>{char}</Text>
              </View>
            );
          })}

          <TextInput
            ref={(r) => {
              hiddenInputRef.current = r;
            }}
            value={normalizedCode}
            onChangeText={(text) => {
              const next = text.replace(/\D/g, '').slice(0, 4);
              setCode(next);
            }}
            keyboardType="number-pad"
            maxLength={4}
            autoFocus
            style={styles.hiddenInput}
            caretHidden
            importantForAutofill="no"
            autoComplete="off"
            textContentType="oneTimeCode"
            testID="lookup-code-hidden-input"
          />
        </TouchableOpacity>

        {!!codeError && (
          <View style={styles.errorBanner} testID="lookup-code-error">
            <AlertCircle size={18} color="#DC2626" />
            <Text style={styles.errorText}>{codeError}</Text>
          </View>
        )}

        {isSearching && (
          <View style={styles.searchingRow} testID="lookup-searching">
            <Text style={styles.searchingText}>{t('common.loading')}</Text>
          </View>
        )}
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipText}>{t('home.lookupTip')}</Text>
      </View>

      {foundResult && (
        <View style={styles.resultSection}>
          <Text style={styles.resultTitle}>{t('result.title')}</Text>
          
          <View style={styles.fullResultContainer}>
            <View style={styles.scoreSection}>
              <View style={[styles.scoreCircle, { backgroundColor: getVerdictConfig(foundResult.result.verdict, foundResult.result.subjectType || 'person', t).bgColor }]}>
                <Text style={[styles.scoreValue, { color: getVerdictConfig(foundResult.result.verdict, foundResult.result.subjectType || 'person', t).color }]}>
                  {formatScore(foundResult.result.credibilityScore)}
                </Text>
                <Text style={[styles.scoreLabel2, { color: getVerdictConfig(foundResult.result.verdict, foundResult.result.subjectType || 'person', t).color }]} numberOfLines={2}>{t('result.credibilityScore')}</Text>
              </View>
              
              <Text style={[styles.scoreTag, { color: getScoreTagConfig(foundResult.result.credibilityScore, t).color }]}>
                {getScoreTagConfig(foundResult.result.credibilityScore, t).label}
              </Text>
              
              <View style={[styles.verdictBadge2, { backgroundColor: getVerdictConfig(foundResult.result.verdict, foundResult.result.subjectType || 'person', t).badgeBg }]}>
                {getVerdictConfig(foundResult.result.verdict, foundResult.result.subjectType || 'person', t).icon}
                <Text style={[styles.verdictText2, { color: getVerdictConfig(foundResult.result.verdict, foundResult.result.subjectType || 'person', t).color }]} numberOfLines={2}>
                  {getVerdictConfig(foundResult.result.verdict, foundResult.result.subjectType || 'person', t).label}
                </Text>
              </View>

              <Text style={styles.verdictDescription} numberOfLines={4}>{getVerdictConfig(foundResult.result.verdict, foundResult.result.subjectType || 'person', t).description}</Text>
            </View>

            <View style={styles.imageSection}>
              <View style={styles.imageTitleRow}>
                <Text style={styles.sectionTitle}>{t('result.editedPhoto')}</Text>
                <View style={[styles.sourceBadge, foundResult.request.photoSource === 'camera' ? styles.sourceBadgeCamera : styles.sourceBadgeLibrary]}>
                  <Text style={styles.sourceBadgeText}>
                    {foundResult.request.photoSource === 'camera' ? '📷 ' + t('verify.takePhoto') : '📁 ' + t('upload.selectPhoto')}
                  </Text>
                </View>
              </View>
              <Image 
                source={{ uri: foundResult.request.editedPhotoUri }}
                style={styles.verifiedImage}
                contentFit="cover"
              />
              {foundResult.request.photoSource === 'library' && (
                <View style={styles.libraryWarning}>
                  <AlertTriangle size={20} color="#F59E0B" />
                  <Text style={styles.libraryWarningText}>{t('result.libraryPhotoWarning')}</Text>
                </View>
              )}
            </View>

            {foundResult.result.metadataWarnings && foundResult.result.metadataWarnings.length > 0 && (
              <View style={styles.metadataWarningSection}>
                <Text style={styles.metadataWarningTitle}>⚠️ {t('common.error')}</Text>
                {foundResult.result.metadataWarnings.map((warning: string, index: number) => (
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
                <View style={styles.analysisItemFull}>
                  <View style={styles.analysisHeader}>
                    <Text style={styles.analysisLabelFull}>{t('result.facialSimilarity')}</Text>
                    <Text style={styles.analysisValueFull}>{foundResult.result.analysis.facialSimilarity.toFixed(1)}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[styles.progressFill, { width: `${foundResult.result.analysis.facialSimilarity}%`, backgroundColor: getProgressColor(foundResult.result.analysis.facialSimilarity) }]} 
                    />
                  </View>
                </View>

                <View style={styles.analysisItemFull}>
                  <View style={styles.analysisHeader}>
                    <Text style={styles.analysisLabelFull}>{t('result.skinTexture')}</Text>
                    <Text style={styles.analysisValueFull}>{foundResult.result.analysis.skinTexture.toFixed(1)}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[styles.progressFill, { width: `${foundResult.result.analysis.skinTexture}%`, backgroundColor: getProgressColor(foundResult.result.analysis.skinTexture) }]} 
                    />
                  </View>
                </View>

                <View style={styles.analysisItemFull}>
                  <View style={styles.analysisHeader}>
                    <Text style={styles.analysisLabelFull}>{t('result.proportions')}</Text>
                    <Text style={styles.analysisValueFull}>{foundResult.result.analysis.proportions.toFixed(1)}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[styles.progressFill, { width: `${foundResult.result.analysis.proportions}%`, backgroundColor: getProgressColor(foundResult.result.analysis.proportions) }]} 
                    />
                  </View>
                </View>

                <View style={styles.analysisItemFull}>
                  <View style={styles.analysisHeader}>
                    <Text style={styles.analysisLabelFull}>{t('result.lighting')}</Text>
                    <Text style={styles.analysisValueFull}>{foundResult.result.analysis.lighting.toFixed(1)}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[styles.progressFill, { width: `${foundResult.result.analysis.lighting}%`, backgroundColor: getProgressColor(foundResult.result.analysis.lighting) }]} 
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.referenceSection}>
              <Text style={styles.sectionTitle}>{t('result.referencePhotos')}</Text>
              {foundResult.request.referencePhotos.map((photo: ReferencePhoto) => (
                <View key={photo.id} style={styles.referenceItem}>
                  <Image 
                    source={{ uri: photo.uri }}
                    style={styles.referenceImageLarge}
                    contentFit="cover"
                  />
                </View>
              ))}
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerDate}>
                {t('result.completedAt')}：{new Date(foundResult.result.completedAt).toLocaleString('en-US')}
              </Text>
              {foundResult.request.metadata && (
                <View style={styles.metadataSection}>
                  <Text style={styles.metadataTitle}>📸 {t('common.tip')}</Text>
                  <Text style={styles.metadataText}>{t('result.completedAt')}: {foundResult.request.metadata.timestamp}</Text>
                  <Text style={styles.metadataText}>{t('verify.takePhoto')}: {foundResult.request.metadata.cameraType}</Text>
                  <Text style={[styles.metadataStatus, foundResult.result.metadataValid ? styles.metadataValid : styles.metadataInvalid]}>
                    {foundResult.result.metadataValid ? '✓ ' + t('common.success') : '✗ ' + t('common.error')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {!foundResult && normalizedCode.length === 4 && !isSearching && !codeError && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <AlertCircle size={48} color="#94A3B8" />
          </View>
          <Text style={styles.emptyText}>{t('history.noVerificationHistory')}</Text>
        </View>
      )}
      </ScrollView>
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

function getScoreTagConfig(score: number, t: any) {
  if (score < 2) {
    return { label: t('result.scoreTagDifferentSubject'), color: '#DC2626' };
  } else if (score < 7.5) {
    return { label: t('result.scoreTagFake'), color: '#DC2626' };
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
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E6F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  codeCell: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeCellActive: {
    borderColor: '#0066FF',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
  },
  codeCellError: {
    borderColor: '#DC2626',
  },
  codeCellText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 2,
  },
  hiddenInput: {
    position: 'absolute',
    left: -9999,
    width: 1,
    height: 1,
    opacity: 0,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#B91C1C',
  },
  searchingRow: {
    marginTop: 10,
    alignItems: 'center',
  },
  searchingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  resultSection: {
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  fullResultContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  scoreLabel2: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  verdictBadge2: {
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
  verdictText2: {
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
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
  },
  analysisItemFull: {
    marginBottom: 20,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  analysisLabelFull: {
    fontSize: 15,
    color: '#64748B',
  },
  analysisValueFull: {
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748B',
  },
  tipCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#0066FF',
  },
  tipText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
});
