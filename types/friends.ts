export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserNickname: string;
  fromUserAvatar?: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Friend {
  userId: string;
  nickname: string;
  avatar?: string;
  phone?: string;
  addedAt: string;
}

export type HistoryVisibility = 'everyone' | 'friends_only' | 'none';
export type HistoryTimeRange = 'all' | 'six_months' | 'three_days';

export interface FriendPrivacySettings {
  allowFriendsViewHistory: boolean;
  historyVisibility: HistoryVisibility;
  historyTimeRange: HistoryTimeRange;
}
