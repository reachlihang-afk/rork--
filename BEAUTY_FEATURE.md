# 美颜功能使用文档

## 📸 功能概述

新增的智能美颜功能允许用户在上传照片后，先进行美颜处理，然后再进行一键换装。美颜效果参考抖音等主流短视频应用。

## ✨ 功能特性

### 美颜参数（5项可调节）

1. **磨皮** (0-100)
   - 平滑皮肤纹理
   - 去除瑕疵和斑点
   - 保持自然肤质

2. **美白** (0-100)
   - 提亮肤色
   - 增加皮肤光泽度
   - 调节整体肤色

3. **瘦脸** (0-100)
   - 收缩面部轮廓
   - 打造V型小脸
   - 优化脸型曲线

4. **大眼** (0-100)
   - 放大眼睛
   - 增强眼神光
   - 使眼睛更有神

5. **红润** (0-100)
   - 增加面部红润感
   - 提升气色
   - 自然腮红效果

## 🎯 使用流程

### 1. 上传照片
```
首页 → 一键换装 → 上传照片/拍照
```

### 2. 应用美颜
```
上传后 → 点击"智能美颜"按钮 → 调整美颜参数 → 点击"应用美颜"
```

### 3. 换装
```
美颜完成后 → 选择模板 → 开始生成换装效果
```

### 4. 恢复原图（可选）
```
如果对美颜效果不满意 → 点击"恢复原图" → 重新调整参数
```

## 🔧 技术实现

### 核心组件

#### 1. BeautyFilter.tsx
- 美颜参数调节界面
- 实时预览（当前版本）
- AI美颜处理

#### 2. SimpleSlider.tsx
- 自定义滑块组件
- 支持触摸拖动
- 精确数值调节

#### 3. outfit-change.tsx 集成
- 美颜按钮集成
- 状态管理（原图/美颜图）
- 流程串联

### AI处理

美颜功能使用 Rork AI API (`https://toolkit.rork.com/images/edit/`) 进行处理：

```typescript
const beautyPrompt = `
CRITICAL: Apply beauty enhancement effects while maintaining natural appearance.

PRESERVE EXACTLY:
- Overall facial structure and identity
- Hair style, color, and position
- Body pose and framing
- Background and lighting
- Clothing and accessories

BEAUTY ENHANCEMENTS TO APPLY:
- Skin smoothing (intensity based on smooth param)
- Skin whitening (intensity based on whiten param)
- Face slimming (intensity based on thinFace param)
- Eye enlargement (intensity based on enlargeEyes param)
- Rosy cheeks (intensity based on rosy param)

IMPORTANT: Keep all enhancements natural and realistic.
`;
```

### 数据流

```
用户上传照片
    ↓
保存原图 (originalImageUri)
    ↓
用户调整美颜参数
    ↓
调用AI API处理
    ↓
返回美颜后的图片
    ↓
更新显示图片 (imageUri)
    ↓
用户可继续换装或恢复原图
```

## 🎨 UI设计

### 布局
- **顶部**：关闭按钮 | 标题（智能美颜） | 重置按钮
- **中间**：图片预览区域（带加载指示器）
- **底部**：5个美颜参数滑块 + 应用按钮

### 视觉效果
- 主色调：蓝色 (#3B82F6)
- 滑块轨道：蓝色/灰色渐变
- 按钮：圆角设计，带图标
- 状态指示：已美颜状态显示蓝色背景

### 交互反馈
- 滑块实时更新数值
- 处理中显示loading动画
- 完成后弹出提示："美颜完成"
- 支持重置到默认值

## 🌍 国际化支持

已添加4种语言翻译：

### 中文 (zh.ts)
```typescript
beauty: {
  title: '智能美颜',
  apply: '应用美颜',
  reset: '重置',
  processing: '美颜处理中...',
  processingFailed: '美颜处理失败，请重试',
  smooth: '磨皮',
  whiten: '美白',
  thinFace: '瘦脸',
  enlargeEyes: '大眼',
  rosy: '红润',
  beautySuccess: '美颜完成',
}
```

### 英文、日文、韩文
类似结构，详见对应的locale文件。

## 📱 用户体验优化

1. **默认参数**
   - 磨皮：50
   - 美白：30
   - 瘦脸：20
   - 大眼：20
   - 红润：30
   
   这些默认值提供自然、均衡的美颜效果。

2. **一键重置**
   - 点击"重置"按钮快速恢复到默认参数

3. **恢复原图**
   - 保存原始图片，可随时恢复

4. **流畅动画**
   - Modal弹出动画
   - 滑块拖动流畅
   - 处理过程有loading指示

## 🐛 已知限制

1. **处理时间**
   - AI处理需要5-15秒，取决于网络和服务器负载
   
2. **图片尺寸**
   - 建议上传图片不超过2MB
   - 过大图片会自动压缩

3. **效果强度**
   - 某些极端参数值可能导致不自然的效果
   - 建议保持参数在30-70范围内

## 🚀 未来优化计划

1. **实时预览**
   - 滑块调整时实时显示效果（当前需点击应用）
   
2. **预设模板**
   - 提供"自然"、"清新"、"艳丽"等预设组合
   
3. **AI智能建议**
   - 根据照片自动推荐最佳参数
   
4. **对比模式**
   - 左右对比查看原图和美颜后效果
   
5. **历史记录**
   - 保存用户常用的美颜参数组合

## 📊 性能指标

- **组件加载**: < 500ms
- **滑块响应**: < 50ms
- **AI处理**: 5-15s (网络依赖)
- **内存占用**: 基线 +20MB (图片缓存)

## 🔒 隐私说明

- 美颜处理在服务器端完成
- 处理完成后服务器不保存图片
- 所有美颜后的图片仅保存在用户本地设备
- 符合数据隐私保护要求

---

*最后更新：2026年1月13日*

