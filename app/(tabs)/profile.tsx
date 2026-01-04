import { User, LogOut, Coins, ChevronRight, Globe, Edit3, Users, Shield } from 'lucide-react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, Pressable, ScrollView, Image, Keyboard, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useCoin } from '@/contexts/CoinContext';
import { useLanguage, Language, languageNames } from '@/contexts/LanguageContext';
import { useFriends } from '@/contexts/FriendsContext';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, isLoggedIn, isLoading, login, logout } = useAuth();
  const { coinBalance, getRemainingFreeCounts } = useCoin();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { pendingRequestsCount, privacySettings, updatePrivacySettings } = useFriends();
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [showTimeRangeModal, setShowTimeRangeModal] = useState(false);
  
  const { verification, imageSource } = getRemainingFreeCounts();

  const handleLanguageSelect = async (lang: Language) => {
    await changeLanguage(lang);
    setShowLanguageModal(false);
  };

  const handleSendCode = async () => {
    if (!phone || phone.length !== 11) {
      Alert.alert(t('common.tip'), t('profile.invalidPhone'));
      return;
    }

    setCodeSent(true);
    setCountdown(60);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    Alert.alert(t('profile.codeSent'), t('profile.demoCode'));
  };

  const handleLogin = useCallback(async () => {
    if (!phone || !verificationCode) {
      Alert.alert(t('common.tip'), t('profile.invalidCode'));
      return;
    }

    if (verificationCode !== '123456') {
      Alert.alert(t('common.error'), t('profile.wrongCode'));
      return;
    }

    setIsSubmitting(true);
    try {
      await login(phone);
      Alert.alert(t('common.success'), t('profile.loginSuccess'));
      setPhone('');
      setVerificationCode('');
      setCodeSent(false);
    } catch {
      Alert.alert(t('common.error'), t('profile.loginFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }, [phone, verificationCode, login, t]);

  const lastAutoLoginKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const isComplete = verificationCode.length === 6 && phone.length === 11;
    const key = `${phone}:${verificationCode}`;

    if (!isComplete) {
      lastAutoLoginKeyRef.current = null;
      return;
    }

    if (isSubmitting) {
      return;
    }

    if (lastAutoLoginKeyRef.current === key) {
      return;
    }

    lastAutoLoginKeyRef.current = key;
    handleLogin();
  }, [verificationCode, phone, isSubmitting, handleLogin]);

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            Alert.alert(t('common.tip'), t('profile.logoutSuccess'));
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  if (isLoggedIn && user) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.avatarWrapper}
              onPress={() => router.push('/edit-profile')}
            >
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User size={40} color="#fff" strokeWidth={2.5} />
                </View>
              )}
              <View style={styles.editBadge}>
                <Edit3 size={12} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.nicknameText}>{user.nickname || user.userId}</Text>
            <Text style={styles.phoneText}>{user.phone}</Text>
          </View>

          <TouchableOpacity 
            style={styles.coinCard}
            onPress={() => router.push('/recharge')}
          >
            <View style={styles.coinLeft}>
              <View style={styles.coinIconContainer}>
                <Coins size={24} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.coinLabel}>{t('profile.myCoins')}</Text>
                <Text style={styles.coinBalance}>{coinBalance}</Text>
              </View>
            </View>
            <View style={styles.coinRight}>
              <Text style={styles.rechargeText}>{t('profile.recharge')}</Text>
              <ChevronRight size={18} color="#64748B" />
            </View>
          </TouchableOpacity>

          <View style={styles.usageCard}>
            <Text style={styles.usageTitle} numberOfLines={2}>{t('profile.remainingFreeTimes')}</Text>
            <View style={styles.usageRow}>
              <View style={styles.usageItem}>
                <Text style={styles.usageCount}>{verification}</Text>
                <Text style={styles.usageLabel} numberOfLines={2}>{t('profile.verificationTimes')}</Text>
              </View>
              <View style={styles.usageDivider} />
              <View style={styles.usageItem}>
                <Text style={styles.usageCount}>{imageSource}</Text>
                <Text style={styles.usageLabel} numberOfLines={2}>{t('profile.findSourceTimes')}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.languageCard}
            onPress={() => setShowLanguageModal(true)}
          >
            <View style={styles.languageLeft}>
              <View style={styles.languageIconContainer}>
                <Globe size={18} color="#0066FF" />
              </View>
              <Text style={styles.languageLabel}>{t('profile.language')}</Text>
            </View>
            <View style={styles.languageRight}>
              <Text style={styles.languageValue}>{languageNames[currentLanguage]}</Text>
              <ChevronRight size={18} color="#64748B" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingsCard}
            onPress={() => router.push('/friends' as any)}
          >
            <View style={styles.settingsLeft}>
              <View style={styles.settingsIconContainer}>
                <Users size={18} color="#10B981" />
              </View>
              <View style={styles.settingsTextContainer}>
                <Text style={styles.settingsLabel}>{t('friends.myFriends')}</Text>
                {pendingRequestsCount > 0 && (
                  <View style={styles.requestBadge}>
                    <Text style={styles.requestBadgeText}>{pendingRequestsCount}</Text>
                  </View>
                )}
              </View>
            </View>
            <ChevronRight size={18} color="#64748B" />
          </TouchableOpacity>

          <View style={styles.privacyCard}>
            <View style={styles.privacyHeader}>
              <View style={styles.privacyIconContainer}>
                <Shield size={18} color="#8B5CF6" />
              </View>
              <Text style={styles.privacyTitle}>{t('friends.privacySettings')}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.privacyOption}
              onPress={() => setShowVisibilityModal(true)}
            >
              <Text style={styles.privacyOptionText}>{t('friends.historyVisibility')}</Text>
              <View style={styles.privacyValueContainer}>
                <Text style={styles.privacyValue}>
                  {privacySettings.historyVisibility === 'everyone' && t('friends.visibilityEveryone')}
                  {privacySettings.historyVisibility === 'friends_only' && t('friends.visibilityFriendsOnly')}
                  {privacySettings.historyVisibility === 'none' && t('friends.visibilityNone')}
                </Text>
                <ChevronRight size={16} color="#64748B" />
              </View>
            </TouchableOpacity>

            <View style={styles.privacyDivider} />

            <TouchableOpacity 
              style={styles.privacyOption}
              onPress={() => setShowTimeRangeModal(true)}
            >
              <Text style={styles.privacyOptionText}>{t('friends.historyTimeRange')}</Text>
              <View style={styles.privacyValueContainer}>
                <Text style={styles.privacyValue}>
                  {privacySettings.historyTimeRange === 'all' && t('friends.timeRangeAll')}
                  {privacySettings.historyTimeRange === 'six_months' && t('friends.timeRangeSixMonths')}
                  {privacySettings.historyTimeRange === 'three_days' && t('friends.timeRangeThreeDays')}
                </Text>
                <ChevronRight size={16} color="#64748B" />
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={18} color="#DC2626" />
            <Text style={styles.logoutButtonText}>{t('profile.logout')}</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          visible={showVisibilityModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowVisibilityModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowVisibilityModal(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('friends.historyVisibility')}</Text>
              {['everyone', 'friends_only', 'none'].map((visibility) => (
                <TouchableOpacity
                  key={visibility}
                  style={[
                    styles.languageOption,
                    privacySettings.historyVisibility === visibility && styles.languageOptionActive,
                  ]}
                  onPress={async () => {
                    await updatePrivacySettings({ historyVisibility: visibility as any });
                    setShowVisibilityModal(false);
                  }}
                >
                  <Text style={[
                    styles.languageOptionText,
                    privacySettings.historyVisibility === visibility && styles.languageOptionTextActive,
                  ]}>
                    {visibility === 'everyone' && t('friends.visibilityEveryone')}
                    {visibility === 'friends_only' && t('friends.visibilityFriendsOnly')}
                    {visibility === 'none' && t('friends.visibilityNone')}
                  </Text>
                  {privacySettings.historyVisibility === visibility && (
                    <View style={styles.checkMark}>
                      <Text style={styles.checkMarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        <Modal
          visible={showTimeRangeModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowTimeRangeModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowTimeRangeModal(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('friends.historyTimeRange')}</Text>
              {['all', 'six_months', 'three_days'].map((timeRange) => (
                <TouchableOpacity
                  key={timeRange}
                  style={[
                    styles.languageOption,
                    privacySettings.historyTimeRange === timeRange && styles.languageOptionActive,
                  ]}
                  onPress={async () => {
                    await updatePrivacySettings({ historyTimeRange: timeRange as any });
                    setShowTimeRangeModal(false);
                  }}
                >
                  <Text style={[
                    styles.languageOptionText,
                    privacySettings.historyTimeRange === timeRange && styles.languageOptionTextActive,
                  ]}>
                    {timeRange === 'all' && t('friends.timeRangeAll')}
                    {timeRange === 'six_months' && t('friends.timeRangeSixMonths')}
                    {timeRange === 'three_days' && t('friends.timeRangeThreeDays')}
                  </Text>
                  {privacySettings.historyTimeRange === timeRange && (
                    <View style={styles.checkMark}>
                      <Text style={styles.checkMarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        <Modal
          visible={showLanguageModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLanguageModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowLanguageModal(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('profile.selectLanguage')}</Text>
              {(['zh', 'en', 'ja', 'ko'] as Language[]).map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.languageOption,
                    currentLanguage === lang && styles.languageOptionActive,
                  ]}
                  onPress={() => handleLanguageSelect(lang)}
                >
                  <Text style={[
                    styles.languageOptionText,
                    currentLanguage === lang && styles.languageOptionTextActive,
                  ]}>
                    {languageNames[lang]}
                  </Text>
                  {currentLanguage === lang && (
                    <View style={styles.checkMark}>
                      <Text style={styles.checkMarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>
      </View>
    );
  }

  return (
    <>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <User size={40} color="#0066FF" strokeWidth={2.5} />
          </View>
          <Text style={styles.title}>{t('profile.phoneLogin')}</Text>
        </View>

        <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.phone')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('profile.phonePlaceholder')}
                keyboardType="phone-pad"
                inputMode="tel"
                maxLength={11}
                value={phone}
                onChangeText={setPhone}
                editable={true}
                selectTextOnFocus={true}
                autoComplete={Platform.OS === 'web' ? 'tel' : 'off'}
                pointerEvents="auto"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.verificationCode')}</Text>
              <View style={styles.codeRow}>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder={t('profile.verificationCodePlaceholder')}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={6}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  editable={true}
                  selectTextOnFocus={true}
                  autoComplete={Platform.OS === 'web' ? 'one-time-code' : 'off'}
                  pointerEvents="auto"
                />
                <TouchableOpacity
                  style={[styles.sendCodeButton, (countdown > 0) && styles.sendCodeButtonDisabled]}
                  onPress={handleSendCode}
                  disabled={countdown > 0}
                >
                  <Text style={[styles.sendCodeButtonText, (countdown > 0) && styles.sendCodeButtonTextDisabled]} numberOfLines={1}>
                    {countdown > 0 ? `${countdown}${t('profile.resendCode')}` : t('profile.sendCode')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {codeSent && (
              <View style={styles.tipBox}>
                <Text style={styles.tipBoxText}>{t('profile.demoCode')}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>{t('profile.login')}</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.languageCard}
            onPress={() => setShowLanguageModal(true)}
          >
            <View style={styles.languageLeft}>
              <View style={styles.languageIconContainer}>
                <Globe size={18} color="#0066FF" />
              </View>
              <Text style={styles.languageLabel}>{t('profile.language')}</Text>
            </View>
            <View style={styles.languageRight}>
              <Text style={styles.languageValue}>{languageNames[currentLanguage]}</Text>
              <ChevronRight size={18} color="#64748B" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowLanguageModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.selectLanguage')}</Text>
            {(['zh', 'en', 'ja', 'ko'] as Language[]).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.languageOption,
                  currentLanguage === lang && styles.languageOptionActive,
                ]}
                onPress={() => handleLanguageSelect(lang)}
              >
                <Text style={[
                  styles.languageOptionText,
                  currentLanguage === lang && styles.languageOptionTextActive,
                ]}>
                  {languageNames[lang]}
                </Text>
                {currentLanguage === lang && (
                  <View style={styles.checkMark}>
                    <Text style={styles.checkMarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E6F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 14,
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  nicknameText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 14,
    color: '#64748B',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    outlineStyle: 'none' as any,
    ...(Platform.OS === 'web' && {
      outlineWidth: 0,
      cursor: 'text' as any,
    }),
  },
  codeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  codeInput: {
    flex: 1,
  },
  sendCodeButton: {
    backgroundColor: '#0066FF',
    borderRadius: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
    maxWidth: 140,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    flexShrink: 1,
  },
  sendCodeButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  sendCodeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    flexShrink: 1,
    textAlign: 'center',
  },
  sendCodeButtonTextDisabled: {
    color: '#94A3B8',
  },
  tipBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  tipBoxText: {
    fontSize: 14,
    color: '#A16207',
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#0066FF',
    borderRadius: 14,
    padding: 17,
    alignItems: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  loginButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  coinCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 255, 0.08)',
  },
  coinLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  coinIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  coinLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  coinBalance: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.8,
  },
  coinRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rechargeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066FF',
  },
  usageCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 255, 0.08)',
  },
  usageTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
    textAlign: 'center',
    flexShrink: 1,
  },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  usageItem: {
    alignItems: 'center',
    flex: 1,
  },
  usageCount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0066FF',
    marginBottom: 8,
    letterSpacing: -1.2,
  },
  usageLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    flexShrink: 1,
  },
  usageDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },
  languageCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 255, 0.08)',
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  languageRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageValue: {
    fontSize: 14,
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 20,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  languageOptionActive: {
    backgroundColor: '#E6F0FF',
  },
  languageOptionText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  languageOptionTextActive: {
    color: '#0066FF',
    fontWeight: '600',
  },
  checkMark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 255, 0.08)',
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  requestBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  privacyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 255, 0.08)',
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  privacyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  privacyOptionText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  privacyDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  privacyValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  privacyValue: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#10B981',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
});
