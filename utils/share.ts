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
    console.log('[saveToGallery] Starting save, URI type:', uri.startsWith('data:') ? 'base64' : uri.startsWith('http') ? 'remote' : 'file');

    if (Platform.OS === 'web') {
      const link = document.createElement('a');
      link.href = uri;
      link.download = `picseek-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }

    const permission = await MediaLibrary.requestPermissionsAsync();
    const status = (permission as any).status as string;
    console.log('[saveToGallery] Permission status:', status);

    if (status !== 'granted' && status !== 'limited') {
      Alert.alert('提示', '需要相册权限才能保存图片，请在设置中开启相册权限');
      return false;
    }

    let fileUri = uri;
    let tempFileCreated = false;

    const cacheDir = (FileSystem as any).cacheDirectory;
    if (!cacheDir) {
      console.error('[saveToGallery] No cache directory available');
      Alert.alert('错误', '无法获取存储目录');
      return false;
    }

    if (uri.startsWith('data:')) {
      console.log('[saveToGallery] Converting base64 to file...');
      const mimeMatch = uri.match(/^data:([^;]+);base64,/);
      const mimeType = mimeMatch?.[1] || 'image/jpeg';
      const extMap: Record<string, string> = {
        'image/png': 'png',
        'image/jpg': 'jpg',
        'image/jpeg': 'jpg',
        'image/webp': 'webp',
      };
      const ext = extMap[mimeType] || 'jpg';
      const filename = `picseek_${Date.now()}.${ext}`;
      fileUri = `${cacheDir}${filename}`;
      tempFileCreated = true;

      const base64Data = uri.split(',')[1];
      if (!base64Data) {
        console.error('[saveToGallery] Invalid base64 data - no comma found');
        return false;
      }

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: 'base64' as any,
      });

      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        console.error('[saveToGallery] File was not created');
        return false;
      }
    } else if (uri.startsWith('http')) {
      console.log('[saveToGallery] Downloading remote image...');
      const urlParts = uri.split('?')[0].split('/');
      const lastPart = urlParts[urlParts.length - 1] || '';
      const extFromUrl = lastPart.includes('.') ? lastPart.split('.').pop() : '';
      const safeExt = extFromUrl && extFromUrl.length <= 5 ? extFromUrl : 'jpg';
      const filename = `picseek_${Date.now()}.${safeExt}`;
      const targetUri = `${cacheDir}${filename}`;
      const download = await FileSystem.downloadAsync(uri, targetUri);
      fileUri = download.uri;
      tempFileCreated = true;
    }

    console.log('[saveToGallery] Saving to library from:', fileUri);

    const asset = await MediaLibrary.createAssetAsync(fileUri);
    console.log('[saveToGallery] createAssetAsync success:', asset.id);

    try {
      let album = await MediaLibrary.getAlbumAsync('PicSeek');
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync('PicSeek', asset, false);
      }
      console.log('[saveToGallery] Added to PicSeek album');
    } catch (albumError) {
      console.log('[saveToGallery] Album operation skipped:', albumError);
    }

    if (tempFileCreated) {
      try {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } catch {
        // ignore cleanup errors
      }
    }

    console.log('[saveToGallery] SUCCESS - Image saved to gallery!');
    return true;
  } catch (error: any) {
    console.error('[saveToGallery] FAILED:', error.message || error);
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
