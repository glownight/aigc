# 🏗️ 项目架构文档

本文档详细说明 AIGC 项目的技术架构、设计模式和核心概念。

---

## 📋 目录

- [架构概览](#架构概览)
- [技术栈](#技术栈)
- [目录结构](#目录结构)
- [核心模块](#核心模块)
- [数据流](#数据流)
- [设计模式](#设计模式)
- [性能优化](#性能优化)
- [安全性](#安全性)

---

## 🎯 架构概览

### 整体架构图

```
┌──────────────────────────────────────────────────────┐
│                    用户界面层                          │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐    │
│  │ Header │  │Sidebar │  │Messages│  │Composer│    │
│  └────────┘  └────────┘  └────────┘  └────────┘    │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│                    业务逻辑层                          │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐    │
│  │useChat │  │useEngine│ │useSession│ │useLocal│    │
│  └────────┘  └────────┘  └────────┘  └────────┘    │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│                    数据访问层                          │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐           │
│  │LocalStorage│  │WebLLM    │  │Remote API│           │
│  └─────────┘  └──────────┘  └──────────┘           │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│                    基础设施层                          │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐           │
│  │Service  │  │Performance│  │Error     │           │
│  │Worker   │  │Monitor    │  │Boundary  │           │
│  └─────────┘  └──────────┘  └──────────┘           │
└──────────────────────────────────────────────────────┘
```

### 分层架构

#### 1. 用户界面层 (Presentation Layer)
- **职责**: 渲染 UI、处理用户交互
- **技术**: React 组件、CSS
- **特点**: 无状态、可复用、性能优化

#### 2. 业务逻辑层 (Business Logic Layer)
- **职责**: 管理状态、处理业务逻辑
- **技术**: React Hooks
- **特点**: 可测试、可复用、关注点分离

#### 3. 数据访问层 (Data Access Layer)
- **职责**: 数据持久化、API 调用
- **技术**: LocalStorage、WebLLM、Fetch API
- **特点**: 抽象数据源、统一接口

#### 4. 基础设施层 (Infrastructure Layer)
- **职责**: 缓存、监控、错误处理
- **技术**: Service Worker、Performance API
- **特点**: 横切关注点、提升体验

---

## 🔧 技术栈

### 前端框架

```typescript
// React 18.3 - UI 框架
import React from 'react';

// TypeScript 5.6 - 类型系统
type User = {
  id: string;
  name: string;
};

// Vite 6.3 - 构建工具
// 快速热更新、优化的生产构建
```

### 核心依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| React | 18.3.1 | UI 框架 |
| TypeScript | 5.6.3 | 类型系统 |
| Vite | 6.3.6 | 构建工具 |
| React Router | 6.28.0 | 路由管理 |
| WebLLM | 0.2.74 | 浏览器 AI 引擎 |
| Framer Motion | 12.23.24 | 动画库 |
| react-markdown | 10.1.0 | Markdown 渲染 |

---

## 📁 目录结构

### 完整目录树

```
src/
├── components/              # UI 组件
│   ├── ErrorBoundary/      # 错误边界
│   │   ├── index.tsx       # 组件逻辑
│   │   └── styles.css      # 组件样式
│   ├── ChatHeader/         # 顶部导航栏
│   ├── ChatSidebar/        # 会话列表侧边栏
│   ├── ChatMessages/       # 消息列表
│   ├── ChatComposer/       # 输入框
│   ├── SettingsModal/      # 设置弹窗
│   ├── LockScreen/         # 锁屏
│   └── index.ts            # 统一导出
│
├── hooks/                  # 自定义 Hooks
│   ├── useChat.ts          # 聊天逻辑管理
│   ├── useEngine.ts        # AI 引擎管理
│   ├── useSession.ts       # 会话管理
│   ├── useRemoteChat.ts    # 远程 API 管理
│   ├── useLocalStorage.ts  # 本地存储
│   └── index.ts            # 统一导出
│
├── utils/                  # 工具函数
│   ├── uid.ts              # ID 生成器
│   ├── similarity.ts       # 文本相似度
│   ├── textQuality.ts      # 文本质量检查
│   ├── webllm.ts           # WebLLM 管理
│   ├── performance.ts      # 性能监控
│   └── index.ts            # 统一导出
│
├── types/                  # TypeScript 类型
│   └── index.ts            # 类型定义
│
├── styles/                 # 样式文件
│   ├── critical.css        # 关键 CSS
│   ├── animations.css      # 动画库
│   └── utilities.css       # 工具类
│
├── config/                 # 配置文件
│   └── env.ts              # 环境配置
│
├── App.tsx                 # 主应用组件
├── App.css                 # 全局样式
├── MessageContent.tsx      # 消息内容渲染
├── MessageContent.css      # 消息样式
├── main.tsx                # 应用入口
├── index.css               # 基础样式
└── vite-env.d.ts          # Vite 类型定义
```

### 模块职责

#### Components (组件层)
```typescript
// 每个组件遵循以下结构
Component/
  ├── index.tsx        // 组件逻辑
  ├── styles.css       // 组件样式
  └── types.ts         // 组件类型（可选）

// 组件设计原则
- 单一职责
- Props 类型化
- 使用 memo 优化
- 独立可测试
```

#### Hooks (逻辑层)
```typescript
// Hook 命名规范: use + 功能名
useChat      // 聊天逻辑
useEngine    // 引擎管理
useSession   // 会话管理

// Hook 设计原则
- 可复用逻辑
- 无副作用（纯函数）
- 清晰的输入输出
- 完整的类型定义
```

#### Utils (工具层)
```typescript
// 工具函数类型
utils/
  ├── uid.ts           // 通用工具
  ├── similarity.ts    // 算法工具
  ├── textQuality.ts   // 业务工具
  └── performance.ts   // 性能工具

// 工具函数原则
- 纯函数
- 单一职责
- 可测试
- 文档完整
```

---

## 🔄 核心模块

### 1. 聊天模块

#### 组件结构

```
Chat System
├── ChatHeader          (顶部导航)
├── ChatSidebar         (会话列表)
├── ChatMessages        (消息展示)
└── ChatComposer        (消息输入)
```

#### 数据流

```typescript
// 发送消息流程
用户输入
  ↓
ChatComposer.onSend()
  ↓
useChat.handleSend()
  ↓
├─ 验证输入
├─ 创建消息对象
├─ 更新会话
└─ 调用 AI 引擎
  ↓
流式响应处理
  ↓
实时更新 UI
```

### 2. AI 引擎模块

#### 双引擎架构

```typescript
// 浏览器模式
useChat + WebLLM
  ↓
本地推理
  ↓
流式输出

// 远程模式
useRemoteChat + Fetch API
  ↓
API 请求
  ↓
流式响应
```

#### 引擎管理

```typescript
// src/hooks/useEngine.ts
export function useEngine(
  engine: EngineMode,
  browserModel: string,
  downloadPaused: boolean
) {
  // 引擎状态
  const engineRef = useRef<MLCEngine | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [progressText, setProgressText] = useState('');

  // 初始化逻辑
  useEffect(() => {
    if (engine === 'browser' && !downloadPaused) {
      initializeEngine();
    }
  }, [engine, browserModel, downloadPaused]);

  return {
    engineRef,
    engineReady,
    progressText,
    setProgressText,
  };
}
```

### 3. 会话管理模块

#### 会话数据结构

```typescript
interface Session {
  id: string;                    // 唯一标识
  title: string;                 // 会话标题
  messages: Message[];           // 消息列表
  createdAt: number;             // 创建时间
  updatedAt: number;             // 更新时间
}

interface SessionManager {
  sessions: Session[];           // 所有会话
  currentSessionId: string;      // 当前会话ID
}
```

#### 会话操作

```typescript
// src/hooks/useSession.ts
export function useSession(
  sessionManager: SessionManager,
  setSessionManager: (sm: SessionManager) => void
) {
  // 创建会话
  const createNewSession = useCallback(() => {
    const newSession: Session = {
      id: uid(),
      title: `对话 ${sessions.length + 1}`,
      messages: defaultMessages,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    setSessionManager({
      sessions: [...sessions, newSession],
      currentSessionId: newSession.id,
    });
  }, [sessions]);

  // 切换会话
  const switchSession = useCallback((id: string) => {
    setSessionManager({
      ...sessionManager,
      currentSessionId: id,
    });
  }, [sessionManager]);

  // 删除会话
  const deleteSession = useCallback((id: string) => {
    // 实现删除逻辑...
  }, [sessionManager]);

  return {
    currentSession,
    createNewSession,
    switchSession,
    deleteSession,
    updateCurrentSession,
  };
}
```

### 4. 性能监控模块

#### 监控指标

```typescript
// src/utils/performance.ts

// Web Vitals 核心指标
interface WebVitalsMetric {
  name: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

// 监控功能
export function monitorWebVitals() {
  // 收集 TTFB
  const ttfb = navigationTiming.responseStart - navigationTiming.requestStart;
  
  // 收集 FCP
  const paintEntries = performance.getEntriesByType('paint');
  
  // 收集 LCP
  const lcpObserver = new PerformanceObserver((list) => {
    // 处理 LCP 数据
  });
}
```

---

## 📊 数据流

### 完整数据流图

```
┌─────────────┐
│  用户操作    │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  UI 组件     │ → onChange/onClick
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Hook 层     │ → 业务逻辑处理
└──────┬──────┘
       │
       ├─→ LocalStorage (持久化)
       │
       ├─→ WebLLM / API (AI 推理)
       │
       └─→ State Update (状态更新)
              │
              ↓
       ┌─────────────┐
       │  UI 重渲染   │
       └─────────────┘
```

### 消息发送流程

```typescript
// 1. 用户输入
<ChatComposer 
  onSend={() => handleSend(input)}
/>

// 2. Hook 处理
const handleSend = useCallback(async (userMessage: string) => {
  // 2.1 创建用户消息
  const userMsg: Message = {
    id: uid(),
    role: 'user',
    content: userMessage,
  };

  // 2.2 更新会话
  const updatedMessages = [...sessionMessages, userMsg];
  updateCurrentSession(updatedMessages);

  // 2.3 调用 AI
  const assistantMsg: Message = {
    id: uid(),
    role: 'assistant',
    content: '',
  };
  updateCurrentSession([...updatedMessages, assistantMsg]);

  // 2.4 流式响应
  for await (const chunk of stream) {
    assistantMsg.content += chunk;
    updateCurrentSession([...updatedMessages, assistantMsg]);
  }
}, [sessionMessages]);

// 3. UI 更新
{sessionMessages.map(msg => (
  <MessageItem key={msg.id} message={msg} />
))}
```

---

## 🎨 设计模式

### 1. 组件组合模式

```typescript
// 容器组件 + 展示组件
<ChatContainer>
  <ChatHeader {...headerProps} />
  <ChatMessages {...messagesProps} />
  <ChatComposer {...composerProps} />
</ChatContainer>

// 优点:
// - 关注点分离
// - 易于测试
// - 可复用性高
```

### 2. Hook 模式

```typescript
// 自定义 Hook 封装逻辑
function useChat(...) {
  const [loading, setLoading] = useState(false);
  
  const handleSend = useCallback(...);
  const handleStop = useCallback(...);
  
  return { loading, handleSend, handleStop };
}

// 优点:
// - 逻辑复用
// - 易于测试
// - 代码组织清晰
```

### 3. 状态提升模式

```typescript
// App 组件管理全局状态
function App() {
  const [sessionManager, setSessionManager] = useLocalStorage(...);
  const [engine, setEngine] = useLocalStorage(...);
  
  return (
    <ErrorBoundary>
      <ChatHeader {...props} />
      <ChatMessages {...props} />
    </ErrorBoundary>
  );
}
```

### 4. 错误边界模式

```typescript
// 错误边界捕获异常
class ErrorBoundary extends Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorUI />;
    }
    return this.props.children;
  }
}
```

---

## ⚡ 性能优化

### 1. React 性能优化

```typescript
// 使用 memo 避免重渲染
const ChatMessage = memo(({ message }) => {
  return <div>{message.content}</div>;
});

// 使用 useMemo 缓存计算
const filteredMessages = useMemo(() => {
  return messages.filter(m => m.role !== 'system');
}, [messages]);

// 使用 useCallback 缓存函数
const handleClick = useCallback(() => {
  doSomething();
}, [dependency]);
```

### 2. 代码分割

```typescript
// vite.config.ts
manualChunks: (id) => {
  if (id.includes('react')) return 'react-core';
  if (id.includes('webllm')) return 'webllm';
  if (id.includes('markdown')) return 'markdown';
}

// 懒加载
const Settings = lazy(() => import('./Settings'));
```

### 3. 缓存策略

```javascript
// Service Worker 缓存
// 静态资源: 缓存优先
// HTML: 网络优先，缓存备用
// API: 仅网络

const CACHE_CONFIG = {
  STATIC_MAX_AGE: 7 * 24 * 60 * 60 * 1000,   // 7天
  DYNAMIC_MAX_AGE: 24 * 60 * 60 * 1000,      // 24小时
  MAX_CACHE_ITEMS: 50,
};
```

---

## 🔒 安全性

### 1. XSS 防护

```typescript
// 使用 react-markdown 安全渲染
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeHighlight]}
>
  {content}
</ReactMarkdown>

// 避免 dangerouslySetInnerHTML
// ❌ <div dangerouslySetInnerHTML={{ __html: content }} />
// ✅ <ReactMarkdown>{content}</ReactMarkdown>
```

### 2. 输入验证

```typescript
// 验证用户输入
function validateInput(input: string): boolean {
  if (!input || input.trim().length === 0) {
    return false;
  }
  if (input.length > MAX_LENGTH) {
    return false;
  }
  return true;
}
```

### 3. API 密钥保护

```typescript
// 环境变量存储
const API_KEY = import.meta.env.VITE_REMOTE_API_KEY;

// 不在客户端硬编码
// ❌ const API_KEY = 'sk-xxx';
// ✅ const API_KEY = import.meta.env.VITE_REMOTE_API_KEY;
```

---

## 📈 扩展性

### 添加新功能

```typescript
// 1. 创建新组件
src/components/NewFeature/
  ├── index.tsx
  └── styles.css

// 2. 创建新 Hook
src/hooks/useNewFeature.ts

// 3. 添加类型
src/types/index.ts

// 4. 集成到 App
import NewFeature from './components/NewFeature';
```

### 添加新引擎

```typescript
// 1. 定义引擎类型
type EngineMode = 'browser' | 'remote' | 'new-engine';

// 2. 创建引擎 Hook
export function useNewEngine(...) {
  // 引擎逻辑
}

// 3. 集成到 useChat
const chat = engine === 'new-engine' 
  ? useNewEngine(...) 
  : useChat(...);
```

---

## 🔍 调试指南

### 开发工具

```typescript
// 性能分析
window.getPerformanceSummary();

// React DevTools
// 安装浏览器扩展

// Vite 调试
// 打开 http://localhost:5177/__inspect/
```

### 日志系统

```typescript
// 统一日志格式
console.log('[Module] Action:', data);

// 开发环境日志
if (import.meta.env.DEV) {
  console.log('[DEBUG]', debug info);
}
```

---

<div align="center">

**📚 持续更新中...**

如有疑问，请参考 [贡献指南](CONTRIBUTING.md)

</div>

