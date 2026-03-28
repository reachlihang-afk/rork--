import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, MoreHorizontal, User, MessageCircle, Users } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends, UserStats, formatNumber } from '@/contexts/FriendsContext';
import { useSquare, SquarePost } from '@/contexts/SquareContext';
import { useAlert } from '@/contexts/AlertContext';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 2;
const GRID_COLUMNS = 3;
const ITEM_WIDTH = (SCREEN_WIDTH - GRID_GAP * (GRID_COLUMNS + 1)) / GRID_COLUMNS;

interface ProfileUser {
  userId: string;
  nickname: string;
  avatar?: string;
  bio?: string;
  followingCount?: number;
  followersCount?: number;
}

export default function UserProfileScreen() {
  const { t } = useTranslation();
  const { id: userId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isFollowing, followUser, unfollowUser, getUserStats, isMutualFollow } = useFriends();
  const { posts } = useSquare();
  const { showAlert } = useAlert();
  
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isMutual, setIsMutual] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // 获取该用户发布的所有帖子
  const userPosts = useMemo(() => {
    return posts.filter(p => p.userId === userId);
  }, [posts, userId]);

  // 加载用户资料和统计数据
  const loadUserProfile = useCallback(async () => {
    try {
      // 从 all_users 存储中查找用户
      const usersKey = 'all_users';
      const stored = await AsyncStorage.getItem(usersKey);
      const allUsers: ProfileUser[] = stored ? JSON.parse(stored) : [];
      
      const foundUser = allUsers.find(u => u.userId === userId);
      
      if (foundUser) {
        setProfileUser(foundUser);
      } else {
        // 如果找不到，尝试从帖子中获取用户信息
        const userPost = posts.find(p => p.userId === userId);
        if (userPost) {
          setProfileUser({
            userId: userPost.userId,
            nickname: userPost.userNickname,
            avatar: userPost.userAvatar,
            bio: undefined,
            followingCount: 0,
            followersCount: 0,
          });
        }
      }
      
      // 加载用户统计数据（真实的粉丝数/关注数）
      if (typeof userId === 'string') {
        const stats = await getUserStats(userId);
        setUserStats(stats);
        
        // 检查是否互相关注
        const mutual = await isMutualFollow(userId);
        setIsMutual(mutual);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, posts, getUserStats, isMutualFollow]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  // 处理关注/取消关注
  const handleFollowToggle = async () => {
    if (!profileUser || !user) return;
    if (isFollowLoading) return;
    
    setIsFollowLoading(true);
    try {
      if (isFollowing(profileUser.userId)) {
        await unfollowUser(profileUser.userId);
        showAlert({
          type: 'success',
          title: t('common.success'),
          message: t('square.unfollowed'),
        });
        setIsMutual(false);
      } else {
        await followUser(profileUser.userId, profileUser.nickname, profileUser.avatar);
        showAlert({
          type: 'success',
          title: t('common.success'),
          message: t('square.followed'),
        });
        // 检查是否变成互关
        const mutual = await isMutualFollow(profileUser.userId);
        setIsMutual(mutual);
      }
      
      // 重新加载统计数据
      const stats = await getUserStats(profileUser.userId);
      setUserStats(stats);
    } catch (error: any) {
      console.error('Follow toggle error:', error);
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: error.message || t('common.operationFailed'),
      });
    } finally {
      setIsFollowLoading(false);
    }
  };

  // 点击帖子查看详情
  const handlePostPress = (post: SquarePost) => {
    // 跳转到广场详情页或直接在此展示
    router.push(`/(tabs)/square?postId=${post.id}` as any);
  };

  // 渲染作品网格
  const renderPostsGrid = () => {
    if (userPosts.length === 0) {
      return (
        <View style={styles.emptyPostsContainer}>
          <Text style={styles.emptyPostsIcon}>👗</Text>
          <Text style={styles.emptyPostsText}>{t('userProfile.noPosts')}</Text>
        </View>
      );
    }

    return (
      <View style={styles.postsGrid}>
        {userPosts.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={styles.postItem}
            onPress={() => handlePostPress(post)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: post.editedPhotoUri || post.referencePhotoUri }}
              style={styles.postImage}
              contentFit="cover"
            />
            {/* 互动数据 */}
            <View style={styles.postOverlay}>
              <View style={styles.postStats}>
                <Text style={styles.postStatText}>❤️ {post.likes?.length || 0}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <ArrowLeft size={24} color="#1a1a1a" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('userProfile.title')}</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a1a1a" />
        </View>
      </View>
    );
  }

  if (!profileUser) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <ArrowLeft size={24} color="#1a1a1a" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('userProfile.title')}</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.emptyContainer}>
          <User size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>{t('userProfile.notFound')}</Text>
        </View>
      </View>
    );
  }

  const isOwnProfile = user?.userId === profileUser.userId;
  const following = isFollowing(profileUser.userId);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <ArrowLeft size={24} color="#1a1a1a" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('userProfile.title').toUpperCase()}</Text>
        <TouchableOpacity
          style={styles.moreButton}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <MoreHorizontal size={24} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 用户信息区域 */}
        <View style={styles.profileSection}>
          {/* 头像 */}
          <View style={styles.avatarWrapper}>
            {profileUser.avatar ? (
              <Image source={{ uri: profileUser.avatar }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={40} color="#9ca3af" strokeWidth={2} />
              </View>
            )}
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedIcon}>✓</Text>
            </View>
          </View>

          {/* 昵称 */}
          <Text style={styles.nickname}>{profileUser.nickname}</Text>

          {/* 个人介绍 */}
          {profileUser.bio && (
            <Text style={styles.bio}>{profileUser.bio}</Text>
          )}

          {/* 统计数据 - 使用真实数据，可点击查看列表 */}
          <View style={styles.statsContainer}>
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => router.push(`/follow-list?userId=${profileUser.userId}&tab=following` as any)}
            >
              <Text style={styles.statNumber}>{formatNumber(userStats?.followingCount || 0)}</Text>
              <Text style={styles.statLabel}>{t('profile.following')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => router.push(`/follow-list?userId=${profileUser.userId}&tab=followers` as any)}
            >
              <Text style={styles.statNumber}>{formatNumber(userStats?.followersCount || 0)}</Text>
              <Text style={styles.statLabel}>{t('profile.followers')}</Text>
            </TouchableOpacity>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{formatNumber(userStats?.totalLikes || 0)}</Text>
              <Text style={styles.statLabel}>{t('profile.likes')}</Text>
            </View>
          </View>

          {/* 操作按钮 */}
          {!isOwnProfile && user && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[
                  styles.followButton,
                  following && styles.followingButton,
                  isMutual && styles.mutualButton,
                ]}
                onPress={handleFollowToggle}
                disabled={isFollowLoading}
                activeOpacity={0.8}
              >
                {isFollowLoading ? (
                  <ActivityIndicator size="small" color={following ? '#1a1a1a' : '#fff'} />
                ) : (
                  <View style={styles.followButtonContent}>
                    {isMutual && <Users size={16} color="#1a1a1a" strokeWidth={2} style={{ marginRight: 6 }} />}
                    <Text style={[
                      styles.followButtonText,
                      following && styles.followingButtonText,
                    ]}>
                      {isMutual ? t('userProfile.mutualFollow') : (following ? t('userProfile.following') : t('userProfile.follow'))}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.messageButton} activeOpacity={0.8}>
                <MessageCircle size={20} color="#1a1a1a" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          )}

          {isOwnProfile && (
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => router.push('/edit-profile')}
              activeOpacity={0.8}
            >
              <Text style={styles.editProfileButtonText}>{t('profile.editProfile')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 分隔线 */}
        <View style={styles.divider} />

        {/* 作品区域 */}
        <View style={styles.postsSection}>
          <View style={styles.postsSectionHeader}>
            <Text style={styles.postsSectionTitle}>{t('userProfile.posts')}</Text>
            <Text style={styles.postsSectionCount}>{userPosts.length}</Text>
          </View>
          {renderPostsGrid()}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
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
  headerPlaceholder: {
    width: 44,
  },
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 16,
    textAlign: 'center',
  },
  
  // Profile Section
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#f3f4f6',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#e5e7eb',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  verifiedIcon: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  nickname: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  bio: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
    marginTop: 2,
  },
  
  // Actions
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  followButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
  },
  followingButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  mutualButton: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
  },
  followButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  followingButtonText: {
    color: '#1a1a1a',
  },
  messageButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  editProfileButton: {
    marginTop: 24,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  editProfileButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  
  // Divider
  divider: {
    height: 8,
    backgroundColor: '#f3f4f6',
  },
  
  // Posts Section
  postsSection: {
    paddingTop: 16,
  },
  postsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  postsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  postsSectionCount: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_GAP,
  },
  postItem: {
    width: ITEM_WIDTH,
    aspectRatio: 1,
    marginBottom: GRID_GAP,
    marginRight: GRID_GAP,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postStatText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
  },
  
  // Empty Posts
  emptyPostsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyPostsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyPostsText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
