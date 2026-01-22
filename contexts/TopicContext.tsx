import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

export interface Topic {
  id: string;
  name: string;                  // 话题名称（不含#）
  nameWithHash: string;          // 带#的显示名
  description?: string;          // 话题描述
  category: 'style' | 'scene' | 'challenge' | 'seasonal' | 'event' | 'other';
  postsCount: number;            // 参与作品数
  participantsCount: number;     // 参与人数
  viewsCount: number;            // 浏览次数
  followersCount: number;        // 关注人数
  isOfficial: boolean;           // 是否官方话题
  isHot: boolean;                // 是否热门
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEYS = {
  TOPICS: 'topics_all',
  USER_FOLLOWED_TOPICS: 'user_followed_topics_',
};

// 预设官方话题
const OFFICIAL_TOPICS: Omit<Topic, 'id' | 'postsCount' | 'participantsCount' | 'viewsCount' | 'followersCount' | 'createdAt' | 'updatedAt'>[] = [
  { name: '职场通勤', nameWithHash: '#职场通勤', category: 'scene', isOfficial: true, isHot: true, description: '职场穿搭灵感聚集地' },
  { name: '约会穿搭', nameWithHash: '#约会穿搭', category: 'scene', isOfficial: true, isHot: true, description: '浪漫约会造型分享' },
  { name: '优雅淑女', nameWithHash: '#优雅淑女', category: 'style', isOfficial: true, isHot: true, description: '温柔优雅的女性魅力' },
  { name: '酷飒女孩', nameWithHash: '#酷飒女孩', category: 'style', isOfficial: true, isHot: true, description: '个性帅气的酷女孩风' },
  { name: '休闲日常', nameWithHash: '#休闲日常', category: 'scene', isOfficial: true, isHot: false, description: '舒适随性的日常穿搭' },
  { name: '复古港风', nameWithHash: '#复古港风', category: 'style', isOfficial: true, isHot: true, description: '80-90年代经典港风' },
  { name: '夏日清新', nameWithHash: '#夏日清新', category: 'seasonal', isOfficial: true, isHot: true, description: '清爽夏日穿搭灵感' },
  { name: '反差萌挑战', nameWithHash: '#反差萌挑战', category: 'challenge', isOfficial: true, isHot: true, description: '一张脸，两种人生' },
  { name: '一周七套Look', nameWithHash: '#一周七套Look', category: 'challenge', isOfficial: true, isHot: false, description: '一周不重样穿搭挑战' },
  { name: '时尚街拍', nameWithHash: '#时尚街拍', category: 'other', isOfficial: true, isHot: false, description: '街头时尚摄影分享' },
];

export const [TopicProvider, useTopic] = createContextHook(() => {
  const { user } = useAuth();
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [followedTopics, setFollowedTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化话题
  useEffect(() => {
    initializeTopics();
    if (user) {
      loadFollowedTopics();
    }
  }, [user]);

  const initializeTopics = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TOPICS);
      if (stored) {
        setAllTopics(JSON.parse(stored));
      } else {
        // 首次初始化：创建官方话题
        const initialTopics: Topic[] = OFFICIAL_TOPICS.map((t, index) => ({
          ...t,
          id: `topic_${index + 1}`,
          postsCount: 0,
          participantsCount: 0,
          viewsCount: 0,
          followersCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }));
        setAllTopics(initialTopics);
        await AsyncStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(initialTopics));
      }
    } catch (error) {
      console.error('Failed to initialize topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFollowedTopics = async () => {
    if (!user) return;
    try {
      const key = `${STORAGE_KEYS.USER_FOLLOWED_TOPICS}${user.userId}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        setFollowedTopics(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load followed topics:', error);
    }
  };

  const getTopic = useCallback((id: string) => {
    return allTopics.find(t => t.id === id);
  }, [allTopics]);

  const getTopicByName = useCallback((name: string) => {
    const cleanName = name.replace('#', '');
    return allTopics.find(t => t.name === cleanName);
  }, [allTopics]);

  const createTopic = useCallback(async (name: string, category: Topic['category'] = 'other'): Promise<Topic> => {
    const cleanName = name.replace('#', '').trim();
    if (!cleanName) {
      throw new Error('话题名称不能为空');
    }

    const existing = getTopicByName(cleanName);
    if (existing) return existing;

    const newTopic: Topic = {
      id: `topic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: cleanName,
      nameWithHash: `#${cleanName}`,
      category,
      postsCount: 0,
      participantsCount: 0,
      viewsCount: 0,
      followersCount: 0,
      isOfficial: false,
      isHot: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updated = [...allTopics, newTopic];
    setAllTopics(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(updated));
    
    return newTopic;
  }, [allTopics, getTopicByName]);

  const followTopic = useCallback(async (topicId: string) => {
    if (!user) return;
    if (followedTopics.includes(topicId)) return;

    const updated = [...followedTopics, topicId];
    setFollowedTopics(updated);
    
    const key = `${STORAGE_KEYS.USER_FOLLOWED_TOPICS}${user.userId}`;
    await AsyncStorage.setItem(key, JSON.stringify(updated));

    // 更新话题关注数
    const topicIndex = allTopics.findIndex(t => t.id === topicId);
    if (topicIndex !== -1) {
      const updatedTopics = [...allTopics];
      updatedTopics[topicIndex] = {
        ...updatedTopics[topicIndex],
        followersCount: updatedTopics[topicIndex].followersCount + 1,
      };
      setAllTopics(updatedTopics);
      await AsyncStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(updatedTopics));
    }
  }, [user, followedTopics, allTopics]);

