# 🔐 环境变量配置指南

本文档说明如何在开发和生产环境中配置 API 密钥。

---

## 🎯 配置策略

| 环境 | 配置方式 | 安全性 | 说明 |
|------|---------|--------|------|
| **开发环境** | `.env.development` 文件 或 代码默认值 | ⚠️ 中等 | 方便调试 |
| **生产环境** | 环境变量 | ✅ 高 | 不暴露密钥 |

---

## 📝 快速开始

### 方法 1: 使用 .env 文件（推荐）

#### 1. 创建开发环境配置文件

```bash
# 在项目根目录创建 .env.development 文件
# 注意：这个文件会被 .gitignore 忽略，不会提交到 Git

# Windows (PowerShell)
Copy-Item .env.development.example .env.development

# Mac/Linux
cp .env.development.example .env.development
```

#### 2. 编辑配置文件

打开 `.env.development` 文件，填写你的 API 密钥：

```env
# DeepSeek API 配置
VITE_REMOTE_API_BASE_URL=https://api.deepseek.com
VITE_REMOTE_API_KEY=sk-your-real-api-key-here
VITE_REMOTE_API_MODEL=deepseek-chat

# 默认引擎模式
VITE_DEFAULT_ENGINE=remote
```

#### 3. 启动开发服务器

```bash
npm run dev
```

**✅ 完成！** 应用将自动读取 `.env.development` 中的配置。

---

### 方法 2: 直接修改代码默认值

如果你不想创建 `.env` 文件，可以直接在代码中配置：

#### 1. 编辑 `src/config/env.ts`

```typescript
// ⚠️ 开发环境默认配置 - 仅用于开发调试
const DEV_DEFAULTS = {
    BASE_URL: "https://api.deepseek.com",
    API_KEY: "sk-your-real-api-key-here",  // 🔑 在这里填写你的 API Key
    MODEL: "deepseek-chat",
};
```

#### 2. 启动开发服务器

```bash
npm run dev
```

**⚠️ 注意：** 这种方式的密钥会被提交到 Git，仅适合个人项目或测试。

---

## 🌐 支持的 API 提供商

### 1. DeepSeek（推荐）

**性价比最高的选择**

```env
VITE_REMOTE_API_BASE_URL=https://api.deepseek.com
VITE_REMOTE_API_KEY=sk-xxxxx
VITE_REMOTE_API_MODEL=deepseek-chat
```

- 官网：https://www.deepseek.com
- 定价：非常便宜
- 速度：快
- 质量：优秀

### 2. OpenAI

```env
VITE_REMOTE_API_BASE_URL=https://api.openai.com
VITE_REMOTE_API_KEY=sk-xxxxx
VITE_REMOTE_API_MODEL=gpt-4
```

- 官网：https://platform.openai.com
- 定价：较贵
- 速度：中等
- 质量：最佳

### 3. 自定义代理

如果你有自己的 API 代理：

```env
VITE_REMOTE_API_BASE_URL=https://your-proxy.com
VITE_REMOTE_API_KEY=your-key
VITE_REMOTE_API_MODEL=your-model
```

---

## 🔧 开发环境配置

### 完整的 .env.development 示例

```env
# ==========================================
# 开发环境配置
# ==========================================

# 远程 API 配置
VITE_REMOTE_API_BASE_URL=https://api.deepseek.com
VITE_REMOTE_API_KEY=sk-1234567890abcdef
VITE_REMOTE_API_MODEL=deepseek-chat

# 默认引擎模式
# browser - 使用浏览器本地模型（需要下载模型）
# remote  - 使用远程 API（需要配置密钥）
VITE_DEFAULT_ENGINE=remote
```

### 优先级

配置读取的优先级（从高到低）：

1. **环境变量** - `.env.development` 文件
2. **代码默认值** - `src/config/env.ts` 中的 `DEV_DEFAULTS`
3. **最终回退** - 空字符串或浏览器模式

---

## 🚀 生产环境配置

### Vercel 部署

#### 1. 在 Vercel 控制台添加环境变量

进入项目设置 → Environment Variables，添加：

```
VITE_REMOTE_API_BASE_URL = https://api.deepseek.com
VITE_REMOTE_API_KEY = sk-your-production-key
VITE_REMOTE_API_MODEL = deepseek-chat
VITE_DEFAULT_ENGINE = remote
```

#### 2. 重新部署

环境变量会在构建时注入，密钥不会暴露在代码中。

### 其他平台

#### Netlify

在 Site settings → Build & deploy → Environment variables 中添加。

#### Docker

使用环境变量传递：

```bash
docker run -e VITE_REMOTE_API_KEY=sk-xxx your-image
```

#### 传统服务器

在启动脚本中设置：

```bash
export VITE_REMOTE_API_BASE_URL=https://api.deepseek.com
export VITE_REMOTE_API_KEY=sk-xxx
export VITE_REMOTE_API_MODEL=deepseek-chat

npm run build
npm run preview
```

---

## 🔍 调试和验证

### 检查配置是否生效

打开浏览器控制台（F12），你会看到：

```
[Config] 🔧 开发环境配置: {
  baseURL: "https://api.deepseek.com",
  model: "deepseek-chat",
  hasKey: true,
  keyPreview: "sk-1234567..."
}
```

### 常见问题

#### 1. 提示 "无效的令牌" (401 错误)

**原因：** API Key 不正确或已过期

**解决：**
- 检查 API Key 是否正确复制
- 确认 API Key 没有过期
- 检查 API 地址是否正确

#### 2. 配置没有生效

**原因：** 环境变量没有被读取

**解决：**
```bash
# 重启开发服务器
# 停止当前服务器 (Ctrl + C)
npm run dev
```

#### 3. CORS 错误

**原因：** API 服务器不允许跨域请求

**解决：**
- 使用支持 CORS 的 API 服务
- 或通过代理服务器转发请求

---

## 🔒 安全最佳实践

### ✅ 推荐做法

1. **开发环境**
   - 使用 `.env.development` 文件
   - 文件已被 `.gitignore` 忽略
   - 不会提交到 Git

2. **生产环境**
   - 使用平台的环境变量功能
   - 密钥不会出现在代码中
   - 通过构建时注入

3. **团队协作**
   - 分享 `.env.development.example` 模板
   - 每个开发者使用自己的密钥
   - 不共享真实密钥

### ❌ 避免的做法

1. ❌ 不要在代码中硬编码生产环境密钥
2. ❌ 不要将 `.env.development` 提交到 Git
3. ❌ 不要在公开仓库中暴露密钥
4. ❌ 不要使用同一个密钥用于开发和生产

---

## 📚 相关文档

- [README.zh-CN.md](README.zh-CN.md) - 项目主文档
- [QUICK_START.md](QUICK_START.md) - 快速开始
- [ARCHITECTURE.md](ARCHITECTURE.md) - 技术架构

---

## 💡 获取 API Key

### DeepSeek

1. 访问 https://platform.deepseek.com
2. 注册账号
3. 进入 API Keys 页面
4. 创建新的 API Key
5. 复制密钥（只显示一次）

### OpenAI

1. 访问 https://platform.openai.com
2. 注册账号
3. 进入 API Keys 页面
4. 创建新的 API Key
5. 复制密钥（只显示一次）

---

<div align="center">

**🔐 保护好你的 API 密钥！**

有问题？查看 [故障排除](README.zh-CN.md#故障排除)

</div>

