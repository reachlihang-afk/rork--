import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useState } from 'react';

export default function TestInputScreen() {
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const [value3, setValue3] = useState('');

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '输入框测试' }} />
      
      <Text style={styles.title}>输入框测试页面</Text>
      <Text style={styles.info}>平台: {Platform.OS}</Text>
      
      {/* 测试1: 最简单的输入框 */}
      <View style={styles.section}>
        <Text style={styles.label}>测试1 - 原生输入框（无样式）</Text>
        <input
          type="text"
          placeholder="直接使用 HTML input"
          style={{
            padding: 10,
            border: '1px solid #ccc',
            borderRadius: 4,
            fontSize: 16,
          }}
        />
      </View>

      {/* 测试2: 基础 TextInput */}
      <View style={styles.section}>
        <Text style={styles.label}>测试2 - React Native TextInput (最简单)</Text>
        <TextInput
          value={value1}
          onChangeText={setValue1}
          placeholder="最简单的 TextInput"
          style={styles.simpleInput}
        />
        <Text style={styles.value}>值: {value1}</Text>
      </View>

      {/* 测试3: 带完整属性的 TextInput */}
      <View style={styles.section}>
        <Text style={styles.label}>测试3 - 完整属性 TextInput</Text>
        <TextInput
          value={value2}
          onChangeText={setValue2}
          placeholder="输入手机号"
          keyboardType="phone-pad"
          inputMode="tel"
          maxLength={11}
          editable={true}
          selectTextOnFocus={true}
          pointerEvents="auto"
          style={styles.fullInput}
        />
        <Text style={styles.value}>值: {value2}</Text>
      </View>

      {/* 测试4: 使用 nativeID */}
      <View style={styles.section}>
        <Text style={styles.label}>测试4 - 带 nativeID</Text>
        <TextInput
          nativeID="test-input-4"
          value={value3}
          onChangeText={setValue3}
          placeholder="带 nativeID 的输入框"
          style={styles.fullInput}
          editable={true}
          pointerEvents="auto"
        />
        <Text style={styles.value}>值: {value3}</Text>
      </View>

      <View style={styles.debug}>
        <Text style={styles.debugTitle}>调试信息：</Text>
        <Text>• 如果测试1能输入，说明浏览器正常</Text>
        <Text>• 如果测试2能输入，说明 RN Web 基础功能正常</Text>
        <Text>• 如果所有都不能输入，可能是浏览器或扩展问题</Text>
        <Text>• 请在浏览器控制台（F12）查看是否有错误</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  info: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  value: {
    marginTop: 5,
    fontSize: 12,
    color: '#0066FF',
  },
  simpleInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 4,
    fontSize: 16,
  },
  fullInput: {
    borderWidth: 1,
    borderColor: '#0066FF',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fff',
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none' as any,
      cursor: 'text' as any,
    }),
  },
  debug: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
  },
  debugTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
});




