# 电工学习笔记 Hugo 站点（hugo-book）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `StudyNote` 目录搭成可本地预览、`hugo --gc --minify` 零错误构建的 hugo-book 中文笔记站，并把根目录 5 份电工笔记原样迁入。

**Architecture:** 用 Hugo Modules 引入 `github.com/alex-shpak/hugo-book v0.16.0` 并 `hugo mod vendor` 到 `_vendor/`（离线构建）；内容放在 `content/docs/` 下，侧边栏由主题文件树菜单按 `weight` 自动排序；站点根用 `content/_index.md`（`layout: landing`）做首页。中文界面、中文字体、搜索通过配置、`i18n/` 覆盖和 `assets/styles/custom.css` 实现，不改主题源码。

**Tech Stack:** Hugo v0.163.3 extended（windows/amd64）、Go 1.27.2（仅用于 `go.mod`）、git 2.45.1、hugo-book v0.16.0、Git Bash。

**Spec:** `docs/superpowers/specs/2026-11-26-hugo-book-notes-site-design.md`

## Global Constraints

- 主题固定 `github.com/alex-shpak/hugo-book v0.16.0`；主题要求 Hugo `>= 0.158.0`（当前 0.163.3 满足）。
- 主题用 Hugo Modules + `_vendor/` 管理；**不使用** git submodule，**不使用** `themes/` 目录。
- 运行 `hugo mod vendor` 前，若 `_vendor/` 存在但没有 `_vendor/modules.txt`，必须先 `rm -rf _vendor`，否则 Hugo 报 `found _vendor dir without modules.txt, skip delete` 并跳过。
- hugo-book 在 `BookSection` 指向的章节不存在时会直接构建失败（`Section 'docs' not found`）。因此**任何**包含 `BookSection = 'docs'` 的配置，只有在 `content/docs/` 存在时才能构建成功；配置与内容必须同一任务落地（Task 1）。
- 笔记文件名用英文 slug，`title` 用中文；侧边栏顺序：电力基础 → 万用表 → 空气开关 → 接触器 → 继电器（`weight` 10/20/30/40/50）。
- 迁移笔记：正文一字不改，只加 front matter；原文件在核对通过前保留在 `_backup-原始笔记/`。
- 每个任务的构建验证：`hugo --gc --minify --logLevel warn` 退出码 0，输出不含 `ERROR` / `WARN`。
- 本机 git 身份已配置（tooplick），在 `master` 上直接提交，不建额外分支。

## Review Focus

（spec 没写、但使用者一定会遇到的输入；按最可能先踩到的顺序排列，每条在所属任务里都有测试）

1. **现有笔记里碰巧出现 Hugo shortcode 语法**（如从 Obsidian 粘来的 `{{<`）：构建会在渲染期报错，而使用者只想看到原文。→ Task 1 Step 3 扫描。
2. **空笔记 / 只有标题的笔记**（现有 `继电器.md` 为空，`空气开关.md`、`接触器.md` 只有一行标题）：hugo-book 只在 `.Page.Content` 非空时渲染成可点击链接，空页面会变成点不动的侧边栏项。→ Task 1 Step 7 + Task 4 Step 2。
3. **Windows 上的中文呈现**：默认字体栈落到宋体字形；主题有 `Table of Contents`、`Link`、`Logo`、`Menu`、`Thumbnail`、`Breadcrumbs` 等界面键在 `zh.yaml` 中缺失，按钮提示与读屏仍是英文。→ Task 3。
4. **排序/隐藏**：`weight` 写成字符串或漏写会打乱顺序；`bookHidden: true` 的页面（首页）必须从侧边栏消失。→ Task 1 Step 7、Task 2。
5. **部署到子路径**（GitHub Pages 项目页 `/<repo>/`）：`baseURL = '/'` 会让站内链接和搜索索引断开。→ Task 4 Step 3 + README 部署段。

---

## File Structure

