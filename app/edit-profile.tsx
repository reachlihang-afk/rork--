import { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuth } from '@/contexts/AuthContext';
import { useSquare } from '@/contexts/SquareContext';
import { router, Stack } from 'expo-router';
import { Camera, Check, ArrowLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const { user, updateProfile, isLoading: authLoading } = useAuth();
  const { updateUserNickname } = useSquare();
  const insets = useSafeAreaInsets();

  const [nickname, setNickname] = useState<string>(user?.nickname || '');
  const [avatar, setAvatar] = useState<string>(user?.avatar || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const pickImage = useCallback(async () => {
    try {
      console.log('[EditProfile] Starting image picker');

      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('提示', '需要相册访问权限');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
        base64: false,
      });

      console.log('[EditProfile] Image picker result:', result.canceled ? 'canceled' : 'selected');

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const imageUri = asset.uri;
        console.log('[EditProfile] Image selected:', imageUri);

        try {
          const manipResult = await ImageManipulator.manipulateAsync(
            imageUri,
            [{ resize: { width: 512 } }],
            { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
          );

          setAvatar(manipResult.uri);
          console.log('[EditProfile] Avatar set:', manipResult.uri);
        } catch (manipError) {
          console.error('[EditProfile] Image manipulate error, falling back:', manipError);
          setAvatar(imageUri);
        }
      }
    } catch (error) {
      console.error('[EditProfile] Pick image error:', error);
      Alert.alert('错误', '选择图片失败');
    }
  }, []);

  const handleNicknameChange = useCallback((text: string) => {
    console.log('[EditProfile] Nickname changing to:', text);
    setNickname(text);
  }, []);

  const screenOptions = useMemo(() => ({
    title: t('profile.editProfile'),
    headerBackVisible: false,
    headerBackTitle: '',
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
  }), [t]);

  const handleSave = useCallback(async () => {
    const trimmedNickname = nickname.trim();

    if (!trimmedNickname) {
      Alert.alert('提示', '请输入昵称');
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    console.log('[EditProfile] Saving profile:', { nickname: trimmedNickname, hasAvatar: !!avatar });

    try {
      await updateProfile(trimmedNickname, avatar);
      if (user) {
        await updateUserNickname(user.userId, trimmedNickname);
      }
      router.back();
    } catch (error: any) {
      console.error('[EditProfile] Save error:', error);
      if (error.message === 'NICKNAME_TAKEN') {
        Alert.alert('昵称已被使用', '该昵称已被其他用户使用，请重新设置昵称');
      } else {
        Alert.alert('错误', '更新失败，请重试');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [nickname, avatar, updateProfile, updateUserNickname, user, isSubmitting]);

  return (
    <TouchableWithoutFeedback testID="editProfile.dismissKeyboard" onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
      <Stack.Screen options={screenOptions} />

      {authLoading ? (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>加载中...</Text>
          </View>
        </SafeAreaView>
      ) : !user ? (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>请先登录</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>返回</Text>
          </TouchableOpacity>
          </View>
        </SafeAreaView>
      ) : (
        <View style={styles.screenBg}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <KeyboardAvoidingView
              style={styles.keyboardAvoidingView}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? Math.max(insets.top, 12) : 0}
            >
              <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                showsVerticalScrollIndicator={false}
                testID="editProfile.scroll"
              >
          <View style={styles.avatarSection}>
            <TouchableOpacity 
              testID="editProfile.avatarButton"
              style={styles.avatarContainer} 
              onPress={pickImage}
              activeOpacity={0.7}
            >
              {avatar ? (
                <Image
                  source={{ uri: avatar }}
                  style={styles.avatar}
                  contentFit="cover"
                  onError={(e) => {
                    console.error('[EditProfile] Avatar image render error:', e);
                  }}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Camera size={32} color="#94A3B8" />
                </View>
              )}
              <View style={styles.avatarBadge}>
                <Camera size={14} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>点击更换头像</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>昵称</Text>
            <TextInput
              testID="editProfile.nicknameInput"
              style={styles.input}
              placeholder="请输入昵称"
              placeholderTextColor="#94A3B8"
              value={nickname}
              onChangeText={handleNicknameChange}
              maxLength={20}
              autoComplete="off"
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="done"
              blurOnSubmit={true}
              editable={true}
              selectTextOnFocus={true}
              onFocus={() => {
                console.log('[EditProfile] Nickname input focused');
              }}
              onSubmitEditing={() => {
                console.log('[EditProfile] Nickname submit');
                handleSave();
              }}
            />
            <Text style={styles.hint}>{nickname.length}/20</Text>
          </View>

            <TouchableOpacity
              testID="editProfile.saveButton"
              style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Check size={18} color="#fff" />
                  <Text style={styles.saveButtonText}>保存</Text>
                </>
              )}
            </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      )}
    </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screenBg: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#E2E8F0',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarHint: {
    fontSize: 13,
    color: '#64748B',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#0F172A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    outlineStyle: 'none' as any,
  },
  hint: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'right' as const,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0066FF',
    borderRadius: 14,
    padding: 17,
    marginTop: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  backButton: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
