# 🚀 快速入门指南

## 重构后的代码结构一览

恭喜!项目已经完成重构。原本1332行的 `App.tsx` 现在被拆分为清晰的模块化结构。

## 📖 5分钟了解新结构

### 1️⃣ 类型定义 - 一眼看懂数据结构

```typescript
// src/types/index.ts
export type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

export type Session = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
};
```

**使用方式**:
```typescript
import type { Message, Session } from "./types";
```

### 2️⃣ 工具函数 - 开箱即用

```typescript
// src/utils/uid.ts - 生成唯一ID
import { uid } from "./utils/uid";
const messageId = uid();

// src/utils/similarity.ts - 检测重复
import { detectDuplicate } from "./utils/similarity";
const isDuplicate = detectDuplicate(text1, text2);

// src/utils/textQuality.ts - 质量检查
import { checkContentQuality } from "./utils/textQuality";
const { isValid, reason } = checkContentQuality(content);
```

**或者统一导入**:
```typescript
import { uid, detectDuplicate, checkContentQuality } from "./utils";
```

### 3️⃣ 自定义Hooks - 业务逻辑复用

```typescript
// useLocalStorage - 持久化状态
const [theme, setTheme] = useLocalStorage<Theme>("theme", "black");

// useEngine - 引擎管理
const { engineRef, engineReady, progressText } = useEngine(
  engine,
  browserModel,
  downloadPaused
);

// useSession - 会话管理
const {
  currentSession,
  createNewSession,
  switchSession,
  deleteSession
} = useSession(sessionManager, setSessionManager);

// useChat - 聊天逻辑
const { loading, canSend, handleSend, handleStop } = useChat(
  engineRef,
  engineReady,
  browserModel,
  sessionMessages,
  updateCurrentSession,
  setProgressText,
  downloadPaused,
  setDownloadPaused
);
```

### 4️⃣ UI组件 - 即插即用

```typescript
// 顶部导航
<ChatHeader
  progressText={progressText}
  engineReady={engineReady}
  onToggleSidebar={() => setShowSidebar(true)}
  onShowSettings={() => setShowSettings(true)}
/>

// 侧边栏
<ChatSidebar
  sessions={sessions}
  currentSessionId={currentSessionId}
  onSwitchSession={switchSession}
  onDeleteSession={deleteSession}
/>

// 消息列表
<ChatMessages
  messages={messages}
  loading={loading}
  listRef={listRef}
/>

// 输入框
<ChatComposer
  input={input}
  loading={loading}
  canSend={canSend}
  onSend={handleSend}
  onStop={handleStop}
/>
```

## 🎯 常见任务指南

### 添加新的消息类型

**1. 定义类型**
```typescript
// src/types/index.ts
export type MessageType = "text" | "image" | "file";

export type Message = {
  id: string;
  role: Role;
  content: string;
  type?: MessageType; // 新增
};
```

**2. 更新渲染组件**
```typescript
// src/components/ChatMessages/index.tsx
// 根据type渲染不同内容
```

### 添加新的引擎提供商

**1. 扩展类型**
```typescript
// src/types/index.ts
export type EngineMode = "browser" | "openai" | "anthropic";
```

**2. 更新引擎Hook**
```typescript
// src/hooks/useEngine.ts
// 添加新的引擎初始化逻辑
```

**3. 更新设置界面**
```typescript
// src/components/SettingsModal/index.tsx
// 添加新的选项
```

### 添加新的快捷操作

**1. 添加到建议列表**
```typescript
// src/App.tsx
const suggestions = [
  "介绍一下你自己",
  "帮我总结这段文字",
  "新的快捷操作", // 新增
];
```

### 自定义主题

**1. 定义新主题**
```typescript
// src/types/index.ts
export type Theme = "blue" | "pink" | "green" | "yellow" | "black" | "custom";
```

**2. 添加CSS变量**
```css
/* src/App.css */
.theme-custom {
  --primary: #your-color;
  --background: #your-bg;
  /* ... */
}
```

## 📁 文件导航速查

### 想修改...

