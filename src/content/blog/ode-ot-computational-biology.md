---
title: "ODE + OT：计算生物学最硬核的方向"
description: "深入探讨微分方程（ODE）与最优传输（OT）在单细胞生物学中的应用，这是当前计算生物学最有前景的发展方向之一。"
pubDate: 2026-05-30
author: "YMLL"
tags: ["计算生物学", "单细胞", "ODE", "最优传输", "生物信息学"]
category: "计算生物学"
draft: false
featured: true
featuredOrder: 1
maturity: evergreen
growthLog:
  - date: 2026-06-18
    summary: 补充 ODE 与最优传输的建模边界
  - date: 2026-07-22
    summary: 增加单细胞轨迹推断的实践说明
  - date: 2026-08-11
    summary: 重构全文论证结构并更新研究方向
lang: "zh-CN"
---

## 为什么 ODE + OT 是计算生物学最硬核的方向？

在现代计算生物学和单细胞领域，**ODE（常微分方程）** 管动态过程的演化机制，**OT（最优传输）** 管群体分布的对齐与迁移。两者结合完美契合了现代生信的核心数据特性——**高维快照 + 时间连续性 + 群体异质性**。

### 生物学的本质需求

生物不是静态的聚类结果，也不是孤立的单个细胞，而是**随时间连续演化的概率群体**。传统 Seurat/Scanpy + PCA/UMAP 的静态分析已经越来越不够用了。顶刊现在普遍要求你回答：

1. 这个过程**怎么连续变化**的（ODE/Neural ODE）？
2. 不同时间/条件下的**群体是怎么整体迁移**的（OT/Wasserstein）？
3. 如何同时建模**个体轨迹 + 群体异质性**？

---

## 方法学上的互补性

### ODE 的优势

ODE 提供**机理性和可预测性**：

- 可解释、参数有生物意义
- 能做未来外推
- 适合建模连续时间动态

**基本形式：**

$$
\frac{dy}{dt} = f(y, t, \theta)
$$

**Neural ODE：用神经网络学习 $f$**

$$
\frac{dy}{dt} = \text{NeuralNet}(y, t, \theta)
$$

### OT 的优势

OT 提供**分布层面的全局最优性**：

- 处理无配对数据
- 质量不守恒问题
- 跨模态对齐非常自然

**Wasserstein 距离定义：**

$$
W_p(\mu, \nu) = \left( \inf_{\gamma \in \Gamma(\mu, \nu)} \int_{X \times Y} d(x, y)^p \, d\gamma(x, y) \right)^{1/p}
$$

其中：
- $\mu, \nu$ 是两个概率分布
- $\Gamma(\mu, \nu)$ 是所有联合分布的集合
- $d(x, y)$ 是距离函数

### 结合后的威力

结合后（如 Neural ODE + OT、动态势场 + OT、TIGON 类方法）能同时实现：

- ✅ 轨迹重建
- ✅ 速率估计
- ✅ 扰动预测
- ✅ 关键转变点检测

这几乎是当前最优雅的框架。

---

## 为什么这个方向特别强？

### 1. 抓住了生物学的本质

单细胞数据本质上是：
- **高维**：数万个基因
- **快照**：大多数情况下只能获取时间点的切片
- **异质性**：同一时间点的细胞处于不同状态

### 2. 工业界和顶刊的双重驱动

**顶刊表现**（2023-2026）：
- Nature Methods
- Cell Systems
- Nature Biotech
- Genome Biology

单细胞动态建模相关论文中，带 OT 或微分方程背景的占比非常高。

**药企需求**：
- 靶点发现
- 药物响应预测
- 疾病建模

药企特别喜欢这种**可解释 + 可预测**的框架，比纯 Transformer/扩散模型黑盒要安全得多。

---

## 核心方法分类

### OT 类方法

| 方法 | 特点 | 应用场景 |
|------|------|---------|
| **Waddington-OT** | 经典 OT 框架 | 发育轨迹推断 |
| **CellOT** | 细胞级别对齐 | 药物响应预测 |
| **moscot** | 多组学 OT | 空间转录组 |
| **Gromov-Wasserstein** | 无配对对齐 | 跨模态数据 |

### ODE 类方法

| 方法 | 特点 | 应用场景 |
|------|------|---------|
| **Dynamo** | 速度场估计 | RNA 速率 |
| **Neural ODE** | 神经网络 + ODE | 复杂动态 |
| **Flow Matching** | 连续归一化流 | 生成模型 |
| **TIGON** | ODE + OT 结合 | 综合分析 |

---

## 数学基础速览

### 最优传输的直观理解

