import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter, Stack } from 'expo-router';
import { Sparkles, Camera, AlertCircle, ArrowLeft, ImageIcon } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useVerification } from '@/contexts/VerificationContext';
import { useCoin } from '@/contexts/CoinContext';
import { useTranslation } from 'react-i18next';

export default function VerifyPhotoScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { verifyPhoto, referencePhotos } = useVerification();
  const { canUseVerification, useVerification: consumeVerification } = useCoin();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [photoSource, setPhotoSource] = useState<'camera' | 'library'>('camera');
  const [isVerifying, setIsVerifying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [photoMetadata, setPhotoMetadata] = useState<{
    timestamp: string;
    cameraType: 'front' | 'back';
    exifData?: any;
  } | null>(null);

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('errors.permissionDenied'), t('errors.permissionDenied'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      allowsEditing: false,
      quality: 1,
      exif: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      
      const timestamp = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      
      const metadata = {
        timestamp,
        cameraType: 'front' as const,
        exifData: asset.exif,
      };
      
      setPhotoMetadata(metadata);
      setSelectedImage(asset.uri);
      setPhotoSource('camera');
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('errors.permissionDenied'), t('profile.cameraPermissionRequired'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 1,
      exif: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPhotoMetadata(null);
      setSelectedImage(asset.uri);
      setPhotoSource('library');
    }
  };

  const handleVerify = async () => {
    if (!selectedImage) return;

    const { canUse, message } = canUseVerification();
    if (!canUse) {
      Alert.alert(t('common.error'), message, [
        { text: t('common.confirm') },
        message.includes(t('profile.recharge')) && {
          text: t('profile.recharge'),
          onPress: () => router.push('/recharge' as any)
        }
      ].filter(Boolean) as any);
      return;
    }

    const consumed = await consumeVerification();
    if (!consumed) {
      Alert.alert(t('common.error'), t('errors.uploadError'));
      return;
    }

    setIsVerifying(true);
    setElapsedTime(0);
    
    const startTime = Date.now();
    const timeInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);
    
    try {
      const result = await verifyPhoto(selectedImage, photoSource, photoMetadata);
      clearInterval(timeInterval);
      setIsVerifying(false);
      setElapsedTime(0);
        
        Alert.alert(
          t('common.success'),
          t('result.verificationCode'),
          [
            {
              text: t('result.title'),
              onPress: () => {
                router.push({
                  pathname: '/result/[id]' as any,
                  params: { id: result.id },
                });
              },
            },
          ]
        );
      
      setTimeout(() => {
        Alert.alert(
          t('result.verificationCode'),
          result.verificationCode,
          [
            {
              text: t('common.confirm'),
              style: 'default',
            },
          ],
          { cancelable: false }
        );
      }, 500);
    } catch (error) {
      clearInterval(timeInterval);
      setIsVerifying(false);
      setElapsedTime(0);
      const errorMessage = error instanceof Error ? error.message : t('errors.uploadError');
      Alert.alert(t('common.error'), errorMessage);
    }
  };

  if (referencePhotos.length === 0) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: '自拍照片验证',
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ padding: 8 }}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                activeOpacity={0.6}
              >
                <ArrowLeft size={24} color="#0F172A" strokeWidth={2} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <AlertCircle size={48} color="#F59E0B" />
        </View>
        <Text style={styles.emptyTitle}>{t('home.pleaseUploadReference')}</Text>
        <Text style={styles.emptyText}>{t('home.uploadClearPhoto')}</Text>
        <TouchableOpacity
          style={styles.goButton}
          onPress={() => router.push('/upload-reference' as any)}
        >
          <Text style={styles.goButtonText}>{t('upload.title')}</Text>
        </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('verify.title'),
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ padding: 8 }}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              activeOpacity={0.6}
            >
              <ArrowLeft size={24} color="#0F172A" strokeWidth={2} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Sparkles size={32} color="#fff" />
        </View>
        <Text style={styles.title}>{t('verify.title')}</Text>
        <Text style={styles.description}>
          {t('home.uploadEditedPhoto')}
        </Text>
      </View>

      {referencePhotos.length > 0 && (
        <View style={styles.referenceInfo}>
          <Text style={styles.referenceTitle}>{t('upload.title')}</Text>
          <TouchableOpacity 
            onPress={() => {
              Alert.alert(
                t('verify.changeReferencePhoto'),
                t('verify.changeReferencePhotoConfirm'),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: t('common.confirm'),
                    onPress: () => router.push('/upload-reference' as any),
                  },
                ]
              );
            }}
            activeOpacity={0.8}
          >
            <Image 
              source={{ uri: referencePhotos[0].uri }} 
              style={styles.referenceImage} 
              contentFit="contain" 
            />
          </TouchableOpacity>
        </View>
      )}

      {!selectedImage ? (
        <View style={styles.uploadArea}>
          <View style={styles.buttonsRow}>
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={openCamera}
            >
              <Camera size={40} color="#0066FF" />
              <Text style={styles.cameraButtonText}>{t('verify.takePhoto')}</Text>
              <Text style={styles.cameraButtonSubtext}>{t('verify.cameraRecommended')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.libraryButton}
              onPress={pickImage}
            >
              <ImageIcon size={32} color="#64748B" />
              <Text style={styles.libraryButtonText}>{t('upload.selectPhoto')}</Text>
              <Text style={styles.libraryButtonSubtext}>{t('verify.libraryNote')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.previewArea}>
          <Text style={styles.previewTitle}>{t('result.editedPhoto')}</Text>
          <TouchableOpacity 
            onPress={() => {
              Alert.alert(
                t('verify.changeSelfiePhoto'),
                t('verify.changeSelfiePhotoConfirm'),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: t('common.confirm'),
                    onPress: () => setSelectedImage(null),
                  },
                ]
              );
            }}
            activeOpacity={0.8}
          >
            <Image source={{ uri: selectedImage }} style={styles.previewImage} contentFit="contain" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.changeButton} onPress={() => setSelectedImage(null)}>
            <Text style={styles.changeButtonText}>{t('verify.deleteSelfiePhoto')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedImage && (
        <TouchableOpacity
          style={[styles.verifyButton, isVerifying && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={isVerifying}
        >
          {isVerifying ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text style={styles.verifyButtonText}>{t('verify.verifying')} {elapsedTime}{t('verify.seconds')}</Text>
            </>
          ) : (
            <>
              <Sparkles size={20} color="#fff" />
              <Text style={styles.verifyButtonText}>{t('verify.startVerification')}</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <View style={styles.securityCard}>
        <Text style={styles.securityTitle}>{t('verify.tipTitle')}</Text>
        <Text style={styles.securityText}>{t('verify.tip1')}</Text>
        <Text style={styles.securityText}>{t('verify.tip2')}</Text>
        <Text style={styles.securityText}>{t('verify.tip3')}</Text>
        <Text style={styles.securityText}>{t('verify.tip4')}</Text>
      </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 320,
  },
  referenceInfo: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  referenceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  referenceImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
  },
  uploadArea: {
    marginBottom: 24,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cameraButton: {
    flex: 1,
    height: 200,
    backgroundColor: '#F0F9FF',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#0066FF',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cameraButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0066FF',
    marginTop: 12,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  cameraButtonSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  libraryButton: {
    flex: 1,
    height: 200,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  libraryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 12,
    textAlign: 'center',
  },
  libraryButtonSubtext: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
  },
  previewArea: {
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 400,
    backgroundColor: '#E2E8F0',
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  changeButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  changeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0066FF',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#0066FF',
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  infoCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#0066FF',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  securityCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#F97316',
    marginTop: 16,
  },
  securityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 4,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  goButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  goButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
