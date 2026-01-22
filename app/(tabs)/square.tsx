import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Image as ExpoImage } from 'expo-image';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, RefreshControl, Alert, TextInput, Keyboard, TouchableWithoutFeedback, Platform, KeyboardAvoidingView, Modal, PanResponder, Animated, Dimensions } from 'react-native';
import { Heart, MessageSquare, Trash2, MoreHorizontal, Pin, X, AlertTriangle, Download, Search, ChevronLeft, Share2, User, Edit3, Star, MessageCircle, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSquare, SquarePost, SquareComment } from '@/contexts/SquareContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';
import { useFriends, formatNumber } from '@/contexts/FriendsContext';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { saveToGallery } from '@/utils/share';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 10;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_GAP * 3) / 2;


type ZoomableImageProps = {
  uri: string;
  onClose: () => void;
};

function ZoomableImage({ uri }: ZoomableImageProps) {
  return (
    <View style={[zoomStyles.container, { backgroundColor: 'rgba(0, 0, 0, 0.95)' }]}>
      <View
        style={{
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ExpoImage source={{ uri }} style={zoomStyles.image} contentFit="contain" />
      </View>
    </View>
  );
}

function getTemplateIcon(templateName: string): string {
  const templateIcons: Record<string, string> = {
    '随机装': '🎲',
    'Jennie同款': '💖',
    '正装': '👔',
    '比基尼': '👙',
    '一键穿搭': '✨',
    '运动装': '🏃',
    '婚纱/礼服': '👰',
    '汉服': '🏮',
    '超级英雄': '🦸',
    '新年装-马年': '🐴',
    '圣诞装': '🎄',
    '咖啡师-星巴克': '☕',
    '老钱风': '💰',
    '网球装': '🎾',
    '财神装': '💸',
    '辣妹装': '🔥',
    '美团外卖装': '🛵',
    '滑雪服': '⛷️',
    '空姐装': '✈️',
    '户外装': '🏔️',
    '牛仔装': '🤠',
    '魔法师装': '🧙',
    '海盗装': '🏴‍☠️',
  };
  return templateIcons[templateName] || '👔';
}

function getTemplateBadgeColor(templateName: string): string {
  const templateColors: Record<string, string> = {
    '随机装': '#F3E8FF',
    'Jennie同款': '#FFE4E6',
    '正装': '#EEF2FF',
    '比基尼': '#FEF3C7',
    '一键穿搭': '#F0F9FF',
    '运动装': '#DCFCE7',
    '婚纱/礼服': '#FFE4E6',
    '汉服': '#FEF3C7',
    '超级英雄': '#DBEAFE',
    '新年装-马年': '#FEE2E2',
    '圣诞装': '#DCFCE7',
    '咖啡师-星巴克': '#FEF3C7',
    '老钱风': '#FEF9C3',
    '网球装': '#DCFCE7',
    '财神装': '#FEF3C7',
    '辣妹装': '#FECACA',
    '美团外卖装': '#FEF3C7',
    '滑雪服': '#E0F2FE',
    '空姐装': '#E0F2FE',
    '户外装': '#D1FAE5',
    '牛仔装': '#E0E7FF',
    '魔法师装': '#DDD6FE',
    '海盗装': '#374151',
  };
  return templateColors[templateName] || '#EEF2FF';
}

export default function SquareScreen() {
  const { t } = useTranslation();
  const { posts, likePost, deletePost, addComment, deleteComment, pinComment } = useSquare();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { followingUserIds, followUser, unfollowUser, isFollowing, getFollowersCount, isMutualFollow } = useFriends();
  const { highlightPostId } = useLocalSearchParams<{ highlightPostId?: string }>();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'follow' | 'explore'>('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [commentingPost, setCommentingPost] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ commentId: string; userId: string; nickname: string } | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [highlightedPost, setHighlightedPost] = useState<string | null>(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ uri: string; type: 'reference' | 'verified'; postId: string } | null>(null);
  const [expandedIntros, setExpandedIntros] = useState<Set<string>>(new Set());
  const [selectedPost, setSelectedPost] = useState<SquarePost | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [followersCache, setFollowersCache] = useState<Record<string, number>>({});
  const [mutualCache, setMutualCache] = useState<Record<string, boolean>>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const postRefs = useRef<Map<string, View>>(new Map());
  const inputRef = useRef<TextInput>(null);
  const searchInputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  // 批量加载创作者粉丝数（使用缓存避免重复查询）
  useEffect(() => {
    const loadFollowersCounts = async () => {
      const uniqueUserIds = [...new Set(posts.map(p => p.userId))];
      const newCache: Record<string, number> = {};
      const newMutualCache: Record<string, boolean> = {};
      
      for (const userId of uniqueUserIds) {
        // 跳过已缓存的
        if (followersCache[userId] !== undefined) {
          newCache[userId] = followersCache[userId];
        } else {
          const count = await getFollowersCount(userId);
          newCache[userId] = count;
        }
        
        // 检查互关状态
        if (user && userId !== user.userId) {
          if (mutualCache[userId] !== undefined) {
            newMutualCache[userId] = mutualCache[userId];
          } else {
            const mutual = await isMutualFollow(userId);
            newMutualCache[userId] = mutual;
          }
        }
      }
      
      setFollowersCache(prev => ({ ...prev, ...newCache }));
      setMutualCache(prev => ({ ...prev, ...newMutualCache }));
    };
    
    if (posts.length > 0) {
      loadFollowersCounts();
    }
  }, [posts, user, getFollowersCount, isMutualFollow]);

  // 计算帖子的综合分数（热度 + 时间权重）
  const calculateScore = useCallback((post: SquarePost) => {
    const hotScore = post.likes.length + post.comments.length * 2;
    const hoursAgo = (Date.now() - post.createdAt) / (1000 * 60 * 60);
    const timeWeight = 1 / (1 + hoursAgo / 24); // 24小时内权重最高
    return hotScore * timeWeight + timeWeight * 10; // 新帖子有基础分
  }, []);

  // 根据activeTab和搜索关键词过滤和排序帖子
  const filteredAndSortedPosts = useMemo(() => {
    let filtered: SquarePost[];
    
    // 先根据Tab过滤
    if (activeTab === 'follow') {
      // 关注Tab：只显示已关注用户的帖子
      filtered = posts.filter(post => followingUserIds.includes(post.userId));
    } else {
      // 发现Tab：显示所有帖子
      filtered = [...posts];
    }
    
    // 再根据搜索关键词过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(post => {
        // 搜索用户名
        if (post.userNickname.toLowerCase().includes(query)) return true;
        // 搜索描述
        if (post.description?.toLowerCase().includes(query)) return true;
        // 搜索模板名称
        if (post.templateName?.toLowerCase().includes(query)) return true;
        return false;
      });
    }
    
    // 排序
    if (activeTab === 'follow') {
      // 按时间排序（最新优先）
      filtered.sort((a, b) => b.createdAt - a.createdAt);
    } else {
      // 按综合分数排序
      filtered.sort((a, b) => calculateScore(b) - calculateScore(a));
    }
    
    return filtered;
  }, [posts, activeTab, followingUserIds, calculateScore, searchQuery]);

  // 将帖子分为左右两列（瀑布流布局）
  const { leftColumn, rightColumn } = useMemo(() => {
    const left: SquarePost[] = [];
    const right: SquarePost[] = [];
    filteredAndSortedPosts.forEach((post, index) => {
      if (index % 2 === 0) {
        left.push(post);
      } else {
        right.push(post);
      }
    });
    return { leftColumn: left, rightColumn: right };
  }, [filteredAndSortedPosts]);

  // 瀑布流卡片高度 - 左右列交错显示不同高度
  const getCardImageHeight = useCallback((index: number, isLeft: boolean) => {
    // 左列: 高-矮-高-矮 / 右列: 矮-高-矮-高
    const leftHeights = [220, 160, 200, 180, 240, 170];
    const rightHeights = [170, 210, 160, 230, 180, 200];
    const heights = isLeft ? leftHeights : rightHeights;
    return heights[index % heights.length];
  }, []);

  // 处理关注/取消关注
  const handleFollowToggle = useCallback(async (targetUserId: string, targetNickname: string, targetAvatar?: string) => {
    if (!user) {
      showAlert({
        type: 'info',
        title: t('common.notice'),
        message: t('common.loginRequired'),
      });
      return;
    }

    try {
      if (isFollowing(targetUserId)) {
        await unfollowUser(targetUserId);
        showAlert({
          type: 'success',
          title: t('common.success'),
          message: t('square.unfollowed'),
        });
      } else {
        await followUser(targetUserId, targetNickname, targetAvatar);
        showAlert({
          type: 'success',
          title: t('common.success'),
          message: t('square.followed'),
        });
      }
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: error.message || t('common.operationFailed'),
      });
    }
  }, [user, isFollowing, followUser, unfollowUser, showAlert, t]);

  useEffect(() => {
    if (highlightPostId && posts.length > 0) {
      const targetPost = posts.find(p => p.id === highlightPostId);
      if (targetPost) {
        setHighlightedPost(highlightPostId);
        setTimeout(() => {
          const targetView = postRefs.current.get(highlightPostId);
          if (targetView && scrollViewRef.current) {
            targetView.measureLayout(
              scrollViewRef.current as any,
              (x, y) => {
                scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 20), animated: true });
              },
              () => console.log('Failed to measure')
            );
          }
        }, 300);
        setTimeout(() => setHighlightedPost(null), 2000);
      }
    }
  }, [highlightPostId, posts]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };





  const handleLike = useCallback(async (postId: string) => {
    if (!user) {
      showAlert({
        type: 'info',
        message: t('square.loginRequired')
      });
      return;
    }
    await likePost(postId, user.userId);
  }, [user, t, likePost, showAlert]);

  const handleDelete = useCallback((postId: string) => {
    showAlert({
      type: 'confirm',
      title: t('common.tip'),
      message: t('square.confirmDelete'),
      confirmText: t('common.delete'),
      onConfirm: async () => {
        await deletePost(postId);
      }
    });
  }, [t, deletePost, showAlert]);

  const handleOpenComments = useCallback((postId: string, replyToComment?: { commentId: string; userId: string; nickname: string }) => {
    if (!user) {
      showAlert({
        type: 'info',
        message: t('square.loginRequired')
      });
      return;
    }
    setActivePopup(null);
    setCommentingPost(postId);
    setReplyTo(replyToComment || null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [user, t, showAlert]);

  const handleTogglePopup = useCallback((postId: string) => {
    if (!user) {
      showAlert({
        type: 'info',
        message: t('square.loginRequired')
      });
      return;
    }
    setActivePopup(activePopup === postId ? null : postId);
  }, [user, t, activePopup, showAlert]);

  const handleLikeFromPopup = useCallback((postId: string) => {
    handleLike(postId);
    setActivePopup(null);
  }, [handleLike]);

  const toggleExpandComments = useCallback((postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  }, []);

  const handleSendComment = async () => {
    if (!commentingPost || !commentText.trim() || !user) return;

    await addComment(commentingPost, {
      userId: user.userId,
      userNickname: user.nickname || user.userId,
      userAvatar: user.avatar,
      content: commentText.trim(),
      replyToCommentId: replyTo?.commentId,
      replyToUserId: replyTo?.userId,
      replyToNickname: replyTo?.nickname,
    });
    setCommentText('');
    setCommentingPost(null);
    setReplyTo(null);
    Keyboard.dismiss();
  };

  const getLikedUserNames = (likes: string[], allPosts: SquarePost[]) => {
    return likes.map(userId => {
      for (const post of allPosts) {
        if (post.userId === userId) return post.userNickname;
        const comment = post.comments.find((c: SquareComment) => c.userId === userId);
        if (comment) return comment.userNickname;
      }
      return userId.slice(-4);
    });
  };

  const toggleIntro = useCallback((postId: string) => {
    setExpandedIntros(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  }, []);

  const handleImagePress = useCallback(
    (uri: string, type: 'reference' | 'verified', postId: string) => {
      console.log('[Square] open image viewer', { postId, type, uri });
      setSelectedImage({ uri, type, postId });
      requestAnimationFrame(() => {
        setImageViewerVisible(true);
      });

      const post = posts.find((p) => p.id === postId);
      const otherUri =
        type === 'reference' ? post?.resultImageUri ?? undefined : post?.originalImageUri ?? undefined;

      if (otherUri) {
        try {
          ExpoImage.prefetch(otherUri);
        } catch (e) {
          console.log('[Square] ExpoImage.prefetch failed', e);
        }
      }
    },
    [posts]
  );

  const handleCommentPress = useCallback((postId: string, comment: SquareComment, postUserId: string) => {
    if (!user) {
      Alert.alert(t('common.tip'), t('square.loginRequired'));
      return;
    }
    
    const post = posts.find(p => p.id === postId);
    const isPostOwner = user.userId === postUserId;
    const isCommentOwner = user.userId === comment.userId;
    
    if (isPostOwner) {
      const isPinned = post?.pinnedCommentId === comment.id;
      
      showAlert({
        type: 'confirm',
        title: t('common.tip'),
        message: t('square.manageComment'),
        confirmText: isPinned ? t('square.unpinComment') : t('square.pinComment'),
        onConfirm: async () => {
          await pinComment(postId, comment.id);
        },
        cancelText: t('common.delete'),
        onCancel: async () => {
          await deleteComment(postId, comment.id);
        }
      });
    } else if (isCommentOwner) {
      showAlert({
        type: 'confirm',
        title: t('common.tip'),
        message: t('square.deleteCommentConfirm'),
        confirmText: t('common.delete'),
        onConfirm: async () => {
          await deleteComment(postId, comment.id);
        }
      });
    } else {
      const nickname = comment.userNickname || comment.userId.slice(-4);
      if (!nickname) {
        showAlert({
          type: 'info',
          message: t('square.cannotReply')
        });
        return;
      }
      handleOpenComments(postId, { commentId: comment.id, userId: comment.userId, nickname });
    }
  }, [user, t, posts, deleteComment, pinComment, handleOpenComments, showAlert]);



  const getVerdictText = (verdict: string) => {
    switch (verdict) {
      case 'authentic': return t('verdict.authentic');
      case 'slightly-edited': return t('verdict.slightlyEdited');
      case 'heavily-edited': return t('verdict.heavilyEdited');
      case 'suspicious': return t('verdict.suspicious');
      default: return verdict;
    }
  };

  const formatScore = (score: number): string => {
    return score % 1 === 0 ? `${score.toFixed(0)}/10` : `${score.toFixed(1)}/10`;
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

  const getScoreColor = (score: number): string => {
    if (score < 7.5) {
      return '#DC2626';
    } else if (score < 8.5) {
      return '#F97316';
    } else if (score < 9) {
      return '#CA8A04';
    } else {
      return '#15803D';
    }
  };

  const getScoreDescription = (score: number): string => {
    if (score < 2) {
      return t('result.scoreTagDifferentSubject');
    } else if (score < 7.5) {
      return t('result.scoreTagFake');
    } else if (score < 8.5) {
      return t('result.scoreTagObviousEdit');
    } else if (score < 9) {
      return t('result.scoreTagSlightEdit');
    } else {
      return t('result.scoreTagMatch');
    }
  };

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

  

  // 渲染画中画卡片 - 支持瀑布流不同高度
  const renderPIPCard = (post: SquarePost, index: number, isLeft: boolean) => {
    if (post.postType !== 'outfitChange' || !post.resultImageUri) return null;
    
    const isLiked = user ? post.likes.includes(user.userId) : false;
    const imageHeight = getCardImageHeight(index, isLeft);
    
    return (
      <TouchableOpacity
        key={post.id}
        style={pipStyles.card}
        activeOpacity={0.95}
        onPress={() => {
          setCurrentImageIndex(0);
          setSelectedPost(post);
        }}
      >
        {/* 主图（变装结果） - 瀑布流高度，从顶部显示避免头部被裁 */}
        <View style={[pipStyles.imageContainer, { height: imageHeight }]}>
          <ExpoImage
            source={{ uri: post.resultImageUri }}
            style={pipStyles.mainImageWaterfall}
            contentFit="cover"
            contentPosition="top"
          />
        </View>
        
        {/* 描述文字 */}
        {post.description && (
          <Text style={pipStyles.description} numberOfLines={2}>
            {post.description}
          </Text>
        )}
        
        {/* 用户信息和点赞 */}
        <View style={pipStyles.footer}>
          <View style={pipStyles.userInfoContainer}>
            <TouchableOpacity 
              style={pipStyles.userInfo}
              onPress={() => {
                if (user && post.userId !== user.userId) {
                  router.push(`/user-profile/${post.userId}` as any);
                }
              }}
              disabled={!user || post.userId === user?.userId}
            >
              {post.userAvatar ? (
                <Image source={{ uri: post.userAvatar }} style={pipStyles.avatar} />
              ) : (
                <View style={pipStyles.avatarPlaceholder}>
                  <Text style={pipStyles.avatarText}>
                    {post.userNickname.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={pipStyles.nickname} numberOfLines={1}>{post.userNickname}</Text>
            </TouchableOpacity>
            {/* 粉丝数显示 */}
            {followersCache[post.userId] !== undefined && followersCache[post.userId] > 0 && (
              <View style={pipStyles.followersBadge}>
                <User size={10} color="#9CA3AF" />
                <Text style={pipStyles.followersCount}>{formatNumber(followersCache[post.userId])}</Text>
              </View>
            )}
            {/* 互关标识 */}
            {mutualCache[post.userId] && (
              <View style={pipStyles.mutualBadge}>
                <Users size={10} color="#10B981" />
              </View>
            )}
            {/* 关注按钮 - 只对非自己的帖子显示 */}
            {user && post.userId !== user.userId && !isFollowing(post.userId) && (
              <TouchableOpacity
                style={pipStyles.followBadge}
                onPress={(e) => {
                  e.stopPropagation();
                  handleFollowToggle(post.userId, post.userNickname, post.userAvatar);
                }}
              >
                <Text style={pipStyles.followBadgeText}>
                  {t('square.followUser')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={pipStyles.likeButton}
            onPress={() => handleLike(post.id)}
          >
            <Heart
              size={14}
              color={isLiked ? '#EF4444' : '#9CA3AF'}
              fill={isLiked ? '#EF4444' : 'none'}
            />
            <Text style={[pipStyles.likeCount, isLiked && pipStyles.likeCountActive]}>
              {post.likes.length}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* 预览评论 */}
        {post.comments.length > 0 && (
          <View style={pipStyles.commentsPreview}>
            {post.comments.slice(0, 2).map((comment) => (
              <Text key={comment.id} style={pipStyles.previewComment} numberOfLines={1}>
                <Text style={pipStyles.previewCommentAuthor}>{comment.userNickname}</Text>
                <Text style={pipStyles.previewCommentText}>: {comment.content}</Text>
              </Text>
            ))}
            {post.comments.length > 2 && (
              <Text style={pipStyles.viewAllComments}>
                {t('square.viewMoreComments', { count: post.comments.length - 2 })}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // 渲染顶部Tab导航
  const renderHeader = () => (
    <View style={pipStyles.header}>
      {isSearching ? (
        // 搜索模式
        <View style={pipStyles.searchContainer}>
          <View style={pipStyles.searchInputWrapper}>
            <Search size={18} color="#9CA3AF" />
            <TextInput
              ref={searchInputRef}
              style={pipStyles.searchInput}
              placeholder={t('square.searchPlaceholder')}
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={pipStyles.cancelButton}
            onPress={() => {
              setIsSearching(false);
              setSearchQuery('');
            }}
          >
            <Text style={pipStyles.cancelButtonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // 正常模式
        <>
          <View style={pipStyles.tabsContainer}>
            <TouchableOpacity
              style={pipStyles.tabItem}
              onPress={() => setActiveTab('follow')}
            >
              <Text style={[pipStyles.tabText, activeTab === 'follow' && pipStyles.tabTextActive]}>
                {t('square.follow')}
              </Text>
              {activeTab === 'follow' && <View style={pipStyles.tabIndicator} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={pipStyles.tabItem}
              onPress={() => setActiveTab('explore')}
            >
              <Text style={[pipStyles.tabText, activeTab === 'explore' && pipStyles.tabTextActive]}>
                {t('square.explore')}
              </Text>
              {activeTab === 'explore' && <View style={pipStyles.tabIndicator} />}
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={pipStyles.searchButton}
            onPress={() => setIsSearching(true)}
          >
            <Search size={22} color="#1a1a1a" />
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  // 渲染空状态
  const renderEmptyState = () => {
    // 搜索无结果
    if (searchQuery.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>{t('square.noSearchResults')}</Text>
          <Text style={styles.emptyText}>{t('square.noSearchResultsDesc')}</Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.emptyButtonText}>{t('square.clearSearch')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // 关注Tab无内容
    if (activeTab === 'follow') {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>{t('square.noFollowingPosts')}</Text>
          <Text style={styles.emptyText}>{t('square.noFollowingPostsDesc')}</Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => setActiveTab('explore')}
          >
            <Text style={styles.emptyButtonText}>{t('square.goExplore')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // 发现Tab无内容
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t('square.noPosts')}</Text>
      </View>
    );
  };

  return (
    <View style={pipStyles.container}>
      {renderHeader()}
      
      <ScrollView
        ref={scrollViewRef}
        style={pipStyles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a1a1a" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={pipStyles.scrollContent}
      >
        {filteredAndSortedPosts.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {/* 瀑布流两列布局 - 高度交错 */}
            <View style={pipStyles.masonryContainer}>
              <View style={pipStyles.column}>
                {leftColumn.map((post, index) => renderPIPCard(post, index, true))}
              </View>
              <View style={pipStyles.column}>
                {rightColumn.map((post, index) => renderPIPCard(post, index, false))}
              </View>
            </View>
            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>

      {/* 帖子详情弹窗 - 小红书风格 */}
      <Modal
        visible={!!selectedPost}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setSelectedPost(null)}
        statusBarTranslucent
      >
        {selectedPost && (
          <View style={detailStyles.fullScreenContainer}>
            {/* 顶部导航栏 */}
            <View style={[detailStyles.header, { paddingTop: insets.top + 12 }]}>
              <TouchableOpacity
                style={detailStyles.backButton}
                onPress={() => setSelectedPost(null)}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                activeOpacity={0.7}
              >
                <ChevronLeft size={28} color="#1a1a1a" strokeWidth={2.5} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={detailStyles.headerUserInfo}
                onPress={() => {
                  if (user && selectedPost.userId !== user.userId) {
                    setSelectedPost(null);
                    router.push(`/user-profile/${selectedPost.userId}` as any);
                  }
                }}
              >
                {selectedPost.userAvatar ? (
                  <Image source={{ uri: selectedPost.userAvatar }} style={detailStyles.headerAvatar} />
                ) : (
                  <View style={detailStyles.headerAvatarPlaceholder}>
                    <Text style={detailStyles.headerAvatarText}>
                      {selectedPost.userNickname.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={detailStyles.headerNickname} numberOfLines={1}>
                  {selectedPost.userNickname}
                </Text>
              </TouchableOpacity>
              
              <View style={detailStyles.headerRight}>
                {user && user.userId !== selectedPost.userId && (
                  <TouchableOpacity style={detailStyles.followButton}>
                    <Text style={detailStyles.followButtonText}>{t('square.follow')}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={detailStyles.shareButton}>
                  <Share2 size={22} color="#1a1a1a" />
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView 
              style={detailStyles.scrollView}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              {/* 主图区域 - 可左右滑动查看结果图和原图 */}
              <View style={detailStyles.imageCarouselContainer}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  bounces={false}
                  onScroll={(e) => {
                    const offsetX = e.nativeEvent.contentOffset.x;
                    const width = e.nativeEvent.layoutMeasurement.width;
                    const currentIndex = Math.round(offsetX / width);
                    setCurrentImageIndex(currentIndex);
                  }}
                  scrollEventThrottle={16}
                >
                  {/* 结果图 */}
                  <TouchableOpacity
                    activeOpacity={0.95}
                    onPress={() => {
                      if (selectedPost.resultImageUri) {
                        setSelectedImage({ uri: selectedPost.resultImageUri, type: 'verified', postId: selectedPost.id });
                        setImageViewerVisible(true);
                      }
                    }}
                    style={detailStyles.carouselImageWrapper}
                  >
                    <Image
                      source={{ uri: selectedPost.resultImageUri }}
                      style={detailStyles.mainImage}
                      resizeMode="cover"
                    />
                    <View style={detailStyles.imageLabel}>
                      <Text style={detailStyles.imageLabelText}>{t('square.after')}</Text>
                    </View>
                  </TouchableOpacity>
                  
                  {/* 原图 - 仅当用户允许展示时显示 */}
                  {selectedPost.originalImageUri && selectedPost.showOriginal && (
                    <TouchableOpacity
                      activeOpacity={0.95}
                      onPress={() => {
                        if (selectedPost.originalImageUri) {
                          setSelectedImage({ uri: selectedPost.originalImageUri, type: 'reference', postId: selectedPost.id });
                          setImageViewerVisible(true);
                        }
                      }}
                      style={detailStyles.carouselImageWrapper}
                    >
                      <Image
                        source={{ uri: selectedPost.originalImageUri }}
                        style={detailStyles.mainImage}
                        resizeMode="cover"
                      />
                      <View style={detailStyles.imageLabel}>
                        <Text style={detailStyles.imageLabelText}>{t('square.before')}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </ScrollView>
                
                {/* 图片页码指示器 - 仅当有原图且允许展示时显示 */}
                {selectedPost.originalImageUri && selectedPost.showOriginal && (
                  <View style={detailStyles.paginationDots}>
                    <View style={[detailStyles.dot, currentImageIndex === 0 && detailStyles.dotActive]} />
                    <View style={[detailStyles.dot, currentImageIndex === 1 && detailStyles.dotActive]} />
                  </View>
                )}
                
                {/* 滑动提示 - 仅当有原图且允许展示时显示 */}
                {selectedPost.originalImageUri && selectedPost.showOriginal && currentImageIndex === 0 && (
                  <View style={detailStyles.swipeHint}>
                    <Text style={detailStyles.swipeHintText}>← {t('square.swipeToSeeOriginal')}</Text>
                  </View>
                )}
              </View>
              
              {/* 内容区域 */}
              <View style={detailStyles.contentSection}>
                {/* 描述/标题 */}
                {selectedPost.description ? (
                  <Text style={detailStyles.contentTitle}>{selectedPost.description}</Text>
                ) : (
                  <Text style={detailStyles.contentTitle}>{t('outfitChange.transformationComplete')}</Text>
                )}
                
                {/* 模板标签 */}
                {selectedPost.templateName && (
                  <View style={detailStyles.tagRow}>
                    <View style={detailStyles.tag}>
                      <Text style={detailStyles.tagIcon}>{getTemplateIcon(selectedPost.templateName)}</Text>
                      <Text style={detailStyles.tagText}>{selectedPost.templateName}</Text>
                    </View>
                  </View>
                )}
                
                {/* 时间和地点 */}
                <View style={detailStyles.metaRow}>
                  <Text style={detailStyles.metaText}>{formatTime(selectedPost.createdAt)}</Text>
                </View>
              </View>
              
              {/* 分隔线 */}
              <View style={detailStyles.divider} />
              
              {/* 评论区 */}
              <View style={detailStyles.commentsSection}>
                <View style={detailStyles.commentsSectionHeader}>
                  <Text style={detailStyles.commentsTitle}>
                    {t('square.totalComments', { count: selectedPost.comments.length })}
                  </Text>
                </View>
                
                {/* 点赞用户显示 */}
                {selectedPost.likes.length > 0 && (
                  <View style={detailStyles.likesSection}>
                    <Heart size={14} color="#EF4444" fill="#EF4444" />
                    <Text style={detailStyles.likesText} numberOfLines={2}>
                      {selectedPost.likes.slice(0, 5).map((userId, idx) => {
                        const likedUser = posts.find(p => p.userId === userId);
                        const name = likedUser?.userNickname || userId.slice(-4);
                        return idx === 0 ? name : `, ${name}`;
                      }).join('')}
                      {selectedPost.likes.length > 5 && ` ${t('square.andMore', { count: selectedPost.likes.length - 5 })}`}
                    </Text>
                  </View>
                )}
                
                {/* 评论列表 - 支持置顶和嵌套回复 */}
                {(() => {
                  // 组织评论：主评论和回复分开
                  const topLevelComments = selectedPost.comments.filter(c => !c.replyToCommentId);
                  const replyComments = selectedPost.comments.filter(c => c.replyToCommentId);
                  
                  // 置顶评论放最前面
                  const pinnedComment = selectedPost.pinnedCommentId 
                    ? topLevelComments.find(c => c.id === selectedPost.pinnedCommentId)
                    : null;
                  const unpinnedTopComments = topLevelComments
                    .filter(c => c.id !== selectedPost.pinnedCommentId)
                    .sort((a, b) => b.createdAt - a.createdAt);
                  const sortedTopComments = pinnedComment 
                    ? [pinnedComment, ...unpinnedTopComments]
                    : unpinnedTopComments;
                  
                  return sortedTopComments.map((comment, idx) => {
                    const isPinned = selectedPost.pinnedCommentId === comment.id;
                    const replies = replyComments
                      .filter(r => r.replyToCommentId === comment.id)
                      .sort((a, b) => a.createdAt - b.createdAt);
                    
                    return (
                      <View key={comment.id}>
                        {/* 主评论 */}
                        <View style={detailStyles.commentItem}>
                          {comment.userAvatar ? (
                            <Image source={{ uri: comment.userAvatar }} style={detailStyles.commentAvatar} />
                          ) : (
                            <View style={detailStyles.commentAvatarPlaceholder}>
                              <Text style={detailStyles.commentAvatarText}>
                                {comment.userNickname.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <View style={detailStyles.commentMain}>
                            <View style={detailStyles.commentHeader}>
                              <Text style={detailStyles.commentAuthor}>{comment.userNickname}</Text>
                              {comment.userId === selectedPost.userId && (
                                <View style={detailStyles.authorBadge}>
                                  <Text style={detailStyles.authorBadgeText}>{t('square.author')}</Text>
                                </View>
                              )}
                              {isPinned && (
                                <View style={detailStyles.pinnedBadge}>
                                  <Pin size={10} color="#FF6B35" fill="#FF6B35" />
                                  <Text style={detailStyles.pinnedBadgeText}>{t('square.pinned')}</Text>
                                </View>
                              )}
                            </View>
                            <Text style={detailStyles.commentText}>{comment.content}</Text>
                            <View style={detailStyles.commentMeta}>
                              <Text style={detailStyles.commentTime}>{formatTime(comment.createdAt)}</Text>
                              <TouchableOpacity 
                                style={detailStyles.commentReplyButton}
                                onPress={() => handleCommentPress(selectedPost.id, comment, selectedPost.userId)}
                              >
                                <Text style={detailStyles.commentReplyText}>{t('square.reply')}</Text>
                              </TouchableOpacity>
                            </View>
                            {idx === 0 && !isPinned && (
                              <View style={detailStyles.firstCommentBadge}>
                                <Text style={detailStyles.firstCommentBadgeText}>{t('square.firstComment')}</Text>
                              </View>
                            )}
                          </View>
                          <View style={detailStyles.commentActions}>
                            <Heart size={16} color="#9CA3AF" />
                            <MessageCircle size={16} color="#9CA3AF" />
                          </View>
                        </View>
                        
                        {/* 回复评论 - 嵌套显示 */}
                        {replies.map((reply) => (
                          <View key={reply.id} style={[detailStyles.commentItem, detailStyles.replyItem]}>
                            {reply.userAvatar ? (
                              <Image source={{ uri: reply.userAvatar }} style={detailStyles.replyAvatar} />
                            ) : (
                              <View style={detailStyles.replyAvatarPlaceholder}>
                                <Text style={detailStyles.replyAvatarText}>
                                  {reply.userNickname.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            )}
                            <View style={detailStyles.commentMain}>
                              <View style={detailStyles.commentHeader}>
                                <Text style={detailStyles.commentAuthor}>{reply.userNickname}</Text>
                                {reply.userId === selectedPost.userId && (
                                  <View style={detailStyles.authorBadge}>
                                    <Text style={detailStyles.authorBadgeText}>{t('square.author')}</Text>
                                  </View>
                                )}
                              </View>
                              <Text style={detailStyles.commentText}>
                                {reply.replyToNickname && (
                                  <Text style={detailStyles.replyToText}>@{reply.replyToNickname} </Text>
                                )}
                                {reply.content}
                              </Text>
                              <View style={detailStyles.commentMeta}>
                                <Text style={detailStyles.commentTime}>{formatTime(reply.createdAt)}</Text>
                                <TouchableOpacity 
                                  style={detailStyles.commentReplyButton}
                                  onPress={() => handleCommentPress(selectedPost.id, reply, selectedPost.userId)}
                                >
                                  <Text style={detailStyles.commentReplyText}>{t('square.reply')}</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                            <View style={detailStyles.commentActions}>
                              <Heart size={14} color="#9CA3AF" />
                            </View>
                          </View>
                        ))}
                      </View>
                    );
                  });
                })()}
                
                {selectedPost.comments.length === 0 && (
                  <View style={detailStyles.noComments}>
                    <Text style={detailStyles.noCommentsText}>{t('square.noComments')}</Text>
                  </View>
                )}
                
                {/* 底部留白 */}
                <View style={{ height: 100 }} />
              </View>
            </ScrollView>
            
            {/* 底部固定栏 */}
            <View style={[detailStyles.bottomBar, { paddingBottom: Platform.OS === 'ios' ? 30 : 16 }]}>
              <TouchableOpacity 
                style={detailStyles.bottomInputWrapper}
                onPress={() => {
                  setCommentingPost(selectedPost.id);
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
              >
                <Edit3 size={16} color="#9CA3AF" />
                <Text style={detailStyles.bottomInputText}>{t('square.sayWhat')}</Text>
              </TouchableOpacity>
              
              <View style={detailStyles.bottomActions}>
                <TouchableOpacity 
                  style={detailStyles.bottomActionItem}
                  onPress={() => handleLike(selectedPost.id)}
                >
                  <Heart
                    size={24}
                    color={user && selectedPost.likes.includes(user.userId) ? '#EF4444' : '#1a1a1a'}
                    fill={user && selectedPost.likes.includes(user.userId) ? '#EF4444' : 'none'}
                  />
                  <Text style={[
                    detailStyles.bottomActionText,
                    user && selectedPost.likes.includes(user.userId) && { color: '#EF4444' }
                  ]}>{selectedPost.likes.length}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={detailStyles.bottomActionItem}>
                  <Star size={24} color="#1a1a1a" />
                  <Text style={detailStyles.bottomActionText}>0</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={detailStyles.bottomActionItem}
                  onPress={() => {
                    setCommentingPost(selectedPost.id);
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }}
                >
                  <MessageCircle size={24} color="#1a1a1a" />
                  <Text style={detailStyles.bottomActionText}>{selectedPost.comments.length}</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* 评论输入弹窗 - 重构版 */}
            {commentingPost === selectedPost.id && (
              <Modal
                visible={true}
                transparent
                animationType="fade"
                onRequestClose={() => {
                  setCommentingPost(null);
                  setReplyTo(null);
                  setCommentText('');
                }}
              >
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                  style={detailStyles.commentModalContainer}
                >
                  <TouchableOpacity 
                    style={detailStyles.commentModalBackdrop}
                    activeOpacity={1}
                    onPress={() => {
                      setCommentingPost(null);
                      setReplyTo(null);
                      setCommentText('');
                    }}
                  />
                  
                  <View style={detailStyles.commentModalContent}>
                    {replyTo && (
                      <View style={detailStyles.replyIndicator}>
                        <Text style={detailStyles.replyText}>
                          {t('square.replyTo')} @{replyTo.nickname}
                        </Text>
                        <TouchableOpacity 
                          onPress={() => setReplyTo(null)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <X size={18} color="#666" />
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    <View style={detailStyles.commentInputRow}>
                      <TextInput
                        ref={inputRef}
                        style={detailStyles.commentInputField}
                        placeholder={replyTo ? `@${replyTo.nickname}...` : t('square.addComment')}
                        placeholderTextColor="#999"
                        value={commentText}
                        onChangeText={setCommentText}
                        maxLength={200}
                        autoFocus
                        keyboardAppearance="light"
                        returnKeyType="send"
                        blurOnSubmit={false}
                        onSubmitEditing={() => {
                          if (commentText.trim()) {
                            handleSendComment();
                          }
                        }}
                      />
                      <TouchableOpacity
                        style={[
                          detailStyles.commentSendButton, 
                          !commentText.trim() && detailStyles.commentSendButtonDisabled
                        ]}
                        onPress={handleSendComment}
                        disabled={!commentText.trim()}
                      >
                        <Text style={[
                          detailStyles.commentSendButtonText,
                          !commentText.trim() && detailStyles.commentSendButtonTextDisabled
                        ]}>
                          {t('square.send')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </KeyboardAvoidingView>
              </Modal>
            )}
            
            {/* 删除确认 - 仅作者可见 */}
            {user && user.userId === selectedPost.userId && (
              <TouchableOpacity 
                style={detailStyles.deleteButton}
                onPress={() => {
                  handleDelete(selectedPost.id);
                  setSelectedPost(null);
                }}
              >
                <Trash2 size={18} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </Modal>

      {/* 图片查看器 */}
      <Modal
        visible={imageViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setImageViewerVisible(false);
          setSelectedImage(null);
        }}
      >
        <View style={imageViewerStyles.container} pointerEvents={imageViewerVisible ? 'auto' : 'none'}>
          <TouchableOpacity
            style={imageViewerStyles.closeButton}
            onPress={() => {
              setImageViewerVisible(false);
              setSelectedImage(null);
            }}
            activeOpacity={0.8}
          >
            <X size={28} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={imageViewerStyles.content}>
            {selectedImage && (
              <>
                <View style={imageViewerStyles.labelContainer} pointerEvents="none">
                  <View style={imageViewerStyles.labelBadge}>
                    <Text style={imageViewerStyles.labelText}>
                      {selectedImage.type === 'reference' ? t('square.before') : t('square.after')}
                    </Text>
                  </View>
                </View>

                <ZoomableImage uri={selectedImage.uri} onClose={() => {}} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const zoomStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  savingOverlay: {
    position: 'absolute',
    bottom: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  savingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  downloadButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    zIndex: 10,
  },
  downloadButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 102, 255, 0.95)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    minHeight: 300,
  },
  emptyIcon: {
    fontSize: 48,
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
    color: '#64748B',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loginButton: {
    backgroundColor: '#0066FF',
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  postCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  postCardHighlighted: {
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
    borderColor: '#0066FF',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  nickname: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  time: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  imageContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  imageWrapper: {
    flex: 1,
  },
  imageLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  imageLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    flex: 1,
  },
  libraryWarningIconButton: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    marginLeft: 8,
  },
  postImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 80,
  },
  scoreInnerContainer: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 13,
    color: '#64748B',
    flexShrink: 1,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  scoreDescription: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  verdictBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    maxWidth: 140,
    flexShrink: 1,
  },
  verdictText: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  commentsPreview: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  previewCommentItem: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  previewCommentNickname: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginRight: 6,
  },
  previewCommentText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },

  viewMoreComments: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  actionTextActive: {
    color: '#EF4444',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalKeyboardView: {
    maxHeight: '70%',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '100%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  commentsContainer: {
    maxHeight: 300,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  commentUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentContent: {
    flex: 1,
  },
  commentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  commentAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  commentNickname: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  deleteCommentButton: {
    padding: 8,
    marginLeft: 8,
  },
  noCommentsText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 40,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'flex-end',
    gap: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    outlineStyle: 'none' as any,
  },
  commentSendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentSendButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  rateButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F59E0B',
  },
  userRatingContainer: {
    marginTop: 8,
    minHeight: 40,
  },
  userRatingLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  userRatingValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  ratingCount: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '400',
  },
  actionButtonContainer: {
    position: 'relative',
  },
  moreButton: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  actionPopup: {
    position: 'absolute',
    right: 48,
    top: 0,
    flexDirection: 'row',
    backgroundColor: '#4b5563',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    zIndex: 1000,
    minWidth: 140,
    elevation: 1000,
  },
  popupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  popupText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
  popupDivider: {
    width: 1,
    backgroundColor: '#6b7280',
    marginVertical: 2,
  },
  interactionArea: {
    backgroundColor: '#f5f6f7',
    borderRadius: 4,
    marginTop: 6,
    padding: 6,
  },
  likesSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  likesText: {
    flex: 1,
    fontSize: 13,
    color: '#576b95',
    lineHeight: 18,
  },
  interactionDivider: {
    height: 1,
    backgroundColor: '#e5e5e5',
    marginVertical: 8,
  },
  commentsSection: {
    gap: 4,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 2,
    gap: 8,
  },
  commentRowReply: {
    marginLeft: 16,
  },
  commentAuthor: {
    color: '#576b95',
    fontSize: 13,
    fontWeight: '500',
  },
  commentInputOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  inputContainer: {
    flex: 1,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 6,
  },
  replyIndicatorText: {
    fontSize: 12,
    color: '#576b95',
  },
  replyIndicatorClose: {
    fontSize: 14,
    color: '#999',
    paddingLeft: 8,
  },
  sendButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#07c160',
    borderRadius: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#e5e5e5',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
  },
  sendButtonTextDisabled: {
    color: '#999',
  },
  popupBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.01)',
    zIndex: 999,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    backgroundColor: '#FFF5F2',
    borderRadius: 3,
  },
  pinnedText: {
    fontSize: 10,
    color: '#FF6B35',
    fontWeight: '600',
  },
  ratingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  ratingModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  ratingModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  ratingModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  ratingModalClose: {
    fontSize: 24,
    color: '#64748B',
    fontWeight: '300',
  },
  scorePickerContainer: {
    height: 240,
    position: 'relative',
    paddingVertical: 20,
  },
  scorePicker: {
    flex: 1,
  },
  scorePickerContent: {
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  scoreItem: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    borderRadius: 12,
  },
  scoreItemSelected: {
    backgroundColor: '#F0F9FF',
  },
  scoreItemText: {
    fontSize: 32,
    color: '#94A3B8',
    fontWeight: '600',
  },
  scoreItemTextSelected: {
    fontSize: 48,
    color: '#0066FF',
    fontWeight: '800',
  },
  scorePickerIndicator: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: '50%',
    marginTop: -30,
    height: 60,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#E2E8F0',
    pointerEvents: 'none',
  },
  ratingModalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  ratingCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  ratingCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  ratingConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0066FF',
    alignItems: 'center',
  },
  ratingConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  descriptionSection: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  descriptionText: {
    fontSize: 14,
    color: '#0F172A',
    lineHeight: 20,
  },
  imageSourceContainer: {
    marginBottom: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-start',
  },
  singleImageWrapper: {
    flex: 1,
  },
  singleImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  entityInfoCard: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  entityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 6,
  },
  entityIntro: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  keywordChip: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  keywordText: {
    fontSize: 13,
    color: '#0284C7',
    fontWeight: '500',
  },
  outfitChangeContainer: {
    marginBottom: 8,
  },
  outfitImagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  outfitImageWrapper: {
    flex: 1,
  },
  outfitImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  outfitImageResult: {
    width: '95%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignSelf: 'center',
  },
  arrowContainer: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 24,
    color: '#0066FF',
    fontWeight: '700',
  },
  templateBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  templateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  templateIcon: {
    fontSize: 16,
  },
  templateBadgeText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
});

const ratingStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    height: 80,
  },
  scoreNumber: {
    fontSize: 72,
    fontWeight: '800',
    color: '#0F172A',
    width: 160,
    textAlign: 'center',
  },
  scoreLabel: {
    fontSize: 32,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 8,
  },
  sliderContainer: {
    marginBottom: 40,
  },
  sliderWrapper: {
    height: 60,
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 20,
  },
  gradientBar: {
    height: 16,
    borderRadius: 8,
    width: 300,
  },
  thumb: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  thumbInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  scaleMarks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginHorizontal: 20,
  },
  scaleMark: {
    alignItems: 'center',
    width: 30,
  },
  scaleMarkLine: {
    width: 2,
    height: 8,
    backgroundColor: '#E2E8F0',
    marginBottom: 4,
  },
  scaleMarkLineActive: {
    backgroundColor: '#0066FF',
  },
  scaleMarkText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  scaleMarkTextActive: {
    color: '#0066FF',
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  removeButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#0066FF',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

const imageViewerStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 50,
  },
  labelBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  labelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  image: {
    width: '92%',
    height: '78%',
  },
  switchContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  switchButton: {
    backgroundColor: 'rgba(0, 102, 255, 0.9)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  switchButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  hintContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
});

// 画中画瀑布流样式
const pipStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  tabItem: {
    paddingVertical: 8,
    position: 'relative',
  },
  tabText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  tabTextActive: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: '#EF4444',
    borderRadius: 1.5,
  },
  searchButton: {
    padding: 8,
  },
  // 搜索模式样式
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
    paddingVertical: 0,
  },
  cancelButton: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: CARD_GAP,
    paddingTop: CARD_GAP,
  },
  masonryContainer: {
    flexDirection: 'row',
    gap: CARD_GAP,
  },
  column: {
    flex: 1,
    gap: CARD_GAP,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  mainImage: {
    width: '100%',
    aspectRatio: 0.75,
    backgroundColor: '#F3F4F6',
  },
  mainImageWaterfall: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  beforeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  beforeImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  beforeLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 2,
  },
  beforeLabelText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1a1a1a',
    lineHeight: 18,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  followBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#FF2442',
  },
  followBadgeActive: {
    backgroundColor: '#F3F4F6',
  },
  followBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  followBadgeTextActive: {
    color: '#6B7280',
  },
  // 粉丝数标识
  followersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  followersCount: {
    fontSize: 9,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  // 互关标识
  mutualBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  nickname: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    maxWidth: 60,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 8,
  },
  likeCount: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  likeCountActive: {
    color: '#EF4444',
  },
  // 预览评论样式
  commentsPreview: {
    paddingTop: 8,
    paddingHorizontal: 10,
    gap: 4,
  },
  previewComment: {
    fontSize: 12,
    lineHeight: 18,
  },
  previewCommentAuthor: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  previewCommentText: {
    color: '#666',
  },
  viewAllComments: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});

// 帖子详情弹窗样式
const detailStyles = StyleSheet.create({
  // 全屏容器
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // 顶部导航栏 - 参照历史记录页面优化
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
    zIndex: 10,
    minHeight: 72,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginLeft: 0,
  },
  headerUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  headerNickname: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    maxWidth: 120,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF2442',
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF2442',
  },
  shareButton: {
    padding: 4,
  },
  // 滚动视图
  scrollView: {
    flex: 1,
  },
  // 图片轮播容器
  imageCarouselContainer: {
    position: 'relative',
  },
  carouselImageWrapper: {
    width: Dimensions.get('window').width,
    position: 'relative',
  },
  // 主图
  mainImage: {
    width: Dimensions.get('window').width,
    aspectRatio: 0.85,
    backgroundColor: '#f5f5f5',
  },
  // 图片标签（原图/结果）
  imageLabel: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  // 分页指示点
  paginationDots: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 24,
  },
  // 滑动提示
  swipeHint: {
    position: 'absolute',
    bottom: 40,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  swipeHintText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  beforeThumbnail: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  beforeThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  beforeThumbnailLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 2,
  },
  beforeThumbnailLabelText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  imageCounter: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  // 内容区域
  contentSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  contentTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 24,
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  tagIcon: {
    fontSize: 14,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#999',
  },
  // 分隔线
  divider: {
    height: 8,
    backgroundColor: '#f5f5f5',
  },
  // 评论区
  commentsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  commentsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  commentsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  // 评论输入提示
  commentPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
    gap: 10,
  },
  commentPromptAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  commentPromptAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentPromptInput: {
    flex: 1,
  },
  commentPromptText: {
    fontSize: 14,
    color: '#999',
  },
  commentPromptIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  commentPromptIcon: {
    fontSize: 18,
    color: '#999',
  },
  // 评论项
  commentItem: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  commentAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  commentMain: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  authorBadge: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  authorBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF2442',
  },
  commentText: {
    fontSize: 15,
    color: '#1a1a1a',
    lineHeight: 22,
    marginBottom: 8,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  commentReplyButton: {
    paddingVertical: 2,
  },
  commentReplyText: {
    fontSize: 12,
    color: '#999',
  },
  firstCommentBadge: {
    marginTop: 8,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  firstCommentBadgeText: {
    fontSize: 11,
    color: '#999',
  },
  commentActions: {
    alignItems: 'center',
    gap: 12,
    paddingLeft: 8,
  },
  // 点赞用户显示
  likesSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef5f5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  likesText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  // 置顶标签
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#FFF5F2',
    borderRadius: 4,
  },
  pinnedBadgeText: {
    fontSize: 10,
    color: '#FF6B35',
    fontWeight: '600',
  },
  // 回复评论样式
  replyItem: {
    marginLeft: 46,
    paddingTop: 12,
    borderTopWidth: 0,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  replyAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyAvatarText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  replyToText: {
    color: '#1a1a1a',
    fontWeight: '500',
  },
  noComments: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noCommentsText: {
    fontSize: 14,
    color: '#999',
  },
  // 底部固定栏
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: '#f0f0f0',
    gap: 16,
  },
  bottomInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginRight: 12,
  },
  bottomInputText: {
    fontSize: 14,
    color: '#999',
    flex: 1,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  bottomActionItem: {
    alignItems: 'center',
    gap: 2,
  },
  bottomActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  // 评论输入弹窗
  // 评论输入弹窗样式 - 重构版
  commentModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  commentModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  commentModalContent: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  replyText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentInputField: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1a1a',
    minHeight: 40,
    maxHeight: 40,
  },
  commentSendButton: {
    backgroundColor: '#FF2442',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 60,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentSendButtonDisabled: {
    backgroundColor: '#e5e5e5',
  },
  commentSendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  commentSendButtonTextDisabled: {
    color: '#999',
  },
  sendButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sendButtonTextDisabled: {
    color: '#999',
  },
  // 删除按钮
  deleteButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 20,
    right: 60,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