| 文件 | 职责 |
|---|---|
| `hugo.toml` | 站点配置：默认语言、标题、模块导入、`Book*` 参数 |
| `go.mod` / `go.sum` | 固定 hugo-book v0.16.0 与校验和 |
| `_vendor/` | 已 vendor 的主题（提交进 git） |
| `content/_index.md` | 首页（landing 布局、不在侧边栏、不进搜索） |
| `content/docs/_index.md` | 「目录」章节页（说明 + 阅读顺序） |
| `content/docs/{basic,components,electromech}/*.md` | 按「基础 / 常用器件 / 机电与传感」分类的笔记（原 `docs/posts/`） |
| `archetypes/docs.md` | `hugo new content docs/posts/x.md` 的模板 |
| `i18n/zh.yaml` | 主题缺失的中文界面文案 |
| `assets/styles/custom.css` | 中文字体栈（主题 `index.yaml` 最后加载） |
| `_backup-原始笔记/*.md` | 迁移前备份（git 忽略，用户确认后自行删除） |
| `README.md` | 预览 / 构建 / 写笔记 / 升级 / 部署 |
| `.gitignore` | `public/`、`resources/_gen/`、`.hugo_build.lock`、`_backup-原始笔记/` |

---

### Task 1: 配置站点并迁入全部内容（使构建首次成功）

**Files:**
- Modify: `hugo.toml`（当前 3 行默认值，整体重写）
- Create: `_backup-原始笔记/电力基础.md` 等 5 个副本
- Create: `content/docs/posts/{power-basics,multimeter,circuit-breaker,contactor,relay}.md`
- Create: `content/docs/_index.md`、`content/_index.md`
- Modify: `.gitignore`（追加 `_backup-原始笔记/`）
- Delete: `themes/`（空目录）；根目录 `电力基础.md`、`万用表.md`、`空气开关.md`、`接触器.md`、`继电器.md`（核对后）

**Interfaces:**
- Consumes: 无（首个任务）。
- Produces: 构建成功的站点；页面路径 `/`、`/docs/`、`/docs/posts/{power-basics,multimeter,circuit-breaker,contactor,relay}/`。后续任务基于这些路径写断言。

- [ ] **Step 1: 删除空 `themes/` 目录（spec §4 要求）**

```bash
cd "C:/Users/id654/Desktop/Electric/StudyNote"
rmdir themes && echo "themes removed"
```

预期：输出 `themes removed`。若报 `Directory not empty`，**停下报告**（有人放了主题文件，需用户决定）。

- [ ] **Step 2: 备份原笔记并忽略备份目录**

```bash
mkdir -p "_backup-原始笔记"
cp 电力基础.md 万用表.md 空气开关.md 接触器.md 继电器.md "_backup-原始笔记/"
ls -1 "_backup-原始笔记" | wc -l
grep -qxF '_backup-原始笔记/' .gitignore || echo '_backup-原始笔记/' >> .gitignore
```

预期：输出 `5`。

- [ ] **Step 3: 迁移前置检查（Review Focus 1、4）**

```bash
grep -nE '\{\{[<%]' _backup-原始笔记/*.md; echo "shortcode-grep-exit=$?"
grep -nE '^(title|weight|bookHidden)\s*:' _backup-原始笔记/*.md; echo "frontmatter-grep-exit=$?"
grep -nE '<script|javascript:' _backup-原始笔记/*.md; echo "raw-html-grep-exit=$?"
```

预期：三次 `grep` 均为 `exit=1`（无命中）。任何一项有命中：**停下报告**，把命中行贴给用户（shortcode 会让渲染期报错；原文已有 `title:`/`weight:` 会与新增 front matter 冲突；裸 HTML 会被 Hugo 默认的 `unsafe` 设置过滤）。

- [ ] **Step 4: 写入站点配置**

```toml
baseURL = '/'
title = '电工学习笔记'
defaultContentLanguage = 'zh'
defaultContentLanguageInSubdir = false

[params]
  BookTheme = 'light'
  BookSection = 'docs'
  BookSearch = true

[module]
  [[module.imports]]
    path = 'github.com/alex-shpak/hugo-book'
```

说明：Hugo 0.158+ 的配置只允许一种语言定义方式，spec 中的 `locale` / `languageCode` 已移除；`defaultContentLanguage = 'zh'`（Hugo 语言关键字 `zh`）等价地启用中文，主题 `i18n/zh.yaml` 提供「搜索」等文案与 CJK 二元分词。`defaultContentLanguageInSubdir = false` 保证首页在 `/`。

- [ ] **Step 5: 创建 5 个笔记文件（front matter + 原文逐字节拼接）**

