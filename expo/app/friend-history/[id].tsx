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
import { Shield, AlertCircle, ArrowLeft } from 'lucide-react-native';
import { useFriends } from '@/contexts/FriendsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VerificationHistory } from '@/types/verification';

export default function FriendHistoryScreen() {
  const { id: friendUserId } = useLocalSearchParams();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isFriend, canViewHistory } = useFriends();
  const [friendInfo, setFriendInfo] = useState<{
    userId: string;
    nickname: string;
    avatar?: string;
  } | null>(null);
  const [records, setRecords] = useState<VerificationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canView, setCanView] = useState(false);

  const loadFriendHistory = useCallback(async () => {
    if (!user || !friendUserId || typeof friendUserId !== 'string') {
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

      const friend = allUsers.find(u => u.userId === friendUserId);
      if (friend) {
        setFriendInfo({
          userId: friend.userId,
          nickname: friend.nickname,
          avatar: friend.avatar,
        });
      }

      const isUserFriend = isFriend(friendUserId);
      if (!isUserFriend) {
        setCanView(false);
        setIsLoading(false);
        return;
      }

      const hasPermission = await canViewHistory(friendUserId);
      setCanView(hasPermission);

      if (hasPermission) {
        const historyKey = `verification_history_${friendUserId}`;
        const historyData = await AsyncStorage.getItem(historyKey);
        if (historyData) {
          const history: VerificationHistory[] = JSON.parse(historyData);
          setRecords(history.sort((a, b) => b.result.completedAt - a.result.completedAt));
        }
      }
    } catch (error) {
      console.error('Failed to load friend history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, friendUserId, isFriend, canViewHistory]);

  useEffect(() => {
    loadFriendHistory();
  }, [loadFriendHistory]);

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

  if (!isFriend(friendUserId as string)) {
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
          <Text style={styles.emptyText}>{t('friends.loginRequired')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!canView) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen 
          options={{ 
            title: friendInfo ? friendInfo.nickname : t('friends.viewHistory'),
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
          title: friendInfo ? friendInfo.nickname : t('friends.viewHistory'),
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
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Shield size={64} color="#ccc" />
          <Text style={styles.emptyText}>{t('friends.noHistoryYet')}</Text>
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
