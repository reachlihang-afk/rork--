import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Image as ExpoImage } from 'expo-image';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, RefreshControl, Alert, TextInput, Keyboard, TouchableWithoutFeedback, Platform, KeyboardAvoidingView, Modal, PanResponder, Animated, Dimensions } from 'react-native';
import { Heart, MessageSquare, Trash2, MoreHorizontal, Pin, X, AlertTriangle, Download, Search } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSquare, SquarePost, SquareComment } from '@/contexts/SquareContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { saveToGallery } from '@/utils/share';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 10;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_GAP * 3) / 2;


type ZoomableImageProps = {
  uri: string;
  onClose: () => void;
  t: any;
};

function ZoomableImage({ uri, t }: ZoomableImageProps) {
  const [saving, setSaving] = useState(false);
  const { showAlert } = useAlert();

  const handleDownload = async () => {
    if (saving) return;
    
    try {
      setSaving(true);
      const success = await saveToGallery(uri);
      if (success) {
        showAlert({
          type: 'success',
          title: t('common.success'),
          message: t('outfitChange.downloadSuccess')
        });
      } else {
        showAlert({
          type: 'error',
          title: t('common.error'),
          message: t('outfitChange.downloadFailed')
        });
      }
    } catch (error) {
      console.error('Download failed:', error);
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: t('outfitChange.downloadFailed')
      });
    } finally {
      setSaving(false);
    }
  };

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
        {saving && (
          <View style={zoomStyles.savingOverlay}>
            <Text style={zoomStyles.savingText}>{t('common.saving')}...</Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity
        style={zoomStyles.downloadButton}
        onPress={handleDownload}
        disabled={saving}
        activeOpacity={0.8}
      >
        <View style={zoomStyles.downloadButtonInner}>
          <Download size={20} color="#fff" strokeWidth={2.5} />
          <Text style={zoomStyles.downloadButtonText}>{t('common.save')}</Text>
        </View>
      </TouchableOpacity>
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
  const { highlightPostId } = useLocalSearchParams<{ highlightPostId?: string }>();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'follow' | 'explore' | 'nearby'>('explore');
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
  const scrollViewRef = useRef<ScrollView>(null);
  const postRefs = useRef<Map<string, View>>(new Map());
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  // 将帖子分为左右两列（瀑布流布局）
  const { leftColumn, rightColumn } = useMemo(() => {
    const left: SquarePost[] = [];
    const right: SquarePost[] = [];
    posts.forEach((post, index) => {
      if (index % 2 === 0) {
        left.push(post);
      } else {
        right.push(post);
      }
    });
    return { leftColumn: left, rightColumn: right };
  }, [posts]);

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

  

  // 渲染画中画卡片
  const renderPIPCard = (post: SquarePost) => {
    if (post.postType !== 'outfitChange' || !post.resultImageUri) return null;
    
    const isLiked = user ? post.likes.includes(user.userId) : false;
    
    return (
      <TouchableOpacity
        key={post.id}
        style={pipStyles.card}
        activeOpacity={0.95}
        onPress={() => setSelectedPost(post)}
      >
        {/* 主图（变装结果） */}
        <View style={pipStyles.imageContainer}>
          <Image
            source={{ uri: post.resultImageUri }}
            style={pipStyles.mainImage}
            resizeMode="cover"
          />
          
          {/* 左上角原图缩略图 */}
          {post.originalImageUri && (
            <View style={pipStyles.beforeBadge}>
              <Image
                source={{ uri: post.originalImageUri }}
                style={pipStyles.beforeImage}
                resizeMode="cover"
              />
              <View style={pipStyles.beforeLabel}>
                <Text style={pipStyles.beforeLabelText}>{t('square.before')}</Text>
              </View>
            </View>
          )}
        </View>
        
        {/* 描述文字 */}
        {post.description && (
          <Text style={pipStyles.description} numberOfLines={2}>
            {post.description}
          </Text>
        )}
        
        {/* 用户信息和点赞 */}
        <View style={pipStyles.footer}>
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
      </TouchableOpacity>
    );
  };

  // 渲染顶部Tab导航
  const renderHeader = () => (
    <View style={pipStyles.header}>
      <View style={pipStyles.tabsContainer}>
        <TouchableOpacity
          style={pipStyles.tabItem}
          onPress={() => setActiveTab('follow')}
        >
          <Text style={[pipStyles.tabText, activeTab === 'follow' && pipStyles.tabTextActive]}>
            {t('square.follow')}
          </Text>
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
        <TouchableOpacity
          style={pipStyles.tabItem}
          onPress={() => setActiveTab('nearby')}
        >
          <Text style={[pipStyles.tabText, activeTab === 'nearby' && pipStyles.tabTextActive]}>
            {t('square.nearby')}
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={pipStyles.searchButton}>
        <Search size={22} color="#1a1a1a" />
      </TouchableOpacity>
    </View>
  );

  if (posts.length === 0) {
    return (
      <View style={pipStyles.container}>
        {renderHeader()}
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a1a1a" />}
        >
          <Text style={styles.emptyText}>{t('square.noPosts')}</Text>
        </ScrollView>
      </View>
    );
  }

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
        {/* 瀑布流两列布局 */}
        <View style={pipStyles.masonryContainer}>
          <View style={pipStyles.column}>
            {leftColumn.map(post => renderPIPCard(post))}
          </View>
          <View style={pipStyles.column}>
            {rightColumn.map(post => renderPIPCard(post))}
          </View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 帖子详情弹窗 */}
      <Modal
        visible={!!selectedPost}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPost(null)}
      >
        {selectedPost && (
          <View style={detailStyles.overlay}>
            <TouchableOpacity 
              style={detailStyles.backdrop} 
              activeOpacity={1} 
              onPress={() => setSelectedPost(null)} 
            />
            <View style={detailStyles.container}>
              <View style={detailStyles.handle} />
              
              {/* 关闭按钮 */}
              <TouchableOpacity
                style={detailStyles.closeButton}
                onPress={() => setSelectedPost(null)}
              >
                <X size={24} color="#1a1a1a" />
              </TouchableOpacity>
              
              <ScrollView 
                style={detailStyles.scrollView}
                showsVerticalScrollIndicator={false}
              >
                {/* 图片对比区域 */}
                <View style={detailStyles.imagesSection}>
                  {/* 主图（变装结果） */}
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => {
                      if (selectedPost.resultImageUri) {
                        setSelectedImage({ uri: selectedPost.resultImageUri, type: 'verified', postId: selectedPost.id });
                        setImageViewerVisible(true);
                      }
                    }}
                  >
                    <Image
                      source={{ uri: selectedPost.resultImageUri }}
                      style={detailStyles.mainImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  
                  {/* 原图对比 */}
                  {selectedPost.originalImageUri && (
                    <TouchableOpacity
                      style={detailStyles.beforeContainer}
                      activeOpacity={0.9}
                      onPress={() => {
                        if (selectedPost.originalImageUri) {
                          setSelectedImage({ uri: selectedPost.originalImageUri, type: 'reference', postId: selectedPost.id });
                          setImageViewerVisible(true);
                        }
                      }}
                    >
                      <Image
                        source={{ uri: selectedPost.originalImageUri }}
                        style={detailStyles.beforeImage}
                        resizeMode="cover"
                      />
                      <View style={detailStyles.beforeLabel}>
                        <Text style={detailStyles.beforeLabelText}>{t('square.before')}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
                
                {/* 用户信息 */}
                <View style={detailStyles.userSection}>
                  <TouchableOpacity 
                    style={detailStyles.userInfo}
                    onPress={() => {
                      if (user && selectedPost.userId !== user.userId) {
                        setSelectedPost(null);
                        router.push(`/user-profile/${selectedPost.userId}` as any);
                      }
                    }}
                    disabled={!user || selectedPost.userId === user?.userId}
                  >
                    {selectedPost.userAvatar ? (
                      <Image source={{ uri: selectedPost.userAvatar }} style={detailStyles.avatar} />
                    ) : (
                      <View style={detailStyles.avatarPlaceholder}>
                        <Text style={detailStyles.avatarText}>
                          {selectedPost.userNickname.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View>
                      <Text style={detailStyles.nickname}>{selectedPost.userNickname}</Text>
                      <Text style={detailStyles.time}>{formatTime(selectedPost.createdAt)}</Text>
                    </View>
                  </TouchableOpacity>
                  
                  {user && user.userId === selectedPost.userId && (
                    <TouchableOpacity onPress={() => {
                      handleDelete(selectedPost.id);
                      setSelectedPost(null);
                    }}>
                      <Trash2 size={20} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
                
                {/* 描述 */}
                {selectedPost.description && (
                  <Text style={detailStyles.description}>{selectedPost.description}</Text>
                )}
                
                {/* 模板标签 */}
                {selectedPost.templateName && (
                  <View style={[detailStyles.templateBadge, { backgroundColor: getTemplateBadgeColor(selectedPost.templateName) }]}>
                    <Text style={detailStyles.templateIcon}>{getTemplateIcon(selectedPost.templateName)}</Text>
                    <Text style={detailStyles.templateText}>{selectedPost.templateName}</Text>
                  </View>
                )}
                
                {/* 互动区域 */}
                <View style={detailStyles.actionsRow}>
                  <TouchableOpacity 
                    style={detailStyles.actionButton}
                    onPress={() => handleLike(selectedPost.id)}
                  >
                    <Heart
                      size={22}
                      color={user && selectedPost.likes.includes(user.userId) ? '#EF4444' : '#6B7280'}
                      fill={user && selectedPost.likes.includes(user.userId) ? '#EF4444' : 'none'}
                    />
                    <Text style={[
                      detailStyles.actionText,
                      user && selectedPost.likes.includes(user.userId) && detailStyles.actionTextActive
                    ]}>
                      {selectedPost.likes.length}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={detailStyles.actionButton}
                    onPress={() => {
                      setCommentingPost(selectedPost.id);
                      setTimeout(() => inputRef.current?.focus(), 100);
                    }}
                  >
                    <MessageSquare size={22} color="#6B7280" />
                    <Text style={detailStyles.actionText}>{selectedPost.comments.length}</Text>
                  </TouchableOpacity>
                </View>
                
                {/* 评论区 */}
                {selectedPost.comments.length > 0 && (
                  <View style={detailStyles.commentsSection}>
                    <Text style={detailStyles.commentsTitle}>{t('square.comments')} ({selectedPost.comments.length})</Text>
                    {selectedPost.comments.slice(0, 5).map(comment => (
                      <TouchableOpacity
                        key={comment.id}
                        style={detailStyles.commentItem}
                        onPress={() => handleCommentPress(selectedPost.id, comment, selectedPost.userId)}
                      >
                        {comment.userAvatar ? (
                          <Image source={{ uri: comment.userAvatar }} style={detailStyles.commentAvatar} />
                        ) : (
                          <View style={detailStyles.commentAvatarPlaceholder}>
                            <Text style={detailStyles.commentAvatarText}>
                              {comment.userNickname.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View style={detailStyles.commentContent}>
                          <Text style={detailStyles.commentAuthor}>{comment.userNickname}</Text>
                          <Text style={detailStyles.commentText}>{comment.content}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                
                <View style={{ height: 100 }} />
              </ScrollView>
              
              {/* 评论输入框 */}
              {commentingPost === selectedPost.id && (
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  style={detailStyles.commentInputContainer}
                >
                  <View style={detailStyles.commentInputWrapper}>
                    {replyTo && (
                      <View style={detailStyles.replyIndicator}>
                        <Text style={detailStyles.replyText}>{t('square.replyTo')} {replyTo.nickname}</Text>
                        <TouchableOpacity onPress={() => setReplyTo(null)}>
                          <X size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                      </View>
                    )}
                    <View style={detailStyles.inputRow}>
                      <TextInput
                        ref={inputRef}
                        style={detailStyles.commentInput}
                        placeholder={t('square.addComment')}
                        placeholderTextColor="#9CA3AF"
                        value={commentText}
                        onChangeText={setCommentText}
                        maxLength={200}
                      />
                      <TouchableOpacity
                        style={[detailStyles.sendButton, !commentText.trim() && detailStyles.sendButtonDisabled]}
                        onPress={handleSendComment}
                        disabled={!commentText.trim()}
                      >
                        <Text style={[detailStyles.sendButtonText, !commentText.trim() && detailStyles.sendButtonTextDisabled]}>
                          {t('square.send')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </KeyboardAvoidingView>
              )}
            </View>
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
                      {selectedImage.type === 'reference' ? t('square.referencePhoto') : t('square.verifiedPhoto')}
                    </Text>
                  </View>
                </View>

                <ZoomableImage uri={selectedImage.uri} onClose={() => {}} t={t} />
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
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 20,
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
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
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
    flex: 1,
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
});

// 帖子详情弹窗样式
const detailStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    minHeight: '70%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  imagesSection: {
    position: 'relative',
    marginHorizontal: 16,
    marginTop: 8,
  },
  mainImage: {
    width: '100%',
    aspectRatio: 0.8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  beforeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingVertical: 3,
  },
  beforeLabelText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
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
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  nickname: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  time: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  description: {
    fontSize: 15,
    color: '#1a1a1a',
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  templateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  templateIcon: {
    fontSize: 16,
  },
  templateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionTextActive: {
    color: '#EF4444',
  },
  commentsSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  commentsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 10,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  commentInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 34,
  },
  commentInputWrapper: {
    gap: 8,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  replyText: {
    fontSize: 13,
    color: '#6B7280',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sendButtonTextDisabled: {
    color: '#9CA3AF',
  },
});
