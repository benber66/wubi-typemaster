# 编码规范

> 本文档定义 WubiTypeMaster 项目的编码约定。

## 1. TypeScript

### 1.1 严格模式
`tsconfig.json` 启用：
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`
- `noUncheckedIndexedAccess: true`

### 1.2 命名约定
| 类型 | 约定 | 示例 |
|---|---|---|
| 变量、函数 | camelCase | `userName`, `getUserInfo` |
| 类、类型、接口 | PascalCase | `UserInfo`, `ITypingSession` |
| 常量 | UPPER_SNAKE_CASE | `MAX_PRACTICE_TIME` |
| 枚举值 | UPPER_SNAKE_CASE | `Mode.ARTICLE` |
| 文件名（组件） | PascalCase | `VirtualKeyboard.tsx` |
| 文件名（其他） | kebab-case | `wubi-lookup.ts` |
| 目录名 | kebab-case | `word-invaders/` |

### 1.3 导入顺序
使用 `eslint-plugin-import` 自动排序：
1. 外部包
2. `@/` 别名导入
3. 相对路径导入
4. 类型导入（`import type`）

### 1.4 避免
- ❌ `any`（必要时用 `unknown` + 类型守卫）
- ❌ 默认导出（组件除外）
- ❌ 嵌套超过 3 层
- ❌ 单文件超过 500 行（拆）

## 2. React

### 2.1 组件
- 函数组件 + Hooks
- 单文件不超过 200 行（不含样式）
- Props 用 `interface` 定义，不展开

### 2.2 Hooks
- 自定义 Hook 以 `use` 开头
- 单一职责
- 依赖数组必须完整

### 2.3 状态
- 局部状态用 `useState`
- 全局状态用 Zustand
- 派生状态用 `useMemo` 或计算

## 3. 样式

- Tailwind 优先
- 复杂组件使用 cva（class-variance-authority）
- 禁止内联 `style`（动画等动态值除外）

## 4. Git 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型：
- `feat`：新功能
- `fix`：修复
- `docs`：文档
- `style`：格式
- `refactor`：重构
- `test`：测试
- `chore`：构建/工具

示例：
```
feat(article): add WPM calculation

- Add calculateWpm function
- Add unit tests
- Update Article page to show live WPM
```

## 5. 目录结构约定

```
feature/
├── index.ts            # 公共导出
├── types.ts            # 类型定义
├── *.tsx               # 组件
├── *.ts                # 工具
├── *.test.ts           # 测试
└── README.md           # 复杂功能说明
```

## 6. 错误处理

- 不静默 catch
- 自定义错误类继承 `Error`
- 主进程错误记录到日志
- 用户可见错误用 toast/对话框
