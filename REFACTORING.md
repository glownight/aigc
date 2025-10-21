# 项目重构说明

## 概述

本项目已进行全面重构，将原本1332行的单一 `App.tsx` 文件拆分成模块化、可维护、可复用的组件和工具。

## 新项目结构

```
src/
├── types/                    # 类型定义
│   └── index.ts             # 所有TypeScript类型定义
│
├── utils/                    # 工具函数
│   ├── uid.ts               # 唯一ID生成
│   ├── similarity.ts        # 文本相似度计算
│   ├── textQuality.ts       # 文本质量检查
│   ├── webllm.ts           # WebLLM模块懒加载
│   └── index.ts            # 统一导出
│
├── hooks/                    # 自定义Hooks
│   ├── useLocalStorage.ts   # 本地存储Hook
│   ├── useEngine.ts         # 引擎管理Hook
│   ├── useSession.ts        # 会话管理Hook
│   ├── useChat.ts           # 聊天逻辑Hook
│   └── index.ts            # 统一导出
│
├── components/              # UI组件
│   ├── ChatHeader/          # 顶部导航栏
│   │   ├── index.tsx
│   │   └── styles.css
│   ├── ChatSidebar/         # 会话列表侧边栏
│   │   ├── index.tsx
│   │   └── styles.css
│   ├── SuggestionCards/     # 建议卡片
│   │   ├── index.tsx
│   │   └── styles.css
│   ├── ChatMessages/        # 消息列表
│   │   ├── index.tsx
│   │   └── styles.css
│   ├── ChatComposer/        # 消息输入框
│   │   ├── index.tsx
│   │   └── styles.css
│   ├── SettingsModal/       # 设置弹窗
│   │   ├── index.tsx
│   │   └── styles.css
│   └── index.ts            # 统一导出
│
├── App.tsx                  # 主应用组件（重构后约240行）
├── App.css                  # 全局样式
└── main.tsx                # 应用入口

```

## 重构亮点

### 1. 类型定义 (`src/types/`)

- **统一管理**: 所有TypeScript类型集中在一个文件中
- **易于维护**: 类型变更只需修改一处
- **类型安全**: 提供完整的类型定义

主要类型:
- `Message`: 消息类型
- `Session`: 会话类型
- `SessionManager`: 会话管理器
- `EngineMode`: 引擎模式
- `StreamConfig`: 流式处理配置

### 2. 工具函数 (`src/utils/`)

#### `uid.ts` - ID生成
```typescript
export const uid = (): string => Math.random().toString(36).slice(2);
```

#### `similarity.ts` - 相似度计算
- `levenshteinDistance()`: 计算编辑距离
- `calculateSimilarity()`: 计算相似度
- `detectDuplicate()`: 检测重复内容

#### `textQuality.ts` - 文本质量检查
- `checkContentQuality()`: 检查内容质量
- `truncateAtSentence()`: 智能截断

#### `webllm.ts` - WebLLM管理
- `loadWebLLMModule()`: 懒加载WebLLM模块
- `getEngineSingleton()`: 获取引擎单例

### 3. 自定义Hooks (`src/hooks/`)

#### `useLocalStorage.ts`
持久化状态管理，自动同步到localStorage

#### `useEngine.ts`
管理WebLLM引擎的初始化、进度跟踪和状态管理

#### `useSession.ts`
会话管理，包括创建、切换、删除会话，以及URL路由同步

#### `useChat.ts`
聊天逻辑核心，处理消息发送、流式响应、错误重试等

### 4. UI组件 (`src/components/`)

所有组件遵循以下原则:
- **单一职责**: 每个组件只负责一个功能
- **Props类型化**: 完整的TypeScript接口定义
- **可复用性**: 通过props传递数据和回调
- **独立样式**: 每个组件有自己的样式文件

#### 组件列表:

| 组件 | 功能 | 主要Props |
|-----|------|----------|
| ChatHeader | 顶部导航栏 | progressText, engineReady, onToggleSidebar |
| ChatSidebar | 会话列表 | sessions, onSwitchSession, onDeleteSession |
| SuggestionCards | 建议卡片 | suggestions, onSelect |
| ChatMessages | 消息列表 | messages, loading |
| ChatComposer | 输入框 | input, onSend, onStop |
| SettingsModal | 设置弹窗 | engine, theme, onClose |

### 5. 主应用 (`src/App.tsx`)

重构后的App组件:
- 从1332行减少到约240行
- 清晰的组件组合
- 逻辑通过hooks封装
- 易于理解和维护

## 代码质量提升

### 前后对比

| 指标 | 重构前 | 重构后 | 提升 |
|-----|--------|--------|-----|
| 主文件行数 | 1332行 | ~240行 | 82% ↓ |
| 文件数量 | 1个 | 20+个 | 模块化 |
| 组件复用性 | 低 | 高 | ✓ |
| 可测试性 | 困难 | 容易 | ✓ |
| 可维护性 | 困难 | 容易 | ✓ |

### 优势

1. **模块化**: 每个功能独立成模块，易于定位和修改
2. **可复用**: 组件和hooks可在不同场景复用
3. **可测试**: 独立的函数和组件便于单元测试
4. **可读性**: 代码结构清晰，命名规范
5. **可扩展**: 新功能易于添加，不影响现有代码

## 使用指南

### 导入方式

#### 统一导入
```typescript
// 导入所有工具函数
import { uid, calculateSimilarity, checkContentQuality } from "./utils";

// 导入所有hooks
import { useLocalStorage, useEngine, useSession } from "./hooks";

// 导入所有组件
import { ChatHeader, ChatSidebar, ChatMessages } from "./components";
```

#### 单独导入
```typescript
// 导入特定工具
import { uid } from "./utils/uid";
import { detectDuplicate } from "./utils/similarity";

// 导入特定hook
import { useChat } from "./hooks/useChat";

// 导入特定组件
import ChatHeader from "./components/ChatHeader";
```

### 添加新功能

#### 添加新工具函数
1. 在 `src/utils/` 创建新文件
2. 在 `src/utils/index.ts` 中导出
3. 编写单元测试（推荐）

#### 添加新Hook
1. 在 `src/hooks/` 创建新文件
2. 在 `src/hooks/index.ts` 中导出
3. 在组件中使用

#### 添加新组件
1. 在 `src/components/` 创建新目录
2. 创建 `index.tsx` 和 `styles.css`
3. 在 `src/components/index.ts` 中导出
4. 在需要的地方使用

## 最佳实践

1. **类型优先**: 先定义类型，再编写实现
2. **单一职责**: 每个函数/组件只做一件事
3. **命名规范**: 使用清晰、描述性的命名
4. **避免重复**: 相同逻辑提取成共用函数
5. **Props验证**: 组件Props要有完整的类型定义
6. **注释说明**: 复杂逻辑添加注释说明

## 后续优化建议

1. **添加单元测试**: 为工具函数和hooks添加测试
2. **样式独立**: 将组件样式从全局CSS中分离
3. **错误边界**: 添加错误边界组件处理异常
4. **性能优化**: 使用React.memo优化组件渲染
5. **国际化**: 支持多语言
6. **主题系统**: 完善主题切换功能

## 总结

通过本次重构，项目代码质量得到显著提升，为后续开发和维护奠定了良好基础。新的架构更加清晰、模块化，符合现代前端开发的最佳实践。

