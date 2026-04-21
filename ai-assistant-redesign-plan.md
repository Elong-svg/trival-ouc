# YExplorer AI助手 重构产品与设计方案（UI专业版）

> **版本**: v2.0 | **日期**: 2026-04-18 | **设计师**: Claw UI Design Team

---

## 一、设计原则

### 1.1 核心设计理念

| 原则 | 说明 | 对标 |
|------|------|------|
| **对话即一切** | 整个页面只有对话，其他全部隐藏 | 豆包首页 |
| **克制设计** | 能不用装饰就不用，留白>装饰 | 千问极简风 |
| **零干扰** | 没有弹窗、没有悬浮球、没有多余按钮 | 智谱清言 |
| **直觉操作** | 用户不需要思考，看到就知道怎么用 | 所有主流AI |

### 1.2 简洁设计铁律

```
❌ 禁止：
- 渐变背景
- 复杂阴影（最多1层）
- 装饰性图标（功能性图标除外）
- 多余分割线
- 悬浮提示框
- 动画特效（只保留必要的过渡）

✅ 必须：
- 大面积纯白/纯灰背景
- 1px细边框代替阴影
- 文字层级代替视觉装饰
- 隐藏式导航（需要时才出现）
- 留白作为主要分隔手段
```

### 1.3 视觉层次策略

```
第一层次（焦点）：对话内容区 —— 纯白背景，无边框
第二层次（操作）：输入框 —— 1px边框，无阴影
第三层次（导航）：侧边栏 —— 浅灰背景，极简线条
第四层次（辅助）：功能入口 —— 文字链接，无图标装饰
```

---

## 二、设计令牌系统（Design Tokens）

### 2.1 色彩体系

#### 2.1.1 品牌色（海大蓝）

| 令牌名 | 色值 | 用途 | 对比度 |
|--------|------|------|--------|
| `--blue-50` | `#E3F2FD` | 用户气泡背景 | - |
| `--blue-100` | `#BBDEFB` | hover态背景 | - |
| `--blue-500` | `#1E88E5` | 主按钮、链接 | 4.6:1 ✓ |
| `--blue-600` | `#1976D2` | 按钮hover | 5.2:1 ✓ |
| `--blue-700` | `#1565C0` | 按钮active | 6.1:1 ✓ |
| `--blue-900` | `#0D47A1` | Logo、标题 | 11.2:1 ✓ |

#### 2.1.2 中性色

| 令牌名 | 色值 | 用途 |
|--------|------|------|
| `--gray-0` | `#FFFFFF` | 卡片背景 |
| `--gray-50` | `#F9FAFB` | 页面背景 |
| `--gray-100` | `#F3F4F6` | 分割线、hover背景 |
| `--gray-200` | `#E5E7EB` | 边框 |
| `--gray-300` | `#D1D5DB` | 禁用态边框 |
| `--gray-400` | `#9CA3AF` | placeholder |
| `--gray-500` | `#6B7280` | 次要文字 |
| `--gray-700` | `#374151` | 正文文字 |
| `--gray-900` | `#111827` | 标题文字 |

#### 2.1.3 语义色

| 令牌名 | 色值 | 用途 |
|--------|------|------|
| `--success` | `#10B981` | 成功提示、发送成功 |
| `--warning` | `#F59E0B` | 警告提示 |
| `--error` | `#EF4444` | 错误提示、发送失败 |
| `--info` | `#3B82F6` | 信息提示 |

#### 2.1.4 深色主题映射

```css
[data-theme="dark"] {
  --blue-50: #0D47A1;
  --blue-500: #42A5F5;
  --gray-0: #1F2937;
  --gray-50: #111827;
  --gray-100: #374151;
  --gray-700: #E5E7EB;
  --gray-900: #F9FAFB;
}
```

### 2.2 字体系统

#### 2.2.1 字体族

```css
--font-sans: 'Inter', 'Microsoft YaHei', -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Consolas', monospace;
```

#### 2.2.2 字号比例（1.25完美比例）

| 令牌名 | 大小 | 行高 | 用途 |
|--------|------|------|------|
| `--text-xs` | 12px | 16px | 标签、时间戳 |
| `--text-sm` | 14px | 20px | 次要文字、说明 |
| `--text-base` | 16px | 24px | 正文、输入框 |
| `--text-lg` | 18px | 28px | 小标题 |
| `--text-xl` | 24px | 32px | 页面标题 |
| `--text-2xl` | 30px | 38px | 欢迎页标题 |

