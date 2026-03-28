# 网图克星 (PicSeek)

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey.svg)
![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61dafb.svg)
![Expo](https://img.shields.io/badge/Expo-~54.0-000020.svg)

**AI 驱动的多功能图片处理应用**

照片验证 · 图片溯源 · AI 换装

[功能特性](#-功能特性) · [快速开始](#-快速开始) · [文档](#-文档) · [技术栈](#-技术栈)

</div>

---

## 📖 项目简介

**网图克星 (PicSeek)** 是一款集成了照片验证、图片溯源和 AI 换装等核心功能的移动应用。通过先进的人工智能技术，为用户提供：

- 🔍 **照片验证**：检测照片是否经过 PS 修图，提供可信度评分
- 🎯 **图片溯源**：识别图片内容，追踪可能来源
- 👔 **AI 换装**：一键更换照片中的服装风格

---

## ✨ 功能特性

### 🔐 照片验证
- AI 智能分析照片真实性
- 多维度评估（面部相似度、皮肤纹理、身体比例、光影效果）
- 0-100 分可信度评分
- 详细验证报告和验证码
- 分享到社交广场

### 🔎 网图溯源
- 智能识别图片内容
- 自动提取关键词
- 识别知名人物、地标等实体
- 提供可能来源建议
- 支持反向搜索引导

### 👗 一键换装
- 22+ 种服装模板（正装、运动装、古装、和服、礼服等）
- AI 智能换装生成
- 实时生成进度显示
- 高质量效果输出
- 下载保存到相册

### 📊 历史记录
- 验证记录管理
- 溯源记录查询
- 换装历史保存
- 支持删除和清空

### 👥 社交功能
- 验证结果分享广场
- 好友系统
- 查看好友验证记录

### 💰 金币系统
- 照片验证：100 金币/次
- 网图溯源：50 金币/次
- 一键换装：200 金币/次
- 在线充值

### 🌍 多语言支持
- 🇨🇳 简体中文
- 🇺🇸 English
- 🇯🇵 日本語
- 🇰🇷 한국어

---

## 🚀 快速开始

### 环境要求

```bash
Node.js >= 18
Bun >= 1.0 (推荐) 或 npm/yarn
Expo CLI
iOS Simulator / Android Emulator / 真机设备
```

### 安装依赖

```bash
# 使用 Bun（推荐）
bun install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

### 启动开发服务器

```bash
# 启动完整开发服务器（支持 iOS/Android/Web）
bun run start

# 仅启动 Web 版本
bun run start-web

# 启动 Web 版本（带调试）
bun run start-web-dev
```

### 在设备上运行

#### iOS
1. 安装 Expo Go app
2. 扫描终端显示的二维码

#### Android
1. 安装 Expo Go app
2. 扫描终端显示的二维码

#### Web
1. 启动后自动打开浏览器
2. 或访问 `http://localhost:8081`

---

## 📚 文档

我们提供了完整的文档帮助您了解和使用本项目：

| 文档 | 描述 | 链接 |
|------|------|------|
| 📱 **用户手册** | 详细的功能使用指南 | [USER_MANUAL.md](./USER_MANUAL.md) |
| 📖 **产品文档** | 完整的产品功能说明 | [PRODUCT_DOCUMENTATION.md](./PRODUCT_DOCUMENTATION.md) |
| 🔧 **技术文档** | 开发者技术参考 | [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md) |

---

## 🛠️ 技术栈

### 核心框架
- **React Native** 0.81.5 - 跨平台移动应用框架
- **React** 19.1.0 - UI 框架
- **Expo** ~54.0.27 - React Native 开发平台
- **TypeScript** ~5.9.2 - 类型安全

### 路由 & 状态管理
- **Expo Router** ~6.0.17 - 文件路由系统
- **Zustand** ^5.0.2 - 轻量级状态管理
- **Context API** - React 内置状态管理

### UI & 样式
- **Lucide React Native** ^0.475.0 - 图标库
- **Expo Image** ~3.0.11 - 高性能图片组件
- **React Native Gesture Handler** ~2.28.0 - 手势处理

### 功能库
- **Expo Image Picker** ~17.0.9 - 图片选择
- **Expo Media Library** ~18.2.1 - 相册访问
- **Expo File System** ~19.0.21 - 文件系统
- **React Native View Shot** 4.0.3 - 截图功能

### AI & 数据
- **Rork AI Toolkit SDK** ^0.2.51 - AI 服务集成
- **AsyncStorage** 2.2.0 - 本地数据存储
- **Zod** ^4.2.1 - 数据验证

### 国际化
- **i18next** ^25.7.3 - 国际化框架
- **react-i18next** ^16.5.0 - React 国际化绑定

---

## 📂 项目结构

```
rork--/
├── app/                      # 应用页面
│   ├── (tabs)/              # 底部导航页面
│   │   ├── index.tsx       # 首页
│   │   ├── history.tsx     # 历史记录
│   │   ├── profile.tsx     # 个人中心
│   │   └── square.tsx      # 社交广场
│   ├── _layout.tsx         # 全局布局
│   ├── outfit-change.tsx   # 一键换装
│   ├── verify-photo.tsx    # 照片验证
│   ├── image-source.tsx    # 网图溯源
│   └── result/[id].tsx     # 验证结果详情
├── components/              # 公共组件
├── contexts/                # Context 状态管理
│   ├── AuthContext.tsx     # 用户认证
│   ├── CoinContext.tsx     # 金币系统
│   └── VerificationContext.tsx  # 验证数据
├── locales/                 # 国际化语言文件
│   ├── zh.ts               # 简体中文
│   ├── en.ts               # English
│   ├── ja.ts               # 日本語
│   └── ko.ts               # 한국어
├── types/                   # TypeScript 类型定义
├── utils/                   # 工具函数
├── package.json            # 项目依赖
├── app.json                # Expo 配置
└── tsconfig.json           # TypeScript 配置
```

---

## 🎯 核心功能使用

### 照片验证

```typescript
// 1. 上传参考照片
const addReferencePhoto = async (photoUri: string) => {
  await verificationContext.addReferencePhoto({
    id: `ref_${Date.now()}`,
    uri: photoUri,
    uploadedAt: Date.now(),
  });
};

// 2. 验证照片
const verifyPhoto = async (photoUri: string) => {
  const result = await verificationContext.verifyPhoto(
    photoUri,
    referencePhotos
  );
  // 返回验证结果
  return result;
};
```

### 一键换装

```typescript
// 1. 选择服装模板
const template = templates.find(t => t.id === 'formal');

// 2. 生成换装
const response = await fetch('https://toolkit.rork.com/images/edit/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: template.prompt,
    images: [{ type: 'image', image: base64Image }],
    aspectRatio: '3:4',
  }),
});

// 3. 获取结果
const data = await response.json();
const resultImage = `data:${data.image.mimeType};base64,${data.image.base64Data}`;
```

---

## 🔧 开发指南

### 代码规范

```bash
# 运行 Linter
bun run lint

# 自动修复格式问题
bun run lint:fix
```

### 调试

```bash
# 启动开发服务器并打开调试工具
bun run start

# 在设备上摇一摇打开开发菜单
# 选择 "Debug" 启用远程调试
```

### 构建

```bash
# 构建 Android APK
eas build --platform android

# 构建 iOS IPA
eas build --platform ios

# 构建 Web
bun run build:web
```

---

## 📊 性能优化

### 图片优化
- 使用 Expo Image 组件
- 自动图片压缩
- 懒加载和缓存

### 列表优化
- FlatList 虚拟化
- 合理的 `initialNumToRender`
- `removeClippedSubviews` 优化

### 代码优化
- useCallback 避免重复渲染
- useMemo 缓存计算结果
- 代码分割和懒加载

---

## 🐛 已知问题

- [ ] Web 版本输入框在某些浏览器可能有兼容性问题
- [ ] iOS 相册权限需要在 Info.plist 中配置
- [ ] 大尺寸图片处理可能较慢

---

## 🔄 版本历史

### v1.0.0 (2025-01-04)
- ✨ 初始版本发布
- ✅ 照片验证功能
- ✅ 网图溯源功能
- ✅ 一键换装功能（22+ 模板）
- ✅ 历史记录管理
- ✅ 社交广场
- ✅ 金币系统
- ✅ 多语言支持

---

## 🛣️ 未来规划

### 短期 (1-3 个月)
- [ ] 更多换装模板
- [ ] 批量照片处理
- [ ] VIP 会员体系
- [ ] 社交功能增强

### 中期 (3-6 个月)
- [ ] AI 美颜功能
- [ ] 视频验证
- [ ] 图片风格转换
- [ ] API 接口开放

### 长期 (6-12 个月)
- [ ] 企业版本
- [ ] 插件生态
- [ ] 更多 AI 功能

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献
1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### 贡献类型
- 🐛 Bug 修复
- ✨ 新功能
- 📝 文档改进
- 🎨 UI/UX 优化
- ⚡ 性能优化

---

## 📝 许可证

本项目为私有项目，版权所有 © 2025

---

## 📞 联系方式

- **GitHub**: [reachlihang-afk/rork--](https://github.com/reachlihang-afk/rork--)
- **项目路径**: F:\picseek

---

## 🙏 致谢

感谢以下开源项目和服务的支持：

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [Rork AI Toolkit](https://toolkit.rork.com/)
- [Lucide Icons](https://lucide.dev/)
- [i18next](https://www.i18next.com/)
- 所有其他优秀的开源项目

---

<div align="center">

**用 ❤️ 和 AI 打造**

[⬆ 回到顶部](#网图克星-picseek)

</div>
