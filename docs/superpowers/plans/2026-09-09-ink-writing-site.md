# Ink 写作站实施计划

## 本次执行结果（2026-09-09）

- 任务 1、任务 2 已完成；任务 3 未执行，未提交、推送或部署。
- 工作分支：`codex/ink-writing-only`。
- 补充清理计划遗漏的首页摄影预览、侧栏预置摄影分类及关于页摄影文案；保留归档等页面仍使用的通用样式和文章图片浏览功能。
- 摄影文章及 11 张图片已移除。删除前已校验备份文件哈希，备份包含原有未提交的文章修改，位置：`C:\Users\Guill\.Codex\backups\fuwari-ink-20260909-145910\pvg-20260531`。
- 默认 Node 16 不满足 Astro 要求；使用命令级 PATH 中的 Node 24.19.0 完成基线构建及最终验证，未修改系统配置。
- `pnpm astro check`：0 errors、0 warnings、1 hint（原有未使用参数 `_cssVar`）。
- 最新 `pnpm build` 成功，生成 4 个页面及 Pagefind 索引。中途一次构建出现 Tailwind `link` 类解析错误，未改代码重跑通过，原因尚未确认；仍有 Browserslist 数据过旧提示。
- 已核对：sitemap 和 robots 使用 Ink 域名；摄影路由、摄影文章及源代码和构建产物中的摄影文本无残留；小说文件未修改；`git diff --check` 通过。当前首页未输出 canonical 标签，本次未新增。
- 部署前须核对原根站的 Git 自动部署配置：若原项目监听同一仓库的 `main`，推送这些改动到 `main` 可能同时更新根站，不能仅凭新建 Pages 项目保证隔离。

> **供执行智能体使用：** 必须使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans`，按任务逐项实施；每一步以复选框跟踪。

**目标：** 将当前 Fuwari 站改为仅承载写作内容的 `ink.shenhaike.com`，且不改动已上线的根域名站点。

**架构：** 保持现有 Astro 静态构建方式，移除摄影专用路由、界面和内容，再通过一个新的 Cloudflare Pages 项目发布 `dist/`。根域名门户、旧域名重定向及 `lens.shenhaike.com` 不属于本次范围。

**技术栈：** Astro 5、TypeScript、Tailwind CSS、pnpm 9、Cloudflare Pages。

## 全局约束

- 写作站正式地址固定为 `https://ink.shenhaike.com/`。
- 不修改或重新绑定当前已上线的 `https://shenhaike.com/`。
- 移除全部 `pvg-20260531` 摄影源内容。
- 保留写作文章、归档页、关于页、RSS 和 sitemap 的生成。
- 不新增后端、数据库、Worker 或依赖。

---

### 任务 1：配置 Ink 域名并收敛导航

**文件：** 修改 `astro.config.mjs:25`、`src/config.ts:60-65`；检查生成后的 `dist/sitemap-index.xml` 与 `dist/index.html`。

- [ ] 先运行 `pnpm build`，确认构建退出码为 `0`。
- [ ] 在 `astro.config.mjs` 中将 `site` 修改为 `"https://ink.shenhaike.com/"`。
- [ ] 从 `navBarConfig.links` 中删除 `{ name: "摄影", url: "/photography/" }`。
- [ ] 再次运行 `pnpm build`；确认 sitemap 包含 `ink.shenhaike.com`，首页不再出现「摄影」导航项。

### 任务 2：移除摄影实现和摄影内容

**文件：** 删除 `src/pages/photography.astro`、`src/components/PhotographyGrid.astro`、`src/content/posts/pvg-20260531/`。仅当样式被证实只服务于已删除摄影路由时，才修改 `src/styles/shenhaike.css`。

- [ ] 运行 `rg -n 'PhotographyGrid|photography|photography-' src`，逐项确认结果仅属于摄影页面、组件、内容或样式。
- [ ] 仅删除上述摄影源文件；保留所有写作文章和通用样式。
- [ ] 运行 `pnpm astro check` 与 `pnpm build`，两者都必须以退出码 `0` 结束。
- [ ] 确认 `Test-Path dist/photography/index.html` 输出 `False`，且 `rg -n 'pvg-20260531|PhotographyGrid' src dist` 无结果。
- [ ] 运行 `git diff --check`、`git diff --stat`、`git status --short`，确认没有混入无关用户修改。

### 任务 3：在 Cloudflare Pages 独立发布 Ink

**Cloudflare 配置：** 连接 GitHub 仓库 `BusySeaAlien/shenhaike`，生产分支选择 `main`；框架选择 Astro；构建命令为 `pnpm build`；输出目录为 `dist`；Node 版本为 22。

- [ ] 在改 DNS 前，先访问生成的 `*.pages.dev` 地址，检查 `/`、`/archive/`、`/about/`、`/posts/shangban/`，并确认 `/photography/` 不存在。
- [ ] 在 Pages 项目中进入 Custom domains，添加 `ink.shenhaike.com`，并在同一 Cloudflare 域名区域完成 DNS 确认。
- [ ] 验证 `https://ink.shenhaike.com/`、`/archive/`、`/posts/shangban/` 返回 `200`；`/photography/` 不存在；`https://shenhaike.com/` 仍可访问。
