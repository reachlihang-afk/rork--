# 百变星君 - 产品文档

## 📱 产品概述

**百变星君**是一款基于AI技术的智能换装应用，专注于为用户提供一键换装体验。用户可以通过上传照片，快速尝试不同风格的服装搭配，无需实际购买或试穿。

### 核心理念
**一键换装变明星！** - 让每个人都能轻松体验不同造型，发现更美的自己。

### 技术栈
- **框架**: React Native + Expo (v54.0)
- **路由**: Expo Router v6.0
- **状态管理**: React Context + Custom Hooks
- **国际化**: react-i18next
- **UI组件**: Lucide React Native Icons
- **图像处理**: Expo Image Picker, Expo Image Manipulator
- **AI服务**: Rork AI Toolkit SDK

---

## 🎯 核心功能

### 1. 一键换装（主打功能）

#### 1.1 模板换装
用户可以从预设的服装模板中选择，快速应用到自己的照片上。

**支持的模板类型**：
- 🎄 **圣诞装** - 圣诞老人服、节日毛衣等
- 🦸 **超级英雄装** - 蜘蛛侠、钢铁侠风格
- 👔 **商务装** - 正式西装、职业装
- 👗 **晚礼服** - 优雅晚宴礼服
- 🎭 **乞丐装** - 特殊造型装扮
- 🐴 **新年装-马年** - 中国传统节日服饰

**使用流程**：
1. 上传或拍摄人物照片
2. 选择模板换装模式
3. 从6种模板中选择一种
4. 点击"开始生成"
5. 等待AI处理（显示实时计时）
6. 查看换装结果
7. 可下载到相册或发布到广场

#### 1.2 一键穿搭（自定义模式）
用户可以上传自己的服饰、鞋子、包包等单品照片，AI会自动搭配到人物照片上。

**特性**：
- 支持上传最多2张服饰单品图片
- 支持的单品类型：衣服、鞋子、包包、帽子、饰品
- AI会智能识别照片中可见的身体部位
- 只对可见部位进行服饰应用
- 保持原始照片的人脸、表情、发型不变

**智能规则**：
- 如果照片中没有腿部，则忽略鞋子
- 如果照片中只显示上半身，则只应用上衣
- 保持照片原始裁剪和构图
- 不会补全或延伸图像

**技术优化**：
- 客户端自动压缩图片（主图480px @ 45%，服饰图360px @ 35%）
- 二次压缩机制，防止请求过大
- 智能错误提示和建议

#### 1.3 费用机制
- **免费额度**: 
  - 未登录用户：每天1次免费
  - 已登录用户：每天**5次**免费
- **超出免费次数**: 每次消耗200金币
- **首次注册奖励**: 1000金币

---

### 2. 照片验证

#### 2.1 真伪验证
使用AI技术分析照片的真实性，检测是否被修图或美颜。

**验证流程**：
1. 上传参考照片（清晰的本人照片）
2. 上传待验证照片（自拍或他人提供）
3. AI分析对比
4. 生成可信度评分（0-10分）
5. 给出验证结论

**验证结果类型**：
- ✅ **真实照片** (8-10分)
- ⚠️ **轻度编辑** (6-7分)
- ⚠️ **重度编辑** (3-5分)
- ❌ **可疑照片** (0-2分)

**结果展示**：
- AI评分和判断
- 详细分析说明
- 可保存到历史记录
- 可发布到广场分享
- 生成验证码供他人查询

#### 2.2 费用机制
- 未登录用户：每天1次免费
- 已登录用户：每天**5次**免费
- 超出后每次100金币

---

### 3. 图片找出处

#### 3.1 智能识别
上传图片，AI自动识别图片中的人物、动物、植物等实体，并提供详细信息。

**识别能力**：
- **人物识别**: 名人、公众人物
- **动物识别**: 品种、特征
- **植物识别**: 种类、生长习性
- **物品识别**: 商品、建筑等

**结果内容**：
- 实体类型
- 名称
- 详细介绍
- 相关关键词
- 可通过关键词搜索更多信息

