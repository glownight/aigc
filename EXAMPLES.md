# 📚 代码示例和最佳实践

本文档提供了 AIGC 项目的代码示例和最佳实践指南。

---

## 📋 目录

- [组件示例](#组件示例)
- [Hook 示例](#hook-示例)
- [工具函数示例](#工具函数示例)
- [最佳实践](#最佳实践)
- [常见模式](#常见模式)
- [性能优化技巧](#性能优化技巧)

---

## 🎨 组件示例

### 基础组件

```typescript
/**
 * 按钮组件示例
 * 展示了组件的基本结构和最佳实践
 */
import { memo, useCallback } from 'react';
import './Button.css';

/**
 * 按钮组件的 Props 接口
 */
interface ButtonProps {
  /** 按钮文本 */
  label: string;
  /** 点击事件处理函数 */
  onClick: () => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 按钮类型 */
  variant?: 'primary' | 'secondary' | 'danger';
  /** 是否加载中 */
  loading?: boolean;
}

/**
 * 按钮组件
 * 
 * @example
 * ```tsx
 * <Button 
 *   label="提交" 
 *   onClick={handleSubmit}
 *   variant="primary"
 *   loading={isSubmitting}
 * />
 * ```
 */
const Button = memo<ButtonProps>(({ 
  label, 
  onClick, 
  disabled = false,
  variant = 'primary',
  loading = false,
}) => {
  // 处理点击事件
  const handleClick = useCallback(() => {
    if (!disabled && !loading) {
      onClick();
    }
  }, [onClick, disabled, loading]);

  return (
    <button
      className={`btn btn-${variant}`}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading ? <Spinner /> : label}
    </button>
  );
});

// 设置显示名称（用于调试）
Button.displayName = 'Button';

export default Button;
```

### 复杂组件

```typescript
/**
 * 消息列表组件示例
 * 展示了列表渲染和性能优化
 */
import { memo, useMemo, useCallback } from 'react';
import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
  onMessageDelete?: (id: string) => void;
  loading?: boolean;
}

const MessageList = memo<MessageListProps>(({ 
  messages, 
  onMessageDelete,
  loading = false,
}) => {
  // 过滤系统消息
  const visibleMessages = useMemo(() => {
    return messages.filter(m => m.role !== 'system');
  }, [messages]);

  // 删除消息处理
  const handleDelete = useCallback((id: string) => {
    if (onMessageDelete) {
      onMessageDelete(id);
    }
  }, [onMessageDelete]);

  return (
    <div className="message-list">
      {visibleMessages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          onDelete={handleDelete}
        />
      ))}
      {loading && <LoadingIndicator />}
    </div>
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;
```

---

## 🎣 Hook 示例

### 自定义 Hook 基础

```typescript
/**
 * 计数器 Hook 示例
 * 展示了 Hook 的基本结构
 */
import { useState, useCallback } from 'react';

/**
 * 计数器 Hook 返回值
 */
interface UseCounterReturn {
  /** 当前计数 */
  count: number;
  /** 增加计数 */
  increment: () => void;
  /** 减少计数 */
  decrement: () => void;
  /** 重置计数 */
  reset: () => void;
}

/**
 * 计数器 Hook
 * 
 * @param initialValue - 初始值，默认为 0
 * @returns 计数器状态和操作函数
 * 
 * @example
 * ```tsx
 * function Counter() {
 *   const { count, increment, decrement, reset } = useCounter(0);
 *   
 *   return (
 *     <div>
 *       <p>Count: {count}</p>
 *       <button onClick={increment}>+</button>
 *       <button onClick={decrement}>-</button>
 *       <button onClick={reset}>Reset</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useCounter(initialValue: number = 0): UseCounterReturn {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);

  const decrement = useCallback(() => {
    setCount(prev => prev - 1);
  }, []);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  return { count, increment, decrement, reset };
}
```

### 高级 Hook

```typescript
/**
 * 本地存储 Hook 示例
 * 展示了持久化状态管理
 */
import { useState, useEffect, useCallback } from 'react';

/**
 * 本地存储 Hook
 * 
 * @param key - localStorage 键名
 * @param initialValue - 初始值
 * @returns [value, setValue] 状态和设置函数
 * 
 * @example
 * ```tsx
 * function Settings() {
 *   const [theme, setTheme] = useLocalStorage('theme', 'dark');
 *   
 *   return (
 *     <select value={theme} onChange={e => setTheme(e.target.value)}>
 *       <option value="light">Light</option>
 *       <option value="dark">Dark</option>
 *     </select>
 *   );
 * }
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  // 从 localStorage 读取初始值
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('读取 localStorage 失败:', error);
      return initialValue;
    }
  });

  // 更新 localStorage
  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('写入 localStorage 失败:', error);
    }
  }, [key]);

  // 监听其他标签页的更改
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error('同步 localStorage 失败:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}
```

---

## 🛠️ 工具函数示例

### 纯函数

```typescript
/**
 * 生成唯一 ID
 * 
 * @returns 唯一字符串 ID
 * 
 * @example
 * ```typescript
 * const id = generateId(); // "abc123def"
 * ```
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * 防抖函数
 * 
 * @param fn - 要防抖的函数
 * @param delay - 延迟时间（毫秒）
 * @returns 防抖后的函数
 * 
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query: string) => {
 *   console.log('搜索:', query);
 * }, 300);
 * 
 * input.addEventListener('input', (e) => {
 *   debouncedSearch(e.target.value);
 * });
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * 节流函数
 * 
 * @param fn - 要节流的函数
 * @param limit - 限制时间（毫秒）
 * @returns 节流后的函数
 * 
 * @example
 * ```typescript
 * const throttledScroll = throttle(() => {
 *   console.log('滚动事件');
 * }, 100);
 * 
 * window.addEventListener('scroll', throttledScroll);
 * ```
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
```

### 复杂工具

```typescript
/**
 * 文本相似度计算
 * 使用 Levenshtein 距离算法
 * 
 * @param str1 - 第一个字符串
 * @param str2 - 第二个字符串
 * @returns 0-1 之间的相似度分数
 * 
 * @example
 * ```typescript
 * const similarity = calculateSimilarity('hello', 'hallo');
 * console.log(similarity); // 0.8
 * ```
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  
  if (maxLength === 0) return 1;
  
  return 1 - distance / maxLength;
}

/**
 * Levenshtein 距离算法
 * 计算两个字符串的编辑距离
 * 
 * @param str1 - 第一个字符串
 * @param str2 - 第二个字符串
 * @returns 编辑距离
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  // 初始化矩阵
  for (let i = 0; i <= str1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str2.length; j++) {
    matrix[0][j] = j;
  }

  // 计算距离
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // 替换
          matrix[i][j - 1] + 1,     // 插入
          matrix[i - 1][j] + 1      // 删除
        );
      }
    }
  }

  return matrix[str1.length][str2.length];
}
```

---

## ✅ 最佳实践

### 1. 组件设计

```typescript
// ✅ 好的做法
interface Props {
  // 明确的 Props 类型
  title: string;
  onSubmit: (data: FormData) => void;
  disabled?: boolean;
}

const Component = memo<Props>(({ title, onSubmit, disabled = false }) => {
  // 使用 useCallback 缓存函数
  const handleSubmit = useCallback(() => {
    onSubmit(data);
  }, [onSubmit, data]);

  // 使用 useMemo 缓存计算
  const processedData = useMemo(() => {
    return processData(data);
  }, [data]);

  return <div>{/* ... */}</div>;
});

// ❌ 避免的做法
const Component = (props: any) => {
  // 没有类型定义
  // 没有性能优化
  return <div>{/* ... */}</div>;
};
```

### 2. 状态管理

```typescript
// ✅ 使用 useState 的函数形式
setCount(prev => prev + 1);

// ❌ 直接设置值可能导致闭包问题
setCount(count + 1);

// ✅ 使用 useCallback 避免重新创建
const handleClick = useCallback(() => {
  doSomething();
}, [dependency]);

// ❌ 每次渲染都创建新函数
const handleClick = () => {
  doSomething();
};
```

### 3. 副作用处理

```typescript
// ✅ 正确的 useEffect 使用
useEffect(() => {
  const subscription = api.subscribe();
  
  return () => {
    subscription.unsubscribe();
  };
}, [dependency]);

// ❌ 缺少清理函数
useEffect(() => {
  api.subscribe();
}, []);
```

---

## 🎯 常见模式

### 条件渲染

```typescript
// ✅ 使用三元运算符
{isLoading ? <Spinner /> : <Content />}

// ✅ 使用 && 运算符
{error && <ErrorMessage message={error} />}

// ✅ 使用函数
{renderContent()}

// ❌ 避免复杂嵌套
{isLoading 
  ? <Spinner /> 
  : error 
    ? <Error /> 
    : data 
      ? <Content /> 
      : null
}
```

### 列表渲染

```typescript
// ✅ 使用稳定的 key
{items.map(item => (
  <Item key={item.id} data={item} />
))}

// ❌ 使用索引作为 key
{items.map((item, index) => (
  <Item key={index} data={item} />
))}

// ✅ 使用 memo 优化列表项
const Item = memo<ItemProps>(({ data }) => {
  return <div>{data.name}</div>;
});
```

### 表单处理

```typescript
// ✅ 受控组件
function Form() {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
      />
      <button type="submit">提交</button>
    </form>
  );
}
```

---

## ⚡ 性能优化技巧

### 1. 虚拟化长列表

```typescript
import { FixedSizeList } from 'react-window';

function VirtualList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      {items[index].content}
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

### 2. 懒加载组件

```typescript
import { lazy, Suspense } from 'react';

// 懒加载组件
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### 3. 避免不必要的渲染

```typescript
// 使用 React.memo
const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* 复杂的渲染 */}</div>;
}, (prevProps, nextProps) => {
  // 自定义比较函数
  return prevProps.data.id === nextProps.data.id;
});

// 使用 useMemo 缓存值
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.value - b.value);
}, [data]);

// 使用 useCallback 缓存函数
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);
```

---

## 📱 响应式设计

```typescript
// 使用 CSS 媒体查询
const Container = styled.div`
  width: 100%;
  
  @media (min-width: 768px) {
    max-width: 768px;
  }
  
  @media (min-width: 1024px) {
    max-width: 1024px;
  }
`;

// 使用 React Hook 检测屏幕尺寸
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = () => setMatches(media.matches);
    media.addListener(listener);

    return () => media.removeListener(listener);
  }, [query]);

  return matches;
}

// 使用
function Component() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return (
    <div>
      {isMobile ? <MobileLayout /> : <DesktopLayout />}
    </div>
  );
}
```

---

<div align="center">

**💡 持续更新中，欢迎贡献示例！**

[返回文档首页](README.zh-CN.md)

</div>

