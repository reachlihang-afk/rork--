import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Mail, Phone, Eye, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAlert } from '@/contexts/AlertContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type LoginMethod = 'phone' | 'email';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, loginWithEmail, loginWithApple, loginWithGoogle } = useAuth();
  const { currentLanguage } = useLanguage();
  const { showAlert } = useAlert();

  const [loginMethod, setLoginMethod] = useState<LoginMethod>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 发送验证码
  const handleSendCode = useCallback(async () => {
    const target = loginMethod === 'phone' ? phone : email;
    
    if (loginMethod === 'phone') {
      if (!phone || phone.length < 10) {
        showAlert({
          type: 'info',
          message: t('login.invalidPhone'),
        });
        return;
      }
    } else {
      if (!email || !email.includes('@')) {
        showAlert({
          type: 'info',
          message: t('login.invalidEmail'),
        });
        return;
      }
    }

    setCodeSent(true);
    setCountdown(60);

    // TODO: 实际应该调用后端API发送验证码
    showAlert({
      type: 'success',
      title: t('login.codeSent'),
      message: currentLanguage === 'zh' 
        ? `验证码已发送至 ${target}\n\nDemo模式：请输入 123456` 
        : `Verification code sent to ${target}\n\nDemo mode: Enter 123456`,
    });
  }, [loginMethod, phone, email, showAlert, t, currentLanguage]);

  // 手机号/邮箱登录
  const handleLogin = useCallback(async () => {
    if (loginMethod === 'phone') {
      if (!phone || !verificationCode) {
        showAlert({
          type: 'info',
          message: t('login.fillAllFields'),
        });
        return;
      }

      if (verificationCode !== '123456') {
        showAlert({
          type: 'error',
          message: t('login.wrongCode'),
        });
        return;
      }

      setIsSubmitting(true);
      try {
        await login(phone);
        showAlert({
          type: 'success',
          message: t('login.loginSuccess'),
        });
        router.replace('/(tabs)');
      } catch (error) {
        showAlert({
          type: 'error',
          message: t('login.loginFailed'),
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // 邮箱登录
      if (!email || !password) {
        showAlert({
          type: 'info',
          message: t('login.fillAllFields'),
        });
        return;
      }

      if (password.length < 6) {
        showAlert({
          type: 'info',
          message: t('login.passwordTooShort'),
        });
        return;
      }

      setIsSubmitting(true);
      try {
        await loginWithEmail(email, password);
        showAlert({
          type: 'success',
          message: t('login.loginSuccess'),
        });
        router.replace('/(tabs)');
      } catch (error) {
        showAlert({
          type: 'error',
          message: t('login.loginFailed'),
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [loginMethod, phone, email, password, verificationCode, login, loginWithEmail, showAlert, t, router]);

  // Apple登录
  const handleAppleLogin = useCallback(async () => {
    try {
      setIsSubmitting(true);
      await loginWithApple();
      showAlert({
        type: 'success',
        message: t('login.loginSuccess'),
      });
      router.replace('/(tabs)');
    } catch (error: any) {
      if (error?.message !== 'CANCELLED') {
        showAlert({
          type: 'error',
          message: error?.message || t('login.loginFailed'),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [loginWithApple, showAlert, t, router]);

  // Google登录
  const handleGoogleLogin = useCallback(async () => {
    try {
      setIsSubmitting(true);
      await loginWithGoogle();
      showAlert({
        type: 'success',
        message: t('login.loginSuccess'),
      });
      router.replace('/(tabs)');
    } catch (error: any) {
      if (error?.message !== 'CANCELLED') {
        showAlert({
          type: 'error',
          message: error?.message || t('login.loginFailed'),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [loginWithGoogle, showAlert, t, router]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradientBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo & Title */}
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>✨</Text>
              <Text style={styles.titleText}>{t('login.welcome')}</Text>
              <Text style={styles.subtitleText}>{t('login.subtitle')}</Text>
            </View>

            {/* Login Card */}
            <View style={styles.loginCard}>
              {/* 第三方登录 */}
              <View style={styles.socialLoginSection}>
                <TouchableOpacity
                  style={[styles.socialButton, styles.appleButton]}
                  onPress={handleAppleLogin}
                  disabled={isSubmitting}
                >
                  <Text style={styles.appleIcon}></Text>
                  <Text style={styles.socialButtonText}>{t('login.continueWithApple')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.socialButton, styles.googleButton]}
                  onPress={handleGoogleLogin}
                  disabled={isSubmitting}
                >
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={[styles.socialButtonText, styles.googleText]}>
                    {t('login.continueWithGoogle')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 分割线 */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('login.or')}</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* 登录方式切换 */}
              <View style={styles.methodSwitcher}>
                <TouchableOpacity
                  style={[styles.methodTab, loginMethod === 'phone' && styles.methodTabActive]}
                  onPress={() => setLoginMethod('phone')}
                >
                  <Phone
                    size={18}
                    color={loginMethod === 'phone' ? '#667eea' : '#94a3b8'}
                    strokeWidth={2.5}
                  />
                  <Text
                    style={[
                      styles.methodTabText,
                      loginMethod === 'phone' && styles.methodTabTextActive,
                    ]}
                  >
                    {t('login.phoneLogin')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.methodTab, loginMethod === 'email' && styles.methodTabActive]}
                  onPress={() => setLoginMethod('email')}
                >
                  <Mail
                    size={18}
                    color={loginMethod === 'email' ? '#667eea' : '#94a3b8'}
                    strokeWidth={2.5}
                  />
                  <Text
                    style={[
                      styles.methodTabText,
                      loginMethod === 'email' && styles.methodTabTextActive,
                    ]}
                  >
                    {t('login.emailLogin')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 手机号登录表单 */}
              {loginMethod === 'phone' && (
                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{t('login.phoneNumber')}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t('login.phonePlaceholder')}
                      placeholderTextColor="#94a3b8"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      maxLength={15}
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{t('login.verificationCode')}</Text>
                    <View style={styles.codeInputContainer}>
                      <TextInput
                        style={[styles.input, styles.codeInput]}
                        placeholder={t('login.codePlaceholder')}
                        placeholderTextColor="#94a3b8"
                        value={verificationCode}
                        onChangeText={setVerificationCode}
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                      <TouchableOpacity
                        style={[styles.sendCodeButton, countdown > 0 && styles.sendCodeButtonDisabled]}
                        onPress={handleSendCode}
                        disabled={countdown > 0}
                      >
                        <Text style={styles.sendCodeButtonText}>
                          {countdown > 0 ? `${countdown}s` : t('login.sendCode')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* 邮箱登录表单 */}
              {loginMethod === 'email' && (
                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{t('login.email')}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t('login.emailPlaceholder')}
                      placeholderTextColor="#94a3b8"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{t('login.password')}</Text>
                    <View style={styles.passwordInputContainer}>
                      <TextInput
                        style={[styles.input, styles.passwordInput]}
                        placeholder={t('login.passwordPlaceholder')}
                        placeholderTextColor="#94a3b8"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <Eye size={20} color="#94a3b8" />
                        ) : (
                          <EyeOff size={20} color="#94a3b8" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.forgotPassword}>
                    <Text style={styles.forgotPasswordText}>{t('login.forgotPassword')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 登录按钮 */}
              <TouchableOpacity
                style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={isSubmitting}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.loginButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.loginButtonText}>{t('login.login')}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* 注册提示 */}
              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>{t('login.noAccount')}</Text>
                <TouchableOpacity>
                  <Text style={styles.registerLink}>{t('login.register')}</Text>
                </TouchableOpacity>
              </View>

              {/* 服务条款 */}
              <Text style={styles.termsText}>
                {t('login.termsPrefix')}
                <Text style={styles.termsLink}>{t('login.termsOfService')}</Text>
                {t('login.termsAnd')}
                <Text style={styles.termsLink}>{t('login.privacyPolicy')}</Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBg: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  logoText: {
    fontSize: 64,
    marginBottom: 16,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  loginCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  socialLoginSection: {
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    gap: 10,
  },
  appleButton: {
    backgroundColor: '#000',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  appleIcon: {
    fontSize: 20,
    color: '#fff',
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  googleText: {
    color: '#1e293b',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  methodSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  methodTabActive: {
    backgroundColor: '#fff',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  methodTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  methodTabTextActive: {
    color: '#667eea',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1e293b',
    backgroundColor: '#fff',
  },
  codeInputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  codeInput: {
    flex: 1,
  },
  sendCodeButton: {
    width: 100,
    backgroundColor: '#667eea',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendCodeButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  sendCodeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  passwordInputContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 14,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: 13,
    color: '#667eea',
    fontWeight: '600',
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonGradient: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 4,
  },
  registerText: {
    fontSize: 14,
    color: '#64748b',
  },
  registerLink: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
  termsLink: {
    color: '#667eea',
    fontWeight: '600',
  },
});