#### 3.2 功能限制
- 未登录用户：每天1次免费
- 已登录用户：每天**5次**免费
- 超出后每次100金币
- **结果仅支持下载**，不可发布到广场

---

### 4. 社交广场

#### 4.1 内容类型
用户可以在广场查看和互动：
- ✅ **照片验证记录** - 其他用户的验证结果
- ✅ **换装结果** - 一键换装生成的作品
- ❌ ~~图片找出处结果~~ - 已取消广场分享功能

#### 4.2 互动功能
- ❤️ **点赞** - 喜欢的内容可以点赞
- 💬 **评论** - 可以发表评论和回复
- 📌 **置顶评论** - 帖子作者可以置顶重要评论
- 🗑️ **删除** - 作者可以删除自己的帖子和评论
- ❌ ~~打分功能~~ - 已取消用户评分功能

#### 4.3 发布流程（换装）
1. 生成换装结果后，点击"发布到广场"
2. 弹出确认对话框："发布成功，是否跳转到广场页面？"
3. 选择"是"跳转到广场，选择"否"留在当前页面
4. 可以在头像下方添加文字描述（最多200字）

#### 4.4 内容显示
**验证记录展示**：
- 显示参考照片和待验证照片对比
- 显示AI评分和结论
- 照片来源标识（相机/相册）
- 警告图标（相册照片）

**换装结果展示**：
- 原图和结果图并排显示
- 结果图缩小5%以保持视觉平衡
- 显示使用的模板名称或"一键穿搭"
- 统一的图片展示尺寸（aspectRatio: 1）

**图片源结果**：
- 显示识别的图片
- 实体信息（类型、名称）
- 简介（最多28字，超出显示...，可点击展开）
- 关键词标签

---

### 5. 历史记录

#### 5.1 记录类型
- **验证记录** - 所有照片验证历史
- **找出处记录** - 图片识别历史
- **换装记录** - 换装生成历史（默认显示此标签）

#### 5.2 记录管理
- 查看详细结果
- 删除单条记录
- 清空所有记录（按类型）
- 再次分享或下载

#### 5.3 隐私设置
**换装记录支持隐私控制**：
- `allowSquarePublish` 字段控制是否允许发布到广场
- 可通过`updateOutfitChangePrivacy()`更新设置

#### 5.4 存储限制
- 换装记录限制最多保存5条（防止存储溢出）
- 自动管理：超出限制时删除最旧记录
- 智能压缩：图片使用base64格式存储

---

### 6. 用户系统

#### 6.1 注册/登录
- 手机号验证码登录
- 首次登录自动注册
- 演示验证码：`123456`
- 注册赠送1000金币

#### 6.2 用户资料
- 修改昵称
- 更换头像（从相册选择或拍照）
- 语言设置（中文/英文/日文/韩文）

#### 6.3 金币系统
**获取方式**：
- 首次注册：1000金币
- 充值购买

**消耗方式**：
- 照片验证：超出免费次数后100金币/次
- 图片找出处：超出免费次数后100金币/次
- 一键换装：超出免费次数后200金币/次

**查看余额**：
- 个人中心显示当前金币余额
- 换装页面右上角显示金币余额（可点击跳转充值）
- 显示今日剩余免费次数

---

## 🎨 用户界面

### 主要页面

#### 1. 首页（主打换装）
- App名称：**百变星君**
- 副标题：**一键换装变明星！**
- 主操作按钮：直接跳转到一键换装
- 快速入口：
  - 👔 一键换装
  - 🔍 图片找出处
  - ✅ 照片验证
- 展示最近3条换装记录

#### 2. 一键换装页面
- 上传照片区域
- 模式切换：模板换装 / 一键穿搭
- **模板模式**：
  - 6个服装模板卡片
  - 显示模板图标和名称
  - 右上角显示"今日免费剩余：X次"
- **穿搭模式**：
  - 上传服饰图片（最多2张）
  - 重要提示：只上传可见身体部位对应的服饰
  - 显示已添加的服饰图片
- 开始生成按钮（生成中显示计时）
- 结果展示：原图 ➡️ 结果图
- 操作按钮：下载到相册、发布到广场

