import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, useColorScheme, Platform } from 'react-native';
import { router, Stack } from 'expo-router';
import { ArrowLeft, RefreshCw, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCoin } from '@/contexts/CoinContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface RechargePackage {
  id: string;
  tier: 'starter' | 'popular' | 'best' | 'luxury';
  name: string;
  coins: number;
  bonus?: number;
  price: number;
  save?: string;
}

const RECHARGE_PACKAGES: RechargePackage[] = [
  { 
    id: '1', 
    tier: 'starter',
    name: 'Starter', 
    coins: 500, 
    price: 4.99 
  },
  { 
    id: '2', 
    tier: 'popular',
    name: 'Fashionista', 
    coins: 1200, 
    bonus: 50,
    price: 9.99 
  },
  { 
    id: '3', 
    tier: 'best',
    name: 'Wardrobe Refresh', 
    coins: 5000, 
    price: 39.99,
    save: '20%'
  },
  { 
    id: '4', 
    tier: 'luxury',
    name: 'Luxury Swap', 
    coins: 10000, 
    price: 79.99 
  },
];

export default function RechargeScreen() {
  const { t } = useTranslation();
  const { coinBalance, addCoins } = useCoin();
  const { isLoggedIn } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleRecharge = (pkg: RechargePackage) => {
    Alert.alert(
      t('common.confirm'),
      t('recharge.confirmPurchase', { coins: pkg.coins, price: pkg.price }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            await addCoins(pkg.coins);
            Alert.alert(
              t('common.success'), 
              t('recharge.purchaseSuccess', { coins: pkg.coins }),
              [{ text: t('common.ok'), onPress: () => router.back() }]
            );
          },
        },
      ]
    );
  };

  const handleRestore = () => {
    Alert.alert(
      t('recharge.restorePurchases'),
      t('recharge.restoreMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => {
            Alert.alert(t('common.success'), t('recharge.restoreSuccess'));
          },
        },
      ]
    );
  };

  if (!isLoggedIn) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <Stack.Screen options={{ headerShown: false }} />
        
        {/* Header */}
        <View style={[styles.header, isDark && styles.headerDark]}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.headerButton}
          >
            <ArrowLeft size={24} color={isDark ? '#fff' : '#1a1a1a'} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.textDark]}>
            {t('recharge.title').toUpperCase()}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.notLoginContainer}>
          <Text style={styles.diamondIcon}>💎</Text>
          <Text style={[styles.notLoginTitle, isDark && styles.textDark]}>
            {t('profile.loginRequired')}
          </Text>
          <Text style={[styles.notLoginSubtitle, isDark && styles.subtitleDark]}>
            {t('profile.loginDesc')}
          </Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/(tabs)/profile' as any)}
          >
            <Text style={styles.loginButtonText}>{t('profile.login')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.headerButton}
        >
          <ArrowLeft size={24} color={isDark ? '#fff' : '#1a1a1a'} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>
          {t('recharge.title').toUpperCase()}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Balance */}
        <View style={styles.balanceSection}>
          <Text style={[styles.balanceLabel, isDark && styles.subtitleDark]}>
            {t('recharge.currentBalance').toUpperCase()}
          </Text>
          <View style={styles.balanceRow}>
            <Text style={styles.diamondIcon}>💎</Text>
            <Text style={[styles.balanceAmount, isDark && styles.textDark]}>
              {coinBalance}
            </Text>
          </View>
          <View style={[styles.divider, isDark && styles.dividerDark]} />
        </View>

        {/* Packages */}
        <View style={styles.packagesContainer}>
          {RECHARGE_PACKAGES.map((pkg, index) => {
            const isPopular = pkg.tier === 'popular';
            const isBest = pkg.tier === 'best';
            const isLuxury = pkg.tier === 'luxury';

            return (
              <TouchableOpacity
                key={pkg.id}
                style={[
                  styles.packageCard,
                  isDark && styles.packageCardDark,
                  isBest && styles.packageCardBest,
                  isBest && isDark && styles.packageCardBestDark,
                ]}
                onPress={() => handleRecharge(pkg)}
                activeOpacity={0.9}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.badgeText}>
                      {t('recharge.popular').toUpperCase()}
                    </Text>
                  </View>
                )}

                {/* Best Value Badge */}
                {isBest && (
                  <View style={[styles.bestBadge, isDark && styles.bestBadgeDark]}>
                    <Text style={[styles.badgeTextBest, isDark && styles.badgeTextBestDark]}>
                      {t('recharge.bestValue').toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={[styles.packageContent, isBest && styles.packageContentBest]}>
                  {/* Tier Name & Save Badge */}
                  <View style={styles.packageHeader}>
                    <Text style={[styles.tierName, isDark && styles.subtitleDark]}>
                      {t(`recharge.tier.${pkg.tier}`).toUpperCase()}
                    </Text>
                    {pkg.save && (
                      <View style={[styles.saveBadge, isDark && styles.saveBadgeDark]}>
                        <Text style={[styles.saveText, isDark && styles.saveTextDark]}>
                          {t('recharge.save', { percent: pkg.save })}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Coins Amount */}
                  <View style={[styles.coinsRow, isBest && styles.coinsRowBest]}>
                    <View style={styles.coinsInfo}>
                      <Text style={[styles.coinsAmount, isDark && styles.textDark, isBest && styles.coinsAmountBest]}>
                        {pkg.coins.toLocaleString()}
                      </Text>
                      <Text style={[styles.coinsLabel, isDark && styles.subtitleDark]}>
                        {t('recharge.coins')}
                      </Text>
                      {pkg.bonus && (
                        <Text style={[styles.bonusText, isDark && styles.bonusTextDark]}>
                          +{pkg.bonus} {t('recharge.bonus')}
                        </Text>
                      )}
                    </View>

                    {/* Price Button */}
                    {isLuxury ? (
                      <TouchableOpacity style={styles.luxuryButton} activeOpacity={0.9}>
                        <LinearGradient
                          colors={isDark ? ['#78716c', '#292524'] : ['#57534e', '#000000']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.gradientButton}
                        >
                          <Text style={styles.priceTextLuxury}>
                            ${pkg.price.toFixed(2)}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        style={[
                          styles.priceButton,
                          pkg.tier === 'starter' && styles.priceButtonStarter,
                          pkg.tier === 'starter' && isDark && styles.priceButtonStarterDark,
                          pkg.tier === 'popular' && styles.priceButtonPopular,
                          pkg.tier === 'best' && styles.priceButtonBest,
                          pkg.tier === 'best' && isDark && styles.priceButtonBestDark,
                        ]}
                        activeOpacity={0.9}
                      >
                        <Text style={styles.priceText}>
                          ${pkg.price.toFixed(2)}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Restore Purchases */}
        <TouchableOpacity 
          style={styles.restoreButton}
          onPress={handleRestore}
          activeOpacity={0.7}
        >
          <RefreshCw size={16} color={isDark ? '#78716c' : '#a8a29e'} strokeWidth={2.5} />
          <Text style={[styles.restoreText, isDark && styles.restoreTextDark]}>
            {t('recharge.restorePurchases').toUpperCase()}
          </Text>
        </TouchableOpacity>

        {/* Security & Terms */}
        <View style={styles.footerSection}>
          <View style={styles.securityRow}>
            <Lock size={14} color={isDark ? '#57534e' : '#a8a29e'} />
            <Text style={[styles.securityText, isDark && styles.securityTextDark]}>
              {t('recharge.securedBy').toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.termsText, isDark && styles.termsTextDark]}>
            {t('recharge.terms')}
          </Text>
          <Text style={[styles.termsText, isDark && styles.termsTextDark]}>
            {t('recharge.nonRefundable')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  containerDark: {
    backgroundColor: '#050505',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    paddingBottom: 12,
    backgroundColor: 'rgba(250, 250, 250, 0.95)',
  },
  headerDark: {
    backgroundColor: 'rgba(5, 5, 5, 0.95)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 2,
  },
  placeholder: {
    width: 40,
  },
  
  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  
  // Balance Section
  balanceSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 48,
    paddingHorizontal: 16,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#a8a29e',
    letterSpacing: 2,
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  diamondIcon: {
    fontSize: 48,
  },
  balanceAmount: {
    fontSize: 72,
    fontWeight: '300',
    color: '#1a1a1a',
    letterSpacing: -2,
  },
  divider: {
    width: 32,
    height: 4,
    backgroundColor: '#e7e5e4',
    borderRadius: 2,
    marginTop: 24,
  },
  dividerDark: {
    backgroundColor: '#292524',
  },
  
  // Packages
  packagesContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  packageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative',
  },
  packageCardDark: {
    backgroundColor: '#1c1917',
    borderColor: '#292524',
  },
  packageCardBest: {
    borderWidth: 2,
    borderColor: '#000000',
    shadowColor: '#104F3B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  packageCardBestDark: {
    borderColor: '#ffffff',
    shadowColor: '#10b981',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    backgroundColor: '#B89B5E',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 10,
  },
  bestBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  bestBadgeDark: {
    backgroundColor: '#ffffff',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1.5,
  },
  badgeTextBest: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1.5,
  },
  badgeTextBestDark: {
    color: '#000000',
  },
  packageContent: {
    padding: 20,
    gap: 8,
  },
  packageContentBest: {
    paddingTop: 24,
    paddingBottom: 24,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tierName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78716c',
    letterSpacing: 1.5,
  },
  saveBadge: {
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  saveBadgeDark: {
    backgroundColor: 'rgba(16, 79, 59, 0.3)',
    borderColor: '#065f46',
  },
  saveText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#104F3B',
  },
  saveTextDark: {
    color: '#34d399',
  },
  coinsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coinsRowBest: {
    marginTop: 8,
  },
  coinsInfo: {
    flex: 1,
  },
  coinsAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 24,
  },
  coinsAmountBest: {
    fontSize: 30,
  },
  coinsLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#78716c',
    marginTop: 2,
  },
  bonusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B89B5E',
    marginTop: 4,
  },
  bonusTextDark: {
    color: '#D4B572',
  },
  
  // Price Buttons
  priceButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  priceButtonStarter: {
    backgroundColor: '#A1A6AD',
  },
  priceButtonStarterDark: {
    backgroundColor: '#57534e',
  },
  priceButtonPopular: {
    backgroundColor: '#B89B5E',
  },
  priceButtonBest: {
    backgroundColor: '#104F3B',
    paddingHorizontal: 32,
    shadowColor: '#104F3B',
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  priceButtonBestDark: {
    backgroundColor: '#059669',
  },
  priceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  luxuryButton: {
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gradientButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  priceTextLuxury: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  
  // Restore Button
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 32,
    marginHorizontal: 24,
    borderRadius: 8,
  },
  restoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a8a29e',
    letterSpacing: 1.5,
  },
  restoreTextDark: {
    color: '#78716c',
  },
  
  // Footer
  footerSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 24,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  securityText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#78716c',
    letterSpacing: 1.5,
  },
  securityTextDark: {
    color: '#57534e',
  },
  termsText: {
    fontSize: 9,
    fontWeight: '500',
    color: '#d6d3d1',
    textAlign: 'center',
    lineHeight: 14,
  },
  termsTextDark: {
    color: '#44403c',
  },
  
  // Not Login
  notLoginContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  notLoginTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 24,
    marginBottom: 8,
  },
  notLoginSubtitle: {
    fontSize: 16,
    color: '#78716c',
    marginBottom: 32,
    textAlign: 'center',
  },
  subtitleDark: {
    color: '#78716c',
  },
  loginButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  
  // Text colors
  textDark: {
    color: '#ffffff',
  },
});