想象你有两堆沙子（分布 $\mu$ 和 $\nu$），OT 找到的是**搬运成本最小**的方案。

**离散形式：**

$$
W(\mu, \nu) = \min_{T} \sum_{i,j} T_{ij} \cdot c(x_i, y_j)
$$

约束条件：
$$
\sum_j T_{ij} = \mu_i, \quad \sum_i T_{ij} = \nu_j
$$

### Sinkhorn 算法

为了让 OT 可微且高效，引入熵正则化：

$$
W_\varepsilon(\mu, \nu) = \min_{T} \sum_{i,j} T_{ij} \cdot c(x_i, y_j) + \varepsilon \cdot H(T)
$$

其中 $H(T) = -\sum_{i,j} T_{ij} \log T_{ij}$ 是熵。

这可以用 Sinkhorn 迭代高效求解：

```python
# Sinkhorn 算法伪代码
def sinkhorn(cost_matrix, mu, nu, epsilon, num_iters):
    K = np.exp(-cost_matrix / epsilon)
    u = np.ones_like(mu)
    
    for _ in range(num_iters):
        v = nu / (K.T @ u)
        u = mu / (K @ v)
    
    return np.diag(u) @ K @ np.diag(v)
```

### Neural ODE 的数学

传统神经网络是离散层：
$$
h_{t+1} = h_t + f(h_t, \theta_t)
$$

Neural ODE 将其连续化：
$$
\frac{dh}{dt} = f(h(t), t, \theta)
$$

用 ODE 求解器（如 Runge-Kutta）求解：
$$
h(T) = h(0) + \int_0^T f(h(t), t, \theta) \, dt
$$

---

## 实战建议

### 入门路径（1-2 周）

**第 1 周：理解基础概念**

1. **Wasserstein 距离**
   - 直观理解：搬运成本
   - 计算方法：线性规划、Sinkhorn
   
2. **ODE 基础**
   - 基本形式和求解
   - 稳定性和平衡点

3. **学习资源**
   - 📖 Computational Optimal Transport (Peyré & Cuturi)
   - 📖 Neural ODE 论文 (Chen et al., NeurIPS 2018)

**第 2 周：动手实践**

```python
# 安装必要库
pip install torchdiffeq pot

# 实现简单的 Neural ODE
import torch
from torchdiffeq import odeint

class ODEFunc(torch.nn.Module):
    def __init__(self):
        super().__init__()
        self.net = torch.nn.Sequential(
            torch.nn.Linear(2, 50),
            torch.nn.ReLU(),
            torch.nn.Linear(50, 2)
        )
    
    def forward(self, t, y):
        return self.net(y)

# 训练
func = ODEFunc()
y0 = torch.randn(1, 2)
t = torch.linspace(0, 1, 100)
trajectory = odeint(func, y0, t)
```

### 进阶路径（1-2 月）

**阅读核心论文**

1. Waddington-OT (Schiebinger et al., Cell 2019)
2. Dynamo (Qiu et al., Cell 2022)
3. TIGON (Zhang et al., Nature Methods 2024)

**复现实验**

```python
# 使用 moscot 处理真实数据
import moscot as mt
import scanpy as sc

# 加载数据
adata = sc.read("your_data.h5ad")

# 创建 OT 问题
problem = mt.problems.TrajectoryProblem(adata)

# 求解
problem.solve()

# 获取传输映射
transport_map = problem.solution
```

### 实战路径（3-6 月）

1. **改进现有方法**
   - 结合 GNN 处理图结构数据
   - 引入几何先验

2. **发论文**
   - 顶刊偏好：方法创新 + 生物洞见
   - 工程优化：大规模数据处理

---

## 必读核心论文清单

### 入门必读（5 篇）

| # | 论文 | 作者 | 年份 | 理由 |
|---|------|------|------|------|
| 1 | Computational Optimal Transport | Peyré & Cuturi | 2019 | OT 领域的圣经 |
| 2 | Neural Ordinary Differential Equations | Chen et al. | 2018 | 开创性工作 |
| 3 | Waddington-OT | Schiebinger et al. | 2019 | OT 在生信的经典应用 |
| 4 | RNA velocity of single cells | La Manno et al. | 2018 | 理解动态建模的基础 |
| 5 | CellOT | Bunne et al. | 2023 | OT 在药物响应预测的突破 |

### 进阶必读（5 篇）

