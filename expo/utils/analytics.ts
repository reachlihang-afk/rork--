/**
 * 数据埋点系统
 * 追踪用户行为和关键指标
 * 
 * 可集成：
 * - Mixpanel（推荐）
 * - Google Analytics 4
 * - 自定义后端
 */

// 事件类型定义
export type AnalyticsEvent = 
  // 用户行为
  | 'photo_upload'
  | 'style_select'
  | 'generation_start'
  | 'generation_success'
  | 'generation_fail'
  | 'generation_save'
  | 'generation_share'
  
  // 社交行为
  | 'post_publish'
  | 'post_like'
  | 'post_unlike'
  | 'post_comment'
  | 'post_share'
  | 'user_follow'
  | 'user_unfollow'
  | 'profile_view'
  
  // 付费行为
  | 'recharge_view'
  | 'recharge_click'
  | 'recharge_success'
  | 'recharge_fail'
  | 'membership_view'
  | 'membership_purchase_click'
  | 'membership_purchase_success'
  
  // 免费额度相关
  | 'free_quota_use'
  | 'free_quota_depleted'
  | 'ad_watch_start'
  | 'ad_watch_complete'
  | 'ad_watch_skip'
  | 'share_for_reward'
  | 'invite_friend'
  | 'sign_in'
  
  // 留存关键
  | 'app_open'
  | 'daily_login'
  | 'feature_discover'
  | 'feature_use'
  | 'screen_view';

// 事件属性接口
export interface AnalyticsProperties {
  [key: string]: string | number | boolean | undefined;
}

// 用户属性接口
export interface UserProperties {
  userId?: string;
  isLoggedIn: boolean;
  accountAge?: number; // 账号年龄（天）
  totalGenerations?: number;
  totalPosts?: number;
  followingCount?: number;
  followersCount?: number;
  membershipType?: 'free' | 'standard' | 'creator';
  membershipExpiryDate?: string;
  // 添加更多用户维度
}

