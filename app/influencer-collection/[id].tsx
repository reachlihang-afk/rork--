// app/influencer-collection/[id].tsx - 完整版
// 达人Look集合页面

import { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Platform,
  Alert
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, MoreVertical, Grid, Bookmark, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

// 达人数据类型
interface InfluencerLook {
  id: string;
  imageUri: string; // 占位图URL
  prompt: string;   // AI生成用的prompt描述
  tags: string[];   // 标签: casual, formal, street, elegant, etc.
}

interface InfluencerData {
  id: string;
  name: string;
  nameEn: string;
  avatar: string;
  description: string;
  verified: boolean;
  totalLooks: number;
  looks: InfluencerLook[];
}

// Jennie数据
const JENNIE_DATA: InfluencerData = {
  id: 'jennie',
  name: 'Jennie Kim',
  nameEn: 'Jennie',
  avatar: '👱‍♀️',
  description: 'Chanel Muse & K-Pop Icon',
  verified: true,
  totalLooks: 24,
  looks: [
    {
      id: 'j1',
      imageUri: 'https://placeholder.com/300x400', // 占位图
      prompt: 'Jennie wearing a black Chanel tweed jacket with matching mini skirt, pearl accessories, at a luxury Parisian street, confident pose with hand in pocket, professional fashion photography',
      tags: ['luxury', 'chanel', 'elegant'],
    },
    {
      id: 'j2',
      imageUri: 'https://placeholder.com/300x400',
      prompt: 'Jennie in casual oversized hoodie and ripped jeans, sneakers, urban street background with graffiti wall, relaxed cool pose, natural daylight photography',
      tags: ['casual', 'street', 'urban'],
    },
    {
      id: 'j3',
      imageUri: 'https://placeholder.com/300x400',
      prompt: 'Jennie wearing elegant black evening dress with plunging neckline, diamond jewelry, at a luxury hotel lobby, sophisticated standing pose, dramatic lighting',
      tags: ['evening', 'elegant', 'luxury'],
    },
    {
      id: 'j4',
      imageUri: 'https://placeholder.com/300x400',
      prompt: 'Jennie in trendy crop top and high-waisted skirt, designer handbag, at Seoul Gangnam street, confident walking pose, golden hour lighting',
      tags: ['trendy', 'kpop', 'street'],
    },
    {
      id: 'j5',
      imageUri: 'https://placeholder.com/300x400',
      prompt: 'Jennie wearing white oversized shirt dress, minimal jewelry, at minimalist white studio, artistic sitting pose, soft natural light',
      tags: ['minimal', 'studio', 'artistic'],
    },
    {
      id: 'j6',
      imageUri: 'https://placeholder.com/300x400',
      prompt: 'Jennie in colorful Chanel runway outfit with bold patterns, statement accessories, at fashion week venue, model pose on street, professional runway photography',
      tags: ['runway', 'bold', 'chanel'],
    },
    {
      id: 'j7',
      imageUri: 'https://placeholder.com/300x400',
      prompt: 'Jennie wearing leather jacket and biker boots, edgy accessories, at urban night scene with neon lights, confident standing pose, moody lighting',
      tags: ['edgy', 'night', 'urban'],
    },
    {
      id: 'j8',
      imageUri: 'https://placeholder.com/300x400',
      prompt: 'Jennie in elegant office wear - tailored blazer and trousers, minimal jewelry, at modern glass office building, professional standing pose, natural daylight',
      tags: ['business', 'professional', 'modern'],
    },
    {
      id: 'j9',
      imageUri: 'https://placeholder.com/300x400',
      prompt: 'Jennie wearing cute pastel dress with ribbons, at cherry blossom park in spring, playful twirl pose, soft pink lighting',
      tags: ['cute', 'spring', 'pastel'],
    },
    {
      id: 'j10',
      imageUri: 'https://placeholder.com/300x400',
      prompt: 'Jennie in sporty athleisure outfit - branded leggings and crop top, at modern gym setting, active fitness pose, bright lighting',
      tags: ['sporty', 'athletic', 'fitness'],
    },
    {
      id: 'j11',
      imageUri: 'https://placeholder.com/300x400',
      prompt: 'Jennie wearing vintage 90s inspired outfit, denim jacket and mini skirt, at retro diner setting, casual leaning pose, warm vintage filter',
      tags: ['vintage', '90s', 'retro'],
    },
    {
      id: 'j12',
      imageUri: 'https://placeholder.com/300x400',
      prompt: 'Jennie in beach summer outfit - bikini top with high-waisted shorts, at tropical beach sunset, relaxed beach pose, golden hour glow',
      tags: ['beach', 'summer', 'vacation'],
    },
    {
      id: 'j13',
      imageUri: 'https://placeholder.com/300x400',
      prompt: 'Jennie wearing all-black street style with oversized coat, at Seoul night market, model walking pose, neon reflections',
      tags: ['street', 'night', 'all-black'],
    },
    {
      id: 'j14',
      imageUri: 'https://placeholder.com/300x400',
      prompt: 'Jennie in elegant red carpet gown with train, at award ceremony venue, graceful pose with hand on hip, dramatic spotlight',
      tags: ['red-carpet', 'gown', 'formal'],
    },
    {
      id: 'j15',
      imageUri: 'https://placeholder.com/300x400',
      prompt: 'Jennie wearing cozy winter outfit - fur coat and boots, at snowy European street, elegant winter pose, soft snow lighting',
      tags: ['winter', 'cozy', 'luxury'],
    },
    {
      id: 'j16',
      imageUri: 'https://placeholder.com/300x400',
      prompt: 'Jennie in punk rock style - studded leather jacket and ripped jeans, at rock concert venue, edgy confident pose, dramatic stage lights',
      tags: ['punk', 'rock', 'edgy'],
    },
    {
      id: 'j17',
      imageUri: 'https://placeholder.com/300x400',
      prompt: 'Jennie wearing feminine floral dress, at French garden with flowers, romantic twirl pose, soft afternoon sunlight',
      tags: ['feminine', 'floral', 'romantic'],
    },
    {
      id: 'j18',
      imageUri: 'https://placeholder.com/300x400',
      prompt: 'Jennie in modern minimalist outfit - white turtleneck and black trousers, at contemporary art gallery, artistic standing pose, gallery lighting',
      tags: ['minimalist', 'art', 'modern'],
    },
    {
      id: 'j19',
      imageUri: 'https://placeholder.com/300x400',
      prompt: 'Jennie wearing bohemian festival outfit with fringe details, at music festival ground, carefree dancing pose, festival atmosphere lighting',
      tags: ['bohemian', 'festival', 'carefree'],
    },
    {
      id: 'j20',
      imageUri: 'https://placeholder.com/300x400',
      prompt: 'Jennie in luxury airport fashion - Chanel bag and designer outfit, at private jet terminal, sophisticated walking pose, natural daylight',
      tags: ['luxury', 'airport', 'chanel'],
    },
    {
      id: 'j21',
      imageUri: 'https://placeholder.com/300x400',
      prompt: 'Jennie wearing cute pajama-style outfit, at modern bedroom setting, relaxed casual pose, soft morning light',
      tags: ['casual', 'home', 'cozy'],
    },
    {
      id: 'j22',
      imageUri: 'https://placeholder.com/300x400',
      prompt: 'Jennie in glamorous party dress with sequins, at nightclub VIP area, confident party pose, colorful party lights',
      tags: ['party', 'glamorous', 'night'],
    },
    {
      id: 'j23',
      imageUri: 'https://placeholder.com/300x400',
      prompt: 'Jennie wearing elegant Korean hanbok with modern twist, at traditional palace garden, graceful traditional pose, natural heritage lighting',
      tags: ['hanbok', 'traditional', 'korean'],
    },
    {
      id: 'j24',
      imageUri: 'https://placeholder.com/300x400',
      prompt: 'Jennie in futuristic metallic outfit, at modern architecture background, avant-garde fashion pose, dramatic architectural lighting',
      tags: ['futuristic', 'avantgarde', 'modern'],
    },
  ],
};

// 未来可以添加更多达人
const INFLUENCERS: { [key: string]: InfluencerData } = {
  jennie: JENNIE_DATA,
  // 可以在这里添加更多达人
};

export default function InfluencerCollectionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const influencerId = typeof params.id === 'string' ? params.id : 'jennie';
  const influencer = INFLUENCERS[influencerId] || JENNIE_DATA;

  const [viewMode, setViewMode] = useState<'grid' | 'bookmark'>('grid');
  const [selectedLookId, setSelectedLookId] = useState<string | null>(null);

  const handleSelectLook = (lookId: string) => {
    setSelectedLookId(lookId === selectedLookId ? null : lookId);
  };

  const handleUseStyle = () => {
    if (!selectedLookId) {
      Alert.alert(t('common.tip'), t('outfitChange.selectStyleFirst'));
      return;
    }

    const selectedLook = influencer.looks.find(look => look.id === selectedLookId);
    if (!selectedLook) return;

    // 返回到outfit-change页面,并传递选中的look信息
    router.push({
      pathname: '/outfit-change-new' as any,
      params: {
        mode: 'pro',
        influencerId: influencer.id,
        lookId: selectedLook.id,
        lookPrompt: selectedLook.prompt,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: `${influencer.name} Collection`,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#1a1a1a" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity>
              <MoreVertical size={24} color="#1a1a1a" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 达人简介 */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{influencer.avatar}</Text>
            </View>
            {influencer.verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            )}
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {influencer.name}
            </Text>
            <Text style={styles.profileDesc}>
              {influencer.description}
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {influencer.totalLooks}
                </Text>
                <Text style={styles.statLabel}>
                  {t('outfitChange.looks')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 视图模式切换 */}
        <View style={styles.viewModeContainer}>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === 'grid' && styles.viewModeButtonActive
            ]}
            onPress={() => setViewMode('grid')}
          >
            <Grid 
              size={20} 
              color={viewMode === 'grid' ? '#1a1a1a' : '#9ca3af'} 
              strokeWidth={viewMode === 'grid' ? 2.5 : 2}
            />
            <Text style={[
              styles.viewModeText,
              viewMode === 'grid' && styles.viewModeTextActive
            ]}>
              Grid
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === 'bookmark' && styles.viewModeButtonActive
            ]}
            onPress={() => setViewMode('bookmark')}
          >
            <Bookmark 
              size={20} 
              color={viewMode === 'bookmark' ? '#1a1a1a' : '#9ca3af'} 
              strokeWidth={viewMode === 'bookmark' ? 2.5 : 2}
            />
            <Text style={[
              styles.viewModeText,
              viewMode === 'bookmark' && styles.viewModeTextActive
            ]}>
              Saved
            </Text>
          </TouchableOpacity>
        </View>

        {/* Looks网格 */}
        <View style={styles.looksGrid}>
          {influencer.looks.map((look) => (
            <TouchableOpacity
              key={look.id}
              style={[
                styles.lookCard,
                selectedLookId === look.id && styles.lookCardSelected
              ]}
              onPress={() => handleSelectLook(look.id)}
              activeOpacity={0.9}
            >
              {/* 占位图 */}
              <View style={styles.lookImagePlaceholder}>
                <Text style={styles.lookImageEmoji}>📸</Text>
                <Text style={styles.lookImageText}>Look {look.id}</Text>
              </View>
              
              {/* 选中标记 */}
              {selectedLookId === look.id && (
                <View style={styles.selectedOverlay}>
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedText}>✓</Text>
                  </View>
                </View>
              )}

              {/* 标签 */}
              <View style={styles.lookTags}>
                {look.tags.slice(0, 2).map((tag, index) => (
                  <View key={index} style={styles.lookTag}>
                    <Text style={styles.lookTagText}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* 固定底部按钮 */}
      <View style={styles.fixedBottom}>
        <View style={styles.gradientContainer}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', '#ffffff']}
            style={styles.gradient}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.useStyleButton,
            !selectedLookId && styles.useStyleButtonDisabled
          ]}
          onPress={handleUseStyle}
          disabled={!selectedLookId}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#1a1a1a', '#000000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.useStyleGradient}
          >
            <Sparkles size={20} color="#fff" strokeWidth={2.5} />
            <Text style={styles.useStyleButtonText}>
              {selectedLookId 
                ? t('outfitChange.useThisStyle')
                : t('outfitChange.selectStyleFirst')
              }
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },

  // 简介区域
  profileSection: {
    flexDirection: 'row',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
  },
  verifiedBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  verifiedText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  profileDesc: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 2,
  },

  // 视图模式切换
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  viewModeButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  viewModeTextActive: {
    color: '#1a1a1a',
    fontWeight: '700',
  },

  // Looks网格
  looksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  lookCard: {
    width: '48%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  lookCardSelected: {
    borderColor: '#1a1a1a',
  },
  lookImagePlaceholder: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lookImageEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  lookImageText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  lookTags: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  lookTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 6,
  },
  lookTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  // 固定底部
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
  useStyleButton: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  useStyleButtonDisabled: {
    opacity: 0.5,
  },
  useStyleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  useStyleButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});
