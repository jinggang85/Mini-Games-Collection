# Mini Games Collection (React + TypeScript)

一个基于 React 18 + TypeScript + Tailwind CSS + shadcn UI 的「小游戏合集」。
开箱即玩、移动端友好、键盘操作更畅快，支持 Hash 路由，适合部署到静态托管（GitHub Pages / Netlify / Vercel / S3/OSS 等）。

- 在线预览：本仓库支持本地启动与生产构建后的静态部署
- 技术栈：React 18、TypeScript、esbuild、Tailwind CSS、shadcn UI、Radix、Lucide、react-router（HashRouter）

> 若键盘操作无效，请先点击游戏区域获取焦点（可访问性友好提示）。

---

## 目录
- [功能概览](#功能概览)
- [页面与游戏](#页面与游戏)
  - [首页](#首页)
  - [纸牌（记忆翻牌）](#纸牌记忆翻牌)
  - [俄罗斯方块](#俄罗斯方块)
  - [贪吃蛇](#贪吃蛇)
  - [坦克大战](#坦克大战)
- [开发与运行](#开发与运行)
- [构建与产物](#构建与产物)
- [部署指南](#部署指南)
  - [GitHub Pages](#github-pages)
  - [Netlify](#netlify)
  - [Vercel](#vercel)
  - [任意静态服务器-NginxS3OSS](#任意静态服务器-nginxs3oss)
- [可访问性与体验](#可访问性与体验)
- [项目结构](#项目结构)
- [常见问题-FAQ](#常见问题-faq)
- [致谢与引用](#致谢与引用)
- [License](#license)

---

## 功能概览

- 多游戏合集：纸牌（记忆翻牌）、俄罗斯方块、贪吃蛇、坦克大战
- 组件化与美学：
  - 采用组件驱动开发（小而美的原子组件与图标组件）
  - 良好的色彩对比与层级，深浅色主题友好
- 体验优化：
  - 统一键位提示与焦点提示
  - 移动端触控友好（触控点击即焦点）
  - 部分数据与偏好持久化（localStorage）
- 工程化：
  - esbuild 极速编译与构建
  - HashRouter 适配静态托管，无需服务端重写规则
  - Tailwind + shadcn UI 的一致化设计体系

---

## 页面与游戏

### 首页
- 提供四款小游戏入口与简要介绍。
- 支持浅/深色主题，按钮拥有明显可见的焦点与悬停反馈。

### 纸牌（记忆翻牌）
- 玩法：每回合翻开两张牌，若相同则配对成功并保留正面。
- UI：难度（配对数）选择、步数、用时、最佳记录、重新开始。
- 控制：鼠标/触控操作为主。
- 持久化：可能保存最佳成绩（具体以实现为准）。

### 俄罗斯方块
- 玩法：经典消除。
- 特色（以首页描述为准）：影子投影（Ghost）、保存/交换（Hold）、音效。
- 常见键位（以页面内提示为准）：左右移动，旋转，上/空格硬降，C/Shift 保存。
- 目标：堆叠消行并冲击高分。

### 贪吃蛇
- 玩法：使用方向键/WASD 控制蛇移动，吃到食物变长，撞墙/撞自己结束。
- 控制：WASD / 方向键移动；空格暂停。
- UI：当前分数、状态与“再来一局”。
- 提示：若按键无效，请点击棋盘以聚焦。

### 坦克大战
- 玩法：保护基地，消灭敌人，推进关卡。
- 视觉与交互增强：
  - 舒适模式：更慢更稳，子弹顺滑（默认开启，可切换，记忆偏好）。
  - 关卡节奏阶梯：前两关更少障碍/更慢，第三关起恢复舒适参数。
  - 基地重构：基地位于最底行中间，周围一圈砖墙环绕（砖墙可被炮弹摧毁；钢墙不可摧毁）。
  - 道具：击毁敌人有概率掉落“护盾（抵消一次伤害）/连发（更高开火上限，限时）”。
  - 安全提示：敌方子弹接近基地时，基地格出现红色脉冲边框。
  - 朝向提示：玩家坦克上方显示小箭头，明确射击方向。
  - 音效：柔和哔声，可开关并持久化。
- 控制：WASD / 方向键移动；空格射击；P 暂停。
- 面板：分数、生命、关卡、击杀进度、道具状态（护盾层数 / 连发剩余时间）。

> 提示：如按键无效，请先点击棋盘区域以获取焦点。

---

## 开发与运行

### 环境要求
- Node.js ≥ 18
- npm（或兼容的包管理器）

### 安装依赖
```bash
npm install
```

### 启动开发服务
```bash
npm run dev
```
- 控制台会输出本地预览地址（基于 esbuild 的开发服务）。
- 使用 Hash 路由，无需本地重写规则。

---

## 构建与产物

### 生产构建
```bash
npm run build
```
- 产物目录：`dist/`
- 可直接部署到任意静态托管平台。

---

## 部署指南

> 本项目使用 `HashRouter`，即使在纯静态托管（无服务端重写）环境也能正常访问子路径。

### GitHub Pages
1. 构建：
   ```bash
   npm run build
   ```
2. 将 `dist/` 发布到 `gh-pages` 分支或使用 GitHub Actions 自动化部署。
3. 在仓库 Settings → Pages 中选择部署来源为 `gh-pages` 分支。
4. 访问 `https://<your-name>.github.io/<repo>/` 即可。

> 若仓库作为组织/用户主页仓库（<org>.github.io），可直接使用根路径。

### Netlify
- 新建站点 → 关联仓库 → 构建命令 `npm run build`，发布目录 `dist`
- 使用 Hash 路由，无需额外的重写规则。

### Vercel
- Import Project → Framework 选择 Other
- Build Command: `npm run build`
- Output Directory: `dist`
- 直接静态托管，无需重写。

### 任意静态服务器（Nginx/S3/OSS）
- 将 `dist/` 内容上传至对应 Bucket 或静态目录。
- 因为使用 Hash 路由，访问深层链接不会触发 404（URL `#/path` 仍指向 `index.html`）。

---

## 可访问性与体验

- 键盘操作提示：游戏区域支持 `tabIndex`，不响应键盘时请点击棋盘区域以聚焦。
- 色彩对比：采用高对比度与柔和阴影，保证浅/深色模式下文本与图形均可辨。
- 触控友好：按钮尺寸与间距（HIT area）符合移动端习惯。
- 偏好持久化：
  - 坦克大战的“舒适模式”与“音效开关”使用 `localStorage` 记忆。
  - 其他游戏的最佳成绩/配置如有提供，也会本地保存（以实际页面为准）。

---

## 项目结构

> 以下为关键结构示意（仅列出主要目录/文件，省略若干实现细节）：

```
src/
├─ App.tsx                  # 应用路由（HashRouter）
├─ main.tsx                 # React 入口（请勿修改）
├─ shadcn.css               # 主题样式（请勿修改）
├─ components/
│  ├─ TopBar.tsx
│  ├─ TouchControls.tsx
│  ├─ OrientationHint.tsx
│  ├─ GameCard.tsx
│  └─ icons/
│     ├─ TankIcon.tsx
│     ├─ HomeTanksBadge.tsx
│     ├─ HomeTetrisBadge.tsx
│     ├─ HomeSnakeBadge.tsx
│     └─ ...
├─ pages/
│  ├─ Home.tsx              # 首页（包含四个游戏入口）
│  └─ games/
│     ├─ Cards.tsx          # 纸牌（记忆翻牌）
│     ├─ Tetris.tsx         # 俄罗斯方块
│     ├─ Snake.tsx          # 贪吃蛇
│     └─ Tanks.tsx          # 坦克大战（舒适模式、节奏阶梯、基地环砖、道具、音效等）
└─ hooks/
   └─ useIsTouch.ts
```

- 路由：使用 `react-router` 的 `HashRouter`
- UI 库：`components/ui/*` 为 shadcn UI 组件（不要直接修改其源码）
- 注释：关键组件包含 JSDoc 风格注释，便于快速理解

---

## 常见问题 FAQ

- Q：访问 /tetris 或 /snake 子路径 404？
  - A：请确保使用了 Hash 路由。如果部署在静态托管，URL 形如 `/#/tetris` 是正常的。
- Q：键盘按键不生效？
  - A：请点击一次游戏区域，确保该区域获得焦点（尤其在移动端或 iframe 预览环境）。
- Q：深色模式如何启用？
  - A：默认跟随系统或浏览器设置（通过 `next-themes`/CSS 实现），也可在项目中扩展主题切换。
- Q：如何扩展新游戏或组件？
  - A：遵循“单一职责、小而复用”的组件拆分原则，保持文件 < 100 行优先；必要时进行分层。

---

## 致谢与引用

- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn UI](https://ui.shadcn.com/) 与 [Radix UI](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)
- [esbuild](https://esbuild.github.io/)
- 以及项目中使用的开源生态。

> 图片与插图：项目可能使用占位图与图标（包括但不限于本地 SVG、占位图服务），上线时可替换为实际素材。

---

## License

MIT（可根据团队策略调整）。如需对外开源，建议在仓库根目录添加 `LICENSE` 文件。