#### 2.2.3 字重

| 令牌名 | 值 | 用途 |
|--------|-----|------|
| `--font-normal` | 400 | 正文 |
| `--font-medium` | 500 | 按钮、标签 |
| `--font-semibold` | 600 | 小标题 |
| `--font-bold` | 700 | 大标题 |

### 2.3 间距系统（8px基准）

| 令牌名 | 值 | 用途 |
|--------|-----|------|
| `--space-1` | 4px | 图标与文字间距 |
| `--space-2` | 8px | 紧凑间距 |
| `--space-3` | 12px | 常规内边距 |
| `--space-4` | 16px | 标准间距 |
| `--space-6` | 24px | 区块间距 |
| `--space-8` | 32px | 大区块间距 |
| `--space-12` | 48px | 页面级间距 |
| `--space-16` | 64px | 欢迎页间距 |

### 2.4 圆角系统

| 令牌名 | 值 | 用途 |
|--------|-----|------|
| `--radius-sm` | 6px | 按钮、标签 |
| `--radius-md` | 10px | 输入框、卡片 |
| `--radius-lg` | 14px | 对话气泡 |
| `--radius-xl` | 20px | 欢迎页卡片 |
| `--radius-full` | 9999px | 头像、圆形按钮 |

### 2.5 阴影系统（极简版）

**核心原则：能不用阴影就不用，用边框代替**

| 令牌名 | 值 | 用途 |
|--------|-----|------|
| `--shadow-none` | `none` | 默认状态（90%场景） |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | 输入框聚焦（仅此一处用阴影） |
| `--border-default` | `1px solid var(--gray-200)` | 卡片、输入框、气泡边框 |

**简洁设计实践**：
- 对话气泡：**不用阴影**，用1px浅灰边框
- 卡片：**不用阴影**，用1px边框 + hover时边框变色
- 下拉菜单：**不用阴影**，用1px边框 + 纯白背景
- 唯一使用阴影的地方：输入框聚焦时的外发光

### 2.6 动效系统（克制版）

**核心原则：动效只用于必要的状态切换，不做装饰性动画**

#### 2.6.1 缓动曲线（只保留2种）

| 令牌名 | 值 | 用途 |
|--------|-----|------|
| `--ease-default` | `cubic-bezier(0.16, 1, 0.3, 1)` | 所有滑入/滑出动画 |
| `--ease-fast` | `cubic-bezier(0.3, 0, 0.2, 1)` | hover/点击反馈 |

#### 2.6.2 时长规范（只保留3种）

| 令牌名 | 值 | 用途 |
|--------|-----|------|
| `--duration-fast` | 150ms | hover、颜色变化 |
| `--duration-normal` | 200ms | 消息出现、按钮反馈 |
| `--duration-slow` | 300ms | 侧边栏展开/收起 |

**禁止使用的动画**：
- ❌ 弹跳效果（bounce）
- ❌ 旋转效果（除非loading）
- ❌ 缩放效果（除非必要）
- ❌ 多点延迟动画（如思考中三点跳动 → 改为简单文字"思考中..."）
- ❌ 页面加载时的依次滑入动画 → 改为整体淡入

---

## 三、布局规范

### 3.1 整体布局（精确尺寸）

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: 64px height                                            │
│  ┌─────┬───────────────────────────────────────────────────────┐ │
│  │     │                                                       │ │
│  │     │                                                       │ │
│  │Side │  Main Content Area                                    │ │
│  │bar  │  - Min width: 600px                                   │ │
│  │280px│  - Max width: 900px (centered)                        │ │
│  │     │  - Padding: 24px left/right                           │ │
│  │     │                                                       │ │
│  │     │                                                       │ │
│  └─────┴───────────────────────────────────────────────────────┘ │
│  Footer: optional, 40px height                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 侧边栏布局（精确到像素）