| 功能 | 文件位置 |
|-----|---------|
| **数据类型** | `src/types/index.ts` |
| **ID生成** | `src/utils/uid.ts` |
| **文本处理** | `src/utils/textQuality.ts` |
| **相似度检测** | `src/utils/similarity.ts` |
| **WebLLM管理** | `src/utils/webllm.ts` |
| **本地存储** | `src/hooks/useLocalStorage.ts` |
| **引擎管理** | `src/hooks/useEngine.ts` |
| **会话管理** | `src/hooks/useSession.ts` |
| **聊天逻辑** | `src/hooks/useChat.ts` |
| **顶部导航** | `src/components/ChatHeader/` |
| **侧边栏** | `src/components/ChatSidebar/` |
| **消息列表** | `src/components/ChatMessages/` |
| **输入框** | `src/components/ChatComposer/` |
| **设置弹窗** | `src/components/SettingsModal/` |
| **建议卡片** | `src/components/SuggestionCards/` |
| **主应用** | `src/App.tsx` |
| **全局样式** | `src/App.css` |

## 🔧 开发工作流

### 本地开发
```bash
# 启动开发服务器
npm run dev

# 打开浏览器访问
# http://localhost:5173
```

### 构建生产版本
```bash
# 构建
npm run build

# 预览构建结果
npm run preview
```

### 代码检查
```bash
# TypeScript类型检查
npx tsc --noEmit

# ESLint检查
npx eslint src/
```

## 💡 最佳实践

### 1. 导入顺序
```typescript
// ✅ 推荐
import { useState, useEffect } from "react";          // React
import { useNavigate } from "react-router-dom";       // 第三方库
import { useLocalStorage } from "./hooks";            // 自定义Hooks
import { ChatHeader } from "./components";            // 组件
import type { Message } from "./types";               // 类型
import { uid } from "./utils";                        // 工具
import "./App.css";                                   // 样式
```

### 2. 组件Props定义
```typescript
// ✅ 推荐 - 使用interface
interface ChatHeaderProps {
  progressText: string;
  engineReady: boolean;
  onToggleSidebar: () => void;
}

export default function ChatHeader({
  progressText,
  engineReady,
  onToggleSidebar
}: ChatHeaderProps) {
  // ...
}
```

### 3. Hook使用
```typescript
// ✅ 推荐 - 命名清晰
const { loading, handleSend } = useChat(/*...*/);

// ❌ 避免
const chat = useChat(/*...*/);
chat.handleSend(); // 不够直观
```

### 4. 类型导入
```typescript
// ✅ 推荐 - type-only import
import type { Message, Session } from "./types";

// ❌ 避免 - 可能导致编译错误
import { Message, Session } from "./types";
```

## 🎓 学习路径

### 初学者
1. 了解项目结构（本文档）
2. 阅读 `src/types/index.ts` 了解数据结构
3. 查看 `src/App.tsx` 了解整体流程
4. 尝试修改建议卡片内容

### 中级开发者
1. 深入学习自定义Hooks的实现
2. 了解WebLLM引擎管理机制
3. 优化组件性能（React.memo）
4. 添加新功能（如图片上传）

### 高级开发者
1. 重构工具函数为更通用的库
2. 添加单元测试
3. 性能监控和优化
4. 架构升级（如状态管理库）

## 📚 扩展阅读

- [REFACTORING.md](./REFACTORING.md) - 详细重构说明
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - 完整项目结构

## 🆘 常见问题

### Q: 为什么要拆分这么多文件?
A: 模块化使代码更易维护、测试和复用。每个文件职责单一，修改影响范围小。

### Q: 如何快速找到要修改的代码?
A: 参考上面的"文件导航速查"表格，或使用IDE的全局搜索功能。

### Q: 原来的功能都还在吗?
A: 是的!所有功能都保留，只是重新组织了代码结构。

### Q: 性能会受影响吗?
A: 不会。文件拆分是编译时的事，运行时性能一样。实际上，代码更清晰有助于后续优化。

### Q: 需要学习新的API吗?
A: 不需要。只是将原有代码重新组织，使用的都是标准React API。

## 🎉 开始探索吧!

选择一个你感兴趣的功能，找到对应的文件，开始你的代码之旅!

**Happy Coding!** 🚀

