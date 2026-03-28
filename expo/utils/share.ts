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
    console.log('[saveToGallery] Saving:', uri.substring(0, 50));
    
    if (Platform.OS === 'web') {
      const link = document.createElement('a');
      link.href = uri;
      link.download = `picseek-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }

    // 请求权限
    const { status } = await MediaLibrary.requestPermissionsAsync();
    console.log('[saveToGallery] Permission:', status);
    
    if (status !== 'granted') {
      Alert.alert('提示', '需要相册权限才能保存图片');
      return false;
    }

    // 如果是 base64，需要先转换成文件
    let fileUri = uri;
    if (uri.startsWith('data:')) {
      console.log('[saveToGallery] Converting base64 to file...');
      const baseDir = getWritableDirectory();
      if (!baseDir) {
        console.error('[saveToGallery] No storage available');
        return false;
      }
      
      const filename = `picseek_${Date.now()}.jpg`;
      fileUri = `${baseDir}${filename}`;
      
      const base64Data = uri.split(',')[1];
      if (!base64Data) {
        console.error('[saveToGallery] Invalid base64');
        return false;
      }
      
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: 'base64' as any,
      });
      console.log('[saveToGallery] File created:', fileUri);
    }

    // 直接保存到相册（这是关键！）
    console.log('[saveToGallery] Calling saveToLibraryAsync...');
    await MediaLibrary.saveToLibraryAsync(fileUri);
    console.log('[saveToGallery] Success!');
    
    return true;
  } catch (error) {
    console.error('[saveToGallery] Failed:', error);
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