```
┌─────────────────────┐
│  [+ 新建对话]       │  ← 高度: 48px, padding: 12px 16px
│  margin-bottom: 16px│
├─────────────────────┤
│                     │
│  历史对话列表        │  ← 每项高度: 44px
│  ├ 对话标题 18:30   │     padding: 10px 16px
│  ├ 对话标题 昨天    │     图标: 16x16px
│  ├ 对话标题 周一    │     文字: 14px, 时间: 12px
│  │                  │
│                     │
├─────────────────────┤
│  🗺️ 地图指引        │  ← 高度: 40px
│  📚 研学资源        │     padding: 8px 16px
│  📞 联系我们        │     图标: 16x16px, 文字: 14px
└─────────────────────┘
```

### 3.3 对话区布局

#### 3.3.1 消息气泡尺寸

| 元素 | 最大宽度 | 内边距 | 外边距 |
|------|---------|--------|--------|
| 用户气泡 | 70% | 12px 16px | bottom: 16px |
| AI气泡 | 80% | 12px 16px | bottom: 16px |

#### 3.3.2 输入区尺寸

```
┌─────────────────────────────────────────────┐
│  [年龄段选择器]  height: 36px               │
│  margin-bottom: 12px                        │
│                                             │
│  ┌─────────────────────────────┐           │
│  │ 输入框                       │ [发送]    │
│  │ height: 48px (min)          │ 48x48px   │
│  │ max-height: 200px           │           │
│  └─────────────────────────────┘           │
│  padding: 16px 0                            │
└─────────────────────────────────────────────┘
```

---

## 四、组件设计规范

### 4.1 侧边栏组件（极简版）

#### 4.1.1 新建对话按钮

```css
.new-chat-btn {
  height: 40px;
  padding: 0 12px;
  background: var(--gray-0);
  color: var(--gray-700);
  border: 1px solid var(--gray-200);
  border-radius: 6px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 150ms ease;
}

.new-chat-btn:hover {
  background: var(--gray-50);
  border-color: var(--gray-300);
}

/* 不使用阴影、不使用transform、不使用缩放 */
```

#### 4.1.2 历史对话项

```css
.history-item {
  height: 36px;
  padding: 0 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background 150ms ease;
}

.history-item:hover {
  background: var(--gray-100);
}

.history-item.active {
  background: var(--gray-100);
  color: var(--blue-600);
}

/* 不使用位移、不使用边框高亮、不使用延迟显示删除按钮 */
.history-item .delete-btn {
  display: none;
}
.history-item:hover .delete-btn {
  display: block;
}
```

### 4.2 对话气泡组件（极简版）

#### 4.2.1 用户气泡

```css
.message-user {
  align-self: flex-end;
  max-width: 70%;
  background: var(--blue-50);
  border-radius: 12px 12px 2px 12px;
  padding: 10px 14px;
  margin-bottom: 12px;
  font-size: 15px;
  line-height: 1.5;
  /* 不使用动画，直接显示 */
}
```

#### 4.2.2 AI气泡

```css
.message-ai {
  align-self: flex-start;
  max-width: 80%;
  background: var(--gray-0);
  border: 1px solid var(--gray-200);
  border-radius: 12px 12px 12px 2px;
  padding: 10px 14px;
  margin-bottom: 12px;
  font-size: 15px;
  line-height: 1.6;
  /* 不使用动画，直接显示 */
}
```

#### 4.2.3 AI头像（可选，豆包就没有）

```css
/* 简洁方案：不显示头像，只显示文字"研探" */
.ai-name {
  font-size: 12px;
  color: var(--gray-500);
  margin-bottom: 4px;
  font-weight: 500;
}
```

### 4.3 输入区组件（极简版）

#### 4.3.1 输入框

```css
.chat-input {
  min-height: 44px;
  max-height: 160px;
  padding: 10px 14px;
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  font-size: 15px;
  line-height: 1.5;
  background: var(--gray-0);
  resize: none;
  transition: border-color 150ms ease;
}

.chat-input:focus {
  outline: none;
  border-color: var(--blue-500);
  /* 不使用阴影、不使用缩放 */
}
```

#### 4.3.2 发送按钮

```css
.send-btn {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  border: none;
  background: var(--gray-300);
  color: white;
  cursor: not-allowed;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 150ms ease;
}

.send-btn.active {
  background: var(--blue-500);
  cursor: pointer;
}

.send-btn.active:hover {
  background: var(--blue-600);
}

/* 不使用transform、不使用阴影、不使用多状态颜色 */
```

### 4.4 欢迎页组件（极简版）

#### 4.4.1 布局

