import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Search, Users, UserPlus, UserCheck, Clock } from 'lucide-react-native';
import { useFriends } from '@/contexts/FriendsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AddFriendScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { searchUserByIdOrPhone, sendFriendRequest, isFriend, hasPendingRequest } = useFriends();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{
    userId: string;
    nickname: string;
    avatar?: string;
    phone?: string;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert(t('common.tip'), t('friends.enterSearchQuery'));
      return;
    }

    Keyboard.dismiss();
    setIsSearching(true);
    setSearched(false);

    try {
      const result = await searchUserByIdOrPhone(searchQuery.trim());
      setSearchResult(result);
      setSearched(true);
    } catch {
      Alert.alert(t('common.error'), t('friends.searchFailed'));
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!searchResult) return;

    try {
      await sendFriendRequest(
        searchResult.userId,
        searchResult.nickname,
        searchResult.avatar
      );
      Alert.alert(t('common.success'), t('friends.requestSent'));
      setSearchQuery('');
      setSearchResult(null);
      setSearched(false);
    } catch (error: any) {
      if (error.message === 'Cannot add yourself') {
        Alert.alert(t('common.tip'), t('friends.cannotAddYourself'));
      } else if (error.message === 'Already friends') {
        Alert.alert(t('common.tip'), t('friends.alreadyFriends'));
      } else if (error.message === 'Request already sent') {
        Alert.alert(t('common.tip'), t('friends.requestAlreadySent'));
      } else {
        Alert.alert(t('common.error'), t('friends.sendRequestFailed'));
      }
    }
  };

  const getButtonStatus = () => {
    if (!searchResult) return null;
    if (searchResult.userId === user?.userId) return 'self';
    if (isFriend(searchResult.userId)) return 'friend';
    if (hasPendingRequest(searchResult.userId)) return 'pending';
    return 'add';
  };

  const renderActionButton = () => {
    const status = getButtonStatus();

    if (!status) return null;

    if (status === 'self') {
      return (
        <View style={[styles.actionButton, styles.disabledButton]}>
          <Text style={styles.disabledButtonText}>{t('friends.yourself')}</Text>
        </View>
      );
    }

    if (status === 'friend') {
      return (
        <View style={[styles.actionButton, styles.friendButton]}>
          <UserCheck size={20} color="#4CAF50" />
          <Text style={styles.friendButtonText}>{t('friends.alreadyFriend')}</Text>
        </View>
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: t('friends.addFriend'),
          headerStyle: { backgroundColor: '#fff' },
        }}
      />

      <View style={styles.content}>
        <View style={styles.searchSection}>
          <Text style={styles.hint}>{t('friends.searchHint')}</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={t('friends.searchPlaceholder')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Search size={24} color="#007AFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {searched && !searchResult && (
          <View style={styles.resultContainer}>
            <Users size={64} color="#ccc" />
            <Text style={styles.notFoundText}>{t('friends.userNotFound')}</Text>
            <Text style={styles.notFoundSubtext}>{t('friends.checkSearchQuery')}</Text>
          </View>
        )}

        {searchResult && (
          <View style={styles.resultContainer}>
            <View style={styles.userCard}>
              {searchResult.avatar ? (
                <Image source={{ uri: searchResult.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Users size={32} color="#666" />
                </View>
              )}
              <View style={styles.userInfo}>
                <Text style={styles.nickname}>{searchResult.nickname}</Text>
                <Text style={styles.userId}>{searchResult.userId}</Text>
              </View>
            </View>
            {renderActionButton()}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  searchSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  hint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  searchButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  notFoundText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  notFoundSubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
  userCard: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    alignItems: 'center',
  },
  nickname: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userId: {
    fontSize: 16,
    color: '#999',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    minWidth: 150,
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
  disabledButton: {
    backgroundColor: '#f0f0f0',
  },
  disabledButtonText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
  },
});
