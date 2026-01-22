import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface DailyUsage {
  date: string;
  outfitChangeCount: number;
  shareCount: number; // 每日分享次数
}

interface BonusQuota {
  newUserBonus: number; // 新用户注册奖励（一次性）
  inviteBonus: number; // 邀请好友奖励
  signInStreak: number; // 连续签到天数
  signInBonus: number; // 签到奖励次数
}

const STORAGE_KEYS = {
  COINS: 'user_coins',
  DAILY_USAGE: 'daily_usage',
  BONUS_QUOTA: 'bonus_quota', // 奖励额度
};

// ⭐ 免费额度配置（重大升级）
const FREE_DAILY_LIMIT_REGISTERED = 10; // 提升到10次！
const FREE_DAILY_LIMIT_GUEST = 3; // 访客也提升到3次
const COIN_COST_PER_USE = 10; // 降低钻石消耗（原100 → 10）

// 奖励配置
const REWARDS = {
  NEW_USER_BONUS: 50, // 新用户注册奖励50次
  SHARE_DAILY_LIMIT: 3, // 每日分享最多奖励3次
  SHARE_REWARD_PER_TIME: 3, // 每次分享奖励3次
  INVITE_FRIEND_REWARD: 20, // 邀请好友奖励20次
  SIGN_IN_STREAK_REWARD: 30, // 连续7天签到奖励30次
};

