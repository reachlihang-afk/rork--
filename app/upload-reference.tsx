import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter, Stack } from 'expo-router';
import { Camera, ImagePlus, X, Check, ArrowLeft } from 'lucide-react-native';

import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useVerification } from '@/contexts/VerificationContext';
import { ReferencePhoto } from '@/types/verification';
import { useTranslation } from 'react-i18next';

export default function UploadReferenceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { referencePhotos, addReferencePhoto, removeReferencePhoto } = useVerification();

  const hasReferencePhoto = referencePhotos.length > 0;

  const pickImage = async () => {
    if (hasReferencePhoto) {
      Alert.alert(t('common.tip'), t('upload.deletePhoto'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const photo: ReferencePhoto = {
        id: `photo_${Date.now()}`,
        uri: result.assets[0].uri,
        uploadedAt: Date.now(),
      };
      await addReferencePhoto(photo);
    }
  };

  const takePhoto = async () => {
    if (hasReferencePhoto) {
      Alert.alert(t('common.tip'), t('upload.deletePhoto'));
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('errors.permissionDenied'), t('errors.permissionDenied'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const photo: ReferencePhoto = {
        id: `photo_${Date.now()}`,
        uri: result.assets[0].uri,
        uploadedAt: Date.now(),
      };
      await addReferencePhoto(photo);
    }
  };

  const handleRemove = async (photoId: string) => {
    Alert.alert(
      t('upload.deletePhoto'),
      t('upload.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => removeReferencePhoto(photoId) },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('upload.title'),
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
        <Text style={styles.title}>{t('upload.title')}</Text>
        <Text style={styles.description}>
          {t('home.uploadClearPhoto')}
        </Text>
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>{t('upload.tipTitle')}</Text>
        <Text style={styles.tipText}>{t('upload.tip1')}</Text>
        <Text style={styles.tipText}>{t('upload.tip2')}</Text>
        <Text style={styles.tipText}>{t('upload.tip3')}</Text>
      </View>

      {!hasReferencePhoto ? (
        <View style={styles.uploadButtons}>
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <ImagePlus size={24} color="#0066FF" />
            <Text style={styles.uploadButtonText}>{t('upload.selectPhoto')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
            <Camera size={24} color="#0066FF" />
            <Text style={styles.uploadButtonText}>{t('upload.takePhoto')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.gallery}>
          <Text style={styles.galleryTitle}>{t('result.referencePhotos')}</Text>
          <View style={styles.photoGrid}>
            {referencePhotos.map(photo => (
              <View key={photo.id} style={styles.photoItem}>
                <Image source={{ uri: photo.uri }} style={styles.photoImage} contentFit="contain" />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemove(photo.id)}
                >
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {referencePhotos.length > 0 && (
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => router.push('/verify-photo' as any)}
        >
          <Check size={20} color="#fff" />
          <Text style={styles.doneButtonText}>{t('common.confirm')}</Text>
        </TouchableOpacity>
      )}
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
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
  },

  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#0066FF',
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0066FF',
  },
  tipCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#854D0E',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#A16207',
    marginBottom: 4,
  },
  gallery: {
    marginBottom: 24,
  },
  galleryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  photoGrid: {
    alignItems: 'center',
  },
  photoItem: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E2E8F0',
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
