import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { router, Stack } from 'expo-router';
import { ArrowLeft, RefreshCw, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCoin } from '@/contexts/CoinContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useAlert } from '@/contexts/AlertContext';

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
  const { showAlert } = useAlert();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const handleRecharge = (pkg: RechargePackage) => {
    showAlert({
      type: 'confirm',
      title: t('common.confirm'),
      message: t('recharge.confirmPurchase', { coins: pkg.coins, price: pkg.price }),
      onConfirm: async () => {
        await addCoins(pkg.coins);
        showAlert({
          type: 'success',
          title: t('common.success'),
          message: t('recharge.purchaseSuccess', { coins: pkg.coins }),
          onConfirm: () => router.back()
        });
      }
    });
  };

  const handleRestore = () => {
    showAlert({
      type: 'confirm',
      title: t('recharge.restorePurchases'),
      message: t('recharge.restoreMessage'),
      onConfirm: () => {
        showAlert({
          type: 'success',
          title: t('common.success'),
          message: t('recharge.restoreSuccess')
        });
      }
    });
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        
        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.headerButton}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={26} color="#1a1a1a" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('recharge.title').toUpperCase()}
        </Text>
        <View style={styles.placeholder} />
        </View>

        <View style={styles.notLoginContainer}>
          <Text style={styles.diamondIcon}>💎</Text>
          <Text style={styles.notLoginTitle}>
            {t('profile.loginRequired')}
          </Text>
          <Text style={styles.notLoginSubtitle}>
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
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.headerButton}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={26} color="#1a1a1a" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
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
          <Text style={styles.balanceLabel}>
            {t('recharge.currentBalance').toUpperCase()}
          </Text>
          <View style={styles.balanceRow}>
            <Text style={styles.diamondIcon}>💎</Text>
            <Text style={styles.balanceAmount}>
              {coinBalance}
            </Text>
          </View>
          <View style={styles.divider} />
        </View>

        {/* Packages */}
        <View style={styles.packagesContainer}>
          {RECHARGE_PACKAGES.map((pkg, index) => {
            const isSelected = selectedPackage === pkg.id;
            const isPopular = pkg.tier === 'popular';
            const isBest = pkg.tier === 'best';

            return (
              <TouchableOpacity
                key={pkg.id}
                style={[
                  styles.packageCard,
                  isSelected && styles.packageCardSelected,
                ]}
                onPress={() => {
                  setSelectedPackage(pkg.id);
                  handleRecharge(pkg);
                }}
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
                  <View style={styles.bestBadge}>
                    <Text style={styles.badgeTextBest}>
                      {t('recharge.bestValue').toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.packageContent}>
                  {/* Tier Name & Save Badge */}
                  <View style={styles.packageHeader}>
                    <Text style={styles.tierName}>
                      {t(`recharge.tier.${pkg.tier}`).toUpperCase()}
                    </Text>
                    {pkg.save && (
                      <View style={styles.saveBadge}>
                        <Text style={styles.saveText}>
                          {t('recharge.save', { percent: pkg.save })}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Diamonds Amount */}
                  <View style={styles.coinsRow}>
                    <View style={styles.coinsInfo}>
                      <Text style={styles.coinsAmount}>
                        {pkg.coins.toLocaleString()}
                      </Text>
                      <Text style={styles.coinsLabel}>
                        钻石
                      </Text>
                      {pkg.bonus && (
                        <Text style={styles.bonusText}>
                          +{pkg.bonus} {t('recharge.bonus')}
                        </Text>
                      )}
                    </View>

                    {/* Price Button - 统一样式 */}
                    <View style={styles.priceButton}>
                      <Text style={styles.priceText}>
                        ${pkg.price.toFixed(2)}
                      </Text>
                    </View>
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
          <RefreshCw size={16} color="#a8a29e" strokeWidth={2.5} />
          <Text style={styles.restoreText}>
            {t('recharge.restorePurchases').toUpperCase()}
          </Text>
        </TouchableOpacity>

        {/* Security & Terms */}
        <View style={styles.footerSection}>
          <View style={styles.securityRow}>
            <Lock size={14} color="#a8a29e" />
            <Text style={styles.securityText}>
              {t('recharge.securedBy').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.termsText}>
            {t('recharge.terms')}
          </Text>
          <Text style={styles.termsText}>
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
    backgroundColor: '#ffffff',
  },
  
  // Header - iOS 优化版本
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 24,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    minHeight: Platform.OS === 'ios' ? 100 : 72,
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    marginLeft: -8,
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
  
  // Packages - 统一样式
  packagesContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  packageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e7e5e4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  packageCardSelected: {
    borderWidth: 2,
    borderColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
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
    backgroundColor: '#1a1a1a',
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
  packageContent: {
    padding: 24,
    gap: 12,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
  saveText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#104F3B',
  },
  coinsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coinsInfo: {
    flex: 1,
  },
  coinsAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    lineHeight: 30,
  },
  coinsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78716c',
    marginTop: 2,
  },
  bonusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B89B5E',
    marginTop: 6,
  },
  
  // Price Button - 统一样式
  priceButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
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
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  restoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a8a29e',
    letterSpacing: 1.5,
  },
  
  // Footer
  footerSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 40,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  securityText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#a8a29e',
    letterSpacing: 1.5,
  },
  termsText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#d6d3d1',
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 240,
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
  loginButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
