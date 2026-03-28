import React, { useCallback } from 'react';
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
import { Stack, router } from 'expo-router';
import { ArrowLeft, User, Heart, MessageCircle, UserPlus, Image as ImageIcon, Check, Trash2 } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications, Notification, NotificationType } from '@/contexts/NotificationContext';
import { useAlert } from '@/contexts/AlertContext';
import { useTranslation } from 'react-i18next';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { 
    notifications, 
    isLoading, 
    unreadCount,
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    refreshNotifications,
  } = useNotifications();
  const { showAlert } = useAlert();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  }, [refreshNotifications]);

  // 获取通知图标
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'follow':
        return <UserPlus size={20} color="#3B82F6" />;
      case 'like':
        return <Heart size={20} color="#EF4444" fill="#EF4444" />;
      case 'comment':
        return <MessageCircle size={20} color="#10B981" />;
      case 'new_post':
        return <ImageIcon size={20} color="#8B5CF6" />;
      default:
        return <User size={20} color="#6B7280" />;
    }
  };

  // 获取通知背景色
  const getNotificationBgColor = (type: NotificationType) => {
    switch (type) {
      case 'follow':
        return '#EFF6FF';
      case 'like':
        return '#FEF2F2';
      case 'comment':
        return '#ECFDF5';
      case 'new_post':
        return '#F5F3FF';
      default:
        return '#F3F4F6';
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('square.justNow');
    if (minutes < 60) return t('square.minutesAgo', { count: minutes });
    if (hours < 24) return t('square.hoursAgo', { count: hours });
    return t('square.daysAgo', { count: days });
  };

  // 处理通知点击
  const handleNotificationPress = async (notification: Notification) => {
    // 标记为已读
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // 根据类型跳转
    switch (notification.type) {
      case 'follow':
        router.push(`/user-profile/${notification.fromUserId}` as any);
        break;
      case 'like':
      case 'comment':
      case 'new_post':
        if (notification.targetId) {
          router.push(`/(tabs)/square?highlightPostId=${notification.targetId}` as any);
        }
        break;
    }
  };

  // 删除通知
  const handleDeleteNotification = (notificationId: string) => {
    showAlert({
      type: 'confirm',
      title: t('common.tip'),
      message: t('notifications.deleteConfirm'),
      onConfirm: async () => {
        await deleteNotification(notificationId);
      },
    });
  };

  // 渲染通知项
  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.isRead && styles.notificationItemUnread,
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      {/* 左侧图标 */}
      <View style={[styles.iconContainer, { backgroundColor: getNotificationBgColor(item.type) }]}>
        {getNotificationIcon(item.type)}
      </View>

      {/* 头像 */}
      <TouchableOpacity
        onPress={() => router.push(`/user-profile/${item.fromUserId}` as any)}
      >
        {item.fromAvatar ? (
          <Image source={{ uri: item.fromAvatar }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <User size={18} color="#9ca3af" />
          </View>
        )}
      </TouchableOpacity>

      {/* 内容 */}
      <View style={styles.contentContainer}>
        <Text style={styles.contentText} numberOfLines={2}>
          <Text style={styles.nickname}>{item.fromNickname}</Text>
          <Text style={styles.message}> {item.message}</Text>
        </Text>
        {item.targetPreview && (
          <Text style={styles.preview} numberOfLines={1}>
            "{item.targetPreview}"
          </Text>
        )}
        <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
      </View>

      {/* 未读指示点 */}
      {!item.isRead && <View style={styles.unreadDot} />}

      {/* 删除按钮 */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteNotification(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Trash2 size={16} color="#9CA3AF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // 空状态
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyTitle}>{t('notifications.noNotifications')}</Text>
      <Text style={styles.emptyText}>{t('notifications.noNotificationsDesc')}</Text>
    </View>
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#1a1a1a" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔐</Text>
          <Text style={styles.emptyText}>{t('common.pleaseLogin')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#1a1a1a" strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity
            onPress={markAllAsRead}
            style={styles.markAllButton}
          >
            <Check size={20} color="#3B82F6" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerPlaceholder} />
        )}
      </View>

      {/* 通知列表 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a1a1a" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerPlaceholder: {
    width: 44,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  markAllButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  notificationItemUnread: {
    backgroundColor: '#FEFCE8',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  contentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  nickname: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  message: {
    color: '#4B5563',
  },
  preview: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
});
