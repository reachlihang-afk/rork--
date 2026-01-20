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
        setCurrentUserId(user.userId);
        loadData(user.userId);
      }
    } else {
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
    
    // 添加新记录到历史列表
    const updated = [historyItem, ...outfitChangeHistory];
    setOutfitChangeHistory(updated);
    
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OUTFIT_CHANGE_HISTORY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save history:', error);
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
