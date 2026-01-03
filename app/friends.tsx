import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Users, UserPlus, Clock, Check, X, Trash2 } from 'lucide-react-native';
import { useFriends } from '@/contexts/FriendsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Friend, FriendRequest } from '@/types/friends';

export default function FriendsScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const {
    friends,
    friendRequests,
    isLoading,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
  } = useFriends();
  const [selectedTab, setSelectedTab] = useState<'friends' | 'requests'>('friends');

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen options={{ title: t('friends.title') }} />
        <View style={styles.emptyContainer}>
          <Users size={64} color="#ccc" />
          <Text style={styles.emptyText}>{t('friends.loginRequired')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      Alert.alert(t('common.success'), t('friends.requestAccepted'));
    } catch {
      Alert.alert(t('common.error'), t('friends.acceptFailed'));
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId);
    } catch {
      Alert.alert(t('common.error'), t('friends.rejectFailed'));
    }
  };

  const handleRemoveFriend = (friendUserId: string, friendNickname: string) => {
    Alert.alert(
      t('friends.removeFriend'),
      t('friends.removeFriendConfirm', { name: friendNickname }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(friendUserId);
              Alert.alert(t('common.success'), t('friends.friendRemoved'));
            } catch {
              Alert.alert(t('common.error'), t('friends.removeFailed'));
            }
          },
        },
      ]
    );
  };

  const handleViewHistory = (friendUserId: string) => {
    router.push(`/friend-history/${friendUserId}` as any);
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <TouchableOpacity
      style={styles.friendCard}
      onPress={() => handleViewHistory(item.userId)}
      activeOpacity={0.7}
    >
      <View style={styles.friendInfo}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Users size={24} color="#666" />
          </View>
        )}
        <View style={styles.friendDetails}>
          <Text style={styles.friendNickname}>{item.nickname}</Text>
          <Text style={styles.friendUserId}>{item.userId}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => handleRemoveFriend(item.userId, item.nickname)}
        style={styles.removeButton}
      >
        <Trash2 size={20} color="#ff4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderRequest = ({ item }: { item: FriendRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestInfo}>
        {item.fromUserAvatar ? (
          <Image source={{ uri: item.fromUserAvatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Users size={24} color="#666" />
          </View>
        )}
        <View style={styles.requestDetails}>
          <Text style={styles.requestNickname}>{item.fromUserNickname}</Text>
          <Text style={styles.requestUserId}>{item.fromUserId}</Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAcceptRequest(item.id)}
        >
          <Check size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleRejectRequest(item.id)}
        >
          <X size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{ 
          title: t('friends.title'),
          headerStyle: { backgroundColor: '#fff' },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/add-friend' as any)}
              style={styles.addButton}
            >
              <UserPlus size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }} 
      />

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'friends' && styles.activeTab]}
          onPress={() => setSelectedTab('friends')}
        >
          <Users size={20} color={selectedTab === 'friends' ? '#007AFF' : '#666'} />
          <Text style={[styles.tabText, selectedTab === 'friends' && styles.activeTabText]}>
            {t('friends.myFriends')} ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'requests' && styles.activeTab]}
          onPress={() => setSelectedTab('requests')}
        >
          <Clock size={20} color={selectedTab === 'requests' ? '#007AFF' : '#666'} />
          <Text style={[styles.tabText, selectedTab === 'requests' && styles.activeTabText]}>
            {t('friends.requests')} ({friendRequests.length})
          </Text>
          {friendRequests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{friendRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : selectedTab === 'friends' ? (
        friends.length > 0 ? (
          <FlatList
            data={friends}
            renderItem={renderFriend}
            keyExtractor={(item) => item.userId}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Users size={64} color="#ccc" />
            <Text style={styles.emptyText}>{t('friends.noFriends')}</Text>
            <Text style={styles.emptySubtext}>{t('friends.addFriendsHint')}</Text>
          </View>
        )
      ) : friendRequests.length > 0 ? (
        <FlatList
          data={friendRequests}
          renderItem={renderRequest}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Clock size={64} color="#ccc" />
          <Text style={styles.emptyText}>{t('friends.noRequests')}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  addButton: {
    marginRight: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  friendInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendDetails: {
    flex: 1,
  },
  friendNickname: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  friendUserId: {
    fontSize: 14,
    color: '#999',
  },
  removeButton: {
    padding: 8,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  requestInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestDetails: {
    flex: 1,
  },
  requestNickname: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  requestUserId: {
    fontSize: 14,
    color: '#999',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#ff4444',
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
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
