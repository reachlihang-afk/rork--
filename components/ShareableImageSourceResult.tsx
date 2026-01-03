import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import type { ImageSourceHistory } from '@/types/verification';

interface ShareableImageSourceResultProps {
  record: ImageSourceHistory;
}

const ShareableImageSourceResult = forwardRef<View, ShareableImageSourceResultProps>(
  function ShareableImageSourceResult({ record }, ref) {
    const { t } = useTranslation();
    
    return (
      <View ref={ref} style={styles.container} collapsable={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('imageSource.shareReportTitle')}</Text>
          <Text style={styles.headerSubtitle}>{t('imageSource.shareReportTitleEn')}</Text>
        </View>

        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>{t('imageSource.originalImage')}</Text>
          <Image 
            source={{ uri: record.imageUri }} 
            style={styles.image} 
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="high"
          />
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
                <Text style={styles.entityIntro}>
                  {record.analysis.entityInfo.introduction}
                </Text>
              )}
            </View>
          </View>
        )}

        {record.analysis.keywords.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('imageSource.keywords')}</Text>
            <View style={styles.keywordsContainer}>
              {record.analysis.keywords.map((keyword, index) => (
                <View key={index} style={styles.keywordChip}>
                  <Text style={styles.keywordText}>{keyword}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {record.analysis.possibleSources.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('imageSource.possibleSources')}</Text>
            <View style={styles.sourcesCard}>
              {record.analysis.possibleSources.map((source, index) => (
                <View key={index} style={[styles.sourceItem, index === record.analysis.possibleSources.length - 1 && { marginBottom: 0 }]}>
                  <Text style={styles.sourceBullet}>•</Text>
                  <Text style={styles.sourceText}>{source}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerDate}>
            {t('imageSource.analysisTime')}：{new Date(record.createdAt).toLocaleString()}
          </Text>
          <Text style={styles.footerBrand}>{t('imageSource.shareAnalysisSource')}</Text>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    padding: 24,
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  imageSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  section: {
    marginBottom: 20,
  },
  entityCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0066FF',
  },
  entityName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  entityIntro: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  keywordChip: {
    backgroundColor: '#E6F0FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  keywordText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0066FF',
  },
  sourcesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  sourceItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  sourceBullet: {
    fontSize: 13,
    color: '#0066FF',
    marginRight: 8,
    fontWeight: '700',
  },
  sourceText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  footer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
    alignItems: 'center',
  },
  footerDate: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  footerBrand: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
});

export default ShareableImageSourceResult;
