import { User, LogOut, Coins, ChevronRight, Globe, Edit3, Users, Shield } from 'lucide-react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, Pressable, ScrollView, Image, Keyboard, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useCoin } from '@/contexts/CoinContext';
import { useLanguage, Language, languageNames } from '@/contexts/LanguageContext';
import { useFriends } from '@/contexts/FriendsContext';
import { useAlert } from '@/contexts/AlertContext';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, isLoggedIn, isLoading, login, logout } = useAuth();
  const { coinBalance, getRemainingFreeCounts } = useCoin();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { pendingRequestsCount, privacySettings, updatePrivacySettings } = useFriends();
  const { showAlert } = useAlert();
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [showTimeRangeModal, setShowTimeRangeModal] = useState(false);
  
  const { verification, imageSource, outfitChange } = getRemainingFreeCounts();

  const handleLanguageSelect = async (lang: Language) => {
    await changeLanguage(lang);
    setShowLanguageModal(false);
  };

  const handleSendCode = async () => {
    if (!phone || phone.length !== 11) {
      showAlert({
        type: 'info',
        message: t('profile.invalidPhone')
      });
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

    showAlert({
      type: 'success',
      title: t('profile.codeSent'),
      message: t('profile.demoCode')
    });
  };

  const handleLogin = useCallback(async () => {
    if (!phone || !verificationCode) {
      showAlert({
        type: 'info',
        message: t('profile.invalidCode')
      });
      return;
    }

    if (verificationCode !== '123456') {
      showAlert({
        type: 'error',
        message: t('profile.wrongCode')
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await login(phone);
      showAlert({
        type: 'success',
        message: t('profile.loginSuccess')
      });
      setPhone('');
      setVerificationCode('');
      setCodeSent(false);
    } catch {
      showAlert({
        type: 'error',
        message: t('profile.loginFailed')
      });
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
    showAlert({
      type: 'confirm',
      title: t('profile.logout'),
      message: t('profile.logoutConfirm'),
      confirmText: t('profile.logout'),
      onConfirm: async () => {
        await logout();
        showAlert({
          type: 'success',
          message: t('profile.logoutSuccess')
        });
      }
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a1a1a" />
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
                  <User size={40} color="#1a1a1a" strokeWidth={2.5} />
                </View>
              )}
              <View style={styles.editBadge}>
                <Edit3 size={12} color="#1a1a1a" />
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
                <Text style={styles.usageCount}>{outfitChange}</Text>
                <Text style={styles.usageLabel} numberOfLines={2}>{t('profile.outfitChangeTimes')}</Text>
              </View>
              <View style={styles.usageDivider} />
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
                <Globe size={18} color="#1a1a1a" />
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
              <Text style={styles.privacyOptionText}>{t('friends.outfitHistoryVisibility')}</Text>
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

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.loginHero}>
            <View style={styles.loginHeroContent}>
              <View style={styles.loginIconWrapper}>
                <User size={40} color="#1a1a1a" strokeWidth={2} />
              </View>
              <Text style={styles.loginHeroTitle}>{t('profile.phoneLogin')}</Text>
              <Text style={styles.loginHeroSubtitle}>{t('home.transformInstantly')}</Text>
            </View>
          </View>

          <View style={styles.content}>
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
                  placeholderTextColor="#94a3b8"
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
                    placeholderTextColor="#94a3b8"
                  />
                  <TouchableOpacity
                    style={[styles.sendCodeButton, (countdown > 0) && styles.sendCodeButtonDisabled]}
                    onPress={handleSendCode}
                    disabled={countdown > 0}
                  >
                    <Text style={[styles.sendCodeButtonText, (countdown > 0) && styles.sendCodeButtonTextDisabled]}>
                      {countdown > 0 ? `${countdown}s` : t('profile.sendCode')}
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
                  <Globe size={18} color="#1a1a1a" />
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
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginHero: {
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
    paddingBottom: 60,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  loginHeroContent: {
    alignItems: 'center',
  },
  loginIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  loginHeroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1a1a1a',
    letterSpacing: -1,
    marginBottom: 8,
  },
  loginHeroSubtitle: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
    borderWidth: 2,
    borderColor: '#f8fafc',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  nicknameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  phoneText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1a1a1a',
    letterSpacing: -1,
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
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
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 1.5,
    borderColor: '#1a1a1a',
  },
  sendCodeButtonDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  sendCodeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  sendCodeButtonTextDisabled: {
    color: '#94a3b8',
  },
  tipBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderStyle: 'dashed',
  },
  tipBoxText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#f1f5f9',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  coinCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coinBalance: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1a1a1a',
    letterSpacing: -1,
  },
  coinRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rechargeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  usageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  usageTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 20,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
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
    fontSize: 32,
    fontWeight: '900',
    color: '#1a1a1a',
    marginBottom: 6,
    letterSpacing: -1,
  },
  usageLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '600',
  },
  usageDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#f1f5f9',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#fee2e2',
    marginTop: 20,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#dc2626',
  },
  languageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  languageIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  languageRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageValue: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1a1a1a',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  languageOptionActive: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  languageOptionText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '700',
  },
  languageOptionTextActive: {
    color: '#ffffff',
  },
  checkMark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMarkText: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '900',
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  settingsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
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
    fontWeight: '700',
    color: '#1a1a1a',
  },
  requestBadge: {
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  privacyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  privacyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#faf5ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  privacyOptionText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
    flex: 1,
  },
  privacyDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  privacyValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  privacyValue: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '700',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#10b981',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
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
