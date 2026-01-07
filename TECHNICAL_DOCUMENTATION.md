# 网图克星 - 技术文档

## 🏗️ 项目架构

### 技术栈

```
前端框架: React Native 0.81.5 + React 19.1.0
开发框架: Expo ~54.0.27
路由管理: Expo Router ~6.0.17
状态管理: Zustand + Context API
UI 组件: Lucide React Native Icons
国际化: i18next + react-i18next
图片处理: Expo Image + Image Manipulator
AI 服务: Rork AI Toolkit SDK
```

### 项目结构

```
rork--/
├── app/                          # 页面和路由
│   ├── (tabs)/                   # 底部导航页面
│   │   ├── index.tsx            # 首页
│   │   ├── history.tsx          # 历史记录
│   │   ├── profile.tsx          # 个人中心
│   │   └── square.tsx           # 社交广场
│   ├── _layout.tsx              # 全局布局
│   ├── outfit-change.tsx        # 一键换装
│   ├── verify-photo.tsx         # 照片验证
│   ├── image-source.tsx         # 网图溯源
│   ├── result/[id].tsx          # 验证结果详情
│   └── ...                      # 其他页面
├── components/                   # 公共组件
│   └── ShareableVerificationResult.tsx
├── contexts/                     # Context 状态管理
│   ├── AuthContext.tsx          # 用户认证
│   ├── CoinContext.tsx          # 金币系统
│   └── VerificationContext.tsx  # 验证数据
├── locales/                      # 国际化语言文件
│   ├── zh.ts                    # 简体中文
│   ├── en.ts                    # English
│   ├── ja.ts                    # 日本語
│   └── ko.ts                    # 한국어
├── types/                        # TypeScript 类型定义
│   └── verification.ts
├── utils/                        # 工具函数
│   └── share.ts
├── package.json                  # 项目依赖
└── app.json                      # Expo 配置
```

---

## 🔌 核心模块

### 1. 路由系统 (Expo Router)

#### 文件路由结构

```typescript
// 底部导航 Tab 路由
app/(tabs)/_layout.tsx     -> 配置 Tab 导航
app/(tabs)/index.tsx       -> / (首页)
app/(tabs)/history.tsx     -> /history
app/(tabs)/square.tsx      -> /square
app/(tabs)/profile.tsx     -> /profile

// 功能页面路由
app/outfit-change.tsx      -> /outfit-change
app/verify-photo.tsx       -> /verify-photo
app/result/[id].tsx        -> /result/:id (动态路由)
```

#### 导航使用示例

```typescript
import { useRouter } from 'expo-router';

const router = useRouter();

// 普通导航
router.push('/outfit-change');

// 动态路由导航
router.push({
  pathname: '/result/[id]',
  params: { id: verificationId }
});

// 返回上一页
router.back();
```

---

### 2. 状态管理

#### 2.1 Context API 架构

**AuthContext - 用户认证**
```typescript
// contexts/AuthContext.tsx
export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 登录
  const login = async (phone: string, code: string) => {
    // 实现登录逻辑
  };

  // 登出
  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
  };

  return { user, isLoading, login, logout, ... };
});

// 使用
const { user, login, logout } = useAuth();
```

**CoinContext - 金币系统**
```typescript
// contexts/CoinContext.tsx
export const [CoinProvider, useCoin] = createContextHook(() => {
  const [coinBalance, setCoinBalance] = useState(0);

  // 扣除金币
  const deductCoins = async (amount: number) => {
    if (coinBalance < amount) {
      throw new Error('Insufficient coins');
    }
    const newBalance = coinBalance - amount;
    setCoinBalance(newBalance);
    await AsyncStorage.setItem('coinBalance', String(newBalance));
  };

  // 充值金币
  const addCoins = async (amount: number) => {
    const newBalance = coinBalance + amount;
    setCoinBalance(newBalance);
    await AsyncStorage.setItem('coinBalance', String(newBalance));
  };

  return { coinBalance, deductCoins, addCoins };
});

// 使用
const { coinBalance, deductCoins } = useCoin();
```