```bash
mkdir -p content/docs/posts
write_note() {  # $1=slug $2=中文标题 $3=weight $4=原文文件名
cat > "content/docs/posts/$1.md" <<EOF
---
title: "$2"
weight: $3
draft: false
---
EOF
cat "_backup-原始笔记/$4" >> "content/docs/posts/$1.md"
}
write_note power-basics    电力基础  10 电力基础.md
write_note multimeter      万用表    20 万用表.md
write_note circuit-breaker 空气开关  30 空气开关.md
write_note contactor       接触器    40 接触器.md
write_note relay           继电器    50 继电器.md
head -6 content/docs/posts/power-basics.md
```

预期：`head` 显示 4 行 front matter，随后是原文第一行 `  # 电力基础`（原文首行有前导空格，保持原样）。

- [ ] **Step 6: 创建章节页与首页**

`content/docs/_index.md`：

```markdown
---
title: 目录
weight: 1
---

笔记按「从基础到常用器件」组织，侧边栏顺序即推荐阅读顺序：

1. 电力基础 —— 交流/直流、电流电压功率、用电连接
2. 万用表 —— 拨档与测量
3. 空气开关 —— 短路与过载保护
4. 接触器 —— 控制回路
5. 继电器 —— 信号传递与自动控制
```

`content/_index.md`：

```markdown
---
title: 电工学习笔记
layout: landing
bookHidden: true
bookSearchExclude: true
---

# 电工学习笔记

记录日常电工知识与器材使用要点。

[从「电力基础」开始](/docs/posts/power-basics/) · [查看目录](/docs/)
```

- [ ] **Step 7: 构建并验证（构建、页面、顺序、隐藏、迁移一致性）**

```bash
hugo --gc --minify --logLevel warn 2>&1 | tee /tmp/build.log; echo "exit=${PIPESTATUS[0]}"
grep -cE 'ERROR|WARN' /tmp/build.log
ls public/index.html public/docs/index.html \
   public/docs/posts/{power-basics,multimeter,circuit-breaker,contactor,relay}/index.html 2>/dev/null | wc -l
```

预期：`exit=0`、`grep -c` 输出 `0`、文件数 `7`。

侧边栏顺序（Review Focus 4）：

```bash
python - <<'PY'
import re, pathlib
html = pathlib.Path("public/docs/index.html").read_text(encoding="utf-8")
menu = html.split('class="book-menu-content"', 1)[1].split("</aside>", 1)[0]
titles = re.findall(r'<a href="/docs/posts/[^"]+"[^>]*>\s*([^<]+?)\s*</a>', menu)
print(titles)
assert titles == ["电力基础", "万用表", "空气开关", "接触器", "继电器"], titles
print("ORDER-PASS")
PY
```

预期：打印 `['电力基础', '万用表', '空气开关', '接触器', '继电器']` 与 `ORDER-PASS`，无 `AssertionError`。顺序错误 → 检查各文件 `weight` 是否为整数。

迁移一致性（正文与原文逐字一致，忽略 BOM 与行尾）：

```bash
python - <<'PY'
import pathlib
pairs = {"power-basics": "电力基础.md", "multimeter": "万用表.md",
         "circuit-breaker": "空气开关.md", "contactor": "接触器.md", "relay": "继电器.md"}
for slug, src in pairs.items():
    original = pathlib.Path("_backup-原始笔记", src).read_text(encoding="utf-8-sig").replace("\r\n", "\n")
    page = pathlib.Path(f"content/docs/posts/{slug}.md").read_text(encoding="utf-8-sig").replace("\r\n", "\n")
    body = page.split("---\n", 2)[2]
    body = body[1:] if body.startswith("\n") else body
    assert body.rstrip("\n") == original.rstrip("\n"), slug
print("BODY-IDENTICAL")
PY
```

预期：`BODY-IDENTICAL`（front matter 的结束 `---` 后紧跟一行空行，其余与原文完全相同）。

- [ ] **Step 8: 核对通过后删除根目录原文件**

```bash
diff -q _backup-原始笔记/电力基础.md 电力基础.md
rm 电力基础.md 万用表.md 空气开关.md 接触器.md 继电器.md
ls *.md 2>/dev/null; echo "root-md-ls-exit=$?"
```

预期：`diff -q` 无输出（一致）；`ls` 报 No such file（`root-md-ls-exit=2`）。**Step 7 任何断言失败时不得执行本步。**

- [ ] **Step 9: 提交**

```bash
git add -A
git status --short | grep -v '^A  _vendor/'
git commit -m "feat: 配置 hugo-book 站点并迁入 5 篇电工笔记"
```