#### 3. 广场页面
- 瀑布流展示用户发布的内容
- 帖子卡片包含：
  - 用户头像和昵称
  - 可编辑的文字描述
  - 验证结果/换装对比图
  - 点赞数、评论数
  - 互动按钮（点赞、评论、更多）
- 下拉刷新
- 高亮显示刚发布的帖子（3秒）

#### 4. 历史记录页面
- 三个标签：验证记录、找出处记录、**换装记录**（默认）
- 卡片式展示
- 显示缩略图、时间、关键信息
- 右上角"清空记录"按钮
- 点击查看详情

#### 5. 个人中心
- 用户信息（头像、昵称、手机号）
- 金币余额
- 今日剩余免费次数
- 语言设置
- 编辑资料
- 退出登录

---

## 🔧 技术架构

### 前端架构

#### 1. 路由结构
```
app/
├── (tabs)/
│   ├── index.tsx          # 首页
│   ├── square.tsx         # 广场
│   ├── history.tsx        # 历史记录
│   └── profile.tsx        # 个人中心
├── outfit-change.tsx      # 一键换装
├── verify-photo.tsx       # 照片验证
├── lookup-verification.tsx # 查询验证
├── image-source.tsx       # 图片找出处
├── result/[id].tsx        # 验证结果详情
├── image-source-result/[id].tsx # 找出处结果
├── recharge.tsx           # 金币充值
└── edit-profile.tsx       # 编辑资料
```

#### 2. 状态管理（Context）

**AuthContext** - 用户认证
- 用户登录状态
- 用户信息（userId, phone, nickname, avatar）
- 登录/退出功能

**CoinContext** - 金币系统
- 金币余额管理
- 每日免费次数跟踪
  - `verificationCount` - 验证次数
  - `imageSourceCount` - 找出处次数
  - `outfitChangeCount` - 换装次数
- 费用检查和扣除
- 剩余次数查询
- 每日重置机制

**VerificationContext** - 验证和历史
- 参考照片管理
- 验证历史记录
- 找出处历史记录
- 换装历史记录
  - 最多保存5条
  - 支持隐私设置（`allowSquarePublish`）
- 历史记录CRUD操作
- 存储溢出处理

**SquareContext** - 社交广场
- 帖子列表管理
- 点赞/取消点赞
- 评论管理（添加、删除、置顶）
- ~~用户评分功能~~ - 已移除
- 帖子发布（验证、换装）
- 描述编辑功能

#### 3. 数据持久化
使用 `@react-native-async-storage/async-storage`

**存储键值设计**：
```typescript
{
  // 按用户ID分隔数据
  `user_coins_${userKey}`: 金币余额
  `daily_usage_${userKey}`: 每日使用次数
  `reference_photos_${userId}`: 参考照片
  `verification_history_${userId}`: 验证历史
  `image_source_history_${userId}`: 找出处历史
  `outfit_change_history_${userId}`: 换装历史（最多5条）
  `square_posts`: 广场帖子
  `user_profile_${userId}`: 用户资料
}
```

**存储优化**：
- 换装历史限制5条防止溢出
- 图片压缩后存储
- 错误处理和降级策略

#### 4. 国际化
支持4种语言：
- 🇨🇳 简体中文（默认）
- 🇺🇸 English
- 🇯🇵 日本語
- 🇰🇷 한국어

翻译文件结构：
```
locales/
├── zh.ts    # 中文
├── en.ts    # 英文
├── ja.ts    # 日文
└── ko.ts    # 韩文
```

### AI服务集成

#### 1. 一键换装API
**端点**: `https://toolkit.rork.com/images/edit/`

**请求格式**：
```typescript
{
  prompt: string,              // AI指令
  images: Array<{
    type: 'image' | 'reference',
    image: string              // base64编码
  }>,
  aspectRatio: '3:4'          // 宽高比
}
```

**模板模式Prompt**：
```
IMPORTANT: Keep face, facial expression, hairstyle, pose, 
and photo framing EXACTLY as in original. Only change 
clothing in the EXACT visible areas. If only partial 
clothing is visible, apply only to that partial area. 
Do NOT extend or complete the image.

+ [模板特定的服装描述]
```

