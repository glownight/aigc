# 🤝 贡献指南

感谢你考虑为 AIGC 项目做出贡献！本文档提供了参与项目开发的指南和最佳实践。

---

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [测试指南](#测试指南)
- [文档规范](#文档规范)

---

## 📜 行为准则

### 我们的承诺

为了营造一个开放和友好的环境，我们承诺：

- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

---

## 🎯 如何贡献

### 报告 Bug

在提交 Bug 之前，请：

1. **检查现有 Issues** - 确保问题未被报告
2. **使用最新版本** - 确认问题在最新版本中仍然存在
3. **提供详细信息** - 包括复现步骤、截图、环境信息

**Bug 报告模板**:

```markdown
### 问题描述
简要描述问题...

### 复现步骤
1. 打开应用
2. 点击 XXX
3. 看到错误

### 预期行为
应该显示 XXX

### 实际行为
实际显示 XXX

### 环境信息
- 浏览器: Chrome 120
- 操作系统: Windows 11
- 版本: v1.0.0

### 截图
如果适用，添加截图
```

### 建议新功能

提交功能建议时，请：

1. **清晰描述** - 详细说明功能和用例
2. **解释价值** - 为什么这个功能有用
3. **提供示例** - 如何使用这个功能

**功能建议模板**:

```markdown
### 功能描述
我希望能够...

### 使用场景
当用户想要 XXX 时...

### 建议的实现方式
可以通过 XXX 方式实现...

### 替代方案
也可以考虑 XXX...

### 附加信息
其他相关信息...
```

---

## 🔧 开发流程

### 1. Fork 和 Clone

```bash
# Fork 仓库到你的账号
# 然后 clone 到本地
git clone https://github.com/YOUR_USERNAME/aigc.git
cd aigc
```

### 2. 创建分支

```bash
# 从 master 创建新分支
git checkout -b feature/my-new-feature

# 分支命名规范:
# feature/xxx  - 新功能
# fix/xxx      - Bug 修复
# docs/xxx     - 文档更新
# refactor/xxx - 重构
# test/xxx     - 测试相关
# chore/xxx    - 构建/工具相关
```

### 3. 安装依赖

```bash
# 安装项目依赖
npm install

# 如果需要，运行环境配置
npm run setup:env
```

### 4. 开发

```bash
# 启动开发服务器
npm run dev

# 在浏览器打开 http://localhost:5177
```

### 5. 提交更改

```bash
# 添加更改
git add .

# 提交（遵循提交规范）
git commit -m "feat: add amazing feature"

# 推送到你的 fork
git push origin feature/my-new-feature
```

### 6. 创建 Pull Request

1. 访问你的 fork 仓库
2. 点击 "Pull Request"
3. 填写 PR 描述
4. 等待审核

---

## 📝 代码规范

### TypeScript 规范

#### 1. 类型定义

```typescript
// ✅ 好的做法
interface UserProps {
  name: string;
  age: number;
  email?: string;
}

const user: UserProps = {
  name: 'John',
  age: 30,
};

// ❌ 避免使用 any
const data: any = getData();  // 不好

// ✅ 使用具体类型
const data: User = getData();  // 好
```

#### 2. 函数定义

```typescript
// ✅ 使用 JSDoc 注释
/**
 * 计算两个数的和
 * @param a 第一个数
 * @param b 第二个数
 * @returns 两数之和
 */
function add(a: number, b: number): number {
  return a + b;
}
```

#### 3. React 组件

```typescript
// ✅ 使用 memo 和类型
import { memo } from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const Button = memo<ButtonProps>(({ label, onClick, disabled = false }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
});

export default Button;
```

### 命名规范

```typescript
// 组件名: PascalCase
const MyComponent = () => {};

// 变量/函数名: camelCase
const userName = 'John';
const getUserName = () => {};

// 常量: UPPER_SNAKE_CASE
const API_URL = 'https://api.example.com';
const MAX_RETRIES = 3;

// 类型/接口: PascalCase
interface UserData {}
type UserId = string;

// 文件名:
// - 组件: PascalCase (MyComponent.tsx)
// - 工具: camelCase (utils.ts)
// - Hook: camelCase (useMyHook.ts)
```

### CSS 规范

```css
/* BEM 命名规范 */
.component {}
.component__element {}
.component--modifier {}

/* 使用 CSS 变量 */
.button {
  background: var(--color-primary);
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
}

/* 避免深层嵌套 */
/* ❌ 不好 */
.parent .child .grandchild .great-grandchild {}

/* ✅ 好 */
.great-grandchild {}
```

---

## 💬 提交规范

### Commit Message 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关
- `revert`: 回退

### 示例

```bash
# 新功能
git commit -m "feat(chat): add message export function"

# Bug 修复
git commit -m "fix(api): resolve timeout issue"

# 文档
git commit -m "docs(readme): update installation guide"

# 性能优化
git commit -m "perf(rendering): optimize message list rendering"

# 详细的提交消息
git commit -m "feat(chat): add message export

- Add export to JSON functionality
- Add export to Markdown functionality
- Add export button to chat header

Closes #123"
```

---

## 🧪 测试指南

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- MyComponent

# 生成覆盖率报告
npm test -- --coverage
```

### 编写测试

```typescript
// MyComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles click event', () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

---

## 📚 文档规范

### JSDoc 注释

```typescript
/**
 * 用户管理类
 * 
 * @example
 * ```typescript
 * const manager = new UserManager();
 * const user = await manager.getUser('123');
 * ```
 */
class UserManager {
  /**
   * 获取用户信息
   * 
   * @param userId - 用户ID
   * @param options - 可选配置
   * @returns Promise<User> 用户对象
   * @throws {NotFoundError} 用户不存在时抛出
   * 
   * @example
   * ```typescript
   * const user = await manager.getUser('123', { cache: true });
   * console.log(user.name);
   * ```
   */
  async getUser(userId: string, options?: GetUserOptions): Promise<User> {
    // 实现...
  }
}
```

### README 更新

更新功能时，记得同步更新 README：

- 功能列表
- 使用示例
- API 文档
- 配置说明

---

## ✅ Pull Request 检查清单

提交 PR 前，请确保：

- [ ] 代码遵循项目规范
- [ ] 添加了必要的注释
- [ ] 更新了相关文档
- [ ] 添加了测试用例（如适用）
- [ ] 所有测试通过
- [ ] 没有 TypeScript 错误
- [ ] 没有 ESLint 警告
- [ ] Commit message 符合规范
- [ ] PR 描述清晰完整

### PR 描述模板

```markdown
## 变更类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 性能优化
- [ ] 重构
- [ ] 文档更新

## 变更说明
简要描述你的更改...

## 相关 Issue
Closes #123

## 测试
如何测试这些更改...

## 截图
如果适用，添加截图

## 检查清单
- [ ] 代码遵循规范
- [ ] 添加了测试
- [ ] 更新了文档
```

---

## 🎓 学习资源

### 项目相关

- [React 官方文档](https://react.dev/)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [Vite 文档](https://vitejs.dev/)
- [WebLLM 文档](https://github.com/mlc-ai/web-llm)

### 最佳实践

- [React 性能优化](https://react.dev/learn/render-and-commit)
- [TypeScript 最佳实践](https://typescript-cheatsheets.github.io/)
- [Git 提交规范](https://www.conventionalcommits.org/)

---

## 💡 开发技巧

### 性能分析

```javascript
// 查看性能摘要
window.getPerformanceSummary();

// 查看打包分析
// npm run build 后打开 dist/stats.html
```

### 调试技巧

```typescript
// 使用 debugger
function myFunction() {
  debugger; // 浏览器会在此暂停
  // ...
}

// 条件断点
console.log('Debug:', { data });

// React DevTools
// 安装浏览器扩展进行组件调试
```

---

## 🙋 获取帮助

遇到问题？可以通过以下方式获取帮助：

1. **查看文档**: 阅读 README 和相关文档
2. **搜索 Issues**: 查看是否有类似问题
3. **提问**: 在 Discussions 中提问
4. **联系维护者**: 通过 Issues 联系

---

## 🎉 成为贡献者

成功合并 PR 后，你将：

- 出现在贡献者列表中
- 获得项目徽章
- 成为社区的一员

感谢你的贡献！🙏

---

<div align="center">

**Happy Coding! 🚀**

</div>

