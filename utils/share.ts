import { Platform, Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import QRCode from 'qrcode';

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
      const link = document.createElement('a');
      link.href = uri;
      link.download = `share-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }

    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('提示', '需要相册权限才能保存图片');
      return false;
    }

    await MediaLibrary.saveToLibraryAsync(uri);
    return true;
  } catch (error) {
    console.error('Failed to save to gallery:', error);
    return false;
  }
}

export async function shareImage(uri: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      await saveToGallery(uri);
      return;
    }

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri);
    } else {
      const saved = await saveToGallery(uri);
      if (saved) {
        Alert.alert('成功', '图片已保存到相册');
      } else {
        Alert.alert('失败', '保存图片失败');
      }
    }
  } catch (error) {
    console.error('Failed to share:', error);
    Alert.alert('失败', '分享失败');
  }
}
