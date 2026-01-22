import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

// 通知类型
export type NotificationType = 'follow' | 'like' | 'comment' | 'new_post' | 'system';

// 通知数据结构
export interface Notification {
  id: string;
  type: NotificationType;
  fromUserId: string;
  fromNickname: string;
  fromAvatar?: string;
  targetId?: string;        // 帖子ID（点赞/评论时）
  targetPreview?: string;   // 内容预览（评论内容/帖子描述）
  message: string;
  isRead: boolean;
  createdAt: number;
}

const getStorageKey = (userId: string) => `notifications_${userId}`;

export const [NotificationContext, useNotifications] = createContextHook(() => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 加载通知
  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    try {
      const key = getStorageKey(user.userId);
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        // 按时间倒序排列
        setNotifications(parsed.sort((a: Notification, b: Notification) => b.createdAt - a.createdAt));
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // 添加通知（供其他模块调用）
  const addNotification = useCallback(async (
    targetUserId: string,
    notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>
  ) => {
    try {
      const key = getStorageKey(targetUserId);
      const data = await AsyncStorage.getItem(key);
      const currentNotifications: Notification[] = data ? JSON.parse(data) : [];

      const newNotification: Notification = {
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        isRead: false,
        createdAt: Date.now(),
      };

      // 添加到列表开头
      const updated = [newNotification, ...currentNotifications];
      
      // 最多保留100条通知
      const trimmed = updated.slice(0, 100);
      
      await AsyncStorage.setItem(key, JSON.stringify(trimmed));

      // 如果是当前用户，更新状态
      if (user && targetUserId === user.userId) {
        setNotifications(trimmed);
      }

      return newNotification;
    } catch (error) {
      console.error('Failed to add notification:', error);
      return null;
    }
  }, [user]);

  // 发送关注通知
  const sendFollowNotification = useCallback(async (
    targetUserId: string,
    fromUser: { userId: string; nickname: string; avatar?: string }
  ) => {
    return addNotification(targetUserId, {
      type: 'follow',
      fromUserId: fromUser.userId,
      fromNickname: fromUser.nickname,
      fromAvatar: fromUser.avatar,
      message: `关注了你`,
    });
  }, [addNotification]);

  // 发送点赞通知
  const sendLikeNotification = useCallback(async (
    targetUserId: string,
    fromUser: { userId: string; nickname: string; avatar?: string },
    postId: string,
    postPreview?: string
  ) => {
    // 不给自己发通知
    if (targetUserId === fromUser.userId) return null;
    
    return addNotification(targetUserId, {
      type: 'like',
      fromUserId: fromUser.userId,
      fromNickname: fromUser.nickname,
      fromAvatar: fromUser.avatar,
      targetId: postId,
      targetPreview: postPreview,
      message: `赞了你的作品`,
    });
  }, [addNotification]);

  // 发送评论通知
  const sendCommentNotification = useCallback(async (
    targetUserId: string,
    fromUser: { userId: string; nickname: string; avatar?: string },
    postId: string,
    commentContent: string
  ) => {
    // 不给自己发通知
    if (targetUserId === fromUser.userId) return null;
    
    return addNotification(targetUserId, {
      type: 'comment',
      fromUserId: fromUser.userId,
      fromNickname: fromUser.nickname,
      fromAvatar: fromUser.avatar,
      targetId: postId,
      targetPreview: commentContent.slice(0, 50),
      message: `评论了你的作品`,
    });
  }, [addNotification]);

  // 发送新帖子通知（关注的人发帖）
  const sendNewPostNotification = useCallback(async (
    targetUserId: string,
    fromUser: { userId: string; nickname: string; avatar?: string },
    postId: string,
    postPreview?: string
  ) => {
    return addNotification(targetUserId, {
      type: 'new_post',
      fromUserId: fromUser.userId,
      fromNickname: fromUser.nickname,
      fromAvatar: fromUser.avatar,
      targetId: postId,
      targetPreview: postPreview,
      message: `发布了新作品`,
    });
  }, [addNotification]);

  // 标记单条通知为已读
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    const updated = notifications.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    setNotifications(updated);

    const key = getStorageKey(user.userId);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
  }, [user, notifications]);

  // 标记所有通知为已读
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    const updated = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updated);

    const key = getStorageKey(user.userId);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
  }, [user, notifications]);

  // 删除通知
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return;

    const updated = notifications.filter(n => n.id !== notificationId);
    setNotifications(updated);

    const key = getStorageKey(user.userId);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
  }, [user, notifications]);

  // 清空所有通知
  const clearAllNotifications = useCallback(async () => {
    if (!user) return;

    setNotifications([]);
    const key = getStorageKey(user.userId);
    await AsyncStorage.removeItem(key);
  }, [user]);

  // 未读通知数量
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // 刷新通知
  const refreshNotifications = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  return {
    notifications,
    isLoading,
    unreadCount,
    addNotification,
    sendFollowNotification,
    sendLikeNotification,
    sendCommentNotification,
    sendNewPostNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refreshNotifications,
  };
});
