import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Users, UserPlus, UserCheck, Clock, Shield } from 'lucide-react-native';
import { useFriends } from '@/contexts/FriendsContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UserProfileScreen() {
  const { id: userId } = useLocalSearchParams();
  const { t } = useLanguage();
  const { sendFriendRequest, isFriend, hasPendingRequest } = useFriends();
  const [profileUser, setProfileUser] = useState<{
    userId: string;
    nickname: string;
    avatar?: string;
    phone?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserProfile = useCallback(async () => {
    try {
      const usersKey = 'all_users';
      const stored = await AsyncStorage.getItem(usersKey);
      const allUsers: {
        userId: string;
        nickname: string;
        avatar?: string;
        phone: string;
      }[] = stored ? JSON.parse(stored) : [];

      const foundUser = allUsers.find(u => u.userId === userId);
      setProfileUser(foundUser || null);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const handleSendRequest = async () => {
    if (!profileUser) return;

    try {
      await sendFriendRequest(
        profileUser.userId,
        profileUser.nickname,
        profileUser.avatar
      );
      Alert.alert(t('common.success'), t('friends.requestSent'));
    } catch (error: any) {
      if (error.message === 'Already friends') {
        Alert.alert(t('common.tip'), t('friends.alreadyFriends'));
      } else if (error.message === 'Request already sent') {
        Alert.alert(t('common.tip'), t('friends.requestAlreadySent'));
      } else {
        Alert.alert(t('common.error'), t('friends.sendRequestFailed'));
      }
    }
  };

  const handleViewHistory = () => {
    if (!profileUser) return;
    router.push(`/friend-history/${profileUser.userId}` as any);
  };

  const getButtonStatus = () => {
    if (!profileUser) return null;
    if (isFriend(profileUser.userId)) return 'friend';
    if (hasPendingRequest(profileUser.userId)) return 'pending';
    return 'add';
  };

  const renderActionButton = () => {
    const status = getButtonStatus();

    if (!status) return null;

    if (status === 'friend') {
      return (
        <>
          <View style={[styles.actionButton, styles.friendButton]}>
            <UserCheck size={20} color="#4CAF50" />
            <Text style={styles.friendButtonText}>{t('friends.alreadyFriend')}</Text>
          </View>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewHistoryButton]}
            onPress={handleViewHistory}
          >
            <Shield size={20} color="#007AFF" />
            <Text style={styles.viewHistoryButtonText}>{t('friends.viewHistory')}</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (status === 'pending') {
      return (
        <View style={[styles.actionButton, styles.pendingButton]}>
          <Clock size={20} color="#FF9800" />
          <Text style={styles.pendingButtonText}>{t('friends.pending')}</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.actionButton, styles.addButton]}
        onPress={handleSendRequest}
      >
        <UserPlus size={20} color="#fff" />
        <Text style={styles.addButtonText}>{t('friends.addFriend')}</Text>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen options={{ title: t('friends.userProfile') }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!profileUser) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen options={{ title: t('friends.userProfile') }} />
        <View style={styles.emptyContainer}>
          <Users size={64} color="#ccc" />
          <Text style={styles.emptyText}>{t('friends.userNotFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{ 
          title: t('friends.userProfile'),
          headerStyle: { backgroundColor: '#fff' },
        }} 
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          {profileUser.avatar ? (
            <Image source={{ uri: profileUser.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Users size={48} color="#666" />
            </View>
          )}
          <Text style={styles.nickname}>{profileUser.nickname}</Text>
          <Text style={styles.userId}>{profileUser.userId}</Text>
        </View>

        <View style={styles.actionsContainer}>
          {renderActionButton()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  content: {
    padding: 24,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nickname: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  userId: {
    fontSize: 16,
    color: '#999',
  },
  actionsContainer: {
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addButton: {
    backgroundColor: '#007AFF',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  friendButton: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  friendButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  pendingButton: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  pendingButtonText: {
    color: '#FF9800',
    fontSize: 16,
    fontWeight: '600',
  },
  viewHistoryButton: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  viewHistoryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