const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const [CoinProvider, useCoin] = createContextHook(() => {
  const { user, isLoggedIn } = useAuth();
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage>({
    date: getTodayDate(),
    outfitChangeCount: 0,
    shareCount: 0,
  });
  const [bonusQuota, setBonusQuota] = useState<BonusQuota>({
    newUserBonus: 0,
    inviteBonus: 0,
    signInStreak: 0,
    signInBonus: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const resetDailyUsageIfNeeded = useCallback((usage: DailyUsage): DailyUsage => {
    const today = getTodayDate();
    if (usage.date !== today) {
      return {
        date: today,
        outfitChangeCount: 0,
        shareCount: 0,
      };
    }
    return {
      date: usage.date,
      outfitChangeCount: usage.outfitChangeCount || 0,
      shareCount: usage.shareCount || 0,
    };
  }, []);

  const loadData = useCallback(async () => {
    try {
      const userKey = isLoggedIn && user ? user.phone : 'guest';
      const [coinsData, usageData, bonusData] = await Promise.all([
        AsyncStorage.getItem(`${STORAGE_KEYS.COINS}_${userKey}`),
        AsyncStorage.getItem(`${STORAGE_KEYS.DAILY_USAGE}_${userKey}`),
        AsyncStorage.getItem(`${STORAGE_KEYS.BONUS_QUOTA}_${userKey}`),
      ]);

      if (coinsData) {
        try {
          if (typeof coinsData !== 'string' || 
              coinsData.trim() === '' || 
              coinsData === 'undefined' || 
              coinsData === 'null' ||
              coinsData.includes('[object Object]') ||
              (!coinsData.match(/^\d+$/) && !coinsData.match(/^[\d.]+$/))) {
            console.error('Invalid coinsData format:', coinsData?.substring(0, 50));
            await AsyncStorage.removeItem(`${STORAGE_KEYS.COINS}_${userKey}`);
            setCoinBalance(0);
          } else {
            const parsed = JSON.parse(coinsData);
            if (typeof parsed === 'number') {
              setCoinBalance(parsed);
            } else {
              console.warn('Invalid coin balance data, resetting...');
              await AsyncStorage.removeItem(`${STORAGE_KEYS.COINS}_${userKey}`);
              setCoinBalance(0);
            }
          }
        } catch (parseError) {
          console.error('Failed to parse coin balance:', parseError, 'Data:', coinsData?.substring(0, 100));
          await AsyncStorage.removeItem(`${STORAGE_KEYS.COINS}_${userKey}`);
          setCoinBalance(0);
        }
      } else {
        setCoinBalance(0);
      }

      if (usageData) {
        try {
          if (typeof usageData !== 'string' || 
              usageData.trim() === '' || 
              usageData === 'undefined' || 
              usageData === 'null' ||
              usageData.includes('[object Object]') ||
              !usageData.startsWith('{')) {
            console.error('Invalid usageData format:', usageData?.substring(0, 50));
            await AsyncStorage.removeItem(`${STORAGE_KEYS.DAILY_USAGE}_${userKey}`);
            const newUsage = {
              date: getTodayDate(),
              outfitChangeCount: 0,
            };
            setDailyUsage(newUsage);
          } else {
            const parsedUsage = JSON.parse(usageData);
            if (parsedUsage && typeof parsedUsage === 'object') {
              const resetUsage = resetDailyUsageIfNeeded(parsedUsage);
              setDailyUsage(resetUsage);
              if (resetUsage.date !== parsedUsage.date) {
                await AsyncStorage.setItem(
                  `${STORAGE_KEYS.DAILY_USAGE}_${userKey}`,
                  JSON.stringify(resetUsage)
                );
              }
            } else {
              console.warn('Invalid daily usage data, resetting...');
              await AsyncStorage.removeItem(`${STORAGE_KEYS.DAILY_USAGE}_${userKey}`);
              const newUsage = {
                date: getTodayDate(),
                outfitChangeCount: 0,
              };
              setDailyUsage(newUsage);
            }
          }
        } catch (parseError) {
          console.error('Failed to parse daily usage, clearing corrupted data:', parseError);
          await AsyncStorage.removeItem(`${STORAGE_KEYS.DAILY_USAGE}_${userKey}`);
          const newUsage = {
            date: getTodayDate(),
            outfitChangeCount: 0,
          };
          setDailyUsage(newUsage);
        }
      } else {
        const newUsage = {
          date: getTodayDate(),
          outfitChangeCount: 0,
          shareCount: 0,
          adWatchCount: 0,
        };
        setDailyUsage(newUsage);
      }

      // 加载奖励额度
      if (bonusData) {
        try {
          const parsedBonus = JSON.parse(bonusData);
          if (parsedBonus && typeof parsedBonus === 'object') {
            setBonusQuota(parsedBonus);
          } else {
            setBonusQuota({
              newUserBonus: 0,
              inviteBonus: 0,
              signInStreak: 0,
              signInBonus: 0,
              adRewardQuota: 0,
            });
          }
        } catch (error) {
          console.error('Failed to parse bonus quota:', error);
          setBonusQuota({
            newUserBonus: 0,
            inviteBonus: 0,
            signInStreak: 0,
            signInBonus: 0,
            adRewardQuota: 0,
          });
        }
      } else {
        // 新用户：赠送新用户奖励
        if (isLoggedIn && user) {
          const initialBonus = {
            newUserBonus: REWARDS.NEW_USER_BONUS, // 🎁 新用户50次
            inviteBonus: 0,
            signInStreak: 1,
            signInBonus: 0,
          };
          setBonusQuota(initialBonus);
          const userKey = user.phone || 'guest';
          await AsyncStorage.setItem(
            `${STORAGE_KEYS.BONUS_QUOTA}_${userKey}`,
            JSON.stringify(initialBonus)
          );
        } else {
          setBonusQuota({
            newUserBonus: 0,
            inviteBonus: 0,
            signInStreak: 0,
            signInBonus: 0,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load coin data:', error);
      setCoinBalance(0);
      setDailyUsage({
        date: getTodayDate(),
        outfitChangeCount: 0,
        shareCount: 0,
      });
      setBonusQuota({
        newUserBonus: 0,
        inviteBonus: 0,
        signInStreak: 0,
        signInBonus: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, user, resetDailyUsageIfNeeded]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveData = async (balance: number, usage: DailyUsage, bonus?: BonusQuota) => {
    try {
      const userKey = isLoggedIn && user ? user.phone : 'guest';
      const promises = [
        AsyncStorage.setItem(`${STORAGE_KEYS.COINS}_${userKey}`, JSON.stringify(balance)),
        AsyncStorage.setItem(`${STORAGE_KEYS.DAILY_USAGE}_${userKey}`, JSON.stringify(usage)),
      ];
      if (bonus) {
        promises.push(
          AsyncStorage.setItem(`${STORAGE_KEYS.BONUS_QUOTA}_${userKey}`, JSON.stringify(bonus))
        );
      }
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to save coin data:', error);
    }
  };

  const addCoins = async (amount: number) => {
    const newBalance = coinBalance + amount;
    setCoinBalance(newBalance);
    await saveData(newBalance, dailyUsage);
  };

  const deductCoins = async (amount: number): Promise<boolean> => {
    if (coinBalance < amount) {
      return false;
    }
    const newBalance = coinBalance - amount;
    setCoinBalance(newBalance);
    await saveData(newBalance, dailyUsage);
    return true;
  };

  const canUseOutfitChange = (): { canUse: boolean; needsCoins: boolean; message: string } => {
    const resetUsage = resetDailyUsageIfNeeded(dailyUsage);
    const freeLimit = isLoggedIn ? FREE_DAILY_LIMIT_REGISTERED : FREE_DAILY_LIMIT_GUEST;
    
    // 计算总可用免费次数 = 每日基础 + 各种奖励
    const totalFreeQuota = freeLimit + 
      bonusQuota.newUserBonus + 
      bonusQuota.inviteBonus + 
      bonusQuota.signInBonus;
    
    const usedCount = resetUsage.outfitChangeCount;

    // 还有免费次数
    if (usedCount < totalFreeQuota) {
      const remaining = totalFreeQuota - usedCount;
      return { 
        canUse: true, 
        needsCoins: false, 
        message: `使用免费次数（剩余${remaining}次）` 
      };
    }

    // 访客用完免费次数
    if (!isLoggedIn) {
      return { 
        canUse: false, 
        needsCoins: false, 
        message: `未登录用户每天${FREE_DAILY_LIMIT_GUEST}次免费，请登录获取更多次数` 
      };
    }

    // 已登录用户用完免费，尝试用钻石
    if (coinBalance >= COIN_COST_PER_USE) {
      return { canUse: true, needsCoins: true, message: `需要消耗${COIN_COST_PER_USE}钻石` };
    }

    // 钻石也不够
    return { 
      canUse: false, 
      needsCoins: true, 
      message: `免费次数已用完，需要${COIN_COST_PER_USE}钻石，请充值` 
    };
  };

  const useOutfitChange = async (): Promise<boolean> => {
    const { canUse, needsCoins } = canUseOutfitChange();
    if (!canUse) {
      return false;
    }

    const resetUsage = resetDailyUsageIfNeeded(dailyUsage);
    const newUsage = {
      ...resetUsage,
      outfitChangeCount: resetUsage.outfitChangeCount + 1,
    };

    let newBalance = coinBalance;
    let newBonus = { ...bonusQuota };

    if (needsCoins) {
      // 使用钻石
      const success = await deductCoins(COIN_COST_PER_USE);
      if (!success) {
        return false;
      }
      newBalance = coinBalance - COIN_COST_PER_USE;
    } else {
      // 使用免费次数，优先消耗奖励额度
      if (newBonus.newUserBonus > 0) {
        newBonus.newUserBonus--;
      } else if (newBonus.signInBonus > 0) {
        newBonus.signInBonus--;
      } else if (newBonus.inviteBonus > 0) {
        newBonus.inviteBonus--;
      }
      // 否则使用每日基础免费次数
    }

    setDailyUsage(newUsage);
    setBonusQuota(newBonus);
    await saveData(newBalance, newUsage, newBonus);
    return true;
  };

  const getRemainingFreeCounts = () => {
    const resetUsage = resetDailyUsageIfNeeded(dailyUsage);
    const freeLimit = isLoggedIn ? FREE_DAILY_LIMIT_REGISTERED : FREE_DAILY_LIMIT_GUEST;
    
    // 总免费次数 = 每日基础 + 各种奖励
    const totalFreeQuota = freeLimit + 
      bonusQuota.newUserBonus + 
      bonusQuota.inviteBonus + 
      bonusQuota.signInBonus;
    
    const used = resetUsage.outfitChangeCount;
    const remaining = Math.max(0, totalFreeQuota - used);
    
    return {
      total: totalFreeQuota,
      used: used,
      remaining: remaining,
      dailyBase: freeLimit,
      bonus: {
        newUser: bonusQuota.newUserBonus,
        invite: bonusQuota.inviteBonus,
        signIn: bonusQuota.signInBonus,
      }
    };
  };

  // 🎁 分享奖励
  const claimShareReward = async (): Promise<{ success: boolean; message: string }> => {
    if (!isLoggedIn) {
      return { success: false, message: '请先登录' };
    }

    const resetUsage = resetDailyUsageIfNeeded(dailyUsage);
    
    if (resetUsage.shareCount >= REWARDS.SHARE_DAILY_LIMIT) {
      return { 
        success: false, 
        message: `今日分享奖励已达上限（${REWARDS.SHARE_DAILY_LIMIT}次）` 
      };
    }

    const newUsage = {
      ...resetUsage,
      shareCount: resetUsage.shareCount + 1,
    };

    const newBonus = {
      ...bonusQuota,
      inviteBonus: bonusQuota.inviteBonus + REWARDS.SHARE_REWARD_PER_TIME,
    };

    setDailyUsage(newUsage);
    setBonusQuota(newBonus);
    await saveData(coinBalance, newUsage, newBonus);

    return { 
      success: true, 
      message: `分享成功！获得${REWARDS.SHARE_REWARD_PER_TIME}次免费生成机会` 
    };
  };

  // 👥 邀请好友奖励
  const claimInviteReward = async (): Promise<{ success: boolean; message: string }> => {
    if (!isLoggedIn) {
      return { success: false, message: '请先登录' };
    }

    const newBonus = {
      ...bonusQuota,
      inviteBonus: bonusQuota.inviteBonus + REWARDS.INVITE_FRIEND_REWARD,
    };

    setBonusQuota(newBonus);
    await saveData(coinBalance, dailyUsage, newBonus);

    return { 
      success: true, 
      message: `邀请成功！获得${REWARDS.INVITE_FRIEND_REWARD}次免费生成机会` 
    };
  };

  // ✅ 签到奖励
  const claimSignInReward = async (): Promise<{ success: boolean; message: string; streak: number }> => {
    if (!isLoggedIn) {
      return { success: false, message: '请先登录', streak: 0 };
    }

    const newStreak = bonusQuota.signInStreak + 1;
    let rewardAmount = 0;
    let message = `签到成功！连续签到${newStreak}天`;

    // 连续7天签到奖励
    if (newStreak % 7 === 0) {
      rewardAmount = REWARDS.SIGN_IN_STREAK_REWARD;
      message += `，获得${rewardAmount}次免费生成机会🎉`;
    }

    const newBonus = {
      ...bonusQuota,
      signInStreak: newStreak,
      signInBonus: bonusQuota.signInBonus + rewardAmount,
    };

    setBonusQuota(newBonus);
    await saveData(coinBalance, dailyUsage, newBonus);

    return { 
      success: true, 
      message,
      streak: newStreak,
    };
  };

  // 检查是否可以分享
  const canShare = (): boolean => {
    if (!isLoggedIn) return false;
    const resetUsage = resetDailyUsageIfNeeded(dailyUsage);
    return resetUsage.shareCount < REWARDS.SHARE_DAILY_LIMIT;
  };

  return {
    // 原有功能
    coinBalance,
    dailyUsage,
    isLoading,
    addCoins,
    deductCoins,
    canUseOutfitChange,
    useOutfitChange,
    getRemainingFreeCounts,
    
    // ⭐ 新增奖励功能
    bonusQuota,
    claimShareReward,
    claimInviteReward,
    claimSignInReward,
    canShare,
    
    // 常量导出（供UI使用）
    FREE_DAILY_LIMIT: isLoggedIn ? FREE_DAILY_LIMIT_REGISTERED : FREE_DAILY_LIMIT_GUEST,
    REWARDS,
  };
});
