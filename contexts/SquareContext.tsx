import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';

export interface UserRating {
  userId: string;
  score: number;
  createdAt: number;
}

export interface SquarePost {
  id: string;
  userId: string;
  userNickname: string;
  userAvatar?: string;
  postType: 'outfitChange';
  // 换装相关字段
  outfitChangeId?: string;
  originalImageUri?: string;
  resultImageUri?: string;
  templateName?: string;
  customOutfitImages?: string[];  // 自定义穿搭模式下的参考服饰图片
  showOriginal?: boolean;  // 是否展示原图对比，默认false保护隐私
  // 通用字段
  description?: string;
  createdAt: number;
  likes: string[];
  comments: SquareComment[];
  pinnedCommentId?: string;
  userRatings: UserRating[];
}

export interface SquareComment {
  id: string;
  userId: string;
  userNickname: string;
  userAvatar?: string;
  content: string;
  createdAt: number;
  replyToCommentId?: string;
  replyToUserId?: string;
  replyToNickname?: string;
}

const STORAGE_KEY = 'square_posts';

export const [SquareProvider, useSquare] = createContextHook(() => {
  const [posts, setPosts] = useState<SquarePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const normalizeComment = useCallback((raw: Partial<SquareComment>): SquareComment => {
    return {
      id: String(raw.id ?? `comment_${Date.now()}`),
      userId: String(raw.userId ?? ''),
      userNickname: String(raw.userNickname ?? ''),
      userAvatar: raw.userAvatar ? String(raw.userAvatar) : undefined,
      content: String(raw.content ?? ''),
      createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
      replyToCommentId: raw.replyToCommentId ? String(raw.replyToCommentId) : undefined,
      replyToUserId: raw.replyToUserId ? String(raw.replyToUserId) : undefined,
      replyToNickname: raw.replyToNickname ? String(raw.replyToNickname) : undefined,
    };
  }, []);

  const normalizePost = useCallback((raw: Partial<SquarePost>): SquarePost => {
    const likes = Array.isArray(raw.likes) ? raw.likes.filter((x): x is string => typeof x === 'string') : [];
    const commentsRaw = Array.isArray(raw.comments) ? raw.comments : [];
    const comments = commentsRaw.map((c) => normalizeComment(c as Partial<SquareComment>));
    const userRatingsRaw = Array.isArray(raw.userRatings) ? raw.userRatings : [];
    const userRatings = userRatingsRaw
      .map((r) => ({
        userId: String((r as Partial<UserRating>).userId ?? ''),
        score: typeof (r as Partial<UserRating>).score === 'number' ? (r as Partial<UserRating>).score as number : 0,
        createdAt: typeof (r as Partial<UserRating>).createdAt === 'number' ? (r as Partial<UserRating>).createdAt as number : Date.now(),
      }))
      .filter((r) => r.userId.length > 0);

    return {
      id: String(raw.id ?? `post_${Date.now()}`),
      userId: String(raw.userId ?? ''),
      userNickname: String(raw.userNickname ?? ''),
      userAvatar: raw.userAvatar ? String(raw.userAvatar) : undefined,
      postType: 'outfitChange',
      outfitChangeId: raw.outfitChangeId ? String(raw.outfitChangeId) : undefined,
      originalImageUri: raw.originalImageUri ? String(raw.originalImageUri) : undefined,
      resultImageUri: raw.resultImageUri ? String(raw.resultImageUri) : undefined,
      templateName: raw.templateName ? String(raw.templateName) : undefined,
      description: raw.description ? String(raw.description) : undefined,
      createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
      likes,
      comments,
      pinnedCommentId: raw.pinnedCommentId ? String(raw.pinnedCommentId) : undefined,
      userRatings,
    };
  }, [normalizeComment]);

  const loadPosts = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored || 
          stored === 'undefined' || 
          stored === 'null' || 
          stored.trim() === '' ||
          stored.includes('[object Object]')) {
        if (stored && stored.includes('[object Object]')) {
          console.log('Detected [object Object] in storage, clearing');
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
        setPosts([]);
        setIsLoading(false);
        return;
      }

      if (typeof stored !== 'string') {
        console.log('Stored data is not a string, clearing storage');
        await AsyncStorage.removeItem(STORAGE_KEY);
        setPosts([]);
        setIsLoading(false);
        return;
      }

      const trimmedStored = stored.trim();
      
      if (trimmedStored.length < 2) {
        console.log('Stored data too short, clearing storage');
        await AsyncStorage.removeItem(STORAGE_KEY);
        setPosts([]);
        setIsLoading(false);
        return;
      }
      
      const firstChar = trimmedStored.charAt(0);
      if (firstChar !== '[' && firstChar !== '{') {
        console.log('Invalid data format detected, clearing storage');
        await AsyncStorage.removeItem(STORAGE_KEY);
        setPosts([]);
        setIsLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(trimmedStored);
        if (Array.isArray(parsed)) {
          const normalized = parsed.map((p) => normalizePost(p as Partial<SquarePost>));
          setPosts(normalized);
          try {
            const stringified = JSON.stringify(normalized);
            await AsyncStorage.setItem(STORAGE_KEY, stringified);
          } catch {
            console.log('Failed to save normalized posts, continuing anyway');
          }
        } else {
          console.log('Parsed data is not an array, clearing storage');
          await AsyncStorage.removeItem(STORAGE_KEY);
          setPosts([]);
        }
      } catch {
        console.log('Data corrupted, clearing storage');
        await AsyncStorage.removeItem(STORAGE_KEY);
        setPosts([]);
      }
    } catch {
      console.log('Failed to load posts, resetting storage');
      try {
        await AsyncStorage.removeItem(STORAGE_KEY);
      } catch {
        console.log('Failed to clear storage');
      }
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [normalizePost]);

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const publishPost = useCallback(async (post: Omit<SquarePost, 'id' | 'createdAt' | 'likes' | 'comments' | 'userRatings'>) => {
    // 根据不同类型检查是否已存在
    let existingPost;
    if (post.postType === 'verification' && post.verificationResultId) {
      existingPost = posts.find(p => p.verificationResultId === post.verificationResultId);
    } else if (post.postType === 'imageSource' && post.imageSourceId) {
      existingPost = posts.find(p => p.imageSourceId === post.imageSourceId);
    } else if (post.postType === 'outfitChange' && post.outfitChangeId) {
      existingPost = posts.find(p => p.outfitChangeId === post.outfitChangeId);
    }
    
    if (existingPost) {
      return existingPost.id;
    }
    
    const newPost: SquarePost = {
      ...post,
      id: `post_${Date.now()}`,
      createdAt: Date.now(),
      likes: [],
      comments: [],
      userRatings: [],
    };
    const updated = [newPost, ...posts];
    setPosts(updated);
    try {
      const stringified = JSON.stringify(updated);
      await AsyncStorage.setItem(STORAGE_KEY, stringified);
      
      // 更新 all_users 存储
      const usersKey = 'all_users';
      const stored = await AsyncStorage.getItem(usersKey);
      const allUsers: {
        userId: string;
        nickname: string;
        avatar?: string;
        bio?: string;
        phone: string;
        followingCount?: number;
        followersCount?: number;
      }[] = stored ? JSON.parse(stored) : [];
      
      const userIndex = allUsers.findIndex(u => u.userId === post.userId);
      if (userIndex !== -1) {
        allUsers[userIndex] = {
          ...allUsers[userIndex],
          nickname: post.userNickname,
          avatar: post.userAvatar,
        };
      } else {
        allUsers.push({
          userId: post.userId,
          nickname: post.userNickname,
          avatar: post.userAvatar,
          phone: '',
          followingCount: 0,
          followersCount: 0,
        });
      }
      
      await AsyncStorage.setItem(usersKey, JSON.stringify(allUsers));
    } catch {
      console.log('Failed to save post or update user list');
    }
    return newPost.id;
  }, [posts]);

  const deletePost = useCallback(async (postId: string) => {
    const updated = posts.filter(p => p.id !== postId);
    setPosts(updated);
    try {
      const stringified = JSON.stringify(updated);
      await AsyncStorage.setItem(STORAGE_KEY, stringified);
    } catch {
      console.log('Failed to delete post');
    }
  }, [posts]);

  // 根据 outfitChangeId 和 userId 删除帖子（更可靠，避免闭包问题）
  const deletePostByOutfitChangeId = useCallback(async (outfitChangeId: string, userId: string): Promise<boolean> => {
    console.log('[deletePostByOutfitChangeId] Looking for:', outfitChangeId, userId);
    console.log('[deletePostByOutfitChangeId] Current posts:', posts.length);
    
    const postToDelete = posts.find(p => p.outfitChangeId === outfitChangeId && p.userId === userId);
    
    if (postToDelete) {
      console.log('[deletePostByOutfitChangeId] Found post:', postToDelete.id);
      const updated = posts.filter(p => p.id !== postToDelete.id);
      setPosts(updated);
      try {
        const stringified = JSON.stringify(updated);
        await AsyncStorage.setItem(STORAGE_KEY, stringified);
        console.log('[deletePostByOutfitChangeId] Post deleted successfully');
        return true;
      } catch {
        console.log('Failed to delete post');
        return false;
      }
    } else {
      console.log('[deletePostByOutfitChangeId] Post not found');
      return false;
    }
  }, [posts]);

  const likePost = useCallback(async (postId: string, userId: string) => {
    const updated = posts.map(post => {
      if (post.id === postId) {
        const currentLikes = Array.isArray(post.likes) ? post.likes : [];
        const likes = currentLikes.includes(userId)
          ? currentLikes.filter(id => id !== userId)
          : [...currentLikes, userId];
        return { ...post, likes };
      }
      return post;
    });
    setPosts(updated);
    try {
      const stringified = JSON.stringify(updated);
      await AsyncStorage.setItem(STORAGE_KEY, stringified);
    } catch {
      console.log('Failed to like post');
    }
  }, [posts]);

  const addComment = useCallback(async (postId: string, comment: Omit<SquareComment, 'id' | 'createdAt'>) => {
    const newComment: SquareComment = {
      ...comment,
      id: `comment_${Date.now()}`,
      createdAt: Date.now(),
    };
    const updated = posts.map(post => {
      if (post.id === postId) {
        const currentComments = Array.isArray(post.comments) ? post.comments : [];
        return { ...post, comments: [...currentComments, newComment] };
      }
      return post;
    });
    setPosts(updated);
    try {
      const stringified = JSON.stringify(updated);
      await AsyncStorage.setItem(STORAGE_KEY, stringified);
    } catch {
      console.log('Failed to add comment');
    }
  }, [posts]);

  const deleteComment = useCallback(async (postId: string, commentId: string) => {
    const updated = posts.map(post => {
      if (post.id === postId) {
        const currentComments = Array.isArray(post.comments) ? post.comments : [];
        const newPost = { ...post, comments: currentComments.filter(c => c.id !== commentId) };
        if (post.pinnedCommentId === commentId) {
          newPost.pinnedCommentId = undefined;
        }
        return newPost;
      }
      return post;
    });
    setPosts(updated);
    try {
      const stringified = JSON.stringify(updated);
      await AsyncStorage.setItem(STORAGE_KEY, stringified);
    } catch {
      console.log('Failed to delete comment');
    }
  }, [posts]);

  const pinComment = useCallback(async (postId: string, commentId: string) => {
    const updated = posts.map(post => {
      if (post.id === postId) {
        return { ...post, pinnedCommentId: post.pinnedCommentId === commentId ? undefined : commentId };
      }
      return post;
    });
    setPosts(updated);
    try {
      const stringified = JSON.stringify(updated);
      await AsyncStorage.setItem(STORAGE_KEY, stringified);
    } catch {
      console.log('Failed to pin comment');
    }
  }, [posts]);

  const updateUserNickname = useCallback(async (userId: string, newNickname: string) => {
    const updated = posts.map(post => {
      const updatedPost = { ...post };
      
      if (post.userId === userId) {
        updatedPost.userNickname = newNickname;
      }
      
      updatedPost.comments = post.comments.map(comment => {
        if (comment.userId === userId) {
          return { ...comment, userNickname: newNickname };
        }
        if (comment.replyToUserId === userId) {
          return { ...comment, replyToNickname: newNickname };
        }
        return comment;
      });
      
      return updatedPost;
    });
    
    setPosts(updated);
    try {
      const stringified = JSON.stringify(updated);
      await AsyncStorage.setItem(STORAGE_KEY, stringified);
    } catch {
      console.log('Failed to update user nickname in posts');
    }
  }, [posts]);

  const updatePostDescription = useCallback(async (postId: string, description: string) => {
    const updated = posts.map(post => {
      if (post.id === postId) {
        return { ...post, description };
      }
      return post;
    });
    setPosts(updated);
    try {
      const stringified = JSON.stringify(updated);
      await AsyncStorage.setItem(STORAGE_KEY, stringified);
    } catch {
      console.log('Failed to update post description');
    }
  }, [posts]);

  const isPublished = useCallback((verificationResultId: string) => {
    return posts.some(post => post.verificationResultId === verificationResultId);
  }, [posts]);

  const ratePost = useCallback(async (postId: string, userId: string, score: number) => {
    const updated = posts.map(post => {
      if (post.id === postId) {
        const currentRatings = Array.isArray(post.userRatings) ? post.userRatings : [];
        const existingRatingIndex = currentRatings.findIndex(r => r.userId === userId);
        const newRatings = [...currentRatings];
        
        if (existingRatingIndex !== -1) {
          newRatings[existingRatingIndex] = { userId, score, createdAt: Date.now() };
        } else {
          newRatings.push({ userId, score, createdAt: Date.now() });
        }
        
        return { ...post, userRatings: newRatings };
      }
      return post;
    });
    setPosts(updated);
    try {
      const stringified = JSON.stringify(updated);
      await AsyncStorage.setItem(STORAGE_KEY, stringified);
    } catch {
      console.log('Failed to rate post');
    }
  }, [posts]);

  const removeRating = useCallback(async (postId: string, userId: string) => {
    const updated = posts.map(post => {
      if (post.id === postId) {
        const currentRatings = Array.isArray(post.userRatings) ? post.userRatings : [];
        const newRatings = currentRatings.filter(r => r.userId !== userId);
        return { ...post, userRatings: newRatings };
      }
      return post;
    });
    setPosts(updated);
    try {
      const stringified = JSON.stringify(updated);
      await AsyncStorage.setItem(STORAGE_KEY, stringified);
    } catch {
      console.log('Failed to remove rating');
    }
  }, [posts]);

  const getUserRating = useCallback((postId: string, userId: string): number | null => {
    const post = posts.find(p => p.id === postId);
    if (!post) return null;
    const ratings = Array.isArray(post.userRatings) ? post.userRatings : [];
    const rating = ratings.find(r => r.userId === userId);
    return rating ? rating.score : null;
  }, [posts]);

  const getAverageUserRating = useCallback((postId: string): number | null => {
    const post = posts.find(p => p.id === postId);
    const ratings = post && Array.isArray(post.userRatings) ? post.userRatings : [];
    if (!post || ratings.length === 0) return null;
    const sum = ratings.reduce((acc, rating) => acc + rating.score, 0);
    return sum / ratings.length;
  }, [posts]);

  return {
    posts,
    isLoading,
    publishPost,
    updatePostDescription,
    isPublished,
    deletePost,
    deletePostByOutfitChangeId,
    likePost,
    addComment,
    deleteComment,
    pinComment,
    updateUserNickname,
    ratePost,
    removeRating,
    getUserRating,
    getAverageUserRating,
  };
});
