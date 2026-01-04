import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Image as ExpoImage } from 'expo-image';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, RefreshControl, Alert, TextInput, Keyboard, TouchableWithoutFeedback, Platform, KeyboardAvoidingView, Modal, PanResponder, Animated } from 'react-native';
import { Heart, MessageSquare, Trash2, MoreHorizontal, Pin, Star, X, AlertTriangle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSquare, SquarePost, SquareComment } from '@/contexts/SquareContext';
import { useAuth } from '@/contexts/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';


interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  selectedScore: number;
  onScoreChange: (score: number) => void;
  onConfirm: () => void;
  onRemove: () => void;
  hasExistingRating: boolean;
}

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

function RatingModal({
  visible,
  onClose,
  selectedScore,
  onScoreChange,
  onConfirm,
  onRemove,
  hasExistingRating
}: RatingModalProps) {
  const { t } = useTranslation();
  const pan = useRef(new Animated.Value(0)).current;
  const sliderWidth = 300;
  const scoreRange = 10;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (_, gestureState) => {
          const newScore = Math.max(0, Math.min(10, (gestureState.x0 - 40) / (sliderWidth / scoreRange)));
          onScoreChange(Math.round(newScore * 10) / 10);
        },
        onPanResponderMove: (_, gestureState) => {
          const position = gestureState.moveX - 40;
          const clampedPosition = Math.max(0, Math.min(sliderWidth, position));
          const newScore = Math.max(0, Math.min(10, (clampedPosition / sliderWidth) * scoreRange));
          onScoreChange(Math.round(newScore * 10) / 10);
          pan.setValue(clampedPosition);
        },
        onPanResponderRelease: () => {},
      }),
    [onScoreChange, pan, sliderWidth, scoreRange]
  );

  const getGradientColor = (score: number): string[] => {
    if (score <= 3) {
      return ['#DC2626', '#EF4444', '#F87171'];
    } else if (score <= 6) {
      return ['#EA580C', '#F59E0B', '#FBBF24'];
    } else {
      return ['#059669', '#10B981', '#34D399'];
    }
  };

  const thumbPosition = (selectedScore / scoreRange) * sliderWidth;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={ratingStyles.overlay}>
          <TouchableWithoutFeedback>
            <View style={ratingStyles.content}>
              <View style={ratingStyles.header}>
                <Text style={ratingStyles.title}>{t('square.selectScore')}</Text>
                <TouchableOpacity onPress={onClose}>
                  <X size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={ratingStyles.scoreDisplay}>
                <Text style={ratingStyles.scoreNumber}>{selectedScore % 1 === 0 ? selectedScore.toFixed(0) : selectedScore.toFixed(1)}</Text>
                <Text style={ratingStyles.scoreLabel}>/10</Text>
              </View>

              <View style={ratingStyles.sliderContainer}>
                <View style={ratingStyles.sliderWrapper} {...panResponder.panHandlers}>
                  <LinearGradient
                    colors={['#DC2626', '#F59E0B', '#FBBF24', '#34D399', '#10B981']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={ratingStyles.gradientBar}
                  />
                  <Animated.View
                    style={[
                      ratingStyles.thumb,
                      {
                        left: thumbPosition - 20,
                        backgroundColor: getGradientColor(selectedScore)[1],
                      },
                    ]}
                  >
                    <View style={ratingStyles.thumbInner} />
                  </Animated.View>
                </View>

                <View style={ratingStyles.scaleMarks}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((mark) => (
                    <TouchableOpacity
                      key={mark}
                      style={ratingStyles.scaleMark}
                      onPress={() => onScoreChange(mark)}
                    >
                      <View
                        style={[
                          ratingStyles.scaleMarkLine,
                          mark === selectedScore && ratingStyles.scaleMarkLineActive,
                        ]}
                      />
                      <Text
                        style={[
                          ratingStyles.scaleMarkText,
                          mark === selectedScore && ratingStyles.scaleMarkTextActive,
                        ]}
                      >
                        {mark}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={ratingStyles.actions}>
                {hasExistingRating && (
                  <TouchableOpacity style={ratingStyles.removeButton} onPress={onRemove}>
                    <Text style={ratingStyles.removeButtonText}>{t('square.removeRating')}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[ratingStyles.cancelButton, hasExistingRating && { flex: 1 }]}
                  onPress={onClose}
                >
                  <Text style={ratingStyles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[ratingStyles.confirmButton, hasExistingRating && { flex: 1 }]}
                  onPress={onConfirm}
                >
                  <Text style={ratingStyles.confirmButtonText}>{t('square.confirmRating')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export default function SquareScreen() {
  const { t } = useTranslation();
  const { posts, likePost, deletePost, addComment, deleteComment, pinComment, ratePost, removeRating, getUserRating, getAverageUserRating } = useSquare();
  const { user } = useAuth();
  const { highlightPostId } = useLocalSearchParams<{ highlightPostId?: string }>();

  const [refreshing, setRefreshing] = useState(false);
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [commentingPost, setCommentingPost] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ commentId: string; userId: string; nickname: string } | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [highlightedPost, setHighlightedPost] = useState<string | null>(null);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedPostForRating, setSelectedPostForRating] = useState<string | null>(null);
  const [selectedScore, setSelectedScore] = useState(10);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ uri: string; type: 'reference' | 'verified'; postId: string } | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const postRefs = useRef<Map<string, View>>(new Map());
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

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
      Alert.alert(t('common.tip'), t('square.loginRequired'));
      return;
    }
    await likePost(postId, user.userId);
  }, [user, t, likePost]);

  const handleDelete = useCallback((postId: string) => {
    Alert.alert(
      t('common.tip'),
      t('square.confirmDelete'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deletePost(postId);
          },
        },
      ]
    );
  }, [t, deletePost]);

  const handleOpenComments = useCallback((postId: string, replyToComment?: { commentId: string; userId: string; nickname: string }) => {
    if (!user) {
      Alert.alert(t('common.tip'), t('square.loginRequired'));
      return;
    }
    setActivePopup(null);
    setCommentingPost(postId);
    setReplyTo(replyToComment || null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [user, t]);

  const handleTogglePopup = useCallback((postId: string) => {
    if (!user) {
      Alert.alert(t('common.tip'), t('square.loginRequired'));
      return;
    }
    setActivePopup(activePopup === postId ? null : postId);
  }, [user, t, activePopup]);

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

  const handleRatePress = useCallback((postId: string) => {
    if (!user) {
      Alert.alert(t('common.tip'), t('square.loginRequired'));
      return;
    }
    const existingRating = getUserRating(postId, user.userId);
    setSelectedPostForRating(postId);
    setSelectedScore(existingRating || 10);
    setRatingModalVisible(true);
  }, [user, t, getUserRating]);

  const handleConfirmRating = useCallback(async () => {
    if (!selectedPostForRating || !user) return;
    await ratePost(selectedPostForRating, user.userId, selectedScore);
    setRatingModalVisible(false);
    setSelectedPostForRating(null);
    Alert.alert(t('common.success'), t('square.ratingSuccess'));
  }, [selectedPostForRating, user, selectedScore, ratePost, t]);

  const handleRemoveRating = useCallback(async () => {
    if (!selectedPostForRating || !user) return;
    await removeRating(selectedPostForRating, user.userId);
    setRatingModalVisible(false);
    setSelectedPostForRating(null);
    Alert.alert(t('common.success'), t('square.ratingRemoved'));
  }, [selectedPostForRating, user, removeRating, t]);


  const handleImagePress = useCallback(
    (uri: string, type: 'reference' | 'verified', postId: string) => {
      console.log('[Square] open image viewer', { postId, type, uri });
      setSelectedImage({ uri, type, postId });
      requestAnimationFrame(() => {
        setImageViewerVisible(true);
      });

      const post = posts.find((p) => p.id === postId);
      const otherUri =
        type === 'reference' ? post?.editedPhotoUri ?? undefined : post?.referencePhotoUri ?? undefined;

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
      const buttons = [
        {
          text: isPinned ? t('square.unpinComment') : t('square.pinComment'),
          onPress: async () => {
            await pinComment(postId, comment.id);
          },
        },
        {
          text: t('common.delete'),
          style: 'destructive' as const,
          onPress: async () => {
            await deleteComment(postId, comment.id);
          },
        },
        { text: t('common.cancel'), style: 'cancel' as const },
      ];
      
      Alert.alert(t('common.tip'), t('square.manageComment'), buttons);
    } else if (isCommentOwner) {
      Alert.alert(
        t('common.tip'),
        t('square.deleteCommentConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: async () => {
              await deleteComment(postId, comment.id);
            },
          },
        ]
      );
    } else {
      const nickname = comment.userNickname || comment.userId.slice(-4);
      if (!nickname) {
        Alert.alert(t('common.tip'), t('square.cannotReply'));
        return;
      }
      handleOpenComments(postId, { commentId: comment.id, userId: comment.userId, nickname });
    }
  }, [user, t, posts, deleteComment, pinComment, handleOpenComments]);



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

  

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t('square.loginToView')}</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Text style={styles.loginButtonText}>{t('profile.login')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={styles.emptyContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.emptyText}>{t('square.noPosts')}</Text>
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        onScrollBeginDrag={() => setActivePopup(null)}
      >
          {posts.map(post => (
        <View 
          key={post.id} 
          style={[
            styles.postCard,
            highlightedPost === post.id && styles.postCardHighlighted
          ]}
          ref={(ref) => {
            if (ref) {
              postRefs.current.set(post.id, ref);
            } else {
              postRefs.current.delete(post.id);
            }
          }}
        >
          <View style={styles.postHeader}>
            <TouchableOpacity 
              style={styles.userInfo}
              onPress={() => {
                if (post.userId !== user.userId) {
                  router.push(`/user-profile/${post.userId}` as any);
                }
              }}
              disabled={post.userId === user.userId}
              activeOpacity={0.7}
            >
              {post.userAvatar ? (
                <Image source={{ uri: post.userAvatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {post.userNickname.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View>
                <Text style={styles.nickname}>{post.userNickname}</Text>
                <Text style={styles.time}>{formatTime(post.createdAt)}</Text>
              </View>
            </TouchableOpacity>
            {user.userId === post.userId && (
              <TouchableOpacity onPress={() => handleDelete(post.id)}>
                <Trash2 size={18} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>

          {post.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionText}>{post.description}</Text>
            </View>
          )}

          <View style={styles.imageContainer}>
            <View style={styles.imageWrapper}>
              <Text style={styles.imageLabel} numberOfLines={1}>{t('square.referencePhoto')}</Text>
              <TouchableOpacity onPress={() => handleImagePress(post.referencePhotoUri, 'reference', post.id)} activeOpacity={0.9}>
                <Image source={{ uri: post.referencePhotoUri }} style={styles.postImage} />
              </TouchableOpacity>
            </View>
            <View style={styles.imageWrapper}>
              <View style={styles.imageLabelRow}>
                <Text style={styles.imageLabel} numberOfLines={1}>{t('square.verifiedPhoto')}</Text>
                {post.photoSource === 'library' && (
                  <TouchableOpacity
                    testID={`square-library-warning-${post.id}`}
                    onPress={() => Alert.alert(t('common.tip'), t('result.libraryPhotoWarning'))}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                    style={styles.libraryWarningIconButton}
                  >
                    <AlertTriangle size={16} color="#F59E0B" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity onPress={() => handleImagePress(post.editedPhotoUri, 'verified', post.id)} activeOpacity={0.9}>
                <Image source={{ uri: post.editedPhotoUri }} style={styles.postImage} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.resultInfo}>
            <View style={styles.scoreContainer}>
              <View style={styles.scoreInnerContainer}>
                <Text style={styles.scoreLabel} numberOfLines={1}>{t('square.aiScore')}</Text>
                <View style={styles.scoreRow}>
                  <Text style={[styles.scoreValue, { color: getScoreColor(post.credibilityScore) }]}>{formatScore(post.credibilityScore)}</Text>
                  <Text style={[styles.scoreDescription, { color: getScoreColor(post.credibilityScore) }]} numberOfLines={1}>
                    {getScoreDescription(post.credibilityScore)}
                  </Text>
                </View>
                <View style={styles.userRatingContainer}>
                  {post.userRatings?.length > 0 && (() => {
                    const avgRating = getAverageUserRating(post.id);
                    return avgRating !== null ? (
                      <>
                        <Text style={styles.userRatingLabel}>{t('square.userRating')}</Text>
                        <Text style={[styles.userRatingValue, { color: getScoreColor(avgRating) }]}>
                          {formatScore(avgRating)} <Text style={styles.ratingCount}>({post.userRatings?.length || 0})</Text>
                        </Text>
                      </>
                    ) : null;
                  })()}
                </View>
              </View>
            </View>
            <View style={[styles.verdictBadge, { backgroundColor: getVerdictColor(post.verdict) + '20' }]}>
              <Text style={[styles.verdictText, { color: getVerdictColor(post.verdict) }]} numberOfLines={1}>
                {getVerdictText(post.verdict)}
              </Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.rateButton}
              onPress={() => handleRatePress(post.id)}
            >
              <Star size={16} color="#F59E0B" fill={getUserRating(post.id, user.userId) !== null ? '#F59E0B' : 'none'} />
              <Text style={styles.rateButtonText}>
                {getUserRating(post.id, user.userId) !== null ? t('square.myRating') : t('square.ratePost')}
              </Text>
            </TouchableOpacity>
            <View style={styles.actionButtonContainer}>
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => handleTogglePopup(post.id)}
              >
                <MoreHorizontal size={20} color="#64748B" />
              </TouchableOpacity>
              
              {activePopup === post.id && (
                <View style={styles.actionPopup}>
                  <TouchableOpacity
                    style={styles.popupItem}
                    onPress={() => handleLikeFromPopup(post.id)}
                  >
                    <Heart
                      size={16}
                      color="#fff"
                      fill={post.likes.includes(user.userId) ? '#fff' : 'none'}
                    />
                    <Text style={styles.popupText} numberOfLines={1}>
                      {post.likes.includes(user.userId) ? t('square.unlike') : t('square.like')}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.popupDivider} />
                  <TouchableOpacity
                    style={styles.popupItem}
                    onPress={() => handleOpenComments(post.id)}
                  >
                    <MessageSquare size={16} color="#fff" />
                    <Text style={styles.popupText} numberOfLines={1}>{t('square.comment')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {(post.likes.length > 0 || post.comments.length > 0) && (
            <View style={styles.interactionArea}>
              {post.likes.length > 0 && (
                <View style={styles.likesSection}>
                  <Heart size={14} color="#576b95" fill="#576b95" />
                  <Text style={styles.likesText} numberOfLines={2}>
                    {getLikedUserNames(post.likes, posts).join(', ')}
                  </Text>
                </View>
              )}
              
              {post.likes.length > 0 && post.comments.length > 0 && (
                <View style={styles.interactionDivider} />
              )}
              
              {post.comments.length > 0 && (
                <View style={styles.commentsSection}>
                  {(() => {
                    const topLevelComments = post.comments.filter(c => !c.replyToCommentId);
                    const replyComments = post.comments.filter(c => c.replyToCommentId);
                    
                    const organizedComments: SquareComment[] = [];
                    
                    const pinnedComment = post.pinnedCommentId 
                      ? topLevelComments.find(c => c.id === post.pinnedCommentId)
                      : null;
                    
                    const unpinnedTopComments = topLevelComments
                      .filter(c => c.id !== post.pinnedCommentId)
                      .sort((a, b) => b.createdAt - a.createdAt);
                    
                    const sortedTopComments = pinnedComment 
                      ? [pinnedComment, ...unpinnedTopComments]
                      : unpinnedTopComments;
                    
                    sortedTopComments.forEach(topComment => {
                      organizedComments.push(topComment);
                      const replies = replyComments
                        .filter(r => r.replyToCommentId === topComment.id)
                        .sort((a, b) => a.createdAt - b.createdAt);
                      organizedComments.push(...replies);
                    });
                    
                    const orphanReplies = replyComments.filter(r => 
                      !topLevelComments.some(t => t.id === r.replyToCommentId) &&
                      !replyComments.some(rc => rc.id === r.replyToCommentId)
                    ).sort((a, b) => b.createdAt - a.createdAt);
                    organizedComments.push(...orphanReplies);
                    
                    const displayComments = expandedComments.has(post.id) 
                      ? organizedComments 
                      : organizedComments.slice(0, 3);
                    
                    return displayComments.map((comment, index) => {
                      const isReply = !!comment.replyToCommentId;
                      const isPinned = post.pinnedCommentId === comment.id;
                      return (
                        <TouchableOpacity
                          key={comment.id}
                          style={[styles.commentRow, isReply && styles.commentRowReply]}
                          onPress={() => handleCommentPress(post.id, comment, post.userId)}
                          activeOpacity={0.7}
                        >
                          {comment.userAvatar ? (
                            <Image source={{ uri: comment.userAvatar }} style={styles.commentAvatar} />
                          ) : (
                            <View style={styles.commentAvatarPlaceholder}>
                              <Text style={styles.commentAvatarText}>
                                {comment.userNickname.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <View style={styles.commentContent}>
                            <Text>
                              <Text style={styles.commentAuthor}>{comment.userNickname}</Text>
                              {isPinned && (
                                <View style={styles.pinnedBadge}>
                                  <Pin size={10} color="#FF6B35" fill="#FF6B35" />
                                  <Text style={styles.pinnedText}>{t('square.pinned')}</Text>
                                </View>
                              )}
                              {comment.replyToNickname && (
                                <Text style={styles.commentText}>
                                  {` ${t('square.replyTo')} `}
                                  <Text style={styles.commentAuthor}>{comment.replyToNickname}</Text>
                                </Text>
                              )}
                              <Text style={styles.commentText}>: {comment.content}</Text>
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    });
                  })()}
                  {post.comments.length > 3 && !expandedComments.has(post.id) && (
                    <TouchableOpacity onPress={() => toggleExpandComments(post.id)}>
                      <Text style={styles.viewMoreComments}>
                        {t('square.viewMoreComments', { count: post.comments.length - 3 })}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {expandedComments.has(post.id) && post.comments.length > 3 && (
                    <TouchableOpacity onPress={() => toggleExpandComments(post.id)}>
                      <Text style={styles.viewMoreComments}>{t('square.collapse')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
          ))}
          <View style={{ height: commentingPost ? 150 : 100 }} />
        </ScrollView>

        {activePopup && (
          <TouchableWithoutFeedback onPress={() => setActivePopup(null)}>
            <View style={styles.popupBackdrop} pointerEvents="box-none">
              <View style={StyleSheet.absoluteFill} pointerEvents="auto" />
            </View>
          </TouchableWithoutFeedback>
        )}

        {commentingPost && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.commentInputOverlay}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <View style={[styles.commentInputWrapper, { paddingBottom: Math.max(8, insets.bottom) }]}>
              <View style={styles.inputContainer}>
                {replyTo && (
                  <View style={styles.replyIndicator}>
                    <Text style={styles.replyIndicatorText}>
                      {t('square.replyTo')} {replyTo.nickname}
                    </Text>
                    <TouchableOpacity onPress={() => setReplyTo(null)}>
                      <Text style={styles.replyIndicatorClose}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <TextInput
                  ref={inputRef}
                  style={styles.commentInput}
                  placeholder={replyTo ? t('square.replyPlaceholder', { name: replyTo.nickname }) : t('square.addComment')}
                  placeholderTextColor="#999"
                  value={commentText}
                  onChangeText={setCommentText}
                  maxLength={200}
                  multiline
                  textAlignVertical="top"
                  editable={true}
                  selectTextOnFocus={true}
                  onBlur={() => {
                    if (!commentText.trim()) {
                      setCommentingPost(null);
                      setReplyTo(null);
                    }
                  }}
                />
              </View>
              <TouchableOpacity
                style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
                onPress={handleSendComment}
                disabled={!commentText.trim()}
              >
                <Text style={[styles.sendButtonText, !commentText.trim() && styles.sendButtonTextDisabled]} numberOfLines={1}>
                  {t('square.send')}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}

        <RatingModal
          visible={ratingModalVisible}
          onClose={() => setRatingModalVisible(false)}
          selectedScore={selectedScore}
          onScoreChange={setSelectedScore}
          onConfirm={handleConfirmRating}
          onRemove={handleRemoveRating}
          hasExistingRating={selectedPostForRating ? getUserRating(selectedPostForRating, user?.userId || '') !== null : false}
        />

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
              testID="square-image-viewer-close"
            >
              <X size={28} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>

            <View style={imageViewerStyles.content} testID="square-image-viewer-content">
              {selectedImage && (
                <>
                  <View style={imageViewerStyles.labelContainer} pointerEvents="none">
                    <View style={imageViewerStyles.labelBadge}>
                      <Text style={imageViewerStyles.labelText}>
                        {selectedImage.type === 'reference' ? t('square.referencePhoto') : t('square.verifiedPhoto')}
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