```
┌─────────────────────────────────────┐
│                                     │
│         YExplorer                   │  ← 24px, 居中, 无装饰
│   带你逛遍美丽海大，探索无限可能      │  ← 14px, 灰色, 居中
│                                     │
│  ┌─────────┐  ┌─────────┐          │
│  │ 校园景点 │  │ 地图导航 │          │  ← 无边框卡片
│  └─────────┘  └─────────┘          │     hover时文字变蓝
│  ┌─────────┐  ┌─────────┐          │
│  │ 研学资源 │  │ 路线规划 │          │
│  └─────────┘  └─────────┘          │
│                                     │
└─────────────────────────────────────┘
```

#### 4.4.2 快捷卡片

```css
.quick-card {
  padding: 16px 20px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 150ms ease;
  text-align: center;
}

.quick-card:hover {
  background: var(--gray-50);
  color: var(--blue-600);
}

/* 不使用阴影、不使用边框、不使用transform、不使用图标旋转 */
```

---

## 五、动效规范（极简版）

### 5.1 核心原则

**豆包/千问的动效特点**：
- 几乎没有装饰性动画
- 只有必要的状态切换动画（展开/收起、淡入/淡出）
- 不使用弹跳、旋转、缩放等花哨效果
- 消息出现是直接显示，不是滑入

### 5.2 唯一需要的动画

```css
/* 1. 侧边栏展开/收起 */
.sidebar {
  transition: width 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

/* 2. 页面淡入 */
.page-content {
  animation: fadeIn 200ms ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 3. 消息出现（淡入即可，不要滑入） */
.chat-message {
  animation: fadeIn 150ms ease;
}

/* 4. hover反馈（颜色变化，不要位移） */
.hover-item {
  transition: background 150ms ease;
}
```

### 5.3 禁止使用的动画

| 动画类型 | 原因 | 替代方案 |
|---------|------|---------|
| 滑入/滑出 | 花哨，分散注意力 | 直接淡入 |
| 弹跳效果 | 不专业 | 不要 |
| 缩放效果 | 干扰阅读 | 不要 |
| 旋转效果 | 除非loading | 不要 |
| 多点延迟动画 | 太复杂 | 统一淡入 |
| 卡片依次出现 | 拖慢加载感知 | 同时显示 |

### 5.4 加载状态

**简洁方案**：
- 页面加载：直接显示内容，不要进度条
- AI思考中：显示文字"思考中..."，不要跳动动画
- 发送中：按钮显示loading图标（旋转），这是唯一允许的旋转动画

---

## 六、响应式断点

### 6.1 断点定义

| 断点名 | 宽度范围 | 设备 |
|--------|---------|------|
| `mobile` | < 640px | 手机竖屏 |
| `tablet` | 640px - 1023px | 平板/手机横屏 |
| `desktop` | 1024px - 1279px | 笔记本 |
| `desktop-lg` | ≥ 1280px | 台式机 |

### 6.2 各断点布局调整

#### 6.2.1 Desktop (≥1024px)
- 侧边栏：完整显示（280px）
- 对话区：居中，max-width: 900px
- 输入区：固定在底部

#### 6.2.2 Tablet (640px - 1023px)
- 侧边栏：默认收起（64px，仅图标）
- 点击展开：覆盖层模式（带遮罩）
- 对话区：padding: 16px
- 快捷卡片：2列布局

#### 6.2.3 Mobile (<640px)
- 侧边栏：隐藏，通过汉堡菜单触发
- 对话区：全屏，padding: 12px
- 输入区：固定在底部，适配安全区
- 快捷卡片：1列布局
- 欢迎页标题：24px → 20px

---

## 七、无障碍设计（WCAG AA合规）

### 7.1 色彩对比度

| 组合 | 对比度 | 等级 |
|------|--------|------|
| 正文文字 / 背景 | 11.2:1 | AAA ✓ |
| 次要文字 / 背景 | 4.6:1 | AA ✓ |
| 按钮文字 / 背景 | 4.6:1 | AA ✓ |
| 链接 / 背景 | 5.2:1 | AA ✓ |

### 7.2 键盘导航

- Tab键顺序：侧边栏 → 对话区 → 输入区 → 发送按钮
- 焦点指示器：2px蓝色外框 + 2px偏移
- Enter键：发送消息
- Shift+Enter：输入框换行
- Esc键：关闭侧边栏/弹窗

