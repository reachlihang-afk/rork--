# Web 输入框修复说明

## 问题
在 `http://localhost:8081/` 网页环境下，手机号输入框无法输入。

## 已实施的修复

### 1. TextInput 组件属性增强
在所有输入框中添加了以下属性：
- `editable={true}` - 显式声明输入框可编辑
- `selectTextOnFocus={true}` - 改善用户体验
- `inputMode="tel"` / `inputMode="numeric"` - Web 平台的输入模式
- `autoComplete` - Web 平台的自动完成提示

### 2. 样式修复
在输入框样式中添加：
```typescript
outlineStyle: 'none' as any,
...(Platform.OS === 'web' && {
  outlineWidth: 0,
  cursor: 'text' as any,
}),
```

### 3. CSS 全局修复
创建了 `app/web-input-fix.css` 文件，包含：
- 移除浏览器默认的 outline 样式
- 确保输入框可点击和可聚焦
- 修复 pointer-events 和 user-select
- 确保正确的 z-index

### 4. 修改的文件
- ✅ `app/(tabs)/profile.tsx` - 登录页面（手机号、验证码输入）
- ✅ `app/add-friend.tsx` - 添加好友搜索框
- ✅ `app/edit-profile.tsx` - 编辑资料昵称输入
- ✅ `app/(tabs)/square.tsx` - 广场评论输入
- ✅ `app/_layout.tsx` - 引入 Web CSS 修复
- ✅ `app.json` - Web 配置更新

## 测试步骤

1. 重启开发服务器：
   ```bash
   # 停止当前服务器 (Ctrl+C)
   # 重新启动
   bun run start
   ```

2. 清除浏览器缓存：
   - Chrome: Ctrl+Shift+Delete
   - 或使用无痕模式测试

3. 访问 `http://localhost:8081/`

4. 测试输入框：
   - 点击手机号输入框
   - 尝试输入数字
   - 检查光标是否出现
   - 检查是否可以正常输入

## 如果仍然无法输入

### 方案 A: 检查浏览器控制台
打开浏览器开发者工具 (F12)，查看是否有错误信息。

### 方案 B: 强制刷新
按 `Ctrl+Shift+R` (Windows) 或 `Cmd+Shift+R` (Mac) 强制刷新页面。

### 方案 C: 检查 React Native Web 版本
确保 `react-native-web` 版本正确：
```bash
bun list react-native-web
```

### 方案 D: 临时调试方案
在浏览器控制台运行：
```javascript
// 检查输入框元素
document.querySelectorAll('input').forEach(input => {
  console.log('Input:', input);
  console.log('Disabled:', input.disabled);
  console.log('ReadOnly:', input.readOnly);
  console.log('PointerEvents:', getComputedStyle(input).pointerEvents);
});
```

## 技术原理

React Native Web 将 `TextInput` 转换为 HTML `<input>` 元素时，可能会：
1. 添加额外的包装层影响事件传递
2. 应用默认样式覆盖自定义样式
3. pointer-events 设置可能阻止点击
4. z-index 层级可能被其他元素遮挡

我们的修复方案从多个层面解决这些问题：
- 组件属性层：确保 React Native 层面的配置正确
- 样式层：通过 StyleSheet 添加 Web 特定样式
- CSS 层：通过全局 CSS 覆盖浏览器默认行为