预期：暂存内容包含 `hugo.toml`、`content/`、`.gitignore`（修改）、删除的 5 个根目录 md 与 `themes/`。

---

### Task 2: 新建笔记模板（archetype）

**Files:**
- Create: `archetypes/docs.md`

**Interfaces:**
- Consumes: `content/docs/` 章节（Task 1）。
- Produces: `hugo new content docs/posts/<slug>.md` 生成含 `title`、`weight: 10`、`draft: false`、`bookHidden: false` 的 front matter；不含 `date`（避免每次新建都带上当天日期）。

- [ ] **Step 1: 写失败测试**

```bash
cd "C:/Users/id654/Desktop/Electric/StudyNote"
hugo new content docs/posts/__test_archetype.md >/dev/null
grep -qE '^draft: false$' content/docs/posts/__test_archetype.md && echo PASS || echo FAIL
grep -qE '^  bookHidden: false$' content/docs/posts/__test_archetype.md && echo PASS || echo FAIL
rm -f content/docs/posts/__test_archetype.md
```

预期：两次 `FAIL` —— 当前 `archetypes/default.md` 生成 `draft = true`，`bookHidden` 被注释掉。

- [ ] **Step 2: 写 `archetypes/docs.md`**

```markdown
---
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
weight: 10
draft: false
params:
  bookHidden: false
  # bookCollapseSection: false
  # bookIcon: ''
  # bookHref: ''
---
```

- [ ] **Step 3: 测试通过**

```bash
hugo new content docs/posts/__test_archetype.md >/dev/null
grep -qE '^draft: false$' content/docs/posts/__test_archetype.md && echo PASS || echo FAIL
grep -qE '^  bookHidden: false$' content/docs/posts/__test_archetype.md && echo PASS || echo FAIL
cat content/docs/posts/__test_archetype.md
rm -f content/docs/posts/__test_archetype.md
hugo --gc --minify --logLevel warn 2>&1 | grep -cE 'ERROR|WARN'
```

预期：两次 `PASS`，生成内容与上面文件一致，最后计数 `0`。

- [ ] **Step 4: 提交**

```bash
git add archetypes/docs.md
git commit -m "chore: 新增 docs archetype"
```

---

### Task 3: 中文界面文案与中文字体（Review Focus 3）

**Files:**
- Create: `i18n/zh.yaml`
- Create: `assets/styles/custom.css`

**Interfaces:**
- Consumes: 主题 `layouts/_partials/docs/text/i18n.html` 调用 `i18n .`；主题 `assets/styles/index.yaml` 声明 `custom.css` 最后加载；主题 `zh.yaml` 已有 `Search` / `Edit this page` / `Last modified by`。
- Produces: `<html>` 中出现 `aria-label="目录"`、`alt="图标"`；内容区域使用中文字体栈。

- [ ] **Step 1: 写失败测试**

```bash
cd "C:/Users/id654/Desktop/Electric/StudyNote"
hugo --gc --minify >/dev/null 2>&1
grep -o 'aria-label="Table of Contents"' public/docs/posts/power-basics/index.html | head -1
grep -rl 'Microsoft YaHei' public --include='*.css' | head -1; echo "font-grep-done"
grep -o 'aria-label="搜索"' public/docs/posts/power-basics/index.html | head -1
```

预期：第一条输出英文 `aria-label="Table of Contents"`；第二条无输出（无中文字体）；第三条输出 `aria-label="搜索"`（主题自带 zh 翻译，作为「翻译机制本身可用」的对照组）。

- [ ] **Step 2: 写 `i18n/zh.yaml`（只补主题缺失的键）**

```yaml
- id: Table of Contents
  translation: 目录

- id: Link
  translation: 链接

- id: Logo
  translation: 图标

- id: Menu
  translation: 菜单

- id: Thumbnail
  translation: 缩略图

- id: Breadcrumbs
  translation: 面包屑导航
```

- [ ] **Step 3: 写 `assets/styles/custom.css`**

```css
/* 只追加中文优先字体，不覆盖主题其他变量 */
.book-page,
.book-menu,
.book-toc {
  font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC",
    "Source Han Sans SC", system-ui, sans-serif;
}
```

- [ ] **Step 4: 测试通过**

