import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { OutfitChangeHistory } from '@/types/verification';
import { useAuth } from './AuthContext';

const getStorageKeys = (userId: string) => ({
  OUTFIT_CHANGE_HISTORY: `outfit_change_history_${userId}`,
});

export const [VerificationProvider, useVerification] = createContextHook(() => {
  const { user } = useAuth();
  const [outfitChangeHistory, setOutfitChangeHistory] = useState<OutfitChangeHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.userId) {
      if (currentUserId !== user.userId) {
        console.log('[VerificationContext] User changed, reloading data for:', user.userId);
        setCurrentUserId(user.userId);
        loadData(user.userId);
      }
    } else {
      console.log('[VerificationContext] No user, clearing data');
      setCurrentUserId(null);
      setOutfitChangeHistory([]);
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  const loadData = async (userId: string) => {
    try {
      const STORAGE_KEYS = getStorageKeys(userId);
      
      const outfitChangeData = await AsyncStorage.getItem(STORAGE_KEYS.OUTFIT_CHANGE_HISTORY);

      if (outfitChangeData) {
        try {
          const parsed = JSON.parse(outfitChangeData);
          if (Array.isArray(parsed)) {
            setOutfitChangeHistory(parsed);
          } else {
            await AsyncStorage.removeItem(STORAGE_KEYS.OUTFIT_CHANGE_HISTORY);
            setOutfitChangeHistory([]);
          }
        } catch (error) {
          console.error('Failed to parse outfit change history:', error);
          await AsyncStorage.removeItem(STORAGE_KEYS.OUTFIT_CHANGE_HISTORY);
          setOutfitChangeHistory([]);
        }
      } else {
        setOutfitChangeHistory([]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addOutfitChangeHistory = async (
    originalImageUri: string,
    resultImageUri: string,
    templateId: string,
    templateName: string,
    allowSquarePublish: boolean = true
  ): Promise<string> => {
    if (!user?.userId) {
      throw new Error('User not logged in');
    }
    const STORAGE_KEYS = getStorageKeys(user.userId);
    const historyItem: OutfitChangeHistory = {
      id: `outfit_${Date.now()}`,
      originalImageUri,
      resultImageUri,
      templateId,
      templateName,
      createdAt: Date.now(),
      allowSquarePublish,
    };
    
    // 限制历史记录数量为5条，防止存储溢出（每条记录包含大量base64图片数据）
    const updated = [historyItem, ...outfitChangeHistory].slice(0, 5);
    setOutfitChangeHistory(updated);
    
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OUTFIT_CHANGE_HISTORY, JSON.stringify(updated));
      console.log('[VerificationContext] Outfit change history saved, total:', updated.length);
    } catch (error) {
      console.error('[VerificationContext] Failed to save history, storage quota exceeded:', error);
      // 如果保存失败（存储溢出），只保留最新的1条记录
      const minimal = [historyItem];
      setOutfitChangeHistory(minimal);
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.OUTFIT_CHANGE_HISTORY, JSON.stringify(minimal));
        console.log('[VerificationContext] Saved minimal history (1 item) after quota exceeded');
      } catch (minimalError) {
        console.error('[VerificationContext] Even minimal save failed:', minimalError);
        // 最后的尝试：清空历史记录
        setOutfitChangeHistory([]);
        await AsyncStorage.removeItem(STORAGE_KEYS.OUTFIT_CHANGE_HISTORY);
      }
    }
    
    return historyItem.id;
  };

  const deleteOutfitChange = async (outfitChangeId: string): Promise<{ success: boolean; message?: string }> => {
    if (!user?.userId) {
      return { success: false, message: 'User not logged in' };
    }
    const STORAGE_KEYS = getStorageKeys(user.userId);
    const updated = outfitChangeHistory.filter(item => item.id !== outfitChangeId);
    setOutfitChangeHistory(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.OUTFIT_CHANGE_HISTORY, JSON.stringify(updated));
    return { success: true };
  };

  const clearOutfitChangeHistory = async () => {
    if (!user?.userId) return;
    const STORAGE_KEYS = getStorageKeys(user.userId);
    setOutfitChangeHistory([]);
    await AsyncStorage.removeItem(STORAGE_KEYS.OUTFIT_CHANGE_HISTORY);
  };

  const updateOutfitChangePrivacy = async (outfitChangeId: string, allowSquarePublish: boolean): Promise<void> => {
    if (!user?.userId) {
      throw new Error('User not logged in');
    }
    const STORAGE_KEYS = getStorageKeys(user.userId);
    const updated = outfitChangeHistory.map(item => 
      item.id === outfitChangeId ? { ...item, allowSquarePublish } : item
    );
    setOutfitChangeHistory(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.OUTFIT_CHANGE_HISTORY, JSON.stringify(updated));
  };

  return {
    outfitChangeHistory,
    isLoading,
    addOutfitChangeHistory,
    deleteOutfitChange,
    clearOutfitChangeHistory,
    updateOutfitChangePrivacy,
  };
});