  const unfollowTopic = useCallback(async (topicId: string) => {
    if (!user) return;
    
    const updated = followedTopics.filter(id => id !== topicId);
    setFollowedTopics(updated);
    
    const key = `${STORAGE_KEYS.USER_FOLLOWED_TOPICS}${user.userId}`;
    await AsyncStorage.setItem(key, JSON.stringify(updated));

    // 更新话题关注数
    const topicIndex = allTopics.findIndex(t => t.id === topicId);
    if (topicIndex !== -1) {
      const updatedTopics = [...allTopics];
      updatedTopics[topicIndex] = {
        ...updatedTopics[topicIndex],
        followersCount: Math.max(0, updatedTopics[topicIndex].followersCount - 1),
      };
      setAllTopics(updatedTopics);
      await AsyncStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(updatedTopics));
    }
  }, [user, followedTopics, allTopics]);

  const isFollowingTopic = useCallback((topicId: string) => {
    return followedTopics.includes(topicId);
  }, [followedTopics]);

  const searchTopics = useCallback((keyword: string) => {
    const cleanKeyword = keyword.toLowerCase().replace('#', '').trim();
    if (!cleanKeyword) return [];
    
    return allTopics.filter(topic => 
      topic.name.toLowerCase().includes(cleanKeyword)
    ).slice(0, 10); // 最多返回10个
  }, [allTopics]);

  // 更新话题统计（当有新帖子发布时调用）
  const incrementTopicStats = useCallback(async (topicIds: string[], userId: string) => {
    if (topicIds.length === 0) return;

    const updatedTopics = [...allTopics];
    let hasChanges = false;

    for (const topicId of topicIds) {
      const index = updatedTopics.findIndex(t => t.id === topicId);
      if (index !== -1) {
        updatedTopics[index] = {
          ...updatedTopics[index],
          postsCount: updatedTopics[index].postsCount + 1,
          updatedAt: Date.now(),
        };
        hasChanges = true;
      }
    }

    if (hasChanges) {
      setAllTopics(updatedTopics);
      await AsyncStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(updatedTopics));
    }
  }, [allTopics]);

  // 增加话题浏览数
  const incrementTopicViews = useCallback(async (topicId: string) => {
    const index = allTopics.findIndex(t => t.id === topicId);
    if (index === -1) return;

    const updatedTopics = [...allTopics];
    updatedTopics[index] = {
      ...updatedTopics[index],
      viewsCount: updatedTopics[index].viewsCount + 1,
    };
    setAllTopics(updatedTopics);
    await AsyncStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(updatedTopics));
  }, [allTopics]);

  const hotTopics = allTopics
    .filter(t => t.isHot)
    .sort((a, b) => b.postsCount - a.postsCount)
    .slice(0, 20);

  return {
    allTopics,
    hotTopics,
    isLoading,
    followedTopics,
    getTopic,
    getTopicByName,
    createTopic,
    followTopic,
    unfollowTopic,
    isFollowingTopic,
    searchTopics,
    incrementTopicStats,
    incrementTopicViews,
  };
});
