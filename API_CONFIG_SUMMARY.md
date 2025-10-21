# 📊 API 配置总结

## ✅ 已完成的配置优化

### 1. 配置文件改进

#### 修改的文件：
- ✅ `src/config/env.ts` - 支持开发/生产环境分离
- ✅ `.gitignore` - 忽略敏感的环境变量文件

#### 新增的文件：
- ✅ `.env.example` - 环境变量模板
- ✅ `ENV_SETUP.md` - 详细配置文档
- ✅ `QUICK_CONFIG.md` - 快速配置指南
- ✅ `API_CONFIG_SUMMARY.md` - 本文档

---

## 🎯 配置策略

### 开发环境配置（2种方式）

#### 方式 1: 直接修改代码
```typescript
// src/config/env.ts
const DEV_DEFAULTS = {
    BASE_URL: "https://api.deepseek.com",
    API_KEY: "sk-你的密钥",  // 🔑 直接填写
    MODEL: "deepseek-chat",
};
```

**优点：** 快速、简单  
**缺点：** 密钥可能被提交到 Git

---

#### 方式 2: 使用 .env 文件（推荐）
```env
# .env.development
VITE_REMOTE_API_BASE_URL=https://api.deepseek.com
VITE_REMOTE_API_KEY=sk-你的密钥
VITE_REMOTE_API_MODEL=deepseek-chat
VITE_DEFAULT_ENGINE=remote
```

**优点：** 安全，不会泄露  
**缺点：** 需要创建文件

---

### 生产环境配置

在部署平台（Vercel、Netlify 等）设置环境变量：

```
VITE_REMOTE_API_BASE_URL = https://api.deepseek.com
VITE_REMOTE_API_KEY = sk-生产环境密钥
VITE_REMOTE_API_MODEL = deepseek-chat
VITE_DEFAULT_ENGINE = remote
```

**特点：** 密钥不会出现在代码中，构建时注入

---

## 🔄 配置优先级

```
1. 环境变量文件 (.env.development)
   ↓
2. 代码默认值 (DEV_DEFAULTS)
   ↓
3. 最终回退 (空字符串)
```

---

## 📋 配置清单

### 开发环境设置

- [ ] 选择配置方式（代码 或 .env）
- [ ] 获取 API Key
- [ ] 填写配置
- [ ] 重启开发服务器
- [ ] 验证配置（查看控制台）
- [ ] 测试聊天功能

### 生产环境设置

- [ ] 在部署平台添加环境变量
- [ ] 验证变量名称正确
- [ ] 重新部署应用
- [ ] 测试生产环境

---

## 🌐 支持的 API 提供商

### DeepSeek（推荐）
- **地址:** `https://api.deepseek.com`
- **模型:** `deepseek-chat`, `deepseek-reasoner`
- **价格:** ⭐⭐⭐⭐⭐ 非常便宜
- **速度:** ⭐⭐⭐⭐ 快
- **质量:** ⭐⭐⭐⭐ 优秀

### OpenAI
- **地址:** `https://api.openai.com`
- **模型:** `gpt-4`, `gpt-3.5-turbo`
- **价格:** ⭐⭐ 较贵
- **速度:** ⭐⭐⭐ 中等
- **质量:** ⭐⭐⭐⭐⭐ 最佳

### 自定义代理
- **地址:** 你的代理地址
- **模型:** 根据代理支持的模型
- **价格:** 取决于代理服务
- **速度:** 取决于代理服务
- **质量:** 取决于后端模型

---

## 🔍 验证方法

### 1. 检查控制台输出

打开浏览器控制台（F12），查看：

```javascript
[Config] 🔧 开发环境配置: {
  baseURL: "https://api.deepseek.com",
  model: "deepseek-chat",
  hasKey: true,  // ✅ 应该是 true
  keyPreview: "sk-1234567..."
}
```

### 2. 测试聊天功能

发送消息：`你好`

应该收到 AI 回复，而不是错误信息。

### 3. 检查网络请求

在控制台的 Network 标签中：
- 找到 `/v1/chat/completions` 请求
- 状态码应该是 `200`，不是 `401`

---

## ❗ 故障排除

### 问题 1: 401 无效令牌

**原因：**
- API Key 不正确
- API Key 已过期
- API Key 未正确配置

**解决：**
1. 检查 API Key 是否完整复制（包括 `sk-`）
2. 确认 API Key 未过期
3. 重启开发服务器
4. 查看控制台是否有配置输出

### 问题 2: 配置不生效

**原因：**
- 环境变量文件未生效
- 服务器未重启

**解决：**
```bash
# 停止服务器
Ctrl + C

# 重新启动
npm run dev
```

### 问题 3: CORS 错误

**原因：**
- API 服务器不支持跨域

**解决：**
- 使用支持 CORS 的 API 服务
- 或使用代理服务器

---

## 🔒 安全建议

### ✅ 推荐做法

1. **开发环境**
   - 使用 `.env.development` 文件
   - 文件已被 `.gitignore` 忽略
   - 每个开发者使用自己的密钥

2. **生产环境**
   - 使用部署平台的环境变量
   - 密钥不出现在代码中
   - 定期轮换密钥

3. **团队协作**
   - 分享 `.env.example` 模板
   - 不共享真实密钥
   - 使用不同的开发/生产密钥

### ❌ 避免做法

1. ❌ 不要在代码中硬编码生产密钥
2. ❌ 不要将 `.env.development` 提交到 Git
3. ❌ 不要在公开仓库暴露密钥
4. ❌ 不要多人共用同一个密钥

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| [QUICK_CONFIG.md](QUICK_CONFIG.md) | 5分钟快速配置 |
| [ENV_SETUP.md](ENV_SETUP.md) | 详细配置指南 |
| [README.zh-CN.md](README.zh-CN.md) | 项目主文档 |
| [ARCHITECTURE.md](ARCHITECTURE.md) | 技术架构 |

---

## 🎉 配置完成检查

完成以下所有步骤后，配置就完成了：

- [ ] ✅ 已选择配置方式
- [ ] ✅ 已获取 API Key
- [ ] ✅ 已填写配置
- [ ] ✅ 已重启服务器
- [ ] ✅ 控制台显示配置正确
- [ ] ✅ 聊天功能正常工作
- [ ] ✅ 没有 401 错误

---

<div align="center">

**🎊 恭喜！配置完成！**

现在可以开始使用 AIGC 应用了！

</div>

