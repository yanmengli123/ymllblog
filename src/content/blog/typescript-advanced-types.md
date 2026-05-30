---
title: "TypeScript 高级类型体操"
description: "深入 TypeScript 类型系统，掌握泛型、条件类型、映射类型等高级特性。"
pubDate: 2023-12-28
author: "YMLL"
tags: ["TypeScript", "类型系统"]
category: "前端工程"
draft: false
featured: false
lang: "zh-CN"
---

## 为什么需要高级类型？

TypeScript 的类型系统不仅仅是 `string`、`number` 这些基础类型。掌握高级类型可以：

- 提供更精确的类型推断
- 减少运行时错误
- 提升代码可读性和可维护性

## 泛型基础

```typescript
// 基础泛型
function identity<T>(arg: T): T {
  return arg;
}

// 泛型约束
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

## 条件类型

```typescript
// 基础条件类型
type IsString<T> = T extends string ? true : false;

type A = IsString<string>; // true
type B = IsString<number>; // false

// 分布式条件类型
type ToArray<T> = T extends any ? T[] : never;

type C = ToArray<string | number>; // string[] | number[]
```

## 映射类型

```typescript
// 将所有属性变为可选
type Partial<T> = {
  [P in keyof T]?: T[P];
};

// 将所有属性变为只读
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// 实际应用
interface User {
  name: string;
  age: number;
  email: string;
}

type PartialUser = Partial<User>;
// { name?: string; age?: number; email?: string; }
```

## 模板字面量类型

```typescript
type EventName = 'click' | 'scroll' | 'mousemove';
type HandlerName = `on${Capitalize<EventName>}`;
// 'onClick' | 'onScroll' | 'onMousemove'
```

## 实用工具类型

```typescript
// Pick - 选择部分属性
type UserBasic = Pick<User, 'name' | 'email'>;

// Omit - 排除部分属性
type UserWithoutAge = Omit<User, 'age'>;

// Record - 创建键值对类型
type UserRoles = Record<string, 'admin' | 'user' | 'guest'>;

// Extract - 从联合类型中提取
type T0 = Extract<'a' | 'b' | 'c', 'a' | 'f'>; // 'a'

// Exclude - 从联合类型中排除
type T1 = Exclude<'a' | 'b' | 'c', 'a'>; // 'b' | 'c'
```

## 总结

TypeScript 的高级类型系统是一把双刃剑。合理使用可以大大提升代码质量，但过度使用会导致代码难以理解。建议在实际项目中，根据需求适度使用这些高级特性。
