import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { ReferencePhoto, VerificationHistory, VerificationResult, ImageSourceHistory, ImageSourceAnalysis, PhotoMetadata, OutfitChangeHistory } from '@/types/verification';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import i18n from 'i18next';
import { useAuth } from './AuthContext';

const DEVICE_ID_KEY = 'device_id';

const getStorageKeys = (userId: string) => ({
  REFERENCE_PHOTOS: `reference_photos_${userId}`,
  VERIFICATION_HISTORY: `verification_history_${userId}`,
  IMAGE_SOURCE_HISTORY: `image_source_history_${userId}`,
  OUTFIT_CHANGE_HISTORY: `outfit_change_history_${userId}`,
});

export const [VerificationProvider, useVerification] = createContextHook(() => {
  const { user } = useAuth();
  const [referencePhotos, setReferencePhotos] = useState<ReferencePhoto[]>([]);
  const [verificationHistory, setVerificationHistory] = useState<VerificationHistory[]>([]);
  const [imageSourceHistory, setImageSourceHistory] = useState<ImageSourceHistory[]>([]);
  const [outfitChangeHistory, setOutfitChangeHistory] = useState<OutfitChangeHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceId, setDeviceId] = useState<string>('');
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
      setReferencePhotos([]);
      setVerificationHistory([]);
      setImageSourceHistory([]);
      setOutfitChangeHistory([]);
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  const getOrCreateDeviceId = async (): Promise<string> => {
    try {
      let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (!id) {
        id = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        await AsyncStorage.setItem(DEVICE_ID_KEY, id);
        console.log('Created new device ID:', id);
      }
      return id;
    } catch (error) {
      console.error('Failed to get/create device ID:', error);
      return `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
  };

  const loadData = async (userId: string) => {
    try {
      const STORAGE_KEYS = getStorageKeys(userId);
      const id = await getOrCreateDeviceId();
      setDeviceId(id);
      
      const [photosData, historyData, imageSourceData, outfitChangeData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.REFERENCE_PHOTOS),
        AsyncStorage.getItem(STORAGE_KEYS.VERIFICATION_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.IMAGE_SOURCE_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.OUTFIT_CHANGE_HISTORY),
      ]);

      if (photosData) {
        try {
          if (typeof photosData !== 'string' || 
              photosData.trim() === '' || 
              photosData === 'undefined' || 
              photosData === 'null' ||
              photosData.includes('[object Object]') ||
              !photosData.startsWith('[')) {
            console.error('Invalid photosData format:', photosData?.substring(0, 50));
            await AsyncStorage.removeItem(STORAGE_KEYS.REFERENCE_PHOTOS);
            setReferencePhotos([]);
          } else {
            const parsed = JSON.parse(photosData);
            if (Array.isArray(parsed)) {
              setReferencePhotos(parsed);
            } else {
              console.warn('Invalid reference photos data, clearing...');
              await AsyncStorage.removeItem(STORAGE_KEYS.REFERENCE_PHOTOS);
              setReferencePhotos([]);
            }
          }
        } catch (parseError) {
          console.error('Failed to parse reference photos:', parseError, 'Data:', photosData?.substring(0, 100));
          await AsyncStorage.removeItem(STORAGE_KEYS.REFERENCE_PHOTOS);
          setReferencePhotos([]);
        }
      }
      if (historyData) {
        try {
          if (typeof historyData !== 'string' || 
              historyData.trim() === '' || 
              historyData === 'undefined' || 
              historyData === 'null' ||
              historyData.includes('[object Object]') ||
              !historyData.startsWith('[')) {
            console.error('Invalid historyData format:', historyData?.substring(0, 50));
            await AsyncStorage.removeItem(STORAGE_KEYS.VERIFICATION_HISTORY);
            setVerificationHistory([]);
          } else {
            const parsed = JSON.parse(historyData);
            if (Array.isArray(parsed)) {
              setVerificationHistory(parsed);
            } else {
              console.warn('Invalid verification history data, clearing...');
              await AsyncStorage.removeItem(STORAGE_KEYS.VERIFICATION_HISTORY);
              setVerificationHistory([]);
            }
          }
        } catch (parseError) {
          console.error('Failed to parse verification history:', parseError, 'Data:', historyData?.substring(0, 100));
          await AsyncStorage.removeItem(STORAGE_KEYS.VERIFICATION_HISTORY);
          setVerificationHistory([]);
        }
      }
      if (imageSourceData) {
        try {
          if (typeof imageSourceData !== 'string' || 
              imageSourceData.trim() === '' || 
              imageSourceData === 'undefined' || 
              imageSourceData === 'null' ||
              imageSourceData.includes('[object Object]') ||
              !imageSourceData.startsWith('[')) {
            console.error('Invalid imageSourceData format:', imageSourceData?.substring(0, 50));
            await AsyncStorage.removeItem(STORAGE_KEYS.IMAGE_SOURCE_HISTORY);
            setImageSourceHistory([]);
          } else {
            const parsed = JSON.parse(imageSourceData);
            if (Array.isArray(parsed)) {
              setImageSourceHistory(parsed);
            } else {
              console.warn('Invalid image source history data, clearing...');
              await AsyncStorage.removeItem(STORAGE_KEYS.IMAGE_SOURCE_HISTORY);
              setImageSourceHistory([]);
            }
          }
        } catch (parseError) {
          console.error('Failed to parse image source history:', parseError, 'Data:', imageSourceData?.substring(0, 100));
          await AsyncStorage.removeItem(STORAGE_KEYS.IMAGE_SOURCE_HISTORY);
          setImageSourceHistory([]);
        }
      }

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

  const addReferencePhoto = async (photo: ReferencePhoto) => {
    if (!user?.userId) return;
    const STORAGE_KEYS = getStorageKeys(user.userId);
    const updated = [...referencePhotos, photo];
    setReferencePhotos(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.REFERENCE_PHOTOS, JSON.stringify(updated));
  };

  const removeReferencePhoto = async (photoId: string) => {
    if (!user?.userId) return;
    const STORAGE_KEYS = getStorageKeys(user.userId);
    const updated = referencePhotos.filter(p => p.id !== photoId);
    setReferencePhotos(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.REFERENCE_PHOTOS, JSON.stringify(updated));
  };

  const clearReferencePhotos = async () => {
    if (!user?.userId) return;
    const STORAGE_KEYS = getStorageKeys(user.userId);
    setReferencePhotos([]);
    await AsyncStorage.removeItem(STORAGE_KEYS.REFERENCE_PHOTOS);
  };

  const compressAndConvertToBase64 = async (uri: string, maxWidth: number = 600): Promise<string> => {
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: maxWidth } }],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
        encoding: 'base64',
      });
      return base64;
    } catch (error) {
      console.error('Failed to compress and convert image to base64:', error);
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      return base64;
    }
  };

  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('AI_SERVICE_TIMEOUT'));
      }, timeoutMs);
      
      promise
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  };

  const verifyPhoto = async (
    editedPhotoUri: string, 
    photoSource: 'camera' | 'library',
    metadata?: PhotoMetadata | null
  ): Promise<VerificationResult> => {
    console.log('Starting photo verification with AI analysis');
    
    const currentLanguage = i18n.language || 'zh';
    const languageInstructions: Record<string, string> = {
      'zh': 'Please respond in Chinese (Simplified Chinese).',
      'en': 'Please respond in English.',
      'ja': 'Please respond in Japanese.',
      'ko': 'Please respond in Korean.',
    };
    const languageInstruction = languageInstructions[currentLanguage] || languageInstructions['zh'];
    
    try {
      console.log('Compressing and converting edited photo to base64...');
      const editedPhotoBase64 = await compressAndConvertToBase64(editedPhotoUri, 500);
      console.log('Edited photo converted, length:', editedPhotoBase64.length);
      
      console.log('Compressing and converting reference photos to base64...');
      const limitedReferencePhotos = referencePhotos.slice(0, 3);
      const referenceImages = await Promise.all(
        limitedReferencePhotos.map(async (photo) => ({
          base64: await compressAndConvertToBase64(photo.uri, 400),
        }))
      );
      console.log('Reference photos converted, count:', referenceImages.length);

      console.log('Images converted, calling AI for analysis');

      const analysisSchema = z.object({
        subjectType: z.enum(['person', 'dog', 'cat', 'animal', 'building', 'object', 'other']).describe('The type of subject in the images (person, dog, cat, animal, building, object, or other)'),
        subjectName: z.string().optional().describe('Optional name/description of the subject'),
        sameSubject: z.boolean().describe('Whether it is the same subject (person/animal/object)'),
        sameGender: z.boolean().describe('Whether the gender/type matches'),
        facialSimilarity: z.number().min(0).max(100).describe('Visual feature similarity score (0-100)'),
        skinTexture: z.number().min(0).max(100).describe('Texture/surface naturalness score (0-100, lower means more editing)'),
        proportions: z.number().min(0).max(100).describe('Proportion consistency score (0-100)'),
        lighting: z.number().min(0).max(100).describe('Lighting naturalness score (0-100)'),
        reasoning: z.string().describe('Analysis reasoning'),
      });

      const referenceImagesContent = referenceImages.map((img, idx) => ({
        type: 'image' as const,
        image: img.base64,
      }));

      let analysis;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`Preparing to call generateObject with schema (attempt ${retryCount + 1}/${maxRetries})`);
          console.log('Reference images count:', referenceImages.length);
          console.log('Edited photo base64 length:', editedPhotoBase64.length);
          console.log('Calling AI API...');
          
          let result;
          try {
            const generatePromise = generateObject({
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: `You are a photo analyst. Compare reference photos with the verification photo.

Rules:
1. IDENTIFY the subject type: person, dog, cat, animal (other animals), building, object, or other
2. Check if SAME SUBJECT: visual features, structure, distinctive characteristics
3. If NOT same subject: sameSubject=false, all scores 0-25
4. If SAME subject: sameSubject=true, evaluate editing (facialSimilarity 70-100)
5. For animals: analyze fur texture, body proportions, distinctive markings
6. For buildings/objects: analyze structural features, colors, design elements
7. ${languageInstruction}

Reference photos (${limitedReferencePhotos.length}):`,
                    },
                    ...referenceImagesContent,
                    {
                      type: 'text',
                      text: 'Photo to verify:',
                    },
                    {
                      type: 'image',
                      image: editedPhotoBase64,
                    },
                  ],
                },
              ],
              schema: analysisSchema,
            });
            
            result = await withTimeout(generatePromise, 60000);
          } catch (generateError: any) {
            console.error('🔴 generateObject threw error');
            console.error('🔴 Raw error object:', generateError);
            
            let errorMessage = '';
            let errorName = '';
            let errorString = '';
            
            try {
              errorName = generateError?.name || 'unknown';
              errorMessage = generateError?.message || '';
              errorString = typeof generateError === 'string' ? generateError : String(generateError);
              
              console.error('🔴 Error name:', errorName);
              console.error('🔴 Error message:', errorMessage);
              console.error('🔴 Error string:', errorString);
            } catch {
              console.error('🔴 Could not extract error details');
            }
            
            const isJsonError = 
              errorName === 'SyntaxError' ||
              errorMessage.toLowerCase().includes('json') || 
              errorMessage.toLowerCase().includes('parse') ||
              errorMessage.includes('Unexpected character') ||
              errorMessage.includes('Unexpected token') ||
              errorMessage.includes('unexpected') ||
              errorString.includes('SyntaxError') ||
              errorString.includes('JSON Parse error') ||
              errorString.includes('JSON parse error');
            
            const isNetworkError =
              errorMessage.includes('Network') ||
              errorMessage.includes('fetch') ||
              errorMessage.includes('Failed to fetch') ||
              errorMessage.includes('network') ||
              errorMessage.includes('timeout') ||
              errorMessage.includes('ECONNREFUSED') ||
              errorMessage.includes('ETIMEDOUT');
            
            if (isJsonError) {
              console.error('❌ Detected JSON parsing error');
              console.error('❌ API returned non-JSON response');
              throw new Error('AI_SERVICE_INVALID_RESPONSE');
            }
            
            if (isNetworkError) {
              console.error('❌ Detected network error');
              throw new Error('AI_SERVICE_NETWORK_ERROR');
            }
            
            console.error('❌ Unknown error type, re-throwing');
            throw generateError;
          }

          console.log('AI Analysis completed successfully');
          console.log('Result type:', typeof result);
          if (result) {
            console.log('Result keys:', Object.keys(result));
          }
          
          if (!result || typeof result !== 'object') {
            console.error('Invalid result type:', typeof result);
            throw new Error('AI返回了无效的数据格式');
          }
          
          if (typeof result.subjectType !== 'string' ||
              typeof result.sameSubject !== 'boolean' || 
              typeof result.sameGender !== 'boolean' ||
              typeof result.facialSimilarity !== 'number' ||
              typeof result.skinTexture !== 'number' ||
              typeof result.proportions !== 'number' ||
              typeof result.lighting !== 'number') {
            console.error('Missing or invalid fields in result:', {
              subjectType: typeof result.subjectType,
              sameSubject: typeof result.sameSubject,
              sameGender: typeof result.sameGender,
              facialSimilarity: typeof result.facialSimilarity,
              skinTexture: typeof result.skinTexture,
              proportions: typeof result.proportions,
              lighting: typeof result.lighting,
            });
            throw new Error('AI返回的数据缺少必需字段');
          }
          
          console.log('Validation passed, analysis result:', {
            subjectType: result.subjectType,
            subjectName: result.subjectName,
            sameSubject: result.sameSubject,
            sameGender: result.sameGender,
            facialSimilarity: result.facialSimilarity,
            skinTexture: result.skinTexture,
            proportions: result.proportions,
            lighting: result.lighting,
          });
          
          analysis = result;
          break;
        } catch (aiError: any) {
          retryCount++;
          console.error(`🔴 AI analysis error (attempt ${retryCount}/${maxRetries})`);
          console.error('🔴 Error object:', aiError);
          console.error('Error type:', typeof aiError);
          console.error('Error constructor:', aiError?.constructor?.name);
          
          if (aiError instanceof Error) {
            console.error('Error message:', aiError.message);
            console.error('Error stack:', aiError.stack);
            
            if (aiError.message.includes('Network request failed')) {
              console.error('Network error detected. This could be due to:');
              console.error('- No internet connection');
              console.error('- API endpoint unreachable');
              console.error('- Request timeout');
              console.error('- CORS issues (web only)');
            }
            
            if (aiError.message.includes('JSON Parse error') || 
                aiError.message.includes('Unexpected character')) {
              console.error('JSON parse error - API may be returning non-JSON response');
              console.error('This could indicate:');
              console.error('- API service is down');
              console.error('- API returned an error page (HTML)');
              console.error('- Invalid response format');
            }
          }
          
          if (retryCount >= maxRetries) {
            console.error(`❌ All ${maxRetries} retry attempts failed`);
            
            if (aiError instanceof Error) {
              if (aiError.message === 'AI_SERVICE_TIMEOUT') {
                console.error('Final error: Request timeout');
                throw new Error('AI服务响应超时，请稍后重试');
              }
              
              if (aiError.message === 'AI_SERVICE_NETWORK_ERROR' ||
                  aiError.message.includes('Network request failed')) {
                console.error('Final error: Network connection issue');
                throw new Error('网络连接失败，请检查网络后重试');
              }
              
              if (aiError.message === 'AI_SERVICE_INVALID_RESPONSE' ||
                  aiError.message.includes('JSON Parse error') || 
                  aiError.message.includes('JSON') || 
                  aiError.message.includes('parse') || 
                  aiError.message.includes('Unexpected character') ||
                  aiError.message.includes('Unexpected token') ||
                  aiError.message.includes('Unexpected')) {
                console.error('Final error: API returning invalid response format');
                throw new Error('AI服务繁忙，请稍后重试');
              }
              
              if (aiError.message.includes('AI返回')) {
                throw aiError;
              }
            }
            
            console.error('Final error: Unknown AI service error');
            throw new Error('AI服务暂时不可用，请稍后重试');
          }
          
          const backoffDelay = Math.min(3000 * Math.pow(2, retryCount - 1), 15000);
          console.log(`⏳ Retrying in ${backoffDelay}ms... (attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }

      if (!analysis) {
        throw new Error('AI分析失败，请重试');
      }

      let credibilityScore: number;
      
      let metadataValid = true;
      const metadataWarnings: string[] = [];
      
      if (photoSource === 'camera' && metadata) {
        if (metadata.cameraType !== 'front') {
          metadataValid = false;
          metadataWarnings.push('未使用前置摄像头');
        }
        
        if (metadata.exifData) {
          if (!metadata.exifData.DateTime && !metadata.exifData.DateTimeOriginal) {
            metadataWarnings.push('缺少拍摄时间信息');
          }
        } else {
          metadataWarnings.push('缺少EXIF数据');
        }
      } else if (photoSource === 'camera' && !metadata) {
        metadataValid = false;
        metadataWarnings.push('缺少照片元数据');
      }

      if (!analysis.sameSubject) {
        credibilityScore = Math.min(2, Math.round(analysis.facialSimilarity * 0.025 * 10) / 10);
      } else if (!analysis.sameGender) {
        credibilityScore = Math.min(1.5, Math.round(analysis.facialSimilarity * 0.02 * 10) / 10);
      } else {
        credibilityScore = Math.round(
          (analysis.facialSimilarity * 0.50 +
          analysis.skinTexture * 0.15 +
          analysis.proportions * 0.25 +
          analysis.lighting * 0.10) / 10 * 10
        ) / 10;
        credibilityScore = Math.max(5, Math.min(10, credibilityScore));
        
        const hasCriticalLowDimension = 
          analysis.skinTexture < 50 || 
          analysis.facialSimilarity < 50 || 
          analysis.proportions < 50;
        
        if (hasCriticalLowDimension && credibilityScore > 8) {
          credibilityScore = Math.min(credibilityScore, 7);
        }
      }
      
      if (!metadataValid && metadataWarnings.length > 0) {
        credibilityScore = Math.max(0, credibilityScore - 1.5);
      }

      const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
      const currentDeviceId = await getOrCreateDeviceId();

      const result: VerificationResult = {
        id: `result_${Date.now()}`,
        requestId: `request_${Date.now()}`,
        credibilityScore,
        subjectType: analysis.subjectType,
        subjectName: analysis.subjectName,
        analysis: {
          facialSimilarity: analysis.facialSimilarity,
          skinTexture: analysis.skinTexture,
          proportions: analysis.proportions,
          lighting: analysis.lighting,
        },
        verdict: getVerdict(credibilityScore),
        verificationCode,
        deviceId: currentDeviceId,
        metadataValid,
        metadataWarnings: metadataWarnings.length > 0 ? metadataWarnings : undefined,
        completedAt: Date.now(),
      };

      const historyItem: VerificationHistory = {
        request: {
          id: result.requestId,
          editedPhotoUri,
          photoSource,
          referencePhotos: [...referencePhotos],
          metadata: metadata || undefined,
          createdAt: Date.now(),
          status: 'completed',
        },
        result,
      };

      if (!user?.userId) {
        throw new Error('User not logged in');
      }
      const STORAGE_KEYS = getStorageKeys(user.userId);
      const updated = [historyItem, ...verificationHistory];
      setVerificationHistory(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.VERIFICATION_HISTORY, JSON.stringify(updated));

      return result;
    } catch (error) {
      console.error('Verification failed:', error);
      throw error;
    }
  };



  const getVerdict = (score: number): VerificationResult['verdict'] => {
    if (score >= 9) return 'authentic';
    if (score >= 7.5) return 'slightly-edited';
    if (score >= 5) return 'heavily-edited';
    return 'suspicious';
  };

  const updateVerificationDescription = async (verificationId: string, description: string): Promise<{ success: boolean; message?: string }> => {
    if (!user?.userId) {
      return { success: false, message: 'User not logged in' };
    }
    const STORAGE_KEYS = getStorageKeys(user.userId);
    const updated = verificationHistory.map(item => {
      if (item.result.id === verificationId) {
        return {
          ...item,
          result: {
            ...item.result,
            description,
          },
        };
      }
      return item;
    });
    setVerificationHistory(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.VERIFICATION_HISTORY, JSON.stringify(updated));
    return { success: true };
  };

  const deleteVerification = async (verificationId: string): Promise<{ success: boolean; message?: string }> => {
    if (!user?.userId) {
      return { success: false, message: 'User not logged in' };
    }
    const STORAGE_KEYS = getStorageKeys(user.userId);
    const updated = verificationHistory.filter(item => item.result.id !== verificationId);
    setVerificationHistory(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.VERIFICATION_HISTORY, JSON.stringify(updated));
    return { success: true };
  };

  const clearHistory = async () => {
    if (!user?.userId) return;
    const STORAGE_KEYS = getStorageKeys(user.userId);
    setVerificationHistory([]);
    await AsyncStorage.removeItem(STORAGE_KEYS.VERIFICATION_HISTORY);
  };

  const addImageSourceHistory = async (imageUri: string, analysis: ImageSourceAnalysis): Promise<string> => {
    if (!user?.userId) {
      throw new Error('User not logged in');
    }
    const STORAGE_KEYS = getStorageKeys(user.userId);
    const historyItem: ImageSourceHistory = {
      id: `source_${Date.now()}`,
      imageUri,
      analysis,
      createdAt: Date.now(),
    };
    const updated = [historyItem, ...imageSourceHistory];
    setImageSourceHistory(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.IMAGE_SOURCE_HISTORY, JSON.stringify(updated));
    return historyItem.id;
  };

  const deleteImageSource = async (imageSourceId: string): Promise<{ success: boolean; message?: string }> => {
    if (!user?.userId) {
      return { success: false, message: 'User not logged in' };
    }
    const STORAGE_KEYS = getStorageKeys(user.userId);
    const updated = imageSourceHistory.filter(item => item.id !== imageSourceId);
    setImageSourceHistory(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.IMAGE_SOURCE_HISTORY, JSON.stringify(updated));
    return { success: true };
  };

  const clearImageSourceHistory = async () => {
    if (!user?.userId) return;
    const STORAGE_KEYS = getStorageKeys(user.userId);
    setImageSourceHistory([]);
    await AsyncStorage.removeItem(STORAGE_KEYS.IMAGE_SOURCE_HISTORY);
  };

  const addOutfitChangeHistory = async (
    originalImageUri: string,
    resultImageUri: string,
    templateId: string,
    templateName: string
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

  return {
    referencePhotos,
    verificationHistory,
    imageSourceHistory,
    outfitChangeHistory,
    isLoading,
    deviceId,
    addReferencePhoto,
    removeReferencePhoto,
    clearReferencePhotos,
    verifyPhoto,
    updateVerificationDescription,
    deleteVerification,
    clearHistory,
    addImageSourceHistory,
    deleteImageSource,
    clearImageSourceHistory,
    addOutfitChangeHistory,
    deleteOutfitChange,
    clearOutfitChangeHistory,
  };
});
