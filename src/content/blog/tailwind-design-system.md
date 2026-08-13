---
title: "Tailwind CSS 设计系统最佳实践"
description: "掌握 Tailwind CSS 的设计系统配置，创建一致且可维护的用户界面，提升开发效率。"
pubDate: 2024-01-10
author: "YMLL"
tags: ["Tailwind", "CSS", "设计系统"]
category: "前端工程"
cover: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&q=80"
draft: false
featured: true
featuredOrder: 3
maturity: growing
growthLog:
  - date: 2026-07-16
    summary: 补充设计令牌与组件分层实践
lang: "zh-CN"
---

## 为什么需要设计系统？

设计系统不仅仅是一组颜色和字体，它是：

- **一致性** - 确保整个应用看起来统一
- **可维护性** - 修改一处，全局生效
- **效率** - 减少重复决策，加快开发速度

## Tailwind 配置设计

### 颜色系统

```javascript
// tailwind.config.mjs
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          // ... 更多色阶
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
      },
    },
  },
};
```

### 字体系统

```javascript
fontFamily: {
  sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
  serif: ['Playfair Display', 'Georgia', 'serif'],
  mono: ['Fira Code', 'monospace'],
},
```

### 间距和圆角

保持一致的间距系统（4px 基准）：

```javascript
spacing: {
  '18': '4.5rem',
  '88': '22rem',
},
borderRadius: {
  'sm': '4px',
  'md': '8px',
  'lg': '12px',
  'xl': '16px',
  '2xl': '24px',
},
```

## 组件化实践

### 使用 @apply 创建可复用类

```css
/* global.css */
@layer components {
  .glass {
    @apply bg-white/80 backdrop-blur-xl border border-white/20 
           shadow-lg shadow-black/5;
  }
  
  .gradient-text {
    @apply bg-gradient-to-r from-emerald-600 to-teal-600 
           bg-clip-text text-transparent;
  }
  
  .hover-lift {
    @apply transition-all duration-300 
           hover:-translate-y-1 hover:shadow-xl;
  }
}
```

### 在组件中使用

```astro
<div class="glass rounded-2xl p-6">
  <h2 class="gradient-text text-2xl font-bold">标题</h2>
  <p class="text-stone-600">内容</p>
</div>
```

## 暗色模式

Tailwind 的暗色模式非常简单：

```javascript
// tailwind.config.mjs
export default {
  darkMode: 'class', // 使用 class 策略
};
```

```astro
<html class="dark"> <!-- 或通过 JS 切换 -->
  <body class="bg-white dark:bg-stone-900">
    <h1 class="text-stone-900 dark:text-white">标题</h1>
  </body>
</html>
```

## 总结

Tailwind CSS 的设计系统让我们的开发更加高效和一致。通过合理的配置和组件化，我们可以构建出既美观又易维护的界面。
