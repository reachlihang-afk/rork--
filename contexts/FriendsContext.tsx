import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import { Friend, FriendRequest, FriendPrivacySettings } from '@/types/friends';
import { useAuth } from './AuthContext';

// 关注的用户类型
export interface FollowingUser {
  userId: string;
  nickname: string;
  avatar?: string;
  followedAt: string;
}

// 粉丝用户类型（反向索引）
export interface FollowerUser {
  userId: string;
  nickname: string;
  avatar?: string;
  followedAt: string;
}

// 用户统计数据类型
export interface UserStats {
  userId: string;
  followersCount: number;  // 粉丝数
  followingCount: number;  // 关注数
  totalLikes: number;      // 获赞总数
  postsCount: number;      // 发帖数
}

// 格式化数字显示（1000 -> 1k, 10000 -> 1w）
export const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1).replace(/\.0$/, '') + 'w';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
};

export const [FriendsContext, useFriends] = createContextHook(() => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [following, setFollowing] = useState<FollowingUser[]>([]); // 关注列表
  const [privacySettings, setPrivacySettings] = useState<FriendPrivacySettings>({
    allowFriendsViewHistory: true,
    historyVisibility: 'friends_only',
    historyTimeRange: 'all',
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadFriendsData = useCallback(async () => {
    if (!user) {
      setFriends([]);
      setFriendRequests([]);
      setSentRequests([]);
      setFollowing([]);
      setIsLoading(false);
      return;
    }

    try {
      const friendsKey = `friends_${user.userId}`;
      const requestsKey = `friend_requests_${user.userId}`;
      const sentRequestsKey = `sent_requests_${user.userId}`;
      const privacyKey = `privacy_settings_${user.userId}`;
      const followingKey = `following_${user.userId}`;

      const [friendsData, requestsData, sentRequestsData, privacyData, followingData] = await Promise.all([
        AsyncStorage.getItem(friendsKey),
        AsyncStorage.getItem(requestsKey),
        AsyncStorage.getItem(sentRequestsKey),
        AsyncStorage.getItem(privacyKey),
        AsyncStorage.getItem(followingKey),
      ]);

      if (friendsData) {
        setFriends(JSON.parse(friendsData));
      }
      if (requestsData) {
        setFriendRequests(JSON.parse(requestsData));
      }
      if (sentRequestsData) {
        setSentRequests(JSON.parse(sentRequestsData));
      }
      if (privacyData) {
        setPrivacySettings(JSON.parse(privacyData));
      }
      if (followingData) {
        setFollowing(JSON.parse(followingData));
      }
    } catch (error) {
      console.error('Failed to load friends data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFriendsData();
  }, [loadFriendsData]);

  const searchUserByIdOrPhone = useCallback(async (query: string): Promise<{
    userId: string;
    nickname: string;
    avatar?: string;
    phone?: string;
  } | null> => {
    try {
      const usersKey = 'all_users';
      const stored = await AsyncStorage.getItem(usersKey);
      const allUsers: {
        userId: string;
        nickname: string;
        avatar?: string;
        phone: string;
      }[] = stored ? JSON.parse(stored) : [];

      const found = allUsers.find(u => 
        u.userId.toUpperCase() === query.toUpperCase() || 
        u.phone === query
      );

      return found || null;
    } catch (error) {
      console.error('Failed to search user:', error);
      return null;
    }
  }, []);

  const sendFriendRequest = useCallback(async (toUserId: string, toUserNickname: string, toUserAvatar?: string) => {
    if (!user) {
      throw new Error('Not logged in');
    }

    if (toUserId === user.userId) {
      throw new Error('Cannot add yourself');
    }

    const existingFriend = friends.find(f => f.userId === toUserId);
    if (existingFriend) {
      throw new Error('Already friends');
    }

    const existingSent = sentRequests.find(r => r.toUserId === toUserId && r.status === 'pending');
    if (existingSent) {
      throw new Error('Request already sent');
    }

    const newRequest: FriendRequest = {
      id: `${user.userId}_${toUserId}_${Date.now()}`,
      fromUserId: user.userId,
      fromUserNickname: user.nickname || user.userId,
      fromUserAvatar: user.avatar,
      toUserId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const updatedSentRequests = [...sentRequests, newRequest];
    setSentRequests(updatedSentRequests);

    const sentRequestsKey = `sent_requests_${user.userId}`;
    await AsyncStorage.setItem(sentRequestsKey, JSON.stringify(updatedSentRequests));

    const receiverRequestsKey = `friend_requests_${toUserId}`;
    const receiverRequestsData = await AsyncStorage.getItem(receiverRequestsKey);
    const receiverRequests: FriendRequest[] = receiverRequestsData ? JSON.parse(receiverRequestsData) : [];
    receiverRequests.push(newRequest);
    await AsyncStorage.setItem(receiverRequestsKey, JSON.stringify(receiverRequests));

    return newRequest;
  }, [user, friends, sentRequests]);

  const acceptFriendRequest = useCallback(async (requestId: string) => {
    if (!user) {
      throw new Error('Not logged in');
    }

    const request = friendRequests.find(r => r.id === requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    const newFriend: Friend = {
      userId: request.fromUserId,
      nickname: request.fromUserNickname,
      avatar: request.fromUserAvatar,
      addedAt: new Date().toISOString(),
    };

    const updatedFriends = [...friends, newFriend];
    setFriends(updatedFriends);

    const updatedRequests = friendRequests.map(r =>
      r.id === requestId ? { ...r, status: 'accepted' as const } : r
    );
    setFriendRequests(updatedRequests);

    const friendsKey = `friends_${user.userId}`;
    const requestsKey = `friend_requests_${user.userId}`;
    await AsyncStorage.setItem(friendsKey, JSON.stringify(updatedFriends));
    await AsyncStorage.setItem(requestsKey, JSON.stringify(updatedRequests));

    const senderFriendsKey = `friends_${request.fromUserId}`;
    const senderFriendsData = await AsyncStorage.getItem(senderFriendsKey);
    const senderFriends: Friend[] = senderFriendsData ? JSON.parse(senderFriendsData) : [];
    senderFriends.push({
      userId: user.userId,
      nickname: user.nickname || user.userId,
      avatar: user.avatar,
      addedAt: new Date().toISOString(),
    });
    await AsyncStorage.setItem(senderFriendsKey, JSON.stringify(senderFriends));

    const senderSentRequestsKey = `sent_requests_${request.fromUserId}`;
    const senderSentRequestsData = await AsyncStorage.getItem(senderSentRequestsKey);
    const senderSentRequests: FriendRequest[] = senderSentRequestsData ? JSON.parse(senderSentRequestsData) : [];
    const updatedSenderRequests = senderSentRequests.map(r =>
      r.id === requestId ? { ...r, status: 'accepted' as const } : r
    );
    await AsyncStorage.setItem(senderSentRequestsKey, JSON.stringify(updatedSenderRequests));
  }, [user, friends, friendRequests]);

  const rejectFriendRequest = useCallback(async (requestId: string) => {
    if (!user) {
      throw new Error('Not logged in');
    }

    const request = friendRequests.find(r => r.id === requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    const updatedRequests = friendRequests.map(r =>
      r.id === requestId ? { ...r, status: 'rejected' as const } : r
    );
    setFriendRequests(updatedRequests);

    const requestsKey = `friend_requests_${user.userId}`;
    await AsyncStorage.setItem(requestsKey, JSON.stringify(updatedRequests));

    const senderSentRequestsKey = `sent_requests_${request.fromUserId}`;
    const senderSentRequestsData = await AsyncStorage.getItem(senderSentRequestsKey);
    const senderSentRequests: FriendRequest[] = senderSentRequestsData ? JSON.parse(senderSentRequestsData) : [];
    const updatedSenderRequests = senderSentRequests.map(r =>
      r.id === requestId ? { ...r, status: 'rejected' as const } : r
    );
    await AsyncStorage.setItem(senderSentRequestsKey, JSON.stringify(updatedSenderRequests));
  }, [user, friendRequests]);

  const removeFriend = useCallback(async (friendUserId: string) => {
    if (!user) {
      throw new Error('Not logged in');
    }

    const updatedFriends = friends.filter(f => f.userId !== friendUserId);
    setFriends(updatedFriends);

    const friendsKey = `friends_${user.userId}`;
    await AsyncStorage.setItem(friendsKey, JSON.stringify(updatedFriends));

    const friendFriendsKey = `friends_${friendUserId}`;
    const friendFriendsData = await AsyncStorage.getItem(friendFriendsKey);
    const friendFriends: Friend[] = friendFriendsData ? JSON.parse(friendFriendsData) : [];
    const updatedFriendFriends = friendFriends.filter(f => f.userId !== user.userId);
    await AsyncStorage.setItem(friendFriendsKey, JSON.stringify(updatedFriendFriends));
  }, [user, friends]);

  const updatePrivacySettings = useCallback(async (settings: Partial<FriendPrivacySettings>) => {
    if (!user) {
      throw new Error('Not logged in');
    }

    const updatedSettings = { ...privacySettings, ...settings };
    setPrivacySettings(updatedSettings);

    const privacyKey = `privacy_settings_${user.userId}`;
    await AsyncStorage.setItem(privacyKey, JSON.stringify(updatedSettings));
  }, [user, privacySettings]);

  const isFriend = useCallback((userId: string): boolean => {
    return friends.some(f => f.userId === userId);
  }, [friends]);

  const hasPendingRequest = useCallback((userId: string): boolean => {
    return sentRequests.some(r => r.toUserId === userId && r.status === 'pending');
  }, [sentRequests]);

  const canViewHistory = useCallback(async (targetUserId: string): Promise<boolean> => {
    if (!user) return false;
    if (user.userId === targetUserId) return true;

    const privacyKey = `privacy_settings_${targetUserId}`;
    const privacyData = await AsyncStorage.getItem(privacyKey);
    const targetSettings: FriendPrivacySettings = privacyData 
      ? JSON.parse(privacyData) 
      : { allowFriendsViewHistory: true, historyVisibility: 'friends_only', historyTimeRange: 'all' };

    if (targetSettings.historyVisibility === 'none') {
      return false;
    }

    if (targetSettings.historyVisibility === 'everyone') {
      return true;
    }

    if (targetSettings.historyVisibility === 'friends_only') {
      const isFriendUser = isFriend(targetUserId);
      return isFriendUser && targetSettings.allowFriendsViewHistory;
    }

    return false;
  }, [user, isFriend]);

  const pendingRequestsCount = friendRequests.filter(r => r.status === 'pending').length;

  // 关注用户（同时维护反向索引）
  const followUser = useCallback(async (targetUserId: string, targetNickname: string, targetAvatar?: string) => {
    if (!user) {
      throw new Error('Not logged in');
    }

    if (targetUserId === user.userId) {
      throw new Error('Cannot follow yourself');
    }

    // 检查是否已关注
    const alreadyFollowing = following.some(f => f.userId === targetUserId);
    if (alreadyFollowing) {
      throw new Error('Already following');
    }

    const now = new Date().toISOString();

    // 1. 更新我的关注列表
    const newFollowing: FollowingUser = {
      userId: targetUserId,
      nickname: targetNickname,
      avatar: targetAvatar,
      followedAt: now,
    };

    const updatedFollowing = [...following, newFollowing];
    setFollowing(updatedFollowing);

    const followingKey = `following_${user.userId}`;
    await AsyncStorage.setItem(followingKey, JSON.stringify(updatedFollowing));

    // 2. 更新对方的粉丝列表（反向索引）
    const followersKey = `followers_${targetUserId}`;
    const followersData = await AsyncStorage.getItem(followersKey);
    const currentFollowers: FollowerUser[] = followersData ? JSON.parse(followersData) : [];
    
    // 避免重复添加
    if (!currentFollowers.some(f => f.userId === user.userId)) {
      const newFollower: FollowerUser = {
        userId: user.userId,
        nickname: user.nickname || user.userId,
        avatar: user.avatar,
        followedAt: now,
      };
      currentFollowers.push(newFollower);
      await AsyncStorage.setItem(followersKey, JSON.stringify(currentFollowers));
    }

    return newFollowing;
  }, [user, following]);

  // 取消关注（同时维护反向索引）
  const unfollowUser = useCallback(async (targetUserId: string) => {
    if (!user) {
      throw new Error('Not logged in');
    }

    // 1. 更新我的关注列表
    const updatedFollowing = following.filter(f => f.userId !== targetUserId);
    setFollowing(updatedFollowing);

    const followingKey = `following_${user.userId}`;
    await AsyncStorage.setItem(followingKey, JSON.stringify(updatedFollowing));

    // 2. 从对方的粉丝列表移除（反向索引）
    const followersKey = `followers_${targetUserId}`;
    const followersData = await AsyncStorage.getItem(followersKey);
    if (followersData) {
      const currentFollowers: FollowerUser[] = JSON.parse(followersData);
      const updatedFollowers = currentFollowers.filter(f => f.userId !== user.userId);
      await AsyncStorage.setItem(followersKey, JSON.stringify(updatedFollowers));
    }
  }, [user, following]);

  // 检查是否已关注某用户
  const isFollowing = useCallback((targetUserId: string): boolean => {
    return following.some(f => f.userId === targetUserId);
  }, [following]);

  // 获取关注列表中的用户ID数组
  const followingUserIds = following.map(f => f.userId);

  // 获取用户的粉丝数（使用反向索引，O(1)复杂度）
  const getFollowersCount = useCallback(async (targetUserId: string): Promise<number> => {
    try {
      const followersKey = `followers_${targetUserId}`;
      const followersData = await AsyncStorage.getItem(followersKey);
      if (followersData) {
        const followers: FollowerUser[] = JSON.parse(followersData);
        return followers.length;
      }
      return 0;
    } catch (error) {
      console.error('Failed to get followers count:', error);
      return 0;
    }
  }, []);

  // 获取用户的粉丝列表
  const getFollowersList = useCallback(async (targetUserId: string): Promise<FollowerUser[]> => {
    try {
      const followersKey = `followers_${targetUserId}`;
      const followersData = await AsyncStorage.getItem(followersKey);
      if (followersData) {
        return JSON.parse(followersData);
      }
      return [];
    } catch (error) {
      console.error('Failed to get followers list:', error);
      return [];
    }
  }, []);

  // 获取用户的关注列表
  const getFollowingList = useCallback(async (targetUserId: string): Promise<FollowingUser[]> => {
    try {
      const followingKey = `following_${targetUserId}`;
      const followingData = await AsyncStorage.getItem(followingKey);
      if (followingData) {
        return JSON.parse(followingData);
      }
      return [];
    } catch (error) {
      console.error('Failed to get following list:', error);
      return [];
    }
  }, []);

  // 获取用户的关注数
  const getFollowingCount = useCallback(async (targetUserId: string): Promise<number> => {
    try {
      const followingKey = `following_${targetUserId}`;
      const followingData = await AsyncStorage.getItem(followingKey);
      if (followingData) {
        const userFollowing: FollowingUser[] = JSON.parse(followingData);
        return userFollowing.length;
      }
      return 0;
    } catch (error) {
      console.error('Failed to get following count:', error);
      return 0;
    }
  }, []);

  // 获取用户完整统计数据
  const getUserStats = useCallback(async (targetUserId: string): Promise<UserStats> => {
    const followersCount = await getFollowersCount(targetUserId);
    const followingCount = await getFollowingCount(targetUserId);
    
    // 获取帖子数和获赞数需要从 square_posts 中计算
    let totalLikes = 0;
    let postsCount = 0;
    
    try {
      const postsData = await AsyncStorage.getItem('square_posts');
      if (postsData) {
        const allPosts = JSON.parse(postsData);
        const userPosts = allPosts.filter((p: any) => p.userId === targetUserId);
        postsCount = userPosts.length;
        totalLikes = userPosts.reduce((sum: number, p: any) => sum + (p.likes?.length || 0), 0);
      }
    } catch (error) {
      console.error('Failed to get posts stats:', error);
    }
    
    return {
      userId: targetUserId,
      followersCount,
      followingCount,
      totalLikes,
      postsCount,
    };
  }, [getFollowersCount, getFollowingCount]);

  // 检查两个用户是否互相关注
  const isMutualFollow = useCallback(async (targetUserId: string): Promise<boolean> => {
    if (!user) return false;
    
    // 检查当前用户是否关注了目标用户
    const iAmFollowing = isFollowing(targetUserId);
    if (!iAmFollowing) return false;
    
    // 检查目标用户是否关注了当前用户
    try {
      const followingKey = `following_${targetUserId}`;
      const followingData = await AsyncStorage.getItem(followingKey);
      if (followingData) {
        const targetFollowing: FollowingUser[] = JSON.parse(followingData);
        return targetFollowing.some(f => f.userId === user.userId);
      }
    } catch (error) {
      console.error('Failed to check mutual follow:', error);
    }
    
    return false;
  }, [user, isFollowing]);

  const getFilteredHistory = useCallback(async (targetUserId: string, allHistory: any[]): Promise<any[]> => {
    const privacyKey = `privacy_settings_${targetUserId}`;
    const privacyData = await AsyncStorage.getItem(privacyKey);
    const targetSettings: FriendPrivacySettings = privacyData 
      ? JSON.parse(privacyData) 
      : { allowFriendsViewHistory: true, historyVisibility: 'friends_only', historyTimeRange: 'all' };

    const now = Date.now();
    let filteredHistory = allHistory;

    if (targetSettings.historyTimeRange === 'three_days') {
      const threeDaysAgo = now - (3 * 24 * 60 * 60 * 1000);
      filteredHistory = allHistory.filter(item => item.result.completedAt >= threeDaysAgo);
    } else if (targetSettings.historyTimeRange === 'six_months') {
      const sixMonthsAgo = now - (180 * 24 * 60 * 60 * 1000);
      filteredHistory = allHistory.filter(item => item.result.completedAt >= sixMonthsAgo);
    }

    return filteredHistory;
  }, []);

  return {
    friends,
    friendRequests: friendRequests.filter(r => r.status === 'pending'),
    sentRequests,
    following,
    followingUserIds,
    privacySettings,
    isLoading,
    pendingRequestsCount,
    searchUserByIdOrPhone,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    updatePrivacySettings,
    isFriend,
    hasPendingRequest,
    canViewHistory,
    getFilteredHistory,
    followUser,
    unfollowUser,
    isFollowing,
    // 新增粉丝数统计方法
    getFollowersCount,
    getFollowingCount,
    getFollowersList,
    getFollowingList,
    getUserStats,
    isMutualFollow,
  };
});