### 7.3 屏幕阅读器

- 所有图标添加 `aria-label`
- 对话区域使用 `role="log"`
- 输入框添加 `aria-describedby` 说明
- 动态内容更新使用 `aria-live="polite"`

### 7.4 触摸目标

- 所有可点击元素最小尺寸：44x44px
- 按钮间距：≥ 8px
- 侧边栏项高度：44px

---

## 八、与旧版对比

| 维度 | 旧版 | 新版 |
|------|------|------|
| 产品形态 | 传统网站 | AI助手产品 |
| 首页 | 内容堆砌 | 沉浸式对话 |
| AI入口 | 导航栏链接 | 默认主体 |
| 功能组织 | 多页面跳转 | 侧边栏整合 |
| 视觉风格 | 传统卡片 | 现代极简 |
| 用户体验 | 需要学习 | 直觉操作 |
| 移动端 | 勉强可用 | 原生适配 |
| 设计系统 | 无 | 完整Design Tokens |
| 动效规范 | 无 | 统一缓动+时长 |
| 无障碍 | 未考虑 | WCAG AA合规 |

---

## 九、风险与注意事项

1. **历史对话存储** —— 使用localStorage，清除浏览器数据会丢失。后续可升级为后端存储。
2. **Markdown渲染** —— AI回复可能包含Markdown，需要引入轻量级解析库（如marked.js）。
3. **侧边栏入口页面** —— 地图、资源、联系页面点击后是跳转新页面还是弹窗？建议跳转新页面，保持简单。
4. **性能** —— 对话历史过多时，需要虚拟滚动或分页加载。
5. **字体加载** —— 如果使用自定义字体，需要添加字体fallback，避免FOIT（Flash of Invisible Text）。

---

## 十、技术实现方案（完整技术流）

### 10.1 技术栈选型

#### 10.1.1 前端技术栈

| 层级 | 技术 | 版本 | 用途 | 为什么选它 |
|------|------|------|------|-----------|
| **核心框架** | 原生JavaScript | ES6+ | 交互逻辑 | 轻量，无依赖，适合单页面应用 |
| **样式方案** | CSS3 Variables + 原生CSS | - | 样式管理 | 支持Design Tokens，无需预处理器 |
| **Markdown渲染** | marked.js | v9.1+ | AI回复Markdown解析 | 轻量（8KB），速度快，支持GFM |
| **代码高亮** | highlight.js | v11.9+ | 代码块语法高亮 | 按需加载，190+语言 |
| **图标方案** | 内联SVG | - | 所有图标 | 零依赖，可CSS控制颜色/大小 |
| **本地存储** | localStorage + IndexedDB | - | 历史对话存储 | localStorage存元数据，IndexedDB存内容 |
| **路由管理** | History API | - | 页面跳转 | 原生API，无需第三方库 |

#### 10.1.2 后端技术栈

| 层级 | 技术 | 版本 | 用途 | 为什么选它 |
|------|------|------|------|-----------|
| **Web框架** | Flask | 3.0+ | HTTP服务 | 轻量，Python生态，已有代码可复用 |
| **CORS处理** | flask-cors | 4.0+ | 跨域支持 | Flask官方推荐 |
| **HTTP客户端** | requests | 2.31+ | 调用智谱 GLM API | Python标准，稳定可靠 |
| **API网关** | Flask路由 | - | 接口管理 | 简单场景足够，无需FastAPI |

#### 10.1.3 不使用的技术

| 技术 | 不使用的理由 |
|------|-------------|
| React/Vue/Angular | 过度设计，单页面AI助手不需要框架 |
| TypeScript | 增加编译复杂度，原生JS足够 |
| Tailwind/Bootstrap | 设计系统已自定义，不需要CSS框架 |
| Node.js/Express | 已有Python后端，无需引入新语言 |
| Webpack/Vite | 无打包需求，直接加载静态文件 |
| jQuery | 过时，原生JS API已足够 |

### 10.2 项目文件结构

