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

## 部署

构建命令:
```
hugo --gc --minify
```
构建输出:`public`
设置变量:```HUGO_VERSION```: ```0.158.0```






