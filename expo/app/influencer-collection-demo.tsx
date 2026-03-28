// Demo版本 - 达人Collection页面 (Jennie示例)
// 展示达人的所有Look,用户可选择并一键换装

import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, MoreVertical, Grid3x3, Bookmark, CheckCircle2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 3; // 3列,间距12px

// Mock Jennie的Look数据
const JENNIE_LOOKS = [
  { id: '1', image: '👱‍♀️', title: 'Chanel Airport' },
  { id: '2', image: '🏛️', title: 'Parisian Chic' },
  { id: '3', image: '💰', title: 'Luxury Gold' },
  { id: '4', image: '👱‍♀️', title: 'Casual Street' },
  { id: '5', image: '💰', title: 'Elegant Gold' },
  { id: '6', image: '🏛️', title: 'Classic Building' },
  { id: '7', image: '👱‍♀️', title: 'K-Pop Style' },
  { id: '8', image: '🏛️', title: 'Urban Fashion' },
  { id: '9', image: '💰', title: 'Rich Aesthetic' },
  { id: '10', image: '💰', title: 'Golden Hour' },
  { id: '11', image: '🏛️', title: 'Architecture' },
  { id: '12', image: '💰', title: 'Wealth Vibes' },
  { id: '13', image: '👱‍♀️', title: 'Portrait Mode' },
  { id: '14', image: '🏛️', title: 'City Life' },
  { id: '15', image: '💰', title: 'Money Talks' },
];

type ViewMode = 'grid' | 'bookmark';

export default function InfluencerCollectionDemoScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedLook, setSelectedLook] = useState<string>('1');

  const handleUseStyle = () => {
    // TODO: 将选中的Look传递给换装页面
    alert(`使用 Look ${selectedLook} 进行换装`);
    router.back();
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* 自定义Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={isDark ? '#fff' : '#1a1a1a'} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, isDark && styles.textDark]}>
          JENNIE'S COLLECTION
        </Text>

        <TouchableOpacity style={styles.headerButton}>
          <MoreVertical size={24} color={isDark ? '#fff' : '#1a1a1a'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👱‍♀️</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <CheckCircle2 size={20} color="#fff" fill="#1a1a1a" />
            </View>
          </View>

          <Text style={[styles.profileName, isDark && styles.textDark]}>
            Jennie Kim
          </Text>

          <Text style={styles.profileDesc}>
            The ultimate Chanel Muse and Street Style Icon.
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, isDark && styles.textDark]}>24 LOOKS</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, isDark && styles.textDark]}>K-POP</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, isDark && styles.textDark]}>GLOBAL</Text>
            </View>
          </View>
        </View>

        {/* View Mode Toggle */}
        <View style={styles.viewModeContainer}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'grid' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('grid')}
          >
            <Grid3x3
              size={24}
              color={viewMode === 'grid' ? '#1a1a1a' : '#9ca3af'}
              strokeWidth={viewMode === 'grid' ? 2.5 : 2}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'bookmark' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('bookmark')}
          >
            <Bookmark
              size={24}
              color={viewMode === 'bookmark' ? '#1a1a1a' : '#9ca3af'}
              strokeWidth={viewMode === 'bookmark' ? 2.5 : 2}
            />
          </TouchableOpacity>
        </View>

        {/* Looks Grid */}
        <View style={styles.looksGrid}>
          {JENNIE_LOOKS.map((look) => (
            <TouchableOpacity
              key={look.id}
              style={[
                styles.lookCard,
                isDark && styles.lookCardDark,
              ]}
              onPress={() => setSelectedLook(look.id)}
              activeOpacity={0.8}
            >
              <View style={styles.lookImageContainer}>
                <View style={[styles.lookImage, isDark && styles.lookImageDark]}>
                  <Text style={styles.lookImageText}>{look.image}</Text>
                </View>
                {selectedLook === look.id && (
                  <View style={styles.selectedOverlay}>
                    <View style={styles.selectedCheck}>
                      <CheckCircle2 size={32} color="#fff" fill="#1a1a1a" strokeWidth={0} />
                    </View>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.fixedBottom}>
        <View style={styles.gradientContainer}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', isDark ? '#121212' : '#ffffff']}
            style={styles.gradient}
          />
        </View>

        <TouchableOpacity
          style={styles.useButton}
          onPress={handleUseStyle}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#1a1a1a', '#000000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.useButtonGradient}
          >
            <Text style={styles.useButtonText}>
              Use This Style →
            </Text>
          </LinearGradient>
        </TouchableOpacity>
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
    backgroundColor: '#121212',
  },
  textDark: {
    color: '#f0f0f0',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerDark: {
    backgroundColor: '#121212',
    borderBottomColor: '#2a2a2a',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Profile Section
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarText: {
    fontSize: 64,
  },
  verifiedBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 2,
  },
  profileName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  profileDesc: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },

  // View Mode
  viewModeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  viewModeButton: {
    padding: 12,
  },
  viewModeButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#1a1a1a',
  },

  // Looks Grid
  looksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 0,
  },
  lookCard: {
    width: cardWidth,
    padding: 6,
  },
  lookCardDark: {
    // dark mode adjustments
  },
  lookImageContainer: {
    position: 'relative',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  lookImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lookImageDark: {
    backgroundColor: '#2a2a2a',
  },
  lookImageText: {
    fontSize: 48,
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheck: {
    backgroundColor: 'transparent',
  },

  // Fixed Bottom
  fixedBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  gradientContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: -1,
  },
  gradient: {
    flex: 1,
  },
  useButton: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  useButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  useButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});
