import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Coins, Check, ArrowLeft } from 'lucide-react-native';
import { useCoin } from '@/contexts/CoinContext';
import { useAuth } from '@/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

interface RechargePackage {
  id: string;
  amount: number;
  coins: number;
  popular?: boolean;
}

const RECHARGE_PACKAGES: RechargePackage[] = [
  { id: '1', amount: 10, coins: 100 },
  { id: '2', amount: 50, coins: 500 },
  { id: '3', amount: 100, coins: 1000, popular: true },
  { id: '4', amount: 200, coins: 2000 },
  { id: '5', amount: 500, coins: 5000 },
];

export default function RechargeScreen() {
  const { t } = useTranslation();
  const { coinBalance, addCoins } = useCoin();
  const { isLoggedIn } = useAuth();

  const handleRecharge = (pkg: RechargePackage) => {
    Alert.alert(
      t('common.confirm'),
      `${t('profile.recharge')} ¥${pkg.amount} ${t('recharge.coins')} ${pkg.coins}?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            await addCoins(pkg.coins);
            Alert.alert(t('recharge.paymentSuccess'), `${t('recharge.coins')} ${pkg.coins}`, [
              { text: t('common.confirm'), onPress: () => router.back() }
            ]);
          },
        },
      ]
    );
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            activeOpacity={0.6}
          >
            <ArrowLeft size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('recharge.title')}</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.notLoginContainer}>
          <Coins size={64} color="#CBD5E1" />
          <Text style={styles.notLoginTitle}>{t('profile.login')}</Text>
          <Text style={styles.notLoginSubtitle}>{t('profile.loginDesc')}</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.loginButtonText}>{t('profile.login')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          activeOpacity={0.6}
        >
          <ArrowLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('recharge.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.balanceCard}>
          <Coins size={32} color="#0066FF" />
          <Text style={styles.balanceLabel}>{t('recharge.currentBalance')}</Text>
          <Text style={styles.balanceAmount}>{coinBalance}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('recharge.selectAmount')}</Text>
          <View style={styles.packagesGrid}>
            {RECHARGE_PACKAGES.map((pkg) => (
              <TouchableOpacity
                key={pkg.id}
                style={[styles.packageCard, pkg.popular && styles.packageCardPopular]}
                onPress={() => handleRecharge(pkg)}
              >
                {pkg.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>{t('recharge.popular')}</Text>
                  </View>
                )}
                <View style={styles.packageContent}>
                  <Coins size={28} color={pkg.popular ? '#0066FF' : '#64748B'} />
                  <Text style={styles.packageCoins}>{pkg.coins}</Text>
                  <Text style={styles.packageCoinsLabel}>{t('recharge.coins')}</Text>
                  <View style={styles.packageDivider} />
                  <Text style={styles.packageAmount}>¥{pkg.amount}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💰 {t('common.tip')}</Text>
          <View style={styles.infoItem}>
            <Check size={16} color="#0066FF" />
            <Text style={styles.infoText}>100元人民币 = 1000金币</Text>
          </View>
          <View style={styles.infoItem}>
            <Check size={16} color="#0066FF" />
            <Text style={styles.infoText}>每次验证/找出处消耗100金币</Text>
          </View>
          <View style={styles.infoItem}>
            <Check size={16} color="#0066FF" />
            <Text style={styles.infoText}>注册用户每天免费3次</Text>
          </View>
          <View style={styles.infoItem}>
            <Check size={16} color="#0066FF" />
            <Text style={styles.infoText}>金币永久有效，不会过期</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  notLoginContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  notLoginTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 24,
    marginBottom: 8,
  },
  notLoginSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#0066FF',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  packageCardPopular: {
    borderWidth: 2,
    borderColor: '#0066FF',
  },
  popularBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#0066FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  popularText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  packageContent: {
    alignItems: 'center',
  },
  packageCoins: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  packageCoinsLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  packageDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  packageAmount: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0066FF',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
});