**VerificationContext - 验证数据**
```typescript
// contexts/VerificationContext.tsx
export const [VerificationProvider, useVerification] = createContextHook(() => {
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [imageSourceHistory, setImageSourceHistory] = useState([]);
  const [outfitChangeHistory, setOutfitChangeHistory] = useState([]);

  // 添加验证记录
  const verifyPhoto = async (photo, references) => {
    // AI 验证逻辑
    const result = await callAIAPI(photo, references);
    // 保存到历史
    await saveToHistory(result);
    return result;
  };

  // 添加换装历史
  const addOutfitChangeHistory = async (original, result, template) => {
    const historyItem = {
      id: `outfit_${Date.now()}`,
      originalImageUri: original,
      resultImageUri: result,
      templateId: template.id,
      templateName: template.name,
      createdAt: Date.now(),
    };
    const updated = [historyItem, ...outfitChangeHistory];
    setOutfitChangeHistory(updated);
    await AsyncStorage.setItem('outfit_history', JSON.stringify(updated));
  };

  return { 
    verificationHistory,
    imageSourceHistory,
    outfitChangeHistory,
    verifyPhoto,
    addOutfitChangeHistory,
    ...
  };
});
```

#### 2.2 数据持久化

使用 AsyncStorage 进行本地数据存储：

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// 保存数据
await AsyncStorage.setItem('key', JSON.stringify(data));

// 读取数据
const data = await AsyncStorage.getItem('key');
const parsed = data ? JSON.parse(data) : defaultValue;

// 删除数据
await AsyncStorage.removeItem('key');

// 多用户数据隔离
const STORAGE_KEY = `data_${userId}`;
```

---

### 3. AI 功能集成

#### 3.1 Rork AI Toolkit SDK

```typescript
import { generateObject } from '@rork-ai/toolkit-sdk';

// 照片验证
const verificationResult = await generateObject({
  model: 'gpt-4-vision',
  schema: VerificationResultSchema,
  prompt: '分析这张照片的真实性...',
  images: [photoBase64, ...referencePhotosBase64],
});

// 图片溯源
const sourceAnalysis = await generateObject({
  model: 'gpt-4-vision',
  schema: ImageSourceSchema,
  prompt: '识别图片内容并提供相关信息...',
  images: [imageBase64],
});
```

#### 3.2 图片编辑 API

```typescript
// 一键换装
const response = await fetch('https://toolkit.rork.com/images/edit/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: template.prompt,
    images: [{ type: 'image', image: base64Image }],
    aspectRatio: '3:4',
  }),
});

const data = await response.json();
const resultImage = `data:${data.image.mimeType};base64,${data.image.base64Data}`;
```

#### 3.3 图片处理

```typescript
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

// 选择图片
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [3, 4],
  quality: 1,
});

// 压缩图片
const manipulated = await ImageManipulator.manipulateAsync(
  imageUri,
  [{ resize: { width: 1024 } }],
  { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
);

// 转换为 Base64
const base64 = await FileSystem.readAsStringAsync(
  imageUri,
  FileSystem.EncodingType.Base64
);
```

---

### 4. 国际化系统

#### 4.1 配置

```typescript
// app/_layout.tsx
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from '@/locales/zh';
import en from '@/locales/en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      zh: { translation: zh },
      en: { translation: en },
    },
    lng: 'zh',
    fallbackLng: 'zh',
    interpolation: {
      escapeValue: false,
    },
  });
```

#### 4.2 使用

```typescript
import { useTranslation } from 'react-i18next';

