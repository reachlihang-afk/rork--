import { Platform, Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import QRCode from 'qrcode';

// 获取可写目录
function getWritableDirectory(): string {
  const fsAny = FileSystem as unknown as {
    documentDirectory?: string | null;
    cacheDirectory?: string | null;
  };
  return fsAny.documentDirectory ?? fsAny.cacheDirectory ?? '';
}

export async function generateQRCode(url: string): Promise<string> {
  try {
    if (Platform.OS === 'web') {
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return canvas.toDataURL();
    } else {
      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrCodeDataUrl;
    }
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    throw error;
  }
}

export async function saveToGallery(uri: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      // Web平台：触发下载
      const link = document.createElement('a');
      link.href = uri;
      link.download = `picseek-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }

    // 请求相册权限
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('提示', '需要相册权限才能保存图片');
      return false;
    }

    let fileUri = uri;
    
    // 如果是 base64 数据 URL，需要先保存为临时文件
    if (uri.startsWith('data:')) {
      console.log('[saveToGallery] Converting base64 to file...');
      const filename = `picseek-download-${Date.now()}.jpg`;
      const baseDir = getWritableDirectory();
      
      if (!baseDir) {
        console.error('[saveToGallery] No writable directory available');
        Alert.alert('错误', '无法获取存储目录');
        return false;
      }
      
      fileUri = `${baseDir}${filename}`;
      
      // 提取 base64 数据
      const base64Data = uri.split(',')[1];
      if (!base64Data) {
        console.error('[saveToGallery] Invalid base64 data');
        return false;
      }
      
      // 写入文件
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: 'base64' as any,
      });
      console.log('[saveToGallery] File saved to:', fileUri);
    }

    // 保存到相册
    const asset = await MediaLibrary.createAssetAsync(fileUri);
    console.log('[saveToGallery] Asset created:', asset.id);
    
    // 尝试将图片保存到相册（某些设备需要这一步）
    try {
      const album = await MediaLibrary.getAlbumAsync('PicSeek');
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync('PicSeek', asset, false);
      }
      console.log('[saveToGallery] Image added to PicSeek album');
    } catch (albumError) {
      // 如果相册操作失败，图片仍然会保存到默认相册
      console.warn('[saveToGallery] Album operation failed, image saved to default album:', albumError);
    }
    
    console.log('[saveToGallery] Image saved to gallery successfully');
    return true;
  } catch (error) {
    console.error('[saveToGallery] Failed to save to gallery:', error);
    return false;
  }
}

export async function shareImage(uri: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      await saveToGallery(uri);
      return;
    }

    let fileUri = uri;
    
    // 如果是 base64 数据 URL，需要先保存为临时文件
    if (uri.startsWith('data:')) {
      console.log('[shareImage] Converting base64 to file...');
      const filename = `picseek-share-${Date.now()}.jpg`;
      const baseDir = getWritableDirectory();
      
      if (!baseDir) {
        console.error('[shareImage] No writable directory available');
        Alert.alert('错误', '无法获取存储目录');
        return;
      }
      
      fileUri = `${baseDir}${filename}`;
      
      const base64Data = uri.split(',')[1];
      if (!base64Data) {
        console.error('[shareImage] Invalid base64 data');
        return;
      }
      
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: 'base64' as any,
      });
      console.log('[shareImage] File saved to:', fileUri);
    }

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri);
    } else {
      const saved = await saveToGallery(uri);
      if (saved) {
        Alert.alert('成功', '图片已保存到相册');
      } else {
        Alert.alert('失败', '保存图片失败');
      }
    }
  } catch (error) {
    console.error('[shareImage] Failed to share:', error);
    Alert.alert('失败', '分享失败');
  }
}