**穿搭模式Prompt**（详细版本）：
```
CRITICAL INSTRUCTIONS - Follow EXACTLY:

1. PRESERVE EVERYTHING: Keep 100% unchanged:
   - Face, facial expression, eye direction
   - Hairstyle, hair color, hair position
   - Body structure, pose, posture
   - Background, lighting, shadows
   - Photo framing and cropping

2. PARTIAL VISIBILITY RULE: 
   - If only HALF of a shirt visible → apply ONLY HALF
   - Only modify visible body parts
   - NEVER complete or extend clothing beyond visible area

3. EXACT FRAMING: 
   - Keep same cropping as original
   - Do NOT try to show "complete" outfit

4. IGNORE IMPOSSIBLE ITEMS:
   - If shoes provided but feet not visible → ignore shoes
   - Do NOT generate missing body parts

5. NO MODIFICATIONS:
   - Do NOT change facial expression
   - Do NOT extend or complete the image
   - ONLY replace visible clothing textures/colors
```

**图片压缩策略**：
- 主图：480px @ 45% 质量
- 服饰图：360px @ 35% 质量
- Base64 > 400KB 触发二次压缩
- 二次压缩：360px/280px @ 25% 质量

#### 2. 照片验证API
**端点**: `https://toolkit.rork.com/images/verify/`

**功能**: 对比参考照片和待验证照片，分析真实性

#### 3. 图片识别API
**端点**: `https://toolkit.rork.com/images/analyze/`

**功能**: 识别图片中的实体信息

---

## 📊 数据模型

### 核心类型定义

```typescript
// 用户类型
interface User {
  userId: string;
  phone: string;
  nickname?: string;
  avatar?: string;
}

// 每日使用统计
interface DailyUsage {
  date: string;               // YYYY-MM-DD
  verificationCount: number;  // 验证次数
  imageSourceCount: number;   // 找出处次数
  outfitChangeCount: number;  // 换装次数
}

// 换装历史
interface OutfitChangeHistory {
  id: string;
  originalImageUri: string;   // 原图
  resultImageUri: string;     // 结果图
  templateId: string;         // 模板ID或'custom-outfit'
  templateName: string;       // 模板名称或'一键穿搭'
  createdAt: number;          // 时间戳
  allowSquarePublish?: boolean; // 隐私设置
}

// 广场帖子
interface SquarePost {
  id: string;
  userId: string;
  userNickname: string;
  userAvatar?: string;
  postType: 'verification' | 'outfitChange'; // 帖子类型
  description?: string;       // 可编辑描述
  createdAt: number;
  likes: string[];            // 点赞用户ID列表
  comments: SquareComment[];
  pinnedCommentId?: string;   // 置顶评论ID
  
  // 验证帖子特有字段
  verificationResultId?: string;
  credibilityScore?: number;
  verdict?: 'authentic' | 'slightly-edited' | 
            'heavily-edited' | 'suspicious';
  referencePhotoUri?: string;
  editedPhotoUri?: string;
  photoSource?: 'camera' | 'library';
  
  // 换装帖子特有字段
  outfitChangeId?: string;
  originalImageUri?: string;
  resultImageUri?: string;
  templateName?: string;
}

// 评论类型
interface SquareComment {
  id: string;
  userId: string;
  userNickname: string;
  userAvatar?: string;
  content: string;
  createdAt: number;
  replyTo?: {
    userId: string;
    nickname: string;
  };
}
```

---

## 🔐 隐私与权限

### 应用权限

**iOS权限**：
- `NSPhotoLibraryUsageDescription` - 访问照片
- `NSCameraUsageDescription` - 使用相机
- `NSPhotoLibraryAddUsageDescription` - 保存照片

**Android权限**：
- `CAMERA` - 相机
- `READ_EXTERNAL_STORAGE` - 读取存储
- `WRITE_EXTERNAL_STORAGE` - 写入存储
- `READ_MEDIA_IMAGES` - 读取图片
- `INTERNET` - 网络访问

### 数据隐私

**本地存储**：
- 所有用户数据存储在本地设备
- 按用户ID隔离数据
- 退出登录后数据保留