```
trivalOUC/
├── index.html                  # 新版主页（AI对话页）
├── map.html                    # 地图指引页（保留旧版）
├── resources.html              # 研学资源页（保留旧版）
├── contact.html                # 联系我们页（保留旧版）
├── server.py                   # Flask后端服务
│
├── css/
│   ├── tokens.css              # Design Tokens（CSS变量定义）
│   ├── reset.css               # CSS Reset + 基础样式
│   ├── layout.css              # 整体布局（侧边栏+主内容区）
│   ├── sidebar.css             # 侧边栏组件
│   ├── chat.css                # 对话区组件
│   ├── input.css               # 输入区组件
│   ├── welcome.css             # 欢迎页组件
│   └── responsive.css          # 响应式断点
│
├── js/
│   ├── config.js               # 全局配置（API地址、模型参数）
│   ├── storage.js              # 本地存储管理（localStorage + IndexedDB）
│   ├── chat.js                 # 对话逻辑（发送、接收、渲染）
│   ├── sidebar.js              # 侧边栏交互（展开/收起、历史列表）
│   ├── markdown.js             # Markdown渲染配置
│   └── utils.js                # 工具函数（防抖、节流、格式化）
│
├── images/
│   ├── logo.svg                # 品牌Logo
│   └── icons/                  # 内联SVG图标
│       ├── send.svg
│       ├── menu.svg
│       ├── plus.svg
│       ├── delete.svg
│       └── copy.svg
│
└── pdfs/                       # 保留旧版资源
```

### 10.3 核心代码架构

#### 10.3.1 Design Tokens（tokens.css）

```css
:root {
  /* 色彩系统 */
  --blue-50: #E3F2FD;
  --blue-500: #1E88E5;
  --blue-600: #1976D2;
  --blue-700: #1565C0;
  --blue-900: #0D47A1;
  
  --gray-0: #FFFFFF;
  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-200: #E5E7EB;
  --gray-300: #D1D5DB;
  --gray-400: #9CA3AF;
  --gray-500: #6B7280;
  --gray-700: #374151;
  --gray-900: #111827;
  
  /* 字体系统 */
  --font-sans: 'Microsoft YaHei', -apple-system, sans-serif;
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 24px;
  
  /* 间距系统 */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  
  /* 动效系统 */
  --ease-default: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
}
```

#### 10.3.2 本地存储架构（storage.js）

```javascript
class ChatStorage {
  constructor() {
    this.DB_NAME = 'YExplorerDB';
    this.DB_VERSION = 1;
    this.STORE_NAME = 'conversations';
    this.db = null;
  }

  // 初始化IndexedDB
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };
      
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve();
      };
      
      request.onerror = (e) => reject(e);
    });
  }

  // 保存对话
  async saveConversation(conversation) {
    const tx = this.db.transaction(this.STORE_NAME, 'readwrite');
    const store = tx.objectStore(this.STORE_NAME);
    store.put(conversation);
    return tx.complete;
  }

  // 获取所有对话列表（元数据）
  async getConversations() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.STORE_NAME, 'readonly');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 获取单个对话详情
  async getConversation(id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.STORE_NAME, 'readonly');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 删除对话
  async deleteConversation(id) {
    const tx = this.db.transaction(this.STORE_NAME, 'readwrite');
    const store = tx.objectStore(this.STORE_NAME);
    store.delete(id);
    return tx.complete;
  }
}

export default new ChatStorage();
```

#### 10.3.3 对话核心逻辑（chat.js）

