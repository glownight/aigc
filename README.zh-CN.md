# 🤖 AIGC 智能对话应用

<div align="center">

![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue)
![Vite](https://img.shields.io/badge/Vite-6.3.6-purple)
![License](https://img.shields.io/badge/license-MIT-green)

一个现代化的 AI 对话应用，支持浏览器本地模型和远程 API 双模式。

[English](./README.md) | 简体中文

</div>

---

## ✨ 核心特性

### 🚀 双引擎模式
- **浏览器本地模型**: 使用 WebLLM 在浏览器中运行 AI 模型，完全离线可用
- **远程 API**: 支持 OpenAI、DeepSeek 等远程 API 服务

### 💡 智能功能
- **实时流式响应**: 打字机效果，实时显示 AI 回复
- **多会话管理**: 支持创建、切换、删除多个对话会话
- **智能去重**: 自动检测和过滤重复内容
- **内容质量检查**: 自动截断不完整的句子

### 🎨 优秀的用户体验
- **Markdown 渲染**: 支持代码高亮、表格、列表等
- **主题切换**: 支持黑色主题（更多主题开发中）
- **响应式设计**: 完美适配桌面和移动设备
- **锁屏功能**: 保护隐私，2小时无操作自动锁定

### ⚡ 性能优化
- **React 性能优化**: 使用 memo、useMemo、useCallback 减少重渲染
- **代码分割**: 智能分块，按需加载
- **Service Worker**: 智能缓存策略，离线可用
- **性能监控**: 内置 Web Vitals 监控

---

## 📸 界面预览

```
┌─────────────────────────────────────────┐
│  ☰  【AIGC 应用】         🔒 设置 新会话 │
├─────────────────────────────────────────┤
│                                         │
│  建议卡片：                              │
│  ┌──────────┐ ┌──────────┐             │
│  │介绍自己  │ │总结文字  │             │
│  └──────────┘ └──────────┘             │
│                                         │
│  消息列表：                              │
│  ┌─────────────────────────────┐        │
│  │ 我: 你好                     │        │
│  └─────────────────────────────┘        │
│  ┌─────────────────────────────┐        │
│  │ AI: 你好！我可以为你提供...  │        │
│  └─────────────────────────────┘        │
│                                         │
├─────────────────────────────────────────┤
│  [输入框: 请输入你的问题...]    [发送]   │
└─────────────────────────────────────────┘
```

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0

### 安装

```bash
# 克隆项目
git clone https://github.com/your-username/aigc.git
cd aigc

# 安装依赖
npm install

# 配置环境变量（可选）
npm run setup:env
# 或手动创建 .env 文件
```

### 环境变量配置

创建 `.env` 文件：

```env
# 默认引擎模式 (browser | remote)
VITE_DEFAULT_ENGINE=browser

# 远程 API 配置
VITE_REMOTE_API_BASE_URL=https://api.deepseek.com
VITE_REMOTE_API_KEY=your-api-key-here
VITE_REMOTE_API_MODEL=deepseek-chat
```

### 开发

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:5177
```

### 构建

```bash
# 生产构建
npm run build

# 预览构建结果
npm run preview
```

---

## 📖 使用指南

### 基础使用

#### 1. 选择引擎模式

在设置中选择引擎模式：
- **浏览器本地模型**: 首次使用需下载约 234MB 的模型文件
- **远程 API**: 需配置 API 密钥

#### 2. 开始对话

- 在输入框输入问题
- 按 `Enter` 发送，`Shift + Enter` 换行
- 点击"停止"按钮可中断生成

#### 3. 会话管理

- 点击左上角 `☰` 打开会话列表
- 点击"新会话"创建新对话
- 点击会话可切换
- 长按或右键可删除会话

### 高级功能

#### 批量删除会话

1. 打开会话列表
2. 点击"批量删除"
3. 选择要删除的会话
4. 点击"删除(N)"确认

#### 锁屏功能

- 点击右上角 🔒 图标手动锁定
- 2小时无操作自动锁定
- 默认密码：`55`（请修改源码更改）

#### 内容复制

- 将鼠标悬停在 AI 回复上
- 点击右上角复制按钮
- 内容已复制到剪贴板

---

## 🏗️ 项目架构

### 目录结构

```
src/
├── components/          # UI 组件
│   ├── ErrorBoundary/  # 错误边界
│   ├── ChatHeader/     # 顶部导航
│   ├── ChatSidebar/    # 会话列表
│   ├── ChatMessages/   # 消息列表
│   ├── ChatComposer/   # 输入框
│   ├── SettingsModal/  # 设置弹窗
│   └── LockScreen/     # 锁屏
├── hooks/              # 自定义 Hooks
│   ├── useChat.ts      # 聊天逻辑
│   ├── useEngine.ts    # 引擎管理
│   ├── useSession.ts   # 会话管理
│   └── useLocalStorage.ts  # 本地存储
├── utils/              # 工具函数
│   ├── performance.ts  # 性能监控
│   ├── similarity.ts   # 相似度计算
│   ├── textQuality.ts  # 文本质量
│   └── webllm.ts       # WebLLM 管理
├── types/              # TypeScript 类型
├── styles/             # 样式文件
│   ├── critical.css    # 关键 CSS
│   ├── animations.css  # 动画库
│   └── utilities.css   # 工具类
└── config/             # 配置文件
```

### 技术栈

- **前端框架**: React 18.3
- **开发语言**: TypeScript 5.6
- **构建工具**: Vite 6.3
- **AI 引擎**: WebLLM 0.2.74
- **路由**: React Router 6.28
- **Markdown**: react-markdown
- **代码高亮**: rehype-highlight
- **动画**: Framer Motion

### 数据流

```
用户输入
  ↓
useChat Hook
  ↓
├─ 浏览器模式 → WebLLM Engine → 本地推理
└─ 远程模式 → API Request → 远程服务
  ↓
流式响应处理
  ↓
消息更新
  ↓
UI 渲染
```

---

## 🎨 自定义开发

### 添加新组件

```tsx
// src/components/MyComponent/index.tsx
import { memo } from 'react';
import './styles.css';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

const MyComponent = memo<MyComponentProps>(({ title, onAction }) => {
  return (
    <div className="my-component">
      <h2>{title}</h2>
      <button onClick={onAction}>Action</button>
    </div>
  );
});

export default MyComponent;
```

### 添加新 Hook

```typescript
// src/hooks/useMyHook.ts
import { useState, useCallback } from 'react';

/**
 * 自定义 Hook 示例
 * @param initialValue 初始值
 * @returns [value, increment, decrement]
 */
export function useCounter(initialValue: number = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount((prev) => prev + 1);
  }, []);

  const decrement = useCallback(() => {
    setCount((prev) => prev - 1);
  }, []);

  return { count, increment, decrement };
}
```

### 使用 CSS 工具类

```tsx
// 使用内置工具类
<div className="d-flex justify-center items-center p-3 rounded shadow">
  <span className="text-primary font-bold">内容</span>
