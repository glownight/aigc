# ⚡ 快速配置指南 - 5分钟解决 API 配置

遇到 **401 无效令牌** 错误？按照以下步骤快速配置！

---

## 🎯 两种配置方式（任选其一）

### 方式 1：修改代码（最快，1分钟）⚡

**适合：** 个人开发、快速测试

1. **打开文件** `src/config/env.ts`

2. **找到这部分代码**（第 10-14 行）：
```typescript
const DEV_DEFAULTS = {
    BASE_URL: "https://api.deepseek.com",
    API_KEY: "your-api-key-here",  // 🔑 在这里改
    MODEL: "deepseek-chat",
};
```

3. **替换 API Key**：
```typescript
API_KEY: "sk-1234567890abcdef",  // 填写你的真实密钥
```

4. **保存文件，刷新浏览器** ✅

---

### 方式 2：使用环境变量（推荐，3分钟）🔒

**适合：** 团队开发、安全部署

#### Windows 用户：

```powershell
# 1. 在项目根目录创建文件
New-Item -Path ".env.development" -ItemType File

# 2. 编辑文件，添加以下内容：
```

#### Mac/Linux 用户：

```bash
# 1. 在项目根目录创建文件
touch .env.development

# 2. 编辑文件，添加以下内容：
```

#### 在 `.env.development` 文件中填写：

```env
VITE_REMOTE_API_BASE_URL=https://api.deepseek.com
VITE_REMOTE_API_KEY=sk-你的真实密钥
VITE_REMOTE_API_MODEL=deepseek-chat
VITE_DEFAULT_ENGINE=remote
```

#### 3. 重启开发服务器：

```bash
# 停止当前服务器 (Ctrl + C)
npm run dev
```

✅ 完成！

---

## 📱 获取 API Key

### DeepSeek（推荐，便宜）

1. 访问：https://platform.deepseek.com
2. 注册并登录
3. 点击 "API Keys"
4. 创建新密钥
5. 复制密钥（格式：`sk-xxxxxxxx`）

**价格：** 非常便宜，1元可以用很久

### OpenAI（备选）

1. 访问：https://platform.openai.com
2. 注册并登录
3. 点击 "API Keys"
4. 创建新密钥
5. 复制密钥（格式：`sk-xxxxxxxx`）

如果使用 OpenAI，还需修改：
```env
VITE_REMOTE_API_BASE_URL=https://api.openai.com
VITE_REMOTE_API_MODEL=gpt-4
```

---

## 🔍 验证配置

打开浏览器控制台（F12），应该看到：

```
[Config] 🔧 开发环境配置: {
  baseURL: "https://api.deepseek.com",
  model: "deepseek-chat",
  hasKey: true,
  keyPreview: "sk-1234567..."  ✅
}
```

如果显示 `hasKey: false`，说明配置没生效。

---

## ❓ 常见问题

### Q1: 修改了配置但还是报错？

**A:** 重启开发服务器
```bash
# Ctrl + C 停止
npm run dev  # 重新启动
```

### Q2: 还是提示 401 错误？

**A:** 检查以下几点：
1. API Key 是否正确（完整复制，包括 `sk-`）
2. API Key 是否过期
3. API 地址是否正确
4. 是否有网络限制

### Q3: 两种方式有什么区别？

| 方式 | 优点 | 缺点 |
|------|------|------|
| **方式1（代码）** | 快速简单 | 密钥会提交到 Git |
| **方式2（环境变量）** | 安全，不会泄露 | 需要创建文件 |

---

## 🚀 快速测试

配置完成后，在聊天框输入：

```
介绍一下你自己
```

如果 AI 正常回复，说明配置成功！🎉

---

## 📚 更多帮助

- 详细配置指南：[ENV_SETUP.md](ENV_SETUP.md)
- 项目文档：[README.zh-CN.md](README.zh-CN.md)
- 遇到问题？[提交 Issue](https://github.com/your-repo/issues)

---

<div align="center">

**🎉 配置完成，开始使用吧！**

</div>

