import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, User, Users, MessageCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends, FollowingUser, FollowerUser, formatNumber } from '@/contexts/FriendsContext';
import { useAlert } from '@/contexts/AlertContext';
import { useTranslation } from 'react-i18next';

type TabType = 'following' | 'followers';

interface ListUser {
  userId: string;
  nickname: string;
  avatar?: string;
  followedAt: string;
  isMutual?: boolean;
}

export default function FollowListScreen() {
  const { t } = useTranslation();
  const { userId, tab: initialTab } = useLocalSearchParams<{ userId: string; tab?: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { 
    isFollowing, 
    followUser, 
    unfollowUser, 
    getFollowingList, 
    getFollowersList,
    isMutualFollow,
    getUserStats,
  } = useFriends();
  const { showAlert } = useAlert();

  const [activeTab, setActiveTab] = useState<TabType>((initialTab as TabType) || 'following');
  const [followingList, setFollowingList] = useState<ListUser[]>([]);
  const [followersList, setFollowersList] = useState<ListUser[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  const targetUserId = userId || user?.userId;
  const isOwnProfile = targetUserId === user?.userId;

  // 加载列表数据
  const loadData = useCallback(async () => {
    if (!targetUserId) return;

    try {
      // 获取统计数据
      const stats = await getUserStats(targetUserId);
      setFollowingCount(stats.followingCount);
      setFollowersCount(stats.followersCount);

      // 获取关注列表
      const followingData = await getFollowingList(targetUserId);
      const followingWithMutual = await Promise.all(
        followingData.map(async (u) => ({
          ...u,
          isMutual: user ? await isMutualFollow(u.userId) : false,
        }))
      );
      setFollowingList(followingWithMutual);

      // 获取粉丝列表
      const followersData = await getFollowersList(targetUserId);
      const followersWithMutual = await Promise.all(
        followersData.map(async (u) => ({
          ...u,
          isMutual: user ? await isMutualFollow(u.userId) : false,
        }))
      );
      setFollowersList(followersWithMutual);
    } catch (error) {
      console.error('Failed to load follow data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [targetUserId, user, getFollowingList, getFollowersList, isMutualFollow, getUserStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
  }, [loadData]);

  // 处理关注/取消关注
  const handleFollowToggle = async (targetUser: ListUser) => {
    if (!user) {
      showAlert({
        type: 'info',
        message: t('common.pleaseLogin'),
      });
      return;
    }

    if (targetUser.userId === user.userId) return;

    setLoadingUserId(targetUser.userId);
    try {
      if (isFollowing(targetUser.userId)) {
        await unfollowUser(targetUser.userId);
        showAlert({
          type: 'success',
          title: t('common.success'),
          message: t('square.unfollowed'),
        });
      } else {
        await followUser(targetUser.userId, targetUser.nickname, targetUser.avatar);
        showAlert({
          type: 'success',
          title: t('common.success'),
          message: t('square.followed'),
        });
      }
      // 刷新列表
      await loadData();
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: error.message || t('common.operationFailed'),
      });
    } finally {
      setLoadingUserId(null);
    }
  };

  // 渲染用户项
  const renderUserItem = ({ item }: { item: ListUser }) => {
    const following = user ? isFollowing(item.userId) : false;
    const isMe = item.userId === user?.userId;
    const isLoadingThis = loadingUserId === item.userId;

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => router.push(`/user-profile/${item.userId}` as any)}
        activeOpacity={0.7}
      >
        {/* 头像 */}
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <User size={24} color="#9ca3af" strokeWidth={2} />
          </View>
        )}

        {/* 用户信息 */}
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.nickname} numberOfLines={1}>{item.nickname}</Text>
            {item.isMutual && (
              <View style={styles.mutualBadge}>
                <Users size={10} color="#10B981" />
                <Text style={styles.mutualText}>{t('userProfile.mutualFollow')}</Text>
              </View>
            )}
          </View>
          <Text style={styles.followTime}>
            {new Date(item.followedAt).toLocaleDateString()}
          </Text>
        </View>

        {/* 操作按钮 */}
        {!isMe && user && (
          <TouchableOpacity
            style={[
              styles.followButton,
              following && styles.followingButton,
              item.isMutual && styles.mutualButton,
            ]}
            onPress={() => handleFollowToggle(item)}
            disabled={isLoadingThis}
          >
            {isLoadingThis ? (
              <ActivityIndicator size="small" color={following ? '#1a1a1a' : '#fff'} />
            ) : (
              <Text style={[styles.followButtonText, following && styles.followingButtonText]}>
                {following ? t('userProfile.following') : t('userProfile.follow')}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* 私信按钮（互关时显示） */}
        {item.isMutual && !isMe && (
          <TouchableOpacity style={styles.messageButton}>
            <MessageCircle size={18} color="#1a1a1a" strokeWidth={2} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  // 空状态
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>
        {activeTab === 'following' ? '👥' : '🙋'}
      </Text>
      <Text style={styles.emptyText}>
        {activeTab === 'following' 
          ? t('followList.noFollowing')
          : t('followList.noFollowers')}
      </Text>
    </View>
  );

  const currentList = activeTab === 'following' ? followingList : followersList;

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
        <Text style={styles.headerTitle}>
          {isOwnProfile ? t('followList.myFollow') : t('followList.userFollow')}
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Tab切换 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.tabActive]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.tabTextActive]}>
            {t('profile.following')} {formatNumber(followingCount)}
          </Text>
          {activeTab === 'following' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'followers' && styles.tabActive]}
          onPress={() => setActiveTab('followers')}
        >
          <Text style={[styles.tabText, activeTab === 'followers' && styles.tabTextActive]}>
            {t('profile.followers')} {formatNumber(followersCount)}
          </Text>
          {activeTab === 'followers' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* 列表 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a1a1a" />
        </View>
      ) : (
        <FlatList
          data={currentList}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a1a1a" />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerPlaceholder: {
    width: 44,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9ca3af',
  },
  tabTextActive: {
    fontWeight: '700',
    color: '#1a1a1a',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: '#EF4444',
    borderRadius: 1.5,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nickname: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    maxWidth: 120,
  },
  mutualBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  mutualText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10B981',
  },
  followTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  followButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 70,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  mutualButton: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  followingButtonText: {
    color: '#1a1a1a',
  },
  messageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
