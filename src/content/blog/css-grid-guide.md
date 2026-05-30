---
title: "CSS Grid 布局完全指南"
description: "掌握 CSS Grid 二维布局系统，创建复杂的响应式布局。"
pubDate: 2023-11-15
author: "YMLL"
tags: ["CSS", "布局", "前端"]
category: "前端工程"
draft: false
featured: false
lang: "zh-CN"
---

## CSS Grid vs Flexbox

| 特性 | CSS Grid | Flexbox |
|------|----------|---------|
| 维度 | 二维布局 | 一维布局 |
| 用途 | 整体页面布局 | 组件内部布局 |
| 对齐 | 行和列 | 主轴或交叉轴 |
| 复杂度 | 适合复杂布局 | 适合简单布局 |

## 基础概念

### 容器属性

```css
.container {
  display: grid;
  
  /* 定义列 */
  grid-template-columns: 200px 1fr 200px;
  
  /* 定义行 */
  grid-template-rows: auto 1fr auto;
  
  /* 间距 */
  gap: 20px;
  
  /* 对齐 */
  justify-items: center;
  align-items: center;
}
```

### fr 单位

```css
/* 三等分布局 */
grid-template-columns: 1fr 1fr 1fr;

/* 混合布局 */
grid-template-columns: 200px 1fr 200px;

/* 比例布局 */
grid-template-columns: 2fr 1fr;
```

## 常见布局模式

### 圣杯布局

```css
.layout {
  display: grid;
  grid-template-areas:
    "header header header"
    "nav    main   aside"
    "footer footer footer";
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

.header { grid-area: header; }
.nav { grid-area: nav; }
.main { grid-area: main; }
.aside { grid-area: aside; }
.footer { grid-area: footer; }
```

### 响应式卡片网格

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}
```

### 十二列网格

```css
.grid-12 {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;
}

.col-6 { grid-column: span 6; }
.col-4 { grid-column: span 4; }
.col-3 { grid-column: span 3; }
```

## 高级技巧

### 自动填充和自动适应

```css
/* 自动填充 - 尽可能多的列 */
grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));

/* 自动适应 - 根据容器大小调整 */
grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
```

### 命名线

```css
.container {
  grid-template-columns: 
    [full-start] minmax(1em, 1fr)
    [main-start] minmax(0, 40em) [main-end]
    minmax(1em, 1fr) [full-end];
}

.main {
  grid-column: main;
}
```

### 子网格

```css
.parent {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.child {
  display: grid;
  grid-column: span 2;
  grid-template-columns: subgrid;
}
```

## 实战示例

### 博客布局

```astro
---
import Header from './Header.astro';
import Sidebar from './Sidebar.astro';
import PostList from './PostList.astro';
import Footer from './Footer.astro';
---

<div class="blog-layout">
  <Header />
  <main>
    <PostList />
    <Sidebar />
  </main>
  <Footer />
</div>

<style>
  .blog-layout {
    display: grid;
    grid-template-rows: auto 1fr auto;
    min-height: 100vh;
  }
  
  main {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  @media (max-width: 768px) {
    main {
      grid-template-columns: 1fr;
    }
  }
</style>
```

## 总结

CSS Grid 是现代 CSS 布局的利器。它让我们可以用简洁的代码实现复杂的布局，而且天然支持响应式设计。建议在新项目中优先考虑 CSS Grid，特别是在需要二维布局的场景下。
