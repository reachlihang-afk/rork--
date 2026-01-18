import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';

interface User {
  phone: string;
  loginTime: string;
  userId: string;
  nickname?: string;
  avatar?: string;
  bio?: string;
  followingCount?: number;
  followersCount?: number;
}

export const [AuthContext, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        try {
          if (typeof stored !== 'string' || 
              stored.trim() === '' || 
              stored === 'undefined' || 
              stored === 'null' ||
              stored.includes('[object Object]') ||
              !stored.startsWith('{')) {
            console.error('Invalid stored user data format:', stored?.substring(0, 50));
            await AsyncStorage.removeItem('user');
          } else {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object' && parsed.phone) {
              setUser(parsed);
            } else {
              console.warn('Invalid user data, clearing storage');
              await AsyncStorage.removeItem('user');
            }
          }
        } catch (parseError) {
          console.error('Failed to parse user data:', parseError, 'Data:', stored?.substring(0, 100));
          await AsyncStorage.removeItem('user');
        }
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateUserId = useCallback((): string => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '012356789';
    
    let id = '';
    for (let i = 0; i < 3; i++) {
      id += letters[Math.floor(Math.random() * letters.length)];
    }
    for (let i = 0; i < 3; i++) {
      id += digits[Math.floor(Math.random() * digits.length)];
    }
    
    return id;
  }, []);

  const login = useCallback(async (phone: string) => {
    const storedUser = await AsyncStorage.getItem('user');
    let existingUser = null;
    if (storedUser && 
        typeof storedUser === 'string' && 
        storedUser.trim() !== '' && 
        storedUser !== 'undefined' &&
        storedUser !== 'null' &&
        !storedUser.includes('[object Object]') &&
        storedUser.startsWith('{')) {
      try {
        existingUser = JSON.parse(storedUser);
      } catch (e) {
        console.error('Failed to parse stored user during login:', e);
        await AsyncStorage.removeItem('user');
      }
    }
    const isNewUser = !existingUser || existingUser.phone !== phone;
    
    const newUser: User = {
      phone,
      loginTime: new Date().toISOString(),
      userId: isNewUser ? generateUserId() : existingUser.userId,
      nickname: !isNewUser && existingUser?.nickname ? existingUser.nickname : undefined,
      avatar: !isNewUser && existingUser?.avatar ? existingUser.avatar : undefined,
      bio: !isNewUser && existingUser?.bio ? existingUser.bio : undefined,
      followingCount: !isNewUser && existingUser?.followingCount ? existingUser.followingCount : 0,
      followersCount: !isNewUser && existingUser?.followersCount ? existingUser.followersCount : 0,
    };
    setUser(newUser);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    
    if (isNewUser) {
      const coinKey = `user_coins_${phone}`;
      try {
        const existingCoins = await AsyncStorage.getItem(coinKey);
        if (!existingCoins) {
          await AsyncStorage.setItem(coinKey, JSON.stringify(1000));
        }
      } catch (error) {
        console.error('Failed to initialize coins:', error);
      }
    }
  }, [generateUserId]);

  const logout = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
  }, []);

  const updateProfile = useCallback(async (nickname: string, avatar: string, bio?: string) => {
    const trimmed = nickname.trim();
    console.log('[AuthContext] updateProfile called:', { nickname: trimmed, avatar: avatar ? 'has avatar' : 'no avatar', bio });

    if (!trimmed) {
      throw new Error('Nickname is required');
    }

    if (!user) {
      console.error('[AuthContext] No user found');
      throw new Error('No user');
    }

    const nicknameRegistryKey = 'nickname_registry';
    let nicknameRegistry: Record<string, string> = {};
    
    try {
      const stored = await AsyncStorage.getItem(nicknameRegistryKey);
      if (stored) {
        nicknameRegistry = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[AuthContext] Failed to load nickname registry:', error);
    }

    const existingUserId = nicknameRegistry[trimmed.toLowerCase()];
    if (existingUserId && existingUserId !== user.userId) {
      throw new Error('NICKNAME_TAKEN');
    }

    if (user.nickname && user.nickname.toLowerCase() !== trimmed.toLowerCase()) {
      delete nicknameRegistry[user.nickname.toLowerCase()];
    }

    nicknameRegistry[trimmed.toLowerCase()] = user.userId;
    await AsyncStorage.setItem(nicknameRegistryKey, JSON.stringify(nicknameRegistry));

    const updatedUser: User = {
      ...user,
      nickname: trimmed,
      avatar: avatar || undefined,
      bio: bio?.trim() || user.bio,
    };

    setUser(updatedUser);

    const jsonString = JSON.stringify(updatedUser);
    console.log('[AuthContext] Saving to AsyncStorage, length:', jsonString.length);
    await AsyncStorage.setItem('user', jsonString);

    console.log('[AuthContext] Profile updated successfully');
    return updatedUser;
  }, [user]);

  return {
    user,
    isLoading,
    isLoggedIn: !!user,
    login,
    logout,
    updateProfile,
  };
});