```bash
hugo --gc --minify --logLevel warn 2>&1 | tee /tmp/build.log; echo "exit=${PIPESTATUS[0]}"
grep -cE 'ERROR|WARN' /tmp/build.log
grep -o 'aria-label="目录"' public/docs/posts/power-basics/index.html | head -1
grep -rl 'Microsoft YaHei' public --include='*.css' | head -1
grep -o 'aria-label="搜索"' public/docs/posts/power-basics/index.html | head -1
```

预期：`exit=0`、计数 `0`、输出 `aria-label="目录"`、找到一个含 `Microsoft YaHei` 的 css、`aria-label="搜索"` 仍存在。

- [ ] **Step 5: 提交**

```bash
git add i18n/zh.yaml assets/styles/custom.css
git commit -m "feat: 中文界面文案与中文字体"
```

---

### Task 4: 完整验收（HTTP、搜索索引、子路径）

**Files:**
- 无新增；任一断言失败则回到对应任务修复后，从头重跑本任务。

**Interfaces:**
- Consumes: Task 1~3 全部产物。
- Produces: spec §6 的验收证据。

- [ ] **Step 1: 干净构建**

```bash
cd "C:/Users/id654/Desktop/Electric/StudyNote"
rm -rf public resources/_gen
hugo --gc --minify --logLevel warn 2>&1 | tee /tmp/build.log; echo "exit=${PIPESTATUS[0]}"
grep -cE 'ERROR|WARN' /tmp/build.log
ls public/index.html public/docs/index.html public/docs/posts/{power-basics,multimeter,circuit-breaker,contactor,relay}/index.html | wc -l
ls public | grep -i search
```

预期：`exit=0`、计数 `0`、文件数 `7`、`search` 相关文件存在（按实际输出记录文件名）。

- [ ] **Step 2: 启动服务并实际请求（含空笔记页与侧边栏链接，Review Focus 2）**

```bash
hugo server -D --port 1313 --bind 127.0.0.1 >/tmp/hugo-server.log 2>&1 &
SRV=$!
for i in $(seq 1 30); do curl -s -o /dev/null http://127.0.0.1:1313/ && break; sleep 1; done
for u in / /docs/ /docs/posts/power-basics/ /docs/posts/relay/; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:1313$u") $u"
done
curl -s http://127.0.0.1:1313/docs/posts/power-basics/ | grep -o '<title>[^<]*</title>'
python - <<'PY'
import re, urllib.request
html = urllib.request.urlopen("http://127.0.0.1:1313/docs/").read().decode()
menu = html.split('class="book-menu-content"', 1)[1].split("</aside>", 1)[0]
for t in ["空气开关", "接触器", "继电器"]:
    ok = re.search(r'<a href="/docs/posts/[^"]+"[^>]*>\s*' + t, menu)
    print(("CLICKABLE " if ok else "NOT-CLICKABLE ") + t)
PY
kill $SRV
```

预期：四行均 `200`；title 为 `电力基础 • 电工学习笔记`；三行都是 `CLICKABLE`。

若出现 `NOT-CLICKABLE`：该页正文渲染为空（hugo-book 对空页面不生成链接）。修复方式：在该笔记正文末尾追加提示块

```markdown
{{< hint info >}}
**待整理**：这一篇还没有内容，之后补充。
{{< /hint >}}
```

（正文若有标题则放在标题之后；不改动原有内容。）然后重跑本任务。

- [ ] **Step 3: 子路径部署冒烟（Review Focus 5）**

```bash
hugo --gc --minify --baseURL https://example.com/notes/ -d /tmp/public-sub --logLevel warn 2>&1 | tee /tmp/sub.log; echo "exit=${PIPESTATUS[0]}"
grep -cE 'ERROR|WARN' /tmp/sub.log
grep -o 'href="/notes/css/[^"]*"' /tmp/public-sub/docs/posts/power-basics/index.html | head -1
grep -o 'href="/notes/docs/[^"]*"' /tmp/public-sub/docs/index.html | head -1
```

预期：`exit=0`、计数 `0`，出现 `/notes/css/...` 与 `/notes/docs/...` 前缀。

- [ ] **Step 4: 记录结果**

把以上输出贴进回复作为证据。任一项不符：回到相关任务修复，再从头重跑本任务。

---

### Task 5: README 与收尾提交

**Files:**
- Create: `README.md`
- Verify: `.gitignore`

**Interfaces:**
- Consumes: Task 1~4 产物。
- Produces: 用户照着执行的命令说明。

- [ ] **Step 1: 写 `README.md`**

内容为以下完整文本（内层代码围栏用四个反引号包裹以保证嵌套正确）：