const Component = () => {
  const { t, i18n } = useTranslation();

  // 基本使用
  const title = t('home.title');

  // 带参数
  const welcome = t('home.welcome', { name: 'John' });

  // 切换语言
  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return <Text>{title}</Text>;
};
```

#### 4.3 语言文件结构

```typescript
// locales/zh.ts
export default {
  common: {
    success: '成功',
    error: '错误',
    cancel: '取消',
    confirm: '确认',
  },
  home: {
    title: '网图克星',
    subtitle: 'AI 驱动的照片验证与图片处理',
  },
  outfitChange: {
    title: '一键换装',
    generate: '开始生成',
    generating: '生成中',
    // ...
  },
  // ...
};
```

---

### 5. 类型系统

#### 5.1 核心类型定义

```typescript
// types/verification.ts

// 用户类型
export interface User {
  userId: string;
  phone: string;
  nickname?: string;
  avatar?: string;
}

// 参考照片
export interface ReferencePhoto {
  id: string;
  uri: string;
  uploadedAt: number;
}

// 验证结果
export interface VerificationResult {
  id: string;
  credibilityScore: number;
  subjectType: 'person' | 'dog' | 'cat' | 'animal' | 'building' | 'object' | 'other';
  analysis: {
    facialSimilarity: number;
    skinTexture: number;
    proportions: number;
    lighting: number;
  };
  verdict: 'authentic' | 'slightly-edited' | 'heavily-edited' | 'suspicious';
  verificationCode: string;
  deviceId: string;
  completedAt: number;
}

// 验证历史
export interface VerificationHistory {
  request: VerificationRequest;
  result: VerificationResult;
}

// 图片溯源分析
export interface ImageSourceAnalysis {
  description: string;
  keywords: string[];
  possibleSources: string[];
  suggestions: string;
  entityInfo?: {
    type: 'person' | 'animal' | 'plant' | 'other';
    name?: string;
    introduction?: string;
  };
}

// 换装历史
export interface OutfitChangeHistory {
  id: string;
  originalImageUri: string;
  resultImageUri: string;
  templateId: string;
  templateName: string;
  createdAt: number;
}
```

---

### 6. 性能优化

#### 6.1 图片优化

```typescript
// 使用 Expo Image 组件
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUri }}
  style={styles.image}
  contentFit="cover"
  placeholder={blurhash}
  transition={200}
/>

