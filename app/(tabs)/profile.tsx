import { User, LogOut, Coins, ChevronRight, Globe, Edit3, Users, Shield } from 'lucide-react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, Pressable, ScrollView, Image, Keyboard, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useCoin } from '@/contexts/CoinContext';
import { useLanguage, Language, languageNames } from '@/contexts/LanguageContext';
import { useFriends } from '@/contexts/FriendsContext';
import { useAlert } from '@/contexts/AlertContext';
import { useVerification } from '@/contexts/VerificationContext'
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, isLoggedIn, isLoading, login, logout } = useAuth();
  const { coinBalance, getRemainingFreeCounts } = useCoin();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { pendingRequestsCount, privacySettings, updatePrivacySettings } = useFriends();
  const { showAlert } = useAlert();
  const { outfitChangeHistory } = useVerification();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [showTimeRangeModal, setShowTimeRangeModal] = useState(false);
  
  const { outfitChange } = getRemainingFreeCounts();

  const handleLanguageSelect = async (lang: Language) => {
    await changeLanguage(lang);
    setShowLanguageModal(false);
  };

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
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>✓</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.nicknameText}>{user.nickname || user.userId}</Text>
            {user.bio ? (
              <Text style={styles.bioText}>{user.bio}</Text>
            ) : (
              <TouchableOpacity onPress={() => router.push('/edit-profile')}>
                <Text style={styles.bioPlaceholder}>{t('profile.addBio')}</Text>
              </TouchableOpacity>
            )}
            
            {/* 统计数据 */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{user.followingCount || 0}</Text>
                <Text style={styles.statLabel}>{t('profile.following')}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{user.followersCount || 0}</Text>
                <Text style={styles.statLabel}>{t('profile.followers')}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{outfitChangeHistory.length}</Text>
                <Text style={styles.statLabel}>{t('profile.swaps')}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.coinCard}
            onPress={() => router.push('/recharge')}
          >
            <View style={styles.coinLeft}>
              <View style={styles.coinIconContainer}>
                <Text style={styles.diamondIcon}>💎</Text>
              </View>
              <View>
                <Text style={styles.coinLabel}>{t('profile.myDiamonds')}</Text>
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
          {/* 新的登录入口 */}
          <View style={styles.modernLoginHero}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.modernLoginGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.modernLoginContent}>
                <Text style={styles.modernLoginIcon}>✨</Text>
                <Text style={styles.modernLoginTitle}>{t('home.title')}</Text>
                <Text style={styles.modernLoginSubtitle}>{t('home.transformInstantly')}</Text>
                <TouchableOpacity 
                  style={styles.modernLoginButton}
                  onPress={() => router.push('/login' as any)}
                >
                  <Text style={styles.modernLoginButtonText}>{t('profile.login')}</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
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
  modernLoginHero: {
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modernLoginGradient: {
    padding: 40,
  },
  modernLoginContent: {
    alignItems: 'center',
  },
  modernLoginIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  modernLoginTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  modernLoginSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 24,
  },
  modernLoginButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modernLoginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#667eea',
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
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  verifiedIcon: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
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
  bioText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  bioPlaceholder: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 2,
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
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondIcon: {
    fontSize: 28,
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
