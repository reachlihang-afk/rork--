import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import { Friend, FriendRequest, FriendPrivacySettings } from '@/types/friends';
import { useAuth } from './AuthContext';

export const [FriendsContext, useFriends] = createContextHook(() => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
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
      setIsLoading(false);
      return;
    }

    try {
      const friendsKey = `friends_${user.userId}`;
      const requestsKey = `friend_requests_${user.userId}`;
      const sentRequestsKey = `sent_requests_${user.userId}`;
      const privacyKey = `privacy_settings_${user.userId}`;

      const [friendsData, requestsData, sentRequestsData, privacyData] = await Promise.all([
        AsyncStorage.getItem(friendsKey),
        AsyncStorage.getItem(requestsKey),
        AsyncStorage.getItem(sentRequestsKey),
        AsyncStorage.getItem(privacyKey),
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
  };
});
