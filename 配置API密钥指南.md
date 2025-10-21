# 🔑 解决 401 无效令牌错误 - 配置指南

## ❌ 问题现象

```
API请求失败: 401 - {"error":{"message":"无效的令牌","type":"new_api_error"}}
```

## ✅ 解决方案

### 方法 1：编辑 `.env.local` 文件（推荐）⭐

#### 步骤 1：打开 `.env.local` 文件

```bash
# 使用记事本打开
notepad .env.local

# 或使用 VS Code 打开
code .env.local
```

#### 步骤 2：在文件末尾添加以下配置

```env
# ==========================================
# 远程 API 配置（新配置系统）
# ==========================================

VITE_REMOTE_API_BASE_URL=https://api.deepseek.com
VITE_REMOTE_API_KEY=sk-你的真实密钥在这里填写
VITE_REMOTE_API_MODEL=deepseek-chat
VITE_DEFAULT_ENGINE=remote
```

**⚠️ 重要：** 将 `sk-你的真实密钥在这里填写` 替换为你从 DeepSeek 获取的真实 API 密钥！

#### 步骤 3：保存文件并重启开发服务器

```bash
# 1. 停止当前服务器
按 Ctrl + C

# 2. 重新启动
npm run dev
```

#### 步骤 4：验证配置

打开浏览器控制台（F12），应该看到：

```javascript
[Config] 🔧 开发环境配置: {
  baseURL: "https://api.deepseek.com",
  model: "deepseek-chat",
  hasKey: true,              // ✅ 应该是 true
  keyPreview: "sk-1234567..."  // ✅ 显示你的密钥前缀
}
```

---

### 方法 2：直接修改代码（快速但不安全）

如果你只是快速测试，可以直接修改代码：

#### 编辑 `src/config/env.ts` 文件

找到第 10-14 行：

```typescript
const DEV_DEFAULTS = {
    BASE_URL: "https://api.deepseek.com",
    API_KEY: "your-api-key-here",  // 🔑 改这里
    MODEL: "deepseek-chat",
};
```

改为：

```typescript
const DEV_DEFAULTS = {
    BASE_URL: "https://api.deepseek.com",
    API_KEY: "sk-你的真实密钥",  // 🔑 填写真实密钥
    MODEL: "deepseek-chat",
};
```

**⚠️ 警告：** 这种方式会将密钥提交到 Git，不安全！仅用于快速测试。

---

## 🎯 获取 DeepSeek API 密钥

### 1. 访问 DeepSeek 平台

打开浏览器访问：https://platform.deepseek.com

### 2. 注册/登录账号

- 如果没有账号，点击注册
- 如果有账号，直接登录

### 3. 创建 API Key

1. 登录后，点击左侧菜单的 **"API Keys"**
2. 点击 **"创建新密钥"** 或 **"Create API Key"**
3. 输入密钥名称（例如：`AIGC开发`）
4. 点击创建

### 4. 复制密钥

⚠️ **重要：** 密钥只显示一次！
- 立即复制密钥（格式：`sk-xxxxxxxxxxxxxxxx`）
- 保存到安全的地方
- 如果忘记了，需要重新创建

### 5. 充值（如需要）

- DeepSeek 需要充值才能使用
- 最低充值金额：通常 ¥10
- 价格非常便宜，¥10 可以用很久

---

## 🔍 故障排除

### Q1: 填写密钥后还是报 401 错误？

**检查清单：**

- [ ] 密钥是否完整复制（包括 `sk-` 前缀）
- [ ] 密钥是否有效（未过期、未删除）
- [ ] 是否重启了开发服务器（必须重启！）
- [ ] 浏览器控制台中 `hasKey` 是否为 `true`

**解决步骤：**

```bash
# 1. 完全停止开发服务器
Ctrl + C

# 2. 清除缓存（可选）
npm run build -- --clean

# 3. 重新启动
npm run dev

# 4. 强制刷新浏览器
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### Q2: 控制台显示 `hasKey: false`？

说明密钥没有读取到，检查：

1. **文件名是否正确**
   - 应该是 `.env.local` 或 `.env.development`
   - 注意开头的 `.` 不要漏掉

2. **变量名是否正确**
   - 必须是 `VITE_REMOTE_API_KEY`（注意大小写）
   - 不是 `VITE_DEEPSEEK_API_KEY`（旧变量）

3. **格式是否正确**
   ```env
   # ✅ 正确
   VITE_REMOTE_API_KEY=sk-1234567890abcdef
   
   # ❌ 错误（有引号）
   VITE_REMOTE_API_KEY="sk-1234567890abcdef"
   
   # ❌ 错误（有空格）
   VITE_REMOTE_API_KEY = sk-1234567890abcdef
   ```

### Q3: 使用其他 API 提供商（如 OpenAI）？

编辑 `.env.local`：

```env
# OpenAI 配置
VITE_REMOTE_API_BASE_URL=https://api.openai.com/v1
VITE_REMOTE_API_KEY=sk-你的OpenAI密钥
VITE_REMOTE_API_MODEL=gpt-3.5-turbo
VITE_DEFAULT_ENGINE=remote
```

### Q4: 密钥会泄露吗？

**不会！** `.env.local` 已被 `.gitignore` 忽略：

```bash
# 验证文件是否被 Git 忽略
git status .env.local

# 应该显示：
# nothing to commit
```

✅ 密钥完全安全，不会被提交到 Git！

---

## 📋 配置检查清单

完成以下所有步骤后，应该可以正常使用：

- [ ] 已获取 DeepSeek API 密钥
- [ ] 已在 `.env.local` 中添加配置
- [ ] 已填写真实密钥（不是 `your-api-key-here`）
- [ ] 已保存文件
- [ ] 已重启开发服务器
- [ ] 浏览器控制台显示 `hasKey: true`
- [ ] 可以正常发送消息并收到回复

---

## 💡 快速测试

配置完成后，在聊天框输入：

```
你好，介绍一下你自己
```

如果 AI 正常回复，说明配置成功！🎉

如果还是报错，请检查：
1. 密钥是否正确
2. 是否有网络限制
3. DeepSeek 账户是否有余额

---

## 📞 需要帮助？

如果还是无法解决，可以：

1. 查看详细文档：[ENV_SETUP.md](ENV_SETUP.md)
2. 查看快速配置：[QUICK_CONFIG.md](QUICK_CONFIG.md)
3. 查看 API 配置总结：[API_CONFIG_SUMMARY.md](API_CONFIG_SUMMARY.md)

---

<div align="center">

**🔑 配置正确的 API 密钥是使用的第一步！**

祝你使用愉快！🎉

</div>

