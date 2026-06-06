# 测试规范

> 本文档定义 WubiTypeMaster 项目的测试策略和约定。

## 1. 测试金字塔

```
        ╱╲
       ╱  ╲         E2E（少量）
      ╱ E2E╲        关键场景 happy path
     ╱______╲
    ╱        ╲
   ╱ 集成测试 ╲      组件 + IPC + 数据库
  ╱____________╲
 ╱              ╲
╱    单元测试    ╲   纯函数、工具、算法
╱________________╲
```

## 2. 工具选型

| 类型 | 工具 | 备注 |
|---|---|---|
| 单元 / 集成 | Vitest | 启动快、API 与 Jest 兼容 |
| E2E | Playwright | 支持 Electron、原生并行 |
| 覆盖率 | @vitest/coverage-v8 | 内置 |
| 组件 | @testing-library/react | 行为驱动测试 |

## 3. 文件组织

### 3.1 测试文件位置
**就近原则**：测试文件与被测代码放在同一目录或集中目录：

```
src/lib/wubi/lookup.ts
tests/unit/lib/wubi-lookup.test.ts    # 集中目录
```

或：

```
src/lib/wubi/lookup.ts
src/lib/wubi/lookup.test.ts           # 就近
```

本项目采用**集中目录**（`tests/unit/`）。

### 3.2 命名约定
- 单元测试：`*.test.ts` 或 `*.spec.ts`
- E2E 测试：`*.spec.ts`（Playwright 默认）

## 4. 编写规范

### 4.1 单元测试
```typescript
import { describe, it, expect } from 'vitest';
import { calculateWpm } from '@/lib/typing/metrics';

describe('calculateWpm', () => {
  it('calculates WPM correctly for 60 chars in 1 minute', () => {
    expect(calculateWpm(60, 60_000)).toBe(60);
  });

  it('returns 0 for empty input', () => {
    expect(calculateWpm(0, 1000)).toBe(0);
  });
});
```

### 4.2 组件测试
```typescript
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Home } from '@/pages/Home';

describe('Home page', () => {
  it('renders 4 mode cards', () => {
    render(<Home />, { wrapper: ThemeProvider });
    expect(screen.getByText('文章跟打')).toBeInTheDocument();
  });
});
```

### 4.3 E2E 测试
```typescript
import { test, expect, _electron as electron } from '@playwright/test';

test('article mode: complete a short text', async () => {
  const app = await electron.launch({ args: ['.'] });
  const window = await app.firstWindow();
  await window.click('text=文章跟打');
  // ...
  await app.close();
});
```

## 5. 覆盖率要求

| 模块 | 最低覆盖率 | v0.1.1 实测 |
|---|---|---|
| `lib/wubi/lookup.ts` | 100% 行/语句/函数 | ✅ 100% / 100% / 100%（分支 85.34%） |
| `db/client.ts` | 80% 行 | ✅ 94.52%（分支 82.6%） |
| `lib/typing/` | 100% | 待 Phase 3 实施 |
| 业务组件 | 70% | 待 Phase 2+ 实施 |
| UI 通用组件 | 50% | 待 Phase 2+ 实施 |
| 整体 | 60% | 待 Phase 2+ |

### 5.1 双实现一致性测试

`lookup.ts` 提供内存 + DB 双实现（`createLookupFromJson` / `createLookup`），
共享同一组 39 个单元测试覆盖逻辑路径，外加 29 个集成测试验证 DB 实现。
任何逻辑修改必须保证两组测试同时通过。

## 6. 跑测试

```bash
# 单元 + 集成
pnpm test

# E2E
pnpm test:e2e

# 覆盖率
pnpm test:coverage

# 监听模式
pnpm test:watch
```

## 7. CI 集成

CI 中：
- PR / push main → 跑 unit + integration
- PR 需 label `run-e2e` → 才跑 E2E（避免资源浪费）

## 8. 写测试的时机

**TDD 优先**：写测试 → 写实现 → 重构。

但对 UI 细节和样式，可采用"实现 + 关键路径测试"模式。
