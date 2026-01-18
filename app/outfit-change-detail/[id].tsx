import React, { useState } from 'react';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowLeft, MoreHorizontal, Sparkles } from 'lucide-react-native';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useVerification } from '@/contexts/VerificationContext';
import { useTranslation } from 'react-i18next';

export default function OutfitChangeDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const { outfitChangeHistory, deleteOutfitChange } = useVerification();
  
  const [viewMode, setViewMode] = useState<'original' | 'result'>('result');

  const outfitItem = outfitChangeHistory.find(item => item.id === id);

  if (!outfitItem) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {t('history.noRecords')}
          </Text>
        </View>
      </View>
    );
  }

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
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.backButtonInner}>
            <ArrowLeft size={20} color="#1a1a1a" strokeWidth={2.5} />
          </View>
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {t('outfitChange.result').toUpperCase()}
        </Text>
        
        <TouchableOpacity 
          onPress={handleMore}
          style={styles.headerButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MoreHorizontal size={24} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* View Mode Toggle */}
        <View style={styles.toggleContainer}>
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
              viewMode === 'original' && styles.toggleTextActive
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
              viewMode === 'result' && styles.toggleTextActive
            ]}>
              {t('history.result')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Image */}
        <View style={styles.imageContainer}>
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
              <Text style={styles.title}>
                {t('outfitChange.transformationComplete')}
              </Text>
              <Text style={styles.subtitle}>
                {outfitItem.templateName?.toUpperCase()} • {t('outfitChange.smartCasual').toUpperCase()}
              </Text>
            </View>
            
            <View style={styles.matchBadge}>
              <Sparkles size={16} color="#1a1a1a" strokeWidth={2.5} />
              <Text style={styles.matchText}>
                98% {t('outfitChange.match')}
              </Text>
            </View>
          </View>

          {/* Style Tags */}
          <View style={styles.tagsContainer}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>
                {outfitItem.templateName}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingRight: 12,
  },
  backButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
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
    paddingBottom: 40,
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
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#09090b',
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
});
