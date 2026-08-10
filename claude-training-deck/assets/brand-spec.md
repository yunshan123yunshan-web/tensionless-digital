# Tensionless Digital · Brand Spec
> 采集日期：2026-05-02
> 资产来源：Tensionless Digital project (index.html + styles.css + logo.svg)
> 资产完整度：完整

## 🎯 核心资产

### Logo
- 主版本：`assets/logo.svg`
- 使用场景：标题页、过渡页
- 注意：SVG 含嵌入式 PNG 光栅，PPTX 导出可用 PNG 兜底

### 色板
- `--ink` (ink): #090909 — 主背景
- `--ink-soft` (ink-soft): #141414 — 次要背景（代码块、表格 header）
- `--ink-mid` (ink-mid): #1e1e1e — 边框、分割线
- `--ink-muted` (ink-muted): #5a6067
- `--steel` (steel): #7a8796 — 次要文字、图注
- `--steel-light` (steel-light): #96a4b2 — 标签、subheader
- `--chrome` (chrome): #b8c4d0 — 正文字色
- `--chrome-hi` (chrome-hi): #d4dde8 — 标题、强调
- `--off-white` (off-white): #f0f2f4
- `--accent` (accent): #9aaabc — 练习卡片边框

### 字型
- Display: Cormorant Garamond (300, 300i, 400) — 标题
- Body: Inter (300, 400, 500, 600) — 正文、标签

### 签名细节
- 深色背景（#090909）为主基调
- 钻石/三角碎片元素（clip-path，实色填充，低透明度）
- 克制排版，无渐变、无装饰性图标
- 4:3 固定尺寸幻灯片（960pt × 540pt）

### 禁区
- 不使用渐变（CSS gradient）
- 不使用 SVG 手画图形代替真实素材
- 不使用 emoji 作为图标
- 不在 p/h 标签上设置 background/border/shadow（PPTX 兼容约束）

### 气质关键词
- 克制 · 编辑感 · 高端 · 深色 · 极简