| # | 论文 | 作者 | 年份 | 理由 |
|---|------|------|------|------|
| 6 | Dynamo | Qiu et al. | 2022 | 速度场估计的里程碑 |
| 7 | moscot | Klein et al. | 2023 | 多组学 OT 框架 |
| 8 | TIGON | Zhang et al. | 2024 | ODE + OT 结合的最新突破 |
| 9 | Flow Matching for Generative Modeling | Lipman et al. | 2023 | 连续归一化流的新范式 |
| 10 | Gromov-Wasserstein Distances | Memoli | 2011 | 无配对对齐的理论基础 |

### 前沿必读（5 篇）

| # | 论文 | 作者 | 年份 | 理由 |
|---|------|------|------|------|
| 11 | Manifold Interpolating Optimal-Transport | Thornton et al. | 2023 | 流形上的 OT |
| 12 | Stochastic Interpolants | Albergo et al. | 2023 | 概率生成的新框架 |
| 13 | OT-based trajectory inference | Lavenant et al. | 2024 | 不确定性量化 |
| 14 | Neural CDE for Irregular Time Series | Kidger et al. | 2020 | 处理不规则时间序列 |
| 15 | Geometric Neural ODE | Mathieu et al. | 2020 | 几何结构保持 |

---

## 代码实现示例

### OT 传输映射可视化

```python
import numpy as np
import matplotlib.pyplot as plt
import ot

# 生成源分布和目标分布
np.random.seed(42)
n = 100

# 源分布：两个高斯
X = np.vstack([
    np.random.randn(n//2, 2) + [0, 0],
    np.random.randn(n//2, 2) + [3, 3]
])

# 目标分布：两个高斯
Y = np.vstack([
    np.random.randn(n//2, 2) + [5, 0],
    np.random.randn(n//2, 2) + [2, 3]
])

# 计算 OT 映射
a = np.ones(n) / n
b = np.ones(n) / n
M = ot.dist(X, Y)
T = ot.emd(a, b, M)

# 可视化
plt.figure(figsize=(10, 5))
plt.subplot(121)
plt.scatter(X[:, 0], X[:, 1], c='blue', label='Source')
plt.scatter(Y[:, 0], Y[:, 1], c='red', label='Target')
plt.legend()

plt.subplot(122)
plt.imshow(T, cmap='Blues')
plt.title('Transport Map')
plt.xlabel('Target')
plt.ylabel('Source')
plt.colorbar()
plt.show()
```

### Neural ODE 训练

```python
import torch
import torch.nn as nn
from torchdiffeq import odeint

class NeuralODE(nn.Module):
    def __init__(self, dim):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(dim, 64),
            nn.Tanh(),
            nn.Linear(64, 64),
            nn.Tanh(),
            nn.Linear(64, dim)
        )
    
    def forward(self, t, y):
        return self.net(y)

# 训练循环
def train_neural_ode(model, y0, target, t_span, epochs=1000):
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
    
    for epoch in range(epochs):
        optimizer.zero_grad()
        
        # 前向传播
        pred = odeint(model, y0, t_span)[-1]
        
        # 计算损失
        loss = nn.MSELoss()(pred, target)
        
        # 反向传播
        loss.backward()
        optimizer.step()
        
        if epoch % 100 == 0:
            print(f"Epoch {epoch}, Loss: {loss.item():.4f}")
```

---

## 潜在风险与注意点

### 1. 数学门槛较高

纯数学推导门槛不低，容易陷入"为了数学而数学"。生信里最值钱的还是**生物洞见驱动**的建模，而不是把 Wasserstein 距离刷得特别漂亮。

### 2. 计算开销大

Sinkhorn、连续模型训练等计算开销较大，工业落地时需要工程优化：
- GPU 加速
- 近似算法
- 分布式训练

### 3. 数据质量依赖

OT 对数据质量敏感：
- 批次效应
- 缺失值
- 噪声

**解决方案：**
- 数据预处理
- 正则化
- 鲁棒性设计

---

## 未来展望

### 三者融合

未来更强的可能是**三者融合**：

$$
\text{OT} + \text{Neural ODE} + \text{GNN} \rightarrow \text{更强大的框架}
$$

### 工业应用

- 药物发现
- 精准医疗
- 细胞治疗

---

## 总结

**强烈推荐深耕**。这个方向兼具**学术深度 + 实际应用价值**，是少数能同时让 PI 兴奋、让药企买单、又能发高分的方向。

**干就对了。** 🚀

---

## 参考资源

- [Computational Optimal Transport](https://optimaltransport.github.io/)
- [moscot Documentation](https://moscot.readthedocs.io/)
- [dynamo-tutorials](https://dynamo-release.readthedocs.io/)
- [torchdiffeq](https://github.com/rtqichen/torchdiffeq)
