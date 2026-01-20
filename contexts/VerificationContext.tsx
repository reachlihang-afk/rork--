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
    console.log('[VerificationContext] loadData called for user:', userId);
    try {
      const STORAGE_KEYS = getStorageKeys(userId);
      
      const outfitChangeData = await AsyncStorage.getItem(STORAGE_KEYS.OUTFIT_CHANGE_HISTORY);
      console.log('[VerificationContext] Raw data from storage:', outfitChangeData ? `${outfitChangeData.length} chars` : 'null');

      if (outfitChangeData) {
        try {
          const parsed = JSON.parse(outfitChangeData);
          if (Array.isArray(parsed)) {
            console.log('[VerificationContext] Loaded history count:', parsed.length);
            setOutfitChangeHistory(parsed);
          } else {
            console.warn('[VerificationContext] History data is not an array, clearing');
            await AsyncStorage.removeItem(STORAGE_KEYS.OUTFIT_CHANGE_HISTORY);
            setOutfitChangeHistory([]);
          }
        } catch (error) {
          console.error('[VerificationContext] Failed to parse outfit change history:', error);
          await AsyncStorage.removeItem(STORAGE_KEYS.OUTFIT_CHANGE_HISTORY);
          setOutfitChangeHistory([]);
        }
      } else {
        console.log('[VerificationContext] No history data found in storage');
        setOutfitChangeHistory([]);
      }
    } catch (error) {
      console.error('[VerificationContext] Failed to load data:', error);
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
    console.log('[VerificationContext] addOutfitChangeHistory called');
    console.log('[VerificationContext] - templateId:', templateId);
    console.log('[VerificationContext] - templateName:', templateName);
    console.log('[VerificationContext] - originalImageUri length:', originalImageUri?.length || 0);
    console.log('[VerificationContext] - resultImageUri length:', resultImageUri?.length || 0);
    
    if (!user?.userId) {
      console.error('[VerificationContext] User not logged in, cannot save history');
      throw new Error('User not logged in');
    }
    console.log('[VerificationContext] - userId:', user.userId);
    
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
    console.log('[VerificationContext] Updating state with', updated.length, 'items');
    setOutfitChangeHistory(updated);
    
    try {
      const jsonData = JSON.stringify(updated);
      console.log('[VerificationContext] JSON data size:', Math.round(jsonData.length / 1024), 'KB');
      await AsyncStorage.setItem(STORAGE_KEYS.OUTFIT_CHANGE_HISTORY, jsonData);
      console.log('[VerificationContext] Outfit change history saved successfully, total:', updated.length);
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
