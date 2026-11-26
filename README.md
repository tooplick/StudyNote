# 电工学习笔记

基于 Hugo + [hugo-book](https://github.com/alex-shpak/hugo-book) 的中文笔记站。

## 首次克隆

主题是 git 子模块，克隆后要先取回：

```bash
git clone --recurse-submodules <本仓库地址>
# 已经克隆过的话：
git submodule update --init
```

## 预览

```bash
hugo server -D      # 打开 http://localhost:1313
```

## 构建

```bash
hugo --gc --minify    # 产物在 public/
```

## 写新笔记

```bash
hugo new content docs/posts/your-slug.md
```

- 文件名用英文 slug；编辑 front matter 的 `title`（中文）和 `weight`（侧边栏排序，数字小的在上）
- 隐藏某一页：`bookHidden: true`；折叠某个小节：`bookCollapseSection: true`
- 图片放到 `static/images/`，正文写 `![说明](/images/xxx.png)`
- 提示块用 Markdown 告警写法（`{{< hint >}}` 在 v0.16 已弃用）：

  ```markdown
  > [!NOTE] 标题
  > 内容
  ```

  可用的类型：`NOTE`、`TIP`、`IMPORTANT`、`WARNING`、`CAUTION`
- 其他短代码：`tabs`、`columns`、`details`、`steps`、`mermaid`、`katex`，写法见[主题文档](https://book.alxs.dev)

## 主题升级

```bash
git submodule update --remote --merge themes/hugo-book
hugo --gc --minify    # 确认无 ERROR / WARN
git add themes/hugo-book && git commit -m "chore: 升级 hugo-book"
```

想固定在某个版本时，进入 `themes/hugo-book` 手动执行 `git checkout v0.16.0`，回到项目根目录再提交。

## 部署

线上：<https://electric.ygking.top/>（Cloudflare Pages 项目 `studynote`，预览地址 <https://studynote-b4k.pages.dev/>）

用 Cloudflare CLI 从本地直接部署（GitHub 仓库变动不会自动发布）：

```bash
hugo --gc --minify
npx wrangler pages deploy public --project-name studynote --branch master
```

- 首次在新机器上使用前先 `npx wrangler login`
- `wrangler.toml` 里的 `pages_build_output_dir = "public"` 让 `npx wrangler pages deploy` 可以省略目录参数
- `wrangler.toml` 里同时写了 `[build]`（`hugo --gc --minify`、`publish = "public"`）和 `[vars] HUGO_VERSION = "0.163.3"`，
  Cloudflare 连接 GitHub 后会自动读这两项；注意主题要求 Hugo ≥ 0.158.0，Cloudflare 默认装的是 0.147，必须靠这个变量升级

在 Cloudflare 控制台把自定义域名 `electric.ygking.top` 绑定到该项目即可。

## 目录说明

| 路径 | 说明 |
|---|---|
| `content/docs/posts/` | 正文笔记，侧边栏按 `weight` 排序 |
| `content/docs/_index.md` | 「目录」章节页 |
| `content/_index.md` | 首页 |
| `archetypes/docs.md` | `hugo new content docs/posts/...` 使用的模板 |
| `i18n/zh.yaml` | 补充的中文界面文案 |
| `assets/styles/custom.css` | 中文字体栈 |
| `themes/hugo-book/` | hugo-book 主题（git 子模块，跟踪 main 分支） |

