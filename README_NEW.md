# 🤖 AIGC - AI聊天应用

一个基于 WebLLM 的浏览器端 AI 聊天应用，采用模块化架构设计。

## ✨ 特性

- 🚀 **完全在浏览器运行** - 无需服务器，数据完全本地化
- 💬 **多会话管理** - 支持创建、切换、删除多个对话会话
- 📱 **响应式设计** - 适配桌面端和移动端
- 🎨 **现代化UI** - 简洁美观的用户界面
- 💾 **数据持久化** - 会话数据自动保存到本地
- ⚡ **流式响应** - 实时显示AI回复内容
- 🔧 **模块化架构** - 优秀的代码组织和可维护性

## 🏗️ 项目结构

```
src/
├── types/           # TypeScript类型定义
├── utils/           # 工具函数（相似度、质量检查等）
├── hooks/           # 自定义Hooks（引擎、会话、聊天逻辑）
├── components/      # UI组件（Header、Sidebar、Messages等）
└── App.tsx          # 主应用组件
```

详细结构请查看 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

## 📚 文档

- **[QUICK_START.md](./QUICK_START.md)** - 快速入门指南，5分钟了解项目
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - 完整的项目结构文档
- **[REFACTORING.md](./REFACTORING.md)** - 重构说明和设计原则
- **[REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md)** - 重构总结

## 🎯 核心模块

### 类型定义 (`src/types/`)
集中管理所有TypeScript类型定义，提供完整的类型安全。

### 工具函数 (`src/utils/`)
- `uid.ts` - 唯一ID生成
- `similarity.ts` - 文本相似度计算和重复检测
- `textQuality.ts` - 文本质量检查和智能截断
- `webllm.ts` - WebLLM模块懒加载管理

### 自定义Hooks (`src/hooks/`)
- `useLocalStorage` - 本地存储持久化
- `useEngine` - WebLLM引擎管理
- `useSession` - 会话管理（创建、切换、删除）
- `useChat` - 聊天逻辑核心（发送、流式响应、错误处理）

### UI组件 (`src/components/`)
- `ChatHeader` - 顶部导航栏
- `ChatSidebar` - 会话列表侧边栏
- `SuggestionCards` - 建议卡片
- `ChatMessages` - 消息列表
- `ChatComposer` - 消息输入框
- `SettingsModal` - 设置弹窗

## 💻 技术栈

- **React** - UI框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **WebLLM** - 浏览器端AI推理
- **React Router** - 路由管理

## 🎨 代码质量

本项目经过全面重构，具备：

- ✅ **模块化** - 清晰的模块划分，职责单一
- ✅ **可复用** - 组件和Hooks高度可复用
- ✅ **可测试** - 独立模块易于单元测试
- ✅ **可维护** - 代码结构清晰，易于维护
- ✅ **类型安全** - 完整的TypeScript类型定义
- ✅ **最佳实践** - 遵循React和软件工程最佳实践

### 重构成果

| 指标 | 重构前 | 重构后 | 改进 |
|-----|--------|--------|------|
| 主文件行数 | 1332行 | 240行 | ⬇️ 82% |
| 模块文件数 | 3个 | 25+个 | ⬆️ 733% |
| 代码可维护性 | 低 | 高 | 显著提升 |
| 代码可读性 | 低 | 高 | 显著提升 |

详见 [REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md)

## 📖 使用示例

### 导入工具函数
```typescript
import { uid, detectDuplicate, checkContentQuality } from "./utils";
```

### 使用自定义Hooks
```typescript
import { useLocalStorage, useEngine, useChat } from "./hooks";

function MyComponent() {
  const [data, setData] = useLocalStorage("key", initialValue);
  const { engineReady, progressText } = useEngine(/*...*/);
  const { loading, handleSend } = useChat(/*...*/);
  // ...
}
```

### 使用组件
```typescript
import { ChatHeader, ChatMessages, ChatComposer } from "./components";

function App() {
  return (
    <>
      <ChatHeader {...props} />
      <ChatMessages {...props} />
      <ChatComposer {...props} />
    </>
  );
}
```

## 🔧 开发指南

### 添加新组件
1. 在 `src/components/` 创建组件目录
2. 创建 `index.tsx` 和 `styles.css`
3. 在 `src/components/index.ts` 中导出

### 添加新Hook
1. 在 `src/hooks/` 创建Hook文件
2. 在 `src/hooks/index.ts` 中导出

### 添加新工具函数
1. 在 `src/utils/` 创建工具文件
2. 在 `src/utils/index.ts` 中导出

详细指南请查看 [QUICK_START.md](./QUICK_START.md)

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

## 📄 许可

MIT License

## 🎉 致谢

感谢所有贡献者和开源社区的支持！

---

**Built with ❤️ using React + TypeScript + WebLLM**

