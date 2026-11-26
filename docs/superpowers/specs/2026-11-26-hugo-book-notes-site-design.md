# 电工学习笔记 Hugo 站点（hugo-book 主题）设计

日期：2026-11-26
状态：已与用户确认（目录结构 / 日常流程 / 验证方式三段均已确认）

## 1. 目标

在 `C:\Users\id654\Desktop\Electric\StudyNote` 下搭建一个 Hugo 静态站点，主题使用
`https://github.com/alex-shpak/hugo-book`。站点内容为现有的 5 份电工学习笔记，并作为
后续持续记笔记的载体。

成功标准：

- 本地可用 `hugo server -D` 预览，修改 Markdown 自动热重载。
- `hugo --gc --minify` 零错误、零警告构建，产物在 `public/`。
- 侧边栏按固定顺序显示 5 篇笔记，界面文案为中文（含中文全文搜索）。
- 原有笔记正文一字不改地迁入站点。

## 2. 现状

- `hugo new site` 已执行过：`hugo.toml` 仍为默认值（`example.org` / `My New Hugo Project`），
  无 `theme` 或模块导入；`content/` 为空。
- `go.mod` 已声明 `github.com/alex-shpak/hugo-book v0.16.0`（indirect），模块已在
  本地模块缓存中下载，`_vendor/` 已通过 `hugo mod vendor` 生成。
- 根目录散落 5 份笔记：`电力基础.md`、`万用表.md`、`空气开关.md`、`接触器.md`、`继电器.md`。
- 工具链：Hugo v0.163.3 extended（windows/amd64），Go 1.27.2，git 2.45.1。
- 不是 git 仓库。

## 3. 内容布局

```
content/
├── _index.md               # 首页（BookSection 根）：书标题 + 简介 + 入口链接
└── docs/
    ├── _index.md           # 「正文」章节页
    ├── power-basics.md     # 电力基础     weight 10
    ├── multimeter.md       # 万用表       weight 20
    ├── circuit-breaker.md  # 空气开关     weight 30
    ├── contactor.md        # 接触器       weight 40
    └── relay.md            # 继电器       weight 50
```

规则：

- 文件名使用英文 slug，`title` 保留中文；减少 URL 百分号编码，链接稳定。
- 每篇笔记 front matter 至少包含 `title` 与 `weight`；侧边栏由 hugo-book 的文件树菜单
  按 `weight` 自动排序，无需手工维护菜单。
- 迁移方式为**移动**：原根目录 `.md` 先备份到 `_backup-原始笔记/`，迁入后逐字 diff 核对
  （只允许多出 front matter），核对通过后由用户确认是否删除备份。

## 4. 站点配置

`hugo.toml`：

- `baseURL = '/'`（部署时按需改成实际域名）
- `locale = 'zh-cn'`、`languageCode = 'zh-cn'`
- `title = '电工学习笔记'`
- `[params]`：`BookTheme = 'light'`、`BookSection = 'docs'`、`BookSearch = true`
- `[module]` 导入 `github.com/alex-shpak/hugo-book`

主题管理方式：Hugo Modules + `_vendor/`。

- `go.mod` 固定版本 `v0.16.0`；`hugo mod vendor` 生成 `_vendor/`，构建不依赖网络。
- 不使用 git submodule；`themes/` 目录删除（为空且不再使用）。
- 注意：`hugo mod vendor` 在 `_vendor/` 缺少 `modules.txt` 时会拒绝删除已有 `_vendor` 目录，
  需先手动删除 `_vendor/` 再 vendor（或删除后再建）。
- 主题自带 `i18n/zh.yaml`，包含「搜索」等文案与 CJK 二元分词的搜索配置。

`archetypes/default.md`：补充 `weight = 10`、`BookHidden = false`，`date` 按 Hugo 自带模板生成。

## 5. 日常流程

- 新建笔记：`hugo new content docs/<slug>.md`，填写 `title`、`weight`。
- 隐藏页面：`BookHidden: true`；折叠小节：`BookCollapseSection: true`。
- 图片：放在叶子 bundle 中（笔记改为 `index.md` + 同目录图片），或放 `static/`。
- 预览：`hugo server -D` → http://localhost:1313 。
- 构建：`hugo mod vendor`（主题未变时可跳过）→ `hugo --gc --minify`。
- 升级主题：改 `go.mod` 版本 → `go mod download` → `hugo mod vendor` → 重新验证。

## 6. 验证

1. `hugo --gc --minify` 退出码 0，输出无 `ERROR` / `WARN`（当前 `Section 'docs' not found`
   错误必须消失）。
2. `public/` 中存在 `index.html`、`docs/index.html` 及 5 篇笔记页。
3. 生成页面包含中文文案（如「搜索」），侧边栏顺序为 电力基础 → 万用表 → 空气开关 → 接触器 → 继电器。
4. `hugo server` 启动后请求 `/` 与一篇笔记页均返回 HTTP 200 且标题正确。
5. 迁移的 5 篇笔记正文与原文件逐字 diff 一致（仅允许新增 front matter）。

## 7. 收尾

- 删除空的 `themes/` 与空的 `_vendor/` 残留（如有）。
- 根目录 `README.md`：预览 / 构建 / 加笔记 / 升级主题的简要说明。
- `.gitignore`：`public/`、`resources/_gen/`、`.hugo_build.lock`、系统临时文件；`_vendor/` 纳入版本控制。
- `git init` 并提交初始版本（用户已同意）。

## 8. 非目标

- 不做自动部署（GitHub Pages / Netlify 等）、评论、多语言界面。
- 不改写、扩充或重新组织笔记内容本身。