class Analytics {
  private isEnabled: boolean = true;
  private userId: string | null = null;
  private sessionId: string;
  private sessionStartTime: number;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    
    // 初始化第三方SDK（如果需要）
    this.initialize();
  }

  /**
   * 初始化埋点SDK
   */
  private initialize() {
    // 示例：初始化Mixpanel
    // if (typeof mixpanel !== 'undefined') {
    //   mixpanel.init('YOUR_TOKEN');
    // }
    
    // 示例：初始化Google Analytics
    // if (typeof gtag !== 'undefined') {
    //   gtag('config', 'GA_MEASUREMENT_ID');
    // }
    
    console.log('[Analytics] Initialized - Session:', this.sessionId);
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 设置用户ID
   */
  setUserId(userId: string | null) {
    this.userId = userId;
    console.log('[Analytics] User ID set:', userId);
    
    // 同步到第三方SDK
    // if (typeof mixpanel !== 'undefined' && userId) {
    //   mixpanel.identify(userId);
    // }
  }

  /**
   * 设置用户属性
   */
  setUserProperties(properties: UserProperties) {
    console.log('[Analytics] User properties:', properties);
    
    // 同步到第三方SDK
    // if (typeof mixpanel !== 'undefined') {
    //   mixpanel.people.set(properties);
    // }
  }

  /**
   * 追踪事件
   */
  track(event: AnalyticsEvent, properties?: AnalyticsProperties) {
    if (!this.isEnabled) return;

    const eventData = {
      event,
      properties: {
        ...properties,
        userId: this.userId,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        platform: this.getPlatform(),
      },
    };

    console.log('[Analytics] Event:', eventData);

    // 发送到第三方SDK
    // if (typeof mixpanel !== 'undefined') {
    //   mixpanel.track(event, eventData.properties);
    // }

    // 发送到自有后端
    // this.sendToBackend(eventData);
  }

  /**
   * 追踪屏幕浏览
   */
  trackScreenView(screenName: string, properties?: AnalyticsProperties) {
    this.track('screen_view', {
      screen_name: screenName,
      ...properties,
    });
  }

  /**
   * 追踪用户登录
   */
  trackLogin(method: 'phone' | 'email' | 'apple' | 'google') {
    this.track('daily_login', {
      login_method: method,
    });
  }

  /**
   * 追踪生成开始
   */
  trackGenerationStart(properties: {
    styleId?: string;
    styleName?: string;
    mainTab?: string;
    useFreeQuota: boolean;
    remainingFreeQuota: number;
  }) {
    this.track('generation_start', properties);
  }

  /**
   * 追踪生成成功
   */
  trackGenerationSuccess(properties: {
    styleId?: string;
    styleName?: string;
    mainTab?: string;
    duration: number; // 生成耗时（毫秒）
    usedFreeQuota: boolean;
    remainingFreeQuota: number;
  }) {
    this.track('generation_success', properties);
  }

  /**
   * 追踪生成失败
   */
  trackGenerationFail(properties: {
    styleId?: string;
    styleName?: string;
    mainTab?: string;
    error: string;
    errorCode?: string;
  }) {
    this.track('generation_fail', properties);
  }

  /**
   * 追踪发布到广场
   */
  trackPostPublish(properties: {
    postId: string;
    styleId?: string;
    hasCaption: boolean;
    captionLength?: number;
  }) {
    this.track('post_publish', properties);
  }

  /**
   * 追踪点赞
   */
  trackLike(properties: {
    postId: string;
    authorId: string;
    isOwn: boolean;
  }) {
    this.track('post_like', properties);
  }

  /**
   * 追踪关注
   */
  trackFollow(properties: {
    targetUserId: string;
    isMutual: boolean;
    source: 'profile' | 'square' | 'post';
  }) {
    this.track('user_follow', properties);
  }

  /**
   * 追踪充值
   */
  trackRecharge(properties: {
    amount: number;
    currency: string;
    method: 'apple_pay' | 'google_pay' | 'card' | 'paypal';
    productId: string;
    success: boolean;
  }) {
    if (properties.success) {
      this.track('recharge_success', properties);
    } else {
      this.track('recharge_fail', properties);
    }
  }

  /**
   * 追踪广告观看
   */
  trackAdWatch(properties: {
    adType: 'rewarded_video';
    placement: 'outfit_change' | 'recharge_prompt';
    completed: boolean;
    reward?: number;
  }) {
    if (properties.completed) {
      this.track('ad_watch_complete', properties);
    } else {
      this.track('ad_watch_skip', properties);
    }
  }

  /**
   * 追踪分享奖励
   */
  trackShareReward(properties: {
    platform?: 'wechat' | 'weibo' | 'qq' | 'system';
    reward: number;
    dailyShareCount: number;
  }) {
    this.track('share_for_reward', properties);
  }

  /**
   * 追踪免费额度用尽
   */
  trackFreeQuotaDepleted(properties: {
    totalUsed: number;
    dailyBase: number;
    bonusUsed: number;
    showAdPrompt: boolean;
    showRechargePrompt: boolean;
  }) {
    this.track('free_quota_depleted', properties);
  }

  /**
   * 获取平台信息
   */
  private getPlatform(): string {
    // @ts-ignore
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent;
      if (/android/i.test(ua)) return 'android';
      if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
      return 'web';
    }
    return 'unknown';
  }

  /**
   * 发送到自有后端（可选）
   */
  private async sendToBackend(eventData: any) {
    try {
      // await fetch('https://your-backend.com/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(eventData),
      // });
    } catch (error) {
      console.error('[Analytics] Failed to send to backend:', error);
    }
  }

  /**
   * 获取会话时长
   */
  getSessionDuration(): number {
    return Date.now() - this.sessionStartTime;
  }

  /**
   * 启用/禁用埋点
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    console.log('[Analytics] Enabled:', enabled);
  }
}

// 导出单例
export const analytics = new Analytics();

// 便捷函数
export const trackEvent = (event: AnalyticsEvent, properties?: AnalyticsProperties) => {
  analytics.track(event, properties);
};

export const trackScreen = (screenName: string, properties?: AnalyticsProperties) => {
  analytics.trackScreenView(screenName, properties);
};

export const setUserId = (userId: string | null) => {
  analytics.setUserId(userId);
};

export const setUserProperties = (properties: UserProperties) => {
  analytics.setUserProperties(properties);
};
