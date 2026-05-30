---
title: "Web 性能优化指南"
description: "从加载速度到运行时性能，全面优化你的 Web 应用。"
pubDate: 2023-11-28
author: "YMLL"
tags: ["性能优化", "前端", "Web"]
category: "前端工程"
draft: false
featured: false
lang: "zh-CN"
---

## 为什么性能很重要？

- **用户体验** - 53% 的用户会放弃加载超过 3 秒的页面
- **SEO 排名** - Google 将页面速度作为排名因素
- **转化率** - 每快 100ms，转化率提升 1%

## Core Web Vitals

Google 的核心性能指标：

| 指标 | 说明 | 目标 |
|------|------|------|
| LCP | 最大内容绘制 | < 2.5s |
| FID | 首次输入延迟 | < 100ms |
| CLS | 累积布局偏移 | < 0.1 |

## 加载优化

### 代码分割

```javascript
// 动态导入
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// 路由级别分割
const Blog = React.lazy(() => import('./pages/Blog'));
const About = React.lazy(() => import('./pages/About'));
```

### 图片优化

```html
<!-- 使用现代格式 -->
<picture>
  <source srcset="image.avif" type="image/avif">
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="..." loading="lazy">
</picture>
```

### 字体优化

```html
<!-- 预加载关键字体 -->
<link rel="preload" href="/fonts/inter.woff2" as="font" crossorigin>

<!-- 使用 font-display: swap -->
<style>
  @font-face {
    font-family: 'Inter';
    src: url('/fonts/inter.woff2') format('woff2');
    font-display: swap;
  }
</style>
```

## 运行时优化

### 虚拟列表

```jsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const parentRef = useRef(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div key={virtualRow.key} style={{
            position: 'absolute',
            top: `${virtualRow.start}px`,
            height: `${virtualRow.size}px`,
          }}>
            {items[virtualRow.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 防抖和节流

```javascript
// 防抖
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 节流
function throttle(fn, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
```

## 构建优化

### Tree Shaking

确保使用 ES 模块：

```javascript
// 好 - 可以 tree shake
import { debounce } from 'lodash-es';

// 不好 - 无法 tree shake
import _ from 'lodash';
```

### 压缩和缓存

```javascript
// vite.config.js
export default {
  build: {
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
};
```

## 总结

性能优化是一个持续的过程。从 Core Web Vitals 入手，逐步优化加载、运行时和构建过程。记住：测量优于猜测，使用 Lighthouse 和 Chrome DevTools 来识别真正的瓶颈。
