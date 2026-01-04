import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface DailyUsage {
  date: string;
  verificationCount: number;
  imageSourceCount: number;
  outfitChangeCount: number;
}

const STORAGE_KEYS = {
  COINS: 'user_coins',
  DAILY_USAGE: 'daily_usage',
};

const FREE_DAILY_LIMIT_REGISTERED = 5;
const FREE_DAILY_LIMIT_GUEST = 1;
const COIN_COST_PER_USE = 100;

const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const [CoinProvider, useCoin] = createContextHook(() => {
  const { user, isLoggedIn } = useAuth();
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage>({
    date: getTodayDate(),
    verificationCount: 0,
    imageSourceCount: 0,
    outfitChangeCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const resetDailyUsageIfNeeded = useCallback((usage: DailyUsage): DailyUsage => {
    const today = getTodayDate();
    if (usage.date !== today) {
      return {
        date: today,
        verificationCount: 0,
        imageSourceCount: 0,
        outfitChangeCount: 0,
      };
    }
    // 确保所有字段都存在，处理旧数据没有 outfitChangeCount 的情况
    return {
      date: usage.date,
      verificationCount: usage.verificationCount || 0,
      imageSourceCount: usage.imageSourceCount || 0,
      outfitChangeCount: usage.outfitChangeCount || 0,
    };
  }, []);

  const loadData = useCallback(async () => {
    try {
      const userKey = isLoggedIn && user ? user.phone : 'guest';
      const [coinsData, usageData] = await Promise.all([
        AsyncStorage.getItem(`${STORAGE_KEYS.COINS}_${userKey}`),
        AsyncStorage.getItem(`${STORAGE_KEYS.DAILY_USAGE}_${userKey}`),
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
              verificationCount: 0,
              imageSourceCount: 0,
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
                verificationCount: 0,
                imageSourceCount: 0,
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
            verificationCount: 0,
            imageSourceCount: 0,
            outfitChangeCount: 0,
          };
          setDailyUsage(newUsage);
        }
      } else {
        const newUsage = {
          date: getTodayDate(),
          verificationCount: 0,
          imageSourceCount: 0,
          outfitChangeCount: 0,
        };
        setDailyUsage(newUsage);
      }
    } catch (error) {
      console.error('Failed to load coin data:', error);
      setCoinBalance(0);
      setDailyUsage({
        date: getTodayDate(),
        verificationCount: 0,
        imageSourceCount: 0,
        outfitChangeCount: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, user, resetDailyUsageIfNeeded]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveData = async (balance: number, usage: DailyUsage) => {
    try {
      const userKey = isLoggedIn && user ? user.phone : 'guest';
      await Promise.all([
        AsyncStorage.setItem(`${STORAGE_KEYS.COINS}_${userKey}`, JSON.stringify(balance)),
        AsyncStorage.setItem(`${STORAGE_KEYS.DAILY_USAGE}_${userKey}`, JSON.stringify(usage)),
      ]);
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

  const canUseVerification = (): { canUse: boolean; needsCoins: boolean; message: string } => {
    const resetUsage = resetDailyUsageIfNeeded(dailyUsage);
    const freeLimit = isLoggedIn ? FREE_DAILY_LIMIT_REGISTERED : FREE_DAILY_LIMIT_GUEST;

    if (resetUsage.verificationCount < freeLimit) {
      return { canUse: true, needsCoins: false, message: '使用免费次数' };
    }

    if (!isLoggedIn) {
      return { 
        canUse: false, 
        needsCoins: false, 
        message: '未登录用户每天仅限1次免费验证，请登录后继续使用' 
      };
    }

    if (coinBalance >= COIN_COST_PER_USE) {
      return { canUse: true, needsCoins: true, message: `需要消耗${COIN_COST_PER_USE}金币` };
    }

    return { 
      canUse: false, 
      needsCoins: true, 
      message: `金币不足，需要${COIN_COST_PER_USE}金币，请充值` 
    };
  };

  const canUseImageSource = (): { canUse: boolean; needsCoins: boolean; message: string } => {
    const resetUsage = resetDailyUsageIfNeeded(dailyUsage);
    const freeLimit = isLoggedIn ? FREE_DAILY_LIMIT_REGISTERED : FREE_DAILY_LIMIT_GUEST;

    if (resetUsage.imageSourceCount < freeLimit) {
      return { canUse: true, needsCoins: false, message: '使用免费次数' };
    }

    if (!isLoggedIn) {
      return { 
        canUse: false, 
        needsCoins: false, 
        message: '未登录用户每天仅限1次免费找出处，请登录后继续使用' 
      };
    }

    if (coinBalance >= COIN_COST_PER_USE) {
      return { canUse: true, needsCoins: true, message: `需要消耗${COIN_COST_PER_USE}金币` };
    }

    return { 
      canUse: false, 
      needsCoins: true, 
      message: `金币不足，需要${COIN_COST_PER_USE}金币，请充值` 
    };
  };

  const useVerification = async (): Promise<boolean> => {
    const { canUse, needsCoins } = canUseVerification();
    if (!canUse) {
      return false;
    }

    const resetUsage = resetDailyUsageIfNeeded(dailyUsage);
    const newUsage = {
      ...resetUsage,
      verificationCount: resetUsage.verificationCount + 1,
    };

    if (needsCoins) {
      const success = await deductCoins(COIN_COST_PER_USE);
      if (!success) {
        return false;
      }
    }

    setDailyUsage(newUsage);
    await saveData(coinBalance - (needsCoins ? COIN_COST_PER_USE : 0), newUsage);
    return true;
  };

  const useImageSource = async (): Promise<boolean> => {
    const { canUse, needsCoins } = canUseImageSource();
    if (!canUse) {
      return false;
    }

    const resetUsage = resetDailyUsageIfNeeded(dailyUsage);
    const newUsage = {
      ...resetUsage,
      imageSourceCount: resetUsage.imageSourceCount + 1,
    };

    if (needsCoins) {
      const success = await deductCoins(COIN_COST_PER_USE);
      if (!success) {
        return false;
      }
    }

    setDailyUsage(newUsage);
    await saveData(coinBalance - (needsCoins ? COIN_COST_PER_USE : 0), newUsage);
    return true;
  };

  const canUseOutfitChange = (): { canUse: boolean; needsCoins: boolean; message: string } => {
    const resetUsage = resetDailyUsageIfNeeded(dailyUsage);
    const freeLimit = isLoggedIn ? FREE_DAILY_LIMIT_REGISTERED : FREE_DAILY_LIMIT_GUEST;

    if (resetUsage.outfitChangeCount < freeLimit) {
      return { canUse: true, needsCoins: false, message: '使用免费次数' };
    }

    if (!isLoggedIn) {
      return { 
        canUse: false, 
        needsCoins: false, 
        message: '未登录用户每天仅限1次免费换装，请登录后继续使用' 
      };
    }

    if (coinBalance >= COIN_COST_PER_USE) {
      return { canUse: true, needsCoins: true, message: `需要消耗${COIN_COST_PER_USE}金币` };
    }

    return { 
      canUse: false, 
      needsCoins: true, 
      message: `金币不足，需要${COIN_COST_PER_USE}金币，请充值` 
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

    if (needsCoins) {
      const success = await deductCoins(COIN_COST_PER_USE);
      if (!success) {
        return false;
      }
    }

    setDailyUsage(newUsage);
    await saveData(coinBalance - (needsCoins ? COIN_COST_PER_USE : 0), newUsage);
    return true;
  };

  const getRemainingFreeCounts = () => {
    const resetUsage = resetDailyUsageIfNeeded(dailyUsage);
    const freeLimit = isLoggedIn ? FREE_DAILY_LIMIT_REGISTERED : FREE_DAILY_LIMIT_GUEST;
    
    return {
      verification: Math.max(0, freeLimit - resetUsage.verificationCount),
      imageSource: Math.max(0, freeLimit - resetUsage.imageSourceCount),
      outfitChange: Math.max(0, freeLimit - resetUsage.outfitChangeCount),
    };
  };

  return {
    coinBalance,
    dailyUsage,
    isLoading,
    addCoins,
    deductCoins,
    canUseVerification,
    canUseImageSource,
    canUseOutfitChange,
    useVerification,
    useImageSource,
    useOutfitChange,
    getRemainingFreeCounts,
  };
});
