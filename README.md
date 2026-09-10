# 深海客 · Ink

> 本项目基于开源博客主题 [Fuwari](https://github.com/saicaca/fuwari) 改造，感谢原作者与所有贡献者的工作。
>
> Fuwari 采用 MIT License；本仓库保留其原始许可与相关版权声明。

Ink 是「深海客」的文字站点，收录小说、随笔与个人记录。

- 线上地址：[ink.shenhaike.com](https://ink.shenhaike.com/)
- 主站：[shenhaike.com](https://shenhaike.com/)
- 技术栈：Astro 5、Svelte、Tailwind CSS、Pagefind

## 内容结构

文章放在 `src/content/posts/`，可使用以下分类：

- `小说`
- `随笔`
- `摄影`

新文章使用 Markdown 文件，并在顶部填写 frontmatter：

```yaml
---
title: 文章标题
published: 2026-09-10
description: 一句简短摘要。
tags: [标签]
category: 随笔
draft: false
---
```

正文直接写在 frontmatter 之后。图片可随文章目录保存，或放在 `public/images/` 并通过绝对路径引用。

## 本地开发

环境要求：Node.js 18.20.8 或更高版本，以及 pnpm 9 或更高版本。

```powershell
pnpm install
pnpm dev
```

开发服务器默认在 `http://localhost:4321` 启动。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `pnpm dev` | 启动本地开发服务器 |
| `pnpm check` | 执行 Astro 类型与模板检查 |
| `pnpm build` | 构建静态站点并建立 Pagefind 搜索索引 |
| `pnpm preview` | 本地预览构建产物 |
| `pnpm new-post <filename>` | 创建一篇新文章 |
| `pnpm format` | 使用 Biome 格式化 `src` |

## 站点配置

主要配置在 `src/config.ts`：

- 站点标题、语言、favicon 与主题色
- 顶部导航
- 侧栏个人信息与外部链接
- 文章页目录和许可证信息

页面外观的定制样式集中在 `src/styles/shenhaike.css`；请优先在这里调整深海客的字体、颜色与阅读排版，避免无关范围的主题改造。

## 许可

本仓库包含来自 Fuwari 的源代码，相关部分遵循其 [MIT License](./LICENSE)。站点文章、图片及其他原创内容的使用权由深海客另行保留；未经许可，请勿转载或商用。
