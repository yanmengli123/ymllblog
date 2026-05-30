---
title: "Framer Motion 动效实战"
description: "使用 Framer Motion 创建流畅的用户界面动画，提升用户体验。"
pubDate: 2023-12-20
author: "YMLL"
tags: ["Framer Motion", "React", "动效"]
category: "前端工程"
draft: false
featured: false
lang: "zh-CN"
---

## 为什么选择 Framer Motion？

Framer Motion 是 React 生态中最受欢迎的动画库之一：

- **声明式 API** - 简单直观
- **物理动画** - 基于真实的物理模型
- **手势支持** - 拖拽、点击、悬停
- **布局动画** - 自动处理布局变化

## 基础动画

```tsx
import { motion } from 'framer-motion';

function Box() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      Hello, Framer Motion!
    </motion.div>
  );
}
```

## 交错动画

```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function List() {
  return (
    <motion.ul variants={container} initial="hidden" animate="show">
      <motion.li variants={item}>Item 1</motion.li>
      <motion.li variants={item}>Item 2</motion.li>
      <motion.li variants={item}>Item 3</motion.li>
    </motion.ul>
  );
}
```

## 悬停和点击动画

```tsx
function Card() {
  return (
    <motion.div
      whileHover={{ 
        scale: 1.05,
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      悬停我试试
    </motion.div>
  );
}
```

## 滚动触发动画

```tsx
import { useInView } from 'framer-motion';
import { useRef } from 'react';

function AnimatedSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      滚动到这里时我会出现
    </motion.div>
  );
}
```

## 布局动画

```tsx
function LayoutAnimation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div layout>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && (
        <motion.div
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          内容
        </motion.div>
      )}
    </motion.div>
  );
}
```

## 在 Astro 中使用

在 Astro 中使用 Framer Motion 需要创建 React 岛屿：

```tsx
// AnimatedCard.tsx
import { motion } from 'framer-motion';

export default function AnimatedCard({ children }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {children}
    </motion.div>
  );
}
```

```astro
---
import AnimatedCard from './AnimatedCard.tsx';
---

<AnimatedCard client:load>
  <div>卡片内容</div>
</AnimatedCard>
```

## 总结

Framer Motion 让 React 动画变得简单而强大。从简单的淡入淡出到复杂的布局动画，它都能胜任。在我们的博客中，文章卡片的悬停效果就是使用 Framer Motion 实现的。
