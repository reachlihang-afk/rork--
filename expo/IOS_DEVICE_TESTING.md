# iOS 真机测试指南

## 方法1: 使用 Expo Go App（最简单）

1. **在 iPhone 上安装 Expo Go**
   - 打开 App Store
   - 搜索 "Expo Go"
   - 安装应用

2. **启动开发服务器**
   ```bash
   cd rork--
   npx expo start
   ```

3. **扫描二维码**
   - 用 iPhone 相机扫描终端显示的二维码
   - 会自动在 Expo Go 中打开应用

4. **测试保存功能**
   - 进行换装
   - 点击保存按钮
   - 检查 iPhone 相册的"最近"

---

## 方法2: 构建独立应用

如果需要完整功能（相册、推送等）：

```bash
# 使用 EAS Build（推荐）
npx eas build --platform ios --profile development

# 或使用本地构建
npx expo run:ios
```

---

## iOS 相册权限说明

应用首次保存图片时，iOS 会弹出权限请求：
```
"百变星君" Would Like to Access Your Photos
[Don't Allow] [Allow]
```

**务必选择 "Allow"**

如果不小心拒绝了，需要：
1. 打开"设置" → "百变星君"
2. 找到"照片"
3. 选择"添加照片到相册"

---

## 预期行为（真机上）

✅ 保存成功后，图片会出现在：
- 系统相册 → "最近"
- 或相册 → "PicSeek"

❌ 模拟器上：
- 提示成功但相册里没有图片（这是正常的）
