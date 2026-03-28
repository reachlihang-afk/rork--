// 话题详情页 - 展示话题下的所有帖子
import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, ArrowLeft, Users, Eye, MessageSquare, Star } from 'lucide-react-native';
import { useTopic } from '@/contexts/TopicContext';
import { useSquare } from '@/contexts/SquareContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends, formatNumber } from '@/contexts/FriendsContext';
import { useTranslation } from 'react-i18next';
import { trackEvent } from '@/utils/analytics';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 10;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_GAP * 3) / 2;

export default function TopicDetailScreen() {
  const { t } = useTranslation();
  const { id: topicId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getTopic, followTopic, unfollowTopic, isFollowingTopic } = useTopic();
  const { posts, likePost } = useSquare();
  const { isFollowing: isFollowingUser } = useFriends();

  const [topic, setTopic] = useState<Awaited<ReturnType<typeof getTopic>>>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowingTopicState, setIsFollowingTopicState] = useState(false);

  // 加载话题信息
  const loadTopicData = useCallback(async () => {
    if (!topicId) return;
    setIsLoading(true);
    try {
      const topicData = await getTopic(topicId);
      setTopic(topicData);
      if (user) {
        const isFollowing = await isFollowingTopic(topicId);
        setIsFollowingTopicState(isFollowing);
      }
    } catch (error) {
      console.error('Failed to load topic:', error);
    } finally {
      setIsLoading(false);
    }
  }, [topicId, getTopic, isFollowingTopic, user]);

  useEffect(() => {
    loadTopicData();
    
    // 追踪话题浏览
    if (topicId) {
      trackEvent('topic_view', {
        topicId,
        source: 'topic_detail_page',
      });
    }
  }, [loadTopicData, topicId]);

  // 刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTopicData();
    setRefreshing(false);
  }, [loadTopicData]);

  // 筛选该话题下的帖子
  const topicPosts = useMemo(() => {
    if (!topicId) return [];
    return posts
      .filter(post => post.topics?.includes(topicId))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [posts, topicId]);

  // 瀑布流分列
  const { leftColumn, rightColumn } = useMemo(() => {
    const left: typeof topicPosts = [];
    const right: typeof topicPosts = [];
    
    topicPosts.forEach((post, index) => {
      if (index % 2 === 0) {
        left.push(post);
      } else {
        right.push(post);
      }
    });
    
    return { leftColumn: left, rightColumn: right };
  }, [topicPosts]);

  // 关注/取消关注话题
  const handleFollowToggle = async () => {
    if (!user || !topic) return;
    
    try {
      if (isFollowingTopicState) {
        await unfollowTopic(topic.id);
        setIsFollowingTopicState(false);
        trackEvent('topic_unfollow', { topicId: topic.id });
      } else {
        await followTopic(topic.id);
        setIsFollowingTopicState(true);
        trackEvent('topic_follow', { topicId: topic.id });
      }
    } catch (error) {
      console.error('Failed to toggle follow topic:', error);
    }
  };

  // 渲染帖子卡片
  const renderPostCard = (post: typeof topicPosts[0]) => {
    if (!post.resultImageUri) return null;
    
    const isLiked = user ? post.likes.includes(user.userId) : false;
    
    return (
      <TouchableOpacity
        key={post.id}
        style={styles.card}
        activeOpacity={0.95}
        onPress={() => {
          router.push({
            pathname: '/(tabs)/square',
            params: { highlightPostId: post.id },
          } as any);
        }}
      >
        {/* 主图 */}
        <View style={styles.imageContainer}>
          <ExpoImage
            source={{ uri: post.resultImageUri }}
            style={styles.mainImage}
            contentFit="cover"
            contentPosition="top"
          />
        </View>
        
        {/* 点赞和评论数 */}
        <View style={styles.cardFooter}>
          <View style={styles.cardStats}>
            <Heart size={12} color={isLiked ? '#EF4444' : '#9CA3AF'} fill={isLiked ? '#EF4444' : 'none'} />
            <Text style={[styles.cardStatText, isLiked && styles.cardStatTextActive]}>{post.likes.length}</Text>
          </View>
          <View style={styles.cardStats}>
            <MessageSquare size={12} color="#9CA3AF" />
            <Text style={styles.cardStatText}>{post.comments.length}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  if (!topic) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>{t('square.topicNotFound')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* 自定义Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('square.topicDetail')}</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
        showsVerticalScrollIndicator={false}
      >
        {/* 话题头部信息 */}
        <View style={styles.topicHeader}>
          <View style={styles.topicTitleRow}>
            <Text style={styles.topicName}>{topic.nameWithHash}</Text>
            {topic.isOfficial && (
              <View style={styles.officialBadge}>
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.officialText}>{t('square.officialTopic')}</Text>
              </View>
            )}
            {topic.isHot && (
              <View style={styles.hotBadge}>
                <Text style={styles.hotText}>🔥 {t('square.hotTopic')}</Text>
              </View>
            )}
          </View>
          
          {topic.description && (
            <Text style={styles.topicDescription}>{topic.description}</Text>
          )}
          
          {/* 统计信息 */}
          <View style={styles.topicStats}>
            <View style={styles.topicStatItem}>
              <Eye size={14} color="#6B7280" />
              <Text style={styles.topicStatText}>{t('square.topicViews', { count: formatNumber(topic.viewsCount) })}</Text>
            </View>
            <View style={styles.topicStatItem}>
              <Users size={14} color="#6B7280" />
              <Text style={styles.topicStatText}>{t('square.topicParticipants', { count: formatNumber(topic.participantsCount) })}</Text>
            </View>
            <View style={styles.topicStatItem}>
              <MessageSquare size={14} color="#6B7280" />
              <Text style={styles.topicStatText}>{t('square.topicPosts', { count: formatNumber(topic.postsCount) })}</Text>
            </View>
          </View>
          
          {/* 关注按钮 */}
          {user && (
            <TouchableOpacity
              style={[styles.followButton, isFollowingTopicState && styles.followButtonActive]}
              onPress={handleFollowToggle}
              activeOpacity={0.7}
            >
              <Text style={[styles.followButtonText, isFollowingTopicState && styles.followButtonTextActive]}>
                {isFollowingTopicState ? t('square.topicFollowed') : t('square.followTopic')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* 相关作品 */}
        <View style={styles.postsSection}>
          <Text style={styles.postsSectionTitle}>{t('square.relatedWorks')}</Text>
          {topicPosts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t('square.noWorks')}</Text>
              <Text style={styles.emptyHint}>{t('square.noWorksHint')}</Text>
            </View>
          ) : (
            <View style={styles.masonryContainer}>
              <View style={styles.column}>
                {leftColumn.map(post => renderPostCard(post))}
              </View>
              <View style={styles.column}>
                {rightColumn.map(post => renderPostCard(post))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  topicHeader: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 8,
    borderBottomColor: '#F9FAFB',
  },
  topicTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  topicName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  officialText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '600',
  },
  hotBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hotText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
  },
  topicDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  topicStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  topicStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topicStatText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  followButton: {
    backgroundColor: '#22c55e',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  followButtonActive: {
    backgroundColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.05,
  },
  followButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  followButtonTextActive: {
    color: '#6B7280',
  },
  postsSection: {
    paddingTop: 16,
  },
  postsSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  masonryContainer: {
    flexDirection: 'row',
    gap: CARD_GAP,
    paddingHorizontal: CARD_GAP,
  },
  column: {
    flex: 1,
    gap: CARD_GAP,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 0.75,
  },
  mainImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardStatText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  cardStatTextActive: {
    color: '#EF4444',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 13,
    color: '#D1D5DB',
  },
});
