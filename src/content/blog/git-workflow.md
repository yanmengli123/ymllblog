---
title: "Git 工作流最佳实践"
description: "掌握 Git Flow、GitHub Flow 等工作流，提升团队协作效率。"
pubDate: 2023-12-15
author: "YMLL"
tags: ["Git", "工具", "协作"]
category: "开发工具"
draft: false
featured: false
lang: "zh-CN"
---

## 为什么需要 Git 工作流？

一个好的 Git 工作流可以：

- **减少冲突** - 清晰的分支策略
- **提高效率** - 标准化的流程
- **保证质量** - 代码审查机制
- **便于回滚** - 清晰的版本历史

## Git Flow

Git Flow 是最经典的分支策略：

```
main (生产)
  ↑
  ├── develop (开发)
  │     ↑
  │     ├── feature/xxx (功能)
  │     ├── feature/yyy
  │     ↓
  │   release/v1.0 (发布)
  │     ↑
  └─────┘
  
hotfix/xxx (热修复)
```

### 分支说明

| 分支 | 用途 | 生命周期 |
|------|------|---------|
| main | 生产环境代码 | 永久 |
| develop | 开发主线 | 永久 |
| feature/* | 新功能开发 | 临时 |
| release/* | 发布准备 | 临时 |
| hotfix/* | 紧急修复 | 临时 |

## GitHub Flow

GitHub Flow 更简单，适合持续部署：

1. 从 `main` 创建分支
2. 开发并提交
3. 创建 Pull Request
4. 代码审查
5. 合并到 `main`
6. 自动部署

```bash
# 创建功能分支
git checkout -b feature/new-feature main

# 开发并提交
git add .
git commit -m "feat: add new feature"

# 推送并创建 PR
git push origin feature/new-feature

# 合并后删除分支
git branch -d feature/new-feature
```

## 提交规范

使用 Conventional Commits 规范：

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### 类型说明

| 类型 | 说明 |
|------|------|
| feat | 新功能 |
| fix | 修复 bug |
| docs | 文档更新 |
| style | 代码格式（不影响功能） |
| refactor | 重构 |
| perf | 性能优化 |
| test | 测试相关 |
| chore | 构建/工具 |

### 示例

```bash
git commit -m "feat(blog): add article search functionality"
git commit -m "fix(header): mobile menu not closing"
git commit -m "docs: update README with setup instructions"
```

## 代码审查最佳实践

### 审查者

- 及时响应（24小时内）
- 给出建设性反馈
- 关注逻辑而非风格
- 使用 "Suggestions" 功能

### 提交者

- PR 保持小而专注
- 写清楚的描述
- 自己先审查一遍
- 及时回复评论

## 总结

选择适合团队的工作流很重要。对于个人项目，GitHub Flow 通常足够；对于大型团队，Git Flow 可能更合适。关键是保持一致，并养成良好的提交习惯。