**服务器交互**：
- 仅在生成换装、验证照片时上传图片
- 上传的图片用于AI处理，不永久存储
- 不收集额外个人信息

**隐私设置**：
- 换装记录支持隐私控制
- 用户可选择是否允许发布到广场

---

## 🎯 产品定位

### 目标用户
1. **时尚爱好者** - 尝试不同服装风格
2. **在线购物用户** - 预览服装上身效果
3. **社交媒体用户** - 创作有趣的换装内容
4. **普通用户** - 满足好奇心，体验不同造型

### 使用场景
1. **服装购买决策** - 购买前预览效果
2. **造型设计** - 探索不同风格搭配
3. **社交娱乐** - 生成有趣的换装图片分享
4. **活动准备** - 提前预览活动服装效果

### 竞争优势
1. ✅ **免费额度充足** - 每天5次免费，满足日常需求
2. ✅ **AI技术先进** - 保持面部和表情不变，只换服装
3. ✅ **操作简单** - 一键完成，无需专业技能
4. ✅ **结果真实** - 智能适配身体部位，效果自然
5. ✅ **社交分享** - 内置社交广场，分享创作
6. ✅ **多语言支持** - 覆盖中英日韩4种语言

---

## 📈 产品指标

### 核心指标（建议）
1. **DAU/MAU** - 日活/月活用户数
2. **换装生成次数** - 每日换装使用量
3. **免费次数使用率** - 免费额度使用情况
4. **付费转化率** - 超出免费后的付费比例
5. **广场互动率** - 点赞、评论数据
6. **用户留存率** - 次日/7日/30日留存

### 功能使用分布
- **一键换装**: 主打功能，预计70%使用率
- **照片验证**: 辅助功能，预计20%使用率
- **图片找出处**: 辅助功能，预计10%使用率

---

## 🚀 未来规划

### 短期优化（1-3个月）
1. **模板扩充** - 增加更多服装风格模板
2. **性能优化** - 减少生成时间，提升压缩效率
3. **UI/UX改进** - 优化用户界面和交互体验
4. **社交功能** - 完善广场互动机制

### 中期规划（3-6个月）
1. **AI能力提升** - 支持更复杂的服装搭配
2. **虚拟试衣间** - 3D试衣体验
3. **商品链接** - 与电商平台对接
4. **推荐系统** - 基于用户喜好推荐服装

### 长期愿景（6-12个月）
1. **AR试衣** - 实时AR换装体验
2. **视频换装** - 支持视频中的服装替换
3. **个性化定制** - AI生成独特服装设计
4. **品牌合作** - 与服装品牌深度合作

---

## 📞 技术支持

### 开发环境
- Node.js 18+
- Bun (包管理器)
- Expo CLI
- iOS Simulator / Android Emulator

### 启动命令
```bash
# 启动开发服务器
bun run start

# 启动Web版
bun run start-web

# 代码检查
bun run lint
```

### 技术文档
- [Expo Router 文档](https://docs.expo.dev/router/introduction/)
- [React Native 文档](https://reactnative.dev/)
- [Rork AI SDK 文档](https://github.com/rork-ai/toolkit-sdk)

---

## 📄 版本信息

**当前版本**: v1.0.0  
**最后更新**: 2026年1月  
**Bundle ID**: app.rork.zhen-shi-pian-ping-fen  
**支持平台**: iOS, Android, Web

---

## 🎨 设计理念

### 视觉设计
- **主色调**: 蓝色 (#0066FF) - 科技感、信任感
- **辅助色**: 灰色系 - 简洁、现代
- **强调色**: 各种彩色图标 - 活泼、有趣

### 交互设计
- **极简操作**: 最少步骤完成任务
- **即时反馈**: 每个操作都有明确反馈
- **友好提示**: 错误提示清晰，提供解决方案
- **流畅动画**: 适度使用动画提升体验

### 内容组织
- **功能优先**: 最常用功能最显眼
- **层级清晰**: 信息结构合理
- **视觉平衡**: 内容分布均衡
- **响应式**: 适配不同屏幕尺寸

---

*本文档最后更新于 2026年1月5日*