````markdown
# 电工学习笔记

基于 Hugo + [hugo-book](https://github.com/alex-shpak/hugo-book) 的中文笔记站。

## 预览

```bash
hugo server -D      # 打开 http://localhost:1313
```

## 构建

```bash
hugo mod vendor       # 只有主题文件变动时才需要
hugo --gc --minify    # 产物在 public/
```

## 写新笔记

```bash
hugo new content docs/posts/your-slug.md
```

- 文件名用英文 slug；编辑 front matter 的 `title`（中文）和 `weight`（侧边栏排序，数字小的在上）
- 隐藏某一页：`bookHidden: true`；折叠某个小节：`bookCollapseSection: true`
- 图片放到 `static/images/`，正文写 `![说明](/images/xxx.png)`
- 可用短代码：`hint`、`tabs`、`columns`、`details`、`steps`、`mermaid`、`katex`，写法见主题仓库 README

## 主题升级

```bash
# 1. 修改 go.mod 中 github.com/alex-shpak/hugo-book 的版本
go mod download
rm -rf _vendor && hugo mod vendor
hugo --gc --minify    # 确认无 ERROR / WARN
```

## 部署

`hugo.toml` 的 `baseURL` 现为 `/`（适合本地与站点根路径）。

- 部署到独立域名/根路径：改为 `https://your.domain/`
- 部署到 GitHub Pages 项目页（子路径）：改为 `https://<user>.github.io/<repo>/`

```bash
hugo --gc --minify --baseURL https://<user>.github.io/<repo>/
```

把 `public/` 推到 Pages 即可。

## 目录说明

| 路径 | 说明 |
|---|---|
| `content/docs/posts/` | 正文笔记，侧边栏按 `weight` 排序 |
| `content/docs/_index.md` | 「目录」章节页 |
| `content/_index.md` | 首页 |
| `_vendor/` | 已 vendor 的 hugo-book 主题（随仓库提交，离线可构建） |
| `_backup-原始笔记/` | 迁站前的原始 Markdown 备份（未提交，确认无误后可删） |
````

- [ ] **Step 2: 校验 `.gitignore` 与仓库状态**

```bash
cd "C:/Users/id654/Desktop/Electric/StudyNote"
cat .gitignore
git status --short --ignored | grep '^!!'
```

预期：`.gitignore` 含 `public/`、`resources/_gen/`、`.hugo_build.lock`、`_backup-原始笔记/`；忽略列表中出现 `public/` 与 `_backup-原始笔记/`。缺项则补上并在此步骤说明。

- [ ] **Step 3: 最终构建并提交**

```bash
hugo --gc --minify --logLevel warn 2>&1 | grep -cE 'ERROR|WARN'
git add -A
git status --short
git commit -m "docs: 补充站点 README"
git log --oneline
```

预期：计数 `0`；提交只包含 `README.md`；日志列出本计划各任务的提交。**不删除** `_backup-原始笔记/` —— 由用户确认后自行删除。

---

## Self-Review

- **Spec 覆盖**：§3 布局 → Task 1；§4 配置/模块/archetype/删除 `themes/` → Task 1 Step 1、Step 4，Task 2；§5 日常流程 → README（Task 5）；§6 验证 1~5 条 → Task 1 Step 7（构建、页面、顺序、迁移一致）、Task 3 Step 4（中文文案）、Task 4 Step 2（HTTP）；§7 收尾 → Task 1 Step 8、Task 5。
- **与 spec 的显式偏离**（spec 未预见的平台事实，理由在对应任务中）：用 `defaultContentLanguage = 'zh'` 替代已移除的 `locale`/`languageCode`；配置与内容合并进 Task 1（`BookSection` 缺失会直接构建失败）；笔记统一放在 `content/docs/posts/`。
- **占位符扫描**：无 TBD/TODO；每个代码步骤给出完整命令或完整文件内容。
- **类型一致性**：slug 集合 `power-basics / multimeter / circuit-breaker / contactor / relay` 在 Task 1、Task 4 一致；路径 `/docs/posts/<slug>/` 全文一致；`BookSection = 'docs'` 与 `content/docs/` 一致。
- **Review Focus 落点**：1 → Task 1 Step 3；2 → Task 1 Step 7 + Task 4 Step 2；3 → Task 3；4 → Task 1 Step 7、Task 2 Step 3；5 → Task 4 Step 3、Task 5 README。