// 图片压缩
const compressed = await ImageManipulator.manipulateAsync(
  uri,
  [{ resize: { width: 1024 } }],
  { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
);
```

#### 6.2 列表优化

```typescript
import { FlatList } from 'react-native';

<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  // 性能优化
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={10}
  // 分页加载
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
/>
```

#### 6.3 状态更新优化

```typescript
// 使用 useCallback 避免重复创建函数
const handlePress = useCallback(() => {
  // 处理逻辑
}, [dependencies]);

// 使用 useMemo 缓存计算结果
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

---

### 7. 错误处理

#### 7.1 全局错误边界

```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

#### 7.2 API 错误处理

```typescript
try {
  const response = await fetch(apiUrl, options);
  
  if (!response.ok) {
    const errorData = await response.text();
    console.error('API Error:', response.status, errorData);
    throw new Error(`API Error: HTTP ${response.status}`);
  }

  const data = await response.json();
  
  if (!data || !data.expected_field) {
    console.error('Invalid response:', data);
    throw new Error('Invalid response format');
  }

  return data;
} catch (error: any) {
  console.error('Request failed:', error);
  Alert.alert('错误', error.message || '请求失败');
  throw error;
}
```

---

### 8. 平台适配

#### 8.1 平台检测

```typescript
import { Platform } from 'react-native';

// 条件渲染
{Platform.OS === 'web' && <WebOnlyComponent />}
{Platform.OS !== 'web' && <NativeOnlyComponent />}

// 样式适配
const styles = StyleSheet.create({
  container: {
    padding: Platform.select({
      ios: 20,
      android: 16,
      web: 24,
    }),
  },
});

// 代码逻辑适配
if (Platform.OS === 'web') {
  // Web 特定逻辑
} else {
  // Native 逻辑
}
```

#### 8.2 权限处理

```typescript
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';

// 请求相册权限
const { status } = await MediaLibrary.requestPermissionsAsync();
if (status !== 'granted') {
  Alert.alert('提示', '需要相册权限才能保存图片');
  return;
}

// 请求相机权限
const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
if (cameraStatus !== 'granted') {
  Alert.alert('提示', '需要相机权限才能拍照');
  return;
}
```

---

### 9. 开发调试

#### 9.1 开发服务器

```bash
# 启动开发服务器（带隧道）
bun run start

# 启动 Web 开发服务器
bun run start-web

# 启动 Web 开发服务器（带调试）
bun run start-web-dev
```

#### 9.2 调试技巧

```typescript
// 控制台日志
console.log('Debug info:', data);
console.error('Error:', error);
console.warn('Warning:', message);

// 网络请求监控
console.log('API Request:', {
  url,
  method,
  body: JSON.stringify(body),
});

console.log('API Response:', {
  status: response.status,
  data: await response.json(),
});

// 性能监控
const startTime = Date.now();
// ... 操作
const endTime = Date.now();
console.log(`Operation took ${endTime - startTime}ms`);
```

#### 9.3 React Native Debugger

```bash
# 启用 Remote Debugging
在设备上摇一摇 -> Debug -> Enable Remote Debugging

# 使用 Flipper
npx expo install react-native-flipper
```

---

### 10. 构建发布

#### 10.1 构建配置

```json
// app.json
{
  "expo": {
    "name": "网图克星",
    "slug": "picseek",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "bundleIdentifier": "com.picseek.app",
      "buildNumber": "1.0.0"
    },
    "android": {
      "package": "com.picseek.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "bundler": "metro",
      "favicon": "./assets/favicon.png"
    }
  }
}
```

#### 10.2 构建命令

```bash
# 构建 Android APK
eas build --platform android

# 构建 iOS IPA
eas build --platform ios

# 构建 Web
bun run build:web

# 发布更新
eas update
```

---

## 🔐 安全最佳实践

### 1. 数据安全
- 敏感数据加密存储
- API 密钥环境变量管理
- HTTPS 通信

### 2. 输入验证
```typescript
// 手机号验证
const validatePhone = (phone: string) => {
  return /^1[3-9]\d{9}$/.test(phone);
};

// 验证码验证
const validateCode = (code: string) => {
  return /^\d{6}$/.test(code);
};
```

### 3. 权限最小化
- 只请求必要权限
- 延迟权限请求
- 清晰的权限说明

---

## 📊 性能监控

### 关键指标
- 页面加载时间
- API 响应时间
- 图片处理时间
- 内存使用情况

### 监控实现
```typescript
// 简单的性能监控
const performanceMonitor = {
  startTime: 0,
  
  start() {
    this.startTime = Date.now();
  },
  
  end(operation: string) {
    const duration = Date.now() - this.startTime;
    console.log(`[Performance] ${operation}: ${duration}ms`);
    return duration;
  },
};

// 使用
performanceMonitor.start();
await loadData();
performanceMonitor.end('Load Data');
```

---

## 🔧 开发工具推荐

### IDE & 编辑器
- VS Code + React Native Tools
- WebStorm

### 调试工具
- React Native Debugger
- Flipper
- Chrome DevTools

### 代码质量
- ESLint
- Prettier
- TypeScript

### 测试工具
- Jest
- React Native Testing Library

---

## 📚 参考资源

### 官方文档
- [React Native](https://reactnative.dev/)
- [Expo](https://docs.expo.dev/)
- [Expo Router](https://expo.github.io/router/docs/)

### 依赖库文档
- [React Navigation](https://reactnavigation.org/)
- [i18next](https://www.i18next.com/)
- [Zustand](https://github.com/pmndrs/zustand)

---

**最后更新**: 2025年1月4日  
**文档版本**: v1.0.0


