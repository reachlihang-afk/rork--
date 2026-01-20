import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Animated, 
  Dimensions, 
  Platform 
} from 'react-native';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';

type AlertType = 'success' | 'error' | 'info' | 'confirm' | 'success_confirm';

interface AlertOptions {
  title?: string;
  message: string;
  type?: AlertType;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  const showAlert = useCallback((opts: AlertOptions) => {
    setOptions(opts);
    setVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const hideAlert = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setOptions(null);
    });
  }, [fadeAnim, scaleAnim]);

  const handleConfirm = () => {
    if (options?.onConfirm) {
      options.onConfirm();
    }
    hideAlert();
  };

  const handleCancel = () => {
    if (options?.onCancel) {
      options.onCancel();
    }
    hideAlert();
  };

  const getIcon = () => {
    const size = 48;
    switch (options?.type) {
      case 'success':
      case 'success_confirm':
        return <CheckCircle2 size={size} color="#10b981" strokeWidth={1.5} />;
      case 'error':
        return <XCircle size={size} color="#ef4444" strokeWidth={1.5} />;
      case 'confirm':
        return <AlertCircle size={size} color="#f59e0b" strokeWidth={1.5} />;
      default:
        return <Info size={size} color="#3b82f6" strokeWidth={1.5} />;
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <Modal
        transparent
        visible={visible}
        animationType="none"
        onRequestClose={hideAlert}
      >
        <View style={styles.overlay}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
            <TouchableOpacity 
              activeOpacity={1} 
              style={styles.backdropClick} 
              onPress={options?.type !== 'confirm' && options?.type !== 'success_confirm' ? hideAlert : undefined} 
            />
          </Animated.View>

          <Animated.View 
            style={[
              styles.alertContainer, 
              { 
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            {Platform.OS === 'ios' ? (
              <BlurView intensity={80} tint="light" style={styles.blurContainer}>
                <AlertContent 
                  options={options} 
                  getIcon={getIcon} 
                  onConfirm={handleConfirm} 
                  onCancel={handleCancel} 
                  hideAlert={hideAlert}
                />
              </BlurView>
            ) : (
              <View style={styles.whiteContainer}>
                <AlertContent 
                  options={options} 
                  getIcon={getIcon} 
                  onConfirm={handleConfirm} 
                  onCancel={handleCancel} 
                  hideAlert={hideAlert}
                />
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

const AlertContent = ({ options, getIcon, onConfirm, onCancel, hideAlert }: any) => {
  const { t } = useTranslation();
  const isConfirmType = options?.type === 'confirm' || options?.type === 'success_confirm';
  return (
    <View style={styles.content}>
      {!isConfirmType && (
        <TouchableOpacity style={styles.closeButton} onPress={hideAlert}>
          <X size={20} color="#94a3b8" />
        </TouchableOpacity>
      )}
      
      <View style={styles.iconContainer}>
        {getIcon()}
      </View>

      {options?.title && (
        <Text style={styles.title}>{options.title}</Text>
      )}
      
      <Text style={styles.message}>{options?.message}</Text>

      <View style={styles.buttonContainer}>
        {(options?.type === 'confirm' || options?.type === 'success_confirm') && (
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]} 
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>
              {options.cancelText || t('common.cancel')}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[
            styles.button, 
            (options?.type === 'confirm' || options?.type === 'success_confirm') ? styles.confirmButton : styles.okButton
          ]} 
          onPress={onConfirm}
        >
          <Text style={(options?.type === 'confirm' || options?.type === 'success_confirm') ? styles.confirmButtonText : styles.okButtonText}>
            {options?.confirmText || ((options?.type === 'confirm' || options?.type === 'success_confirm') ? t('common.confirm') : t('common.gotIt'))}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backdropClick: {
    flex: 1,
  },
  alertContainer: {
    width: width * 0.85,
    maxWidth: 340,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  blurContainer: {
    padding: 24,
  },
  whiteContainer: {
    backgroundColor: '#ffffff',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    padding: 8,
  },
  iconContainer: {
    marginBottom: 20,
    padding: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  okButton: {
    backgroundColor: '#1a1a1a',
  },
  okButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#1a1a1a',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
});