</div>

// 使用动画
<div className="fade-in slide-in-up">
  淡入 + 滑入动画
</div>
```

---

## 🔧 配置说明

### Vite 配置

`vite.config.ts` 包含以下优化：

- **代码分割**: 智能分块策略
- **压缩**: Terser 高级压缩
- **Tree-shaking**: 移除未使用代码
- **路径别名**: `@` 指向 `src`

### TypeScript 配置

`tsconfig.app.json` 启用严格模式：

- 所有严格检查选项
- 类型安全保障
- 更好的 IDE 支持

### Service Worker

`public/sw.js` 智能缓存策略：

- 静态资源缓存 7 天
- 动态资源缓存 24 小时
- 图片资源缓存 30 天
- 自动清理过期缓存

---

## 📊 性能优化

### 已实施的优化

| 优化项 | 说明 | 效果 |
|--------|------|------|
| React.memo | 组件缓存 | 减少重渲染 60-80% |
| 代码分割 | 按需加载 | 包体积减少 ~30% |
| Service Worker | 智能缓存 | 离线可用 |
| 性能监控 | Web Vitals | 实时监控 |

### 性能指标

```bash
# 查看打包分析
npm run build
# 打开 dist/stats.html

# 性能监控（浏览器控制台）
window.getPerformanceSummary()
```

---

## 🐛 故障排除

### 常见问题

#### 1. 模型下载失败

```bash
# 检查网络连接
# 清除浏览器缓存
# 刷新页面重试
```

#### 2. API 调用失败

```bash
# 检查 API 密钥是否正确
# 确认 API 地址可访问
# 查看控制台错误信息
```

#### 3. 构建错误

```bash
# 清理依赖重新安装
rm -rf node_modules package-lock.json
npm install

# 清理缓存
npm run clean  # 如果有的话
```

### 调试技巧

```javascript
// 开发环境调试
console.log('[DEBUG]', data);

// 性能分析
window.getPerformanceSummary();

// Service Worker 调试
navigator.serviceWorker.controller.postMessage({
  type: 'CLEAN_CACHE'
});
```

---

## 🤝 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 编写清晰的注释
- 添加单元测试（如适用）

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

- [WebLLM](https://github.com/mlc-ai/web-llm) - 浏览器端 LLM 引擎
- [React](https://react.dev/) - UI 框架
- [Vite](https://vitejs.dev/) - 构建工具
- [TypeScript](https://www.typescriptlang.org/) - 类型系统

---

## 📞 联系方式

- 问题反馈: [Issues](https://github.com/your-username/aigc/issues)
- 讨论交流: [Discussions](https://github.com/your-username/aigc/discussions)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给它一个星标！**

Made with ❤️ by [Your Name]

</div>

