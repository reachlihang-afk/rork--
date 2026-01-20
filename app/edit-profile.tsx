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
  const [bio, setBio] = useState<string>(user?.bio || '');
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

  const handleBioChange = useCallback((text: string) => {
    console.log('[EditProfile] Bio changing to:', text);
    setBio(text);
  }, []);

  const screenOptions = useMemo(() => ({
    title: t('profile.editProfile'),
    headerBackVisible: false,
    headerBackTitle: '',
    headerLeft: () => (
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ 
          padding: 12, 
          marginLeft: -8,
          minWidth: 48,
          minHeight: 48,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        activeOpacity={0.6}
      >
        <ArrowLeft size={26} color="#1a1a1a" strokeWidth={2.5} />
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
    console.log('[EditProfile] Saving profile:', { nickname: trimmedNickname, hasAvatar: !!avatar, bio: bio.trim() });

    try {
      await updateProfile(trimmedNickname, avatar, bio.trim());
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
  }, [nickname, avatar, bio, updateProfile, updateUserNickname, user, isSubmitting]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={screenOptions} />

      {authLoading ? (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a1a1a" />
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
                keyboardDismissMode="on-drag"
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
            <Text style={styles.label}>{t('profile.nickname')}</Text>
            <TextInput
              testID="editProfile.nicknameInput"
              style={styles.input}
              placeholder={t('profile.nicknamePlaceholder')}
              placeholderTextColor="#94A3B8"
              value={nickname}
              onChangeText={handleNicknameChange}
              maxLength={20}
              autoComplete="off"
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="next"
              blurOnSubmit={false}
              editable={!isSubmitting}
              selectTextOnFocus={true}
              keyboardType="default"
              textContentType="none"
              importantForAutofill="no"
              onFocus={() => {
                console.log('[EditProfile] Nickname input focused, current value:', nickname);
              }}
              onBlur={() => {
                console.log('[EditProfile] Nickname input blurred, final value:', nickname);
              }}
              keyboardAppearance="light"
            />
            <Text style={styles.hint}>{nickname.length}/20</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.bio')}</Text>
            <TextInput
              testID="editProfile.bioInput"
              style={[styles.input, styles.bioInput]}
              placeholder={t('profile.bioPlaceholder')}
              placeholderTextColor="#94A3B8"
              value={bio}
              onChangeText={handleBioChange}
              maxLength={100}
              multiline={true}
              numberOfLines={3}
              autoComplete="off"
              autoCorrect={false}
              returnKeyType="done"
              blurOnSubmit={true}
              editable={!isSubmitting}
              textAlignVertical="top"
              onFocus={() => {
                console.log('[EditProfile] Bio input focused, current value:', bio);
              }}
              onBlur={() => {
                console.log('[EditProfile] Bio input blurred, final value:', bio);
              }}
              onSubmitEditing={() => {
                console.log('[EditProfile] Bio submit');
                Keyboard.dismiss();
                handleSave();
              }}
              keyboardAppearance="light"
            />
            <Text style={styles.hint}>{bio.length}/100</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  screenBg: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#f8fafc',
    backgroundColor: '#f8fafc',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarHint: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 32,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    minHeight: 54,
    ...(Platform.OS === 'web' ? {
      outlineStyle: 'none' as any,
      cursor: 'text' as any,
    } : {}),
  },
  bioInput: {
    minHeight: 100,
    paddingTop: 16,
  },
  hint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'right',
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 18,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#f1f5f9',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#ffffff',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
});