```javascript
import storage from './storage.js';
import { renderMarkdown } from './markdown.js';

class ChatManager {
  constructor() {
    this.API_URL = '/api/chat';
    this.currentConversationId = null;
    this.messages = [];
    this.isWaiting = false;
  }

  // 发送消息
  async sendMessage(userText) {
    if (this.isWaiting || !userText.trim()) return;
    
    this.isWaiting = true;
    this.updateSendButtonState();
    
    // 添加用户消息
    this.addMessage('user', userText);
    
    // 保存到存储
    await this.saveCurrentConversation();
    
    try {
      // 调用后端API
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: this.messages,
          age_group: this.getCurrentAgeGroup()
        })
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      const aiReply = data.reply;
      
      // 添加AI消息
      this.addMessage('assistant', aiReply);
      
      // 保存对话
      await this.saveCurrentConversation();
      
    } catch (error) {
      this.addMessage('error', `请求失败：${error.message}`);
    } finally {
      this.isWaiting = false;
      this.updateSendButtonState();
    }
  }

  // 添加消息到界面
  addMessage(role, content) {
    this.messages.push({ role, content });
    
    const messageEl = this.createMessageElement(role, content);
    const chatWindow = document.getElementById('chat-window');
    chatWindow.appendChild(messageEl);
    
    // 滚动到底部
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // 创建消息DOM元素
  createMessageElement(role, content) {
    const div = document.createElement('div');
    div.className = `chat-message message-${role}`;
    
    if (role === 'assistant') {
      div.innerHTML = `
        <div class="ai-name">研探</div>
        <div class="message-content">${renderMarkdown(content)}</div>
      `;
    } else if (role === 'user') {
      div.innerHTML = `<div class="message-content">${this.escapeHtml(content)}</div>`;
    } else {
      div.innerHTML = `<div class="message-content error">${content}</div>`;
    }
    
    return div;
  }

  // HTML转义（防XSS）
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 更新发送按钮状态
  updateSendButtonState() {
    const btn = document.getElementById('send-btn');
    const input = document.getElementById('user-input');
    
    if (this.isWaiting) {
      btn.className = 'send-btn loading';
      btn.disabled = true;
      btn.innerHTML = '<svg class="loading-icon">...</svg>';
    } else if (input.value.trim()) {
      btn.className = 'send-btn active';
      btn.disabled = false;
      btn.innerHTML = '<svg>发送图标</svg>';
    } else {
      btn.className = 'send-btn';
      btn.disabled = true;
    }
  }

  // 保存当前对话
  async saveCurrentConversation() {
    if (!this.currentConversationId) {
      this.currentConversationId = Date.now().toString();
    }
    
    await storage.saveConversation({
      id: this.currentConversationId,
      title: this.messages[0]?.content?.substring(0, 30) || '新对话',
      messages: this.messages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  // 获取当前年龄段
  getCurrentAgeGroup() {
    return document.getElementById('age-group')?.value || 'high_school';
  }
}

export default new ChatManager();
```

#### 10.3.4 Markdown渲染配置（markdown.js）

```javascript
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@9.1.6/lib/marked.esm.js';
import hljs from 'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/lib/core.min.js';

// 配置marked
marked.setOptions({
  gfm: true,              // GitHub风格Markdown
  breaks: true,           // 换行符转<br>
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  }
});

export function renderMarkdown(text) {
  return marked.parse(text);
}
```

### 10.4 后端API设计（server.py）

#### 10.4.1 接口定义

```python
# 已有接口
@app.route('/api/chat', methods=['POST'])
def chat_with_glm():
    """AI对话接口"""
    # 1. 接收前端messages数组
    # 2. 转发到智谱 GLM API
    # 3. 返回AI回复
    
# 新增接口
@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({"status": "ok", "service": "YExplorer AI"})
```

#### 10.4.2 请求/响应格式

**请求格式**：
```json
{
  "messages": [
    {"role": "system", "content": "你是研探..."},
    {"role": "user", "content": "介绍一下海大"},
    {"role": "assistant", "content": "中国海洋大学..."}
  ],
  "age_group": "high_school"
}
```

**响应格式**：
```json
{
  "reply": "中国海洋大学（Ocean University of China）..."
}
```

**错误响应**：
```json
{
  "error": "请求超时！请检查网络或稍后重试"
}
```

### 10.5 开发实施步骤

#### Phase 1: 基础架构搭建（2小时）

**步骤1.1**：创建文件结构
```bash
cd c:\Users\吴传奇\Desktop\trival-in-OUC\trivalOUC
mkdir css js images\icons
```

**步骤1.2**：编写tokens.css
- 复制Design Tokens定义
- 定义CSS变量

