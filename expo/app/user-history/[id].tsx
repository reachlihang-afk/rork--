import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Shield, AlertCircle, UserPlus, UserCheck, Clock, Users, ArrowLeft } from 'lucide-react-native';
import { useFriends } from '@/contexts/FriendsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VerificationHistory } from '@/types/verification';

export default function UserHistoryScreen() {
  const { id: targetUserId } = useLocalSearchParams();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isFriend, canViewHistory, getFilteredHistory, sendFriendRequest, hasPendingRequest } = useFriends();
  const [targetUser, setTargetUser] = useState<{
    userId: string;
    nickname: string;
    avatar?: string;
  } | null>(null);
  const [records, setRecords] = useState<VerificationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canView, setCanView] = useState(false);

  const loadUserHistory = useCallback(async () => {
    if (!user || !targetUserId || typeof targetUserId !== 'string') {
      setIsLoading(false);
      return;
    }

    try {
      const usersKey = 'all_users';
      const stored = await AsyncStorage.getItem(usersKey);
      const allUsers: {
        userId: string;
        nickname: string;
        avatar?: string;
        phone: string;
      }[] = stored ? JSON.parse(stored) : [];

      const foundUser = allUsers.find(u => u.userId === targetUserId);
      if (foundUser) {
        setTargetUser({
          userId: foundUser.userId,
          nickname: foundUser.nickname,
          avatar: foundUser.avatar,
        });
      }

      const hasPermission = await canViewHistory(targetUserId);
      setCanView(hasPermission);

      if (hasPermission) {
        const historyKey = `verification_history_${targetUserId}`;
        const historyData = await AsyncStorage.getItem(historyKey);
        if (historyData) {
          const history: VerificationHistory[] = JSON.parse(historyData);
          const filtered = await getFilteredHistory(targetUserId, history);
          setRecords(filtered.sort((a, b) => b.result.completedAt - a.result.completedAt));
        }
      }
    } catch (error) {
      console.error('Failed to load user history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, targetUserId, canViewHistory, getFilteredHistory]);

  useEffect(() => {
    loadUserHistory();
  }, [loadUserHistory]);

  const handleSendRequest = async () => {
    if (!targetUser) return;

    try {
      await sendFriendRequest(
        targetUser.userId,
        targetUser.nickname,
        targetUser.avatar
      );
      loadUserHistory();
    } catch (error: any) {
      console.log('Send friend request error:', error.message);
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'authentic': return '#10B981';
      case 'slightly-edited': return '#3B82F6';
      case 'heavily-edited': return '#F59E0B';
      case 'suspicious': return '#EF4444';
      default: return '#64748B';
    }
  };

  const getVerdictText = (verdict: string) => {
    switch (verdict) {
      case 'authentic': return t('verdict.authenticShort');
      case 'slightly-edited': return t('verdict.slightlyEditedShort');
      case 'heavily-edited': return t('verdict.heavilyEditedShort');
      case 'suspicious': return t('verdict.suspiciousShort');
      default: return verdict;
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderRecord = ({ item }: { item: VerificationHistory }) => (
    <TouchableOpacity
      style={styles.recordCard}
      onPress={() => router.push(`/result/${item.result.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.recordImages}>
        <Image source={{ uri: item.request.referencePhotos[0]?.uri }} style={styles.thumbnail} />
        <Image source={{ uri: item.request.editedPhotoUri }} style={styles.thumbnail} />
      </View>
      <View style={styles.recordInfo}>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>{t('result.credibilityScore')}</Text>
          <Text style={[styles.scoreValue, { color: getVerdictColor(item.result.verdict) }]}>
            {item.result.credibilityScore.toFixed(1)}
          </Text>
        </View>
        <View style={styles.verdictRow}>
          <View style={[styles.verdictBadge, { backgroundColor: getVerdictColor(item.result.verdict) + '20' }]}>
            <Text style={[styles.verdictText, { color: getVerdictColor(item.result.verdict) }]}>
              {getVerdictText(item.result.verdict)}
            </Text>
          </View>
          <Text style={styles.timestamp}>{formatDate(item.result.completedAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => {
    if (!targetUser) return null;

    const isUserFriend = isFriend(targetUser.userId);
    const isPending = hasPendingRequest(targetUser.userId);

    return (
      <View style={styles.headerCard}>
        <View style={styles.userInfoSection}>
          {targetUser.avatar ? (
            <Image source={{ uri: targetUser.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Users size={32} color="#666" />
            </View>
          )}
          <View style={styles.userTextInfo}>
            <Text style={styles.nickname}>{targetUser.nickname}</Text>
            <Text style={styles.userId}>{targetUser.userId}</Text>
          </View>
        </View>

        {targetUser.userId !== user?.userId && (
          <View style={styles.actionSection}>
            {!isUserFriend && !isPending && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleSendRequest}
              >
                <UserPlus size={18} color="#fff" />
                <Text style={styles.addButtonText}>{t('friends.addFriend')}</Text>
              </TouchableOpacity>
            )}
            {isPending && (
              <View style={styles.pendingButton}>
                <Clock size={18} color="#FF9800" />
                <Text style={styles.pendingButtonText}>{t('friends.pending')}</Text>
              </View>
            )}
            {isUserFriend && (
              <View style={styles.friendButton}>
                <UserCheck size={18} color="#4CAF50" />
                <Text style={styles.friendButtonText}>{t('friends.alreadyFriend')}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen 
          options={{ 
            title: t('friends.viewHistory'),
            headerStyle: { backgroundColor: '#fff' },
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ marginLeft: -8, padding: 8 }}
              >
                <ArrowLeft size={24} color="#1a1a1a" />
              </TouchableOpacity>
            ),
          }} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!targetUser) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen 
          options={{ 
            title: t('friends.viewHistory'),
            headerStyle: { backgroundColor: '#fff' },
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ marginLeft: -8, padding: 8 }}
              >
                <ArrowLeft size={24} color="#1a1a1a" />
              </TouchableOpacity>
            ),
          }} 
        />
        <View style={styles.emptyContainer}>
          <AlertCircle size={64} color="#ccc" />
          <Text style={styles.emptyText}>{t('friends.userNotFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!canView) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen 
          options={{ 
            title: targetUser.nickname,
            headerStyle: { backgroundColor: '#fff' },
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ marginLeft: -8, padding: 8 }}
              >
                <ArrowLeft size={24} color="#1a1a1a" />
              </TouchableOpacity>
            ),
          }} 
        />
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <Shield size={64} color="#ccc" />
          <Text style={styles.emptyText}>{t('friends.historyNotAllowed')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{ 
          title: targetUser.nickname,
          headerStyle: { backgroundColor: '#fff' },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: -8, padding: 8 }}
            >
              <ArrowLeft size={24} color="#1a1a1a" />
            </TouchableOpacity>
          ),
        }} 
      />
      {records.length > 0 ? (
        <FlatList
          data={records}
          renderItem={renderRecord}
          keyExtractor={(item) => item.result.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.fullContainer}>
          {renderHeader()}
          <View style={styles.emptyContainer}>
            <Shield size={64} color="#ccc" />
            <Text style={styles.emptyText}>{t('friends.noHistoryYet')}</Text>
          </View>
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
  fullContainer: {
    flex: 1,
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
  listContent: {
    padding: 16,
    gap: 12,
  },
  headerCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userTextInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userId: {
    fontSize: 14,
    color: '#999',
  },
  actionSection: {
    marginTop: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  friendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  friendButtonText: {
    color: '#4CAF50',
    fontSize: 15,
    fontWeight: '600',
  },
  pendingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF9800',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  pendingButtonText: {
    color: '#FF9800',
    fontSize: 15,
    fontWeight: '600',
  },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recordImages: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  thumbnail: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  recordInfo: {
    gap: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  verdictRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verdictBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verdictText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
});
