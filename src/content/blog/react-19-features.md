---
title: "React 19 新特性抢先看"
description: "探索 React 19 带来的革命性特性，包括 Server Components、Actions 和新的 Hooks。"
pubDate: 2024-01-05
author: "YMLL"
tags: ["React", "前端", "JavaScript"]
category: "前端工程"
cover: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80"
draft: false
featured: true
lang: "zh-CN"
---

## React 19 的重大更新

React 19 带来了许多令人兴奋的新特性，让我们一一探索。

## Server Components

Server Components 允许组件在服务端渲染，减少客户端 JavaScript：

```tsx
// 这个组件只在服务端运行
async function BlogPost({ id }) {
  const post = await db.posts.find(id);
  
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

### 优势

- **零客户端 JS** - 服务端组件不发送 JS 到浏览器
- **直接数据访问** - 可以直接访问数据库、文件系统
- **自动代码分割** - 客户端组件按需加载

## Actions

Actions 是处理表单和数据变更的新方式：

```tsx
function UpdateName() {
  const [name, setName] = useState('');
  
  async function updateName() {
    const error = await updateNameInDB(name);
    if (error) {
      return { error };
    }
    redirect('/profile');
  }
  
  return (
    <form action={updateName}>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      <button type="submit">Update</button>
    </form>
  );
}
```

## 新的 Hooks

### useActionState

```tsx
const [state, formAction, isPending] = useActionState(
  async (prevState, formData) => {
    const result = await updateName(formData.get('name'));
    return result;
  },
  null
);
```

### useFormStatus

```tsx
function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button disabled={pending}>
      {pending ? '提交中...' : '提交'}
    </button>
  );
}
```

### useOptimistic

```tsx
const [optimisticMessages, addOptimistic] = useOptimistic(
  messages,
  (state, newMessage) => [...state, { text: newMessage, sending: true }]
);
```

## 总结

React 19 的这些新特性让我们的应用更高效、更易维护。Server Components 减少了客户端 JavaScript，Actions 简化了数据变更，新的 Hooks 提供了更好的状态管理。