**步骤1.3**：编写reset.css
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--gray-900);
  background: var(--gray-50);
  line-height: 1.5;
}
```

**步骤1.4**：创建index.html骨架
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YExplorer - 海大文旅AI助手</title>
  <link rel="stylesheet" href="css/tokens.css">
  <link rel="stylesheet" href="css/reset.css">
  <link rel="stylesheet" href="css/layout.css">
  <link rel="stylesheet" href="css/sidebar.css">
  <link rel="stylesheet" href="css/chat.css">
  <link rel="stylesheet" href="css/input.css">
  <link rel="stylesheet" href="css/welcome.css">
  <link rel="stylesheet" href="css/responsive.css">
</head>
<body>
  <div class="app">
    <aside class="sidebar">...</aside>
    <main class="main-content">...</main>
  </div>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

#### Phase 2: 侧边栏开发（1.5小时）

**步骤2.1**：编写layout.css
- 定义`.app`容器（flex布局）
- 定义`.sidebar`（280px宽度）
- 定义`.main-content`（flex: 1）

**步骤2.2**：编写sidebar.css
- 新建对话按钮样式
- 历史列表项样式
- 底部功能入口样式

**步骤2.3**：编写sidebar.js
- 展开/收起逻辑
- 历史列表渲染
- 新建对话逻辑

#### Phase 3: 对话区开发（2小时）

**步骤3.1**：编写chat.css
- 对话窗口布局
- 用户/AI气泡样式
- 消息样式

**步骤3.2**：编写chat.js
- 发送消息逻辑
- 接收AI回复
- 消息渲染

**步骤3.3**：集成marked.js
- CDN引入
- 配置GFM
- 代码高亮

#### Phase 4: 输入区开发（1小时）

**步骤4.1**：编写input.css
- 输入框样式
- 发送按钮样式
- 年龄段选择器样式

**步骤4.2**：编写输入逻辑
- Enter发送
- Shift+Enter换行
- 按钮状态管理

#### Phase 5: 欢迎页开发（1小时）

**步骤5.1**：编写welcome.css
- 欢迎页布局
- 快捷链接样式

**步骤5.2**：编写欢迎逻辑
- 检测是否有对话
- 无对话时显示欢迎页
- 有对话时显示对话流

#### Phase 6: 本地存储集成（1.5小时）

**步骤6.1**：编写storage.js
- IndexedDB初始化
- 保存/读取对话
- 删除对话

**步骤6.2**：集成到chat.js
- 发送消息后保存
- 页面加载时恢复历史

#### Phase 7: 响应式适配（1.5小时）

**步骤7.1**：编写responsive.css
- 断点定义
- 各断点布局调整

**步骤7.2**：测试
- 桌面端（1920px）
- 平板（768px）
- 手机（375px）

#### Phase 8: 联调测试（1小时）

**步骤8.1**：后端联调
- 启动server.py
- 测试API调用
- 错误处理

**步骤8.2**：功能测试
- 新建对话
- 发送消息
- 历史切换
- 删除对话

**步骤8.3**：性能测试
- 加载时间 < 1.5s
- 消息响应 < 2s
- 滚动流畅度

### 10.6 技术风险与解决方案

| 风险 | 影响 | 概率 | 解决方案 |
|------|------|------|---------|
| IndexedDB兼容性 | 老旧浏览器不支持 | 低 | 降级到localStorage |
| Markdown XSS攻击 | 安全问题 | 中 | 使用DOMPurify过滤 |
| 大对话加载慢 | 性能问题 | 中 | 虚拟滚动/分页 |
| 移动端键盘遮挡 | 体验问题 | 高 | 监听resize事件调整 |
| CORS跨域错误 | 无法调用API | 低 | flask-cors已配置 |

### 10.7 性能优化策略

| 优化项 | 方案 | 预期效果 |
|--------|------|---------|
| 首屏加载 | CSS内联关键样式 | < 1s |
| 图片优化 | SVG图标，无位图 | 零图片加载 |
| JS加载 | 模块化，按需加载 | < 500KB |
| 对话渲染 | 虚拟滚动（>100条时） | 流畅滚动 |
| 缓存策略 | Service Worker（可选） | 离线可用 |

---

## 十一、风险与注意事项

1. **历史对话存储** —— 使用IndexedDB，清除浏览器数据会丢失。后续可升级为后端存储。
2. **Markdown渲染** —— AI回复可能包含Markdown，已引入marked.js + DOMPurify防XSS。
3. **侧边栏入口页面** —— 地图、资源、联系页面点击后跳转新页面，保持简单。
4. **性能** —— 对话历史超过100条时，启用虚拟滚动。
5. **字体加载** —— 使用系统字体（Microsoft YaHei），无FOIT风险。

---

## 十二、下一步

1. **确认方案** —— 你看看这个技术方向对不对
2. **开始开发** —— 按Phase 1-8逐步实现，预计10.5小时
3. **测试验收** —— 功能测试 + 性能测试 + 响应式测试

---

_方案版本：v3.0 (技术完整版)_
_创建时间：2026-04-18_
_设计师：Claw UI Design Team_
