# Web 输入框调试步骤

## 🚨 重要：必须按顺序执行

### 步骤 1: 完全停止开发服务器
```bash
# 按 Ctrl+C 停止
# 确保进程完全停止
```

### 步骤 2: 清除所有缓存
```bash
# 在项目目录运行
rm -rf .expo
rm -rf node_modules/.cache
# Windows PowerShell 使用:
# Remove-Item -Recurse -Force .expo
# Remove-Item -Recurse -Force node_modules\.cache
```

### 步骤 3: 重新启动服务器
```bash
bun run start
# 等待完全启动后，按 w 打开 web
```

### 步骤 4: 浏览器操作
1. **完全清除浏览器缓存**
   - Chrome: 按 `Ctrl+Shift+Delete`
   - 选择"全部时间"
   - 勾选"缓存的图片和文件"
   - 点击"清除数据"

2. **或使用无痕模式**
   - Chrome: `Ctrl+Shift+N`
   - 访问 `http://localhost:8081/`

### 步骤 5: 测试输入框
1. 访问测试页面：`http://localhost:8081/test-input`
2. 尝试每个测试输入框
3. 查看哪些能输入，哪些不能

### 步骤 6: 如果仍然无法输入

#### 检查 1: 浏览器控制台
1. 按 `F12` 打开开发者工具
2. 切换到 Console 标签
3. 查看是否有红色错误信息
4. 截图发给我

#### 检查 2: 元素检查
1. 按 `F12` 打开开发者工具
2. 点击左上角的选择元素工具（或按 Ctrl+Shift+C）
3. 点击输入框
4. 在 Elements 标签中查看：
   - 是否有 `pointer-events: none` 样式
   - 是否有 `disabled` 属性
   - 截图发给我

#### 检查 3: 运行调试脚本
在浏览器控制台粘贴并运行：
```javascript
// 查找所有输入框
const inputs = document.querySelectorAll('input');
console.log('找到输入框数量:', inputs.length);

inputs.forEach((input, i) => {
  const styles = window.getComputedStyle(input);
  console.log(`输入框 ${i}:`, {
    disabled: input.disabled,
    readOnly: input.readOnly,
    pointerEvents: styles.pointerEvents,
    display: styles.display,
    visibility: styles.visibility,
    opacity: styles.opacity,
    zIndex: styles.zIndex,
  });
});

// 尝试强制启用所有输入框
inputs.forEach(input => {
  input.disabled = false;
  input.readOnly = false;
  input.style.pointerEvents = 'auto';
  input.style.userSelect = 'text';
  input.style.cursor = 'text';
});

console.log('已尝试强制启用所有输入框，请再次尝试输入');
```

#### 检查 4: 浏览器扩展
1. 禁用所有浏览器扩展
2. 刷新页面
3. 再次测试

#### 检查 5: 尝试其他浏览器
- Firefox
- Edge
- Safari (Mac)

## 📝 反馈信息

如果仍然无法输入，请提供：
1. 使用的浏览器和版本
2. 控制台错误截图
3. 元素检查截图
4. 调试脚本输出结果
5. 测试页面的结果（哪些输入框能用，哪些不能）

## 🔧 已实施的修复

1. ✅ 移除 `TouchableWithoutFeedback` 包装器（改用 ScrollView）
2. ✅ 添加 `pointerEvents="auto"` 到所有输入框
3. ✅ 添加 `keyboardShouldPersistTaps="handled"`
4. ✅ 强化 CSS 修复（pointer-events, z-index）
5. ✅ 添加 Web 特定属性（inputMode, autoComplete）
6. ✅ 创建测试页面 `/test-input`


