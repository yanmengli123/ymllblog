---
title: "ODE + OT：计算生物学最硬核的方向"
description: "深入探讨微分方程（ODE）与最优传输（OT）在单细胞生物学中的应用，这是当前计算生物学最有前景的发展方向之一。"
pubDate: 2026-05-30
author: "YMLL"
tags: ["计算生物学", "单细胞", "ODE", "最优传输", "生物信息学"]
category: "计算生物学"
draft: false
featured: true
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

```python
# 简单的 ODE 示例：细胞分化
dy/dt = f(y, t, θ)

# Neural ODE：用神经网络学习 f
dy/dt = NeuralNet(y, t, θ)
```

### OT 的优势

OT 提供**分布层面的全局最优性**：

- 处理无配对数据
- 质量不守恒问题
- 跨模态对齐非常自然

$$
W_p(\mu, \nu) = \left( \inf_{\gamma \in \Gamma(\mu, \nu)} \int_{X \times Y} d(x, y)^p \, d\gamma(x, y) \right)^{1/p}
$$

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
| **Neural ODE** | 神神网络 + ODE | 复杂动态 |
| **Flow Matching** | 连续归一化流 | 生成模型 |
| **TIGON** | ODE + OT 结合 | 综合分析 |

---

## 实战建议

### 入门路径（1-2 周）

1. **理解基础概念**
   - Wasserstein 距离的直观理解
   - ODE 的基本形式和求解
   - Sinkhorn 算法

2. **学习资源**
   - Computational Optimal Transport (Peyré & Cuturi)
   - Neural ODE 论文 (Chen et al., NeurIPS 2018)

### 进阶路径（1-2 月）

1. **阅读核心论文**
   - Waddington-OT (Schiebinger et al., Cell 2019)
   - Dynamo (Qiu et al., Cell 2022)
   - TIGON (Zhang et al., Nature Methods 2024)

2. **复现实验**
   - 使用 moscot 处理真实数据
   - 用 torchdiffeq 实现 Neural ODE

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

1. **Computational Optimal Transport**
   - 作者：Gabriel Peyré, Marco Cuturi
   - 理由：OT 领域的圣经，理论和算法都很全面

2. **Neural Ordinary Differential Equations**
   - 作者：Chen et al., NeurIPS 2018
   - 理由：开创性工作，引入连续深度学习

3. **Waddington-OT: A Multi-Modal, Optimal Transport Framework for Modeling Cellular Development**
   - 作者：Schiebinger et al., Cell 2019
   - 理由：OT 在生信的经典应用

4. **RNA velocity of single cells**
   - 作者：La Manno et al., Nature 2018
   - 理由：理解动态建模的基础

5. **CellOT: Learning to predict cellular responses to perturbations**
   - 作者：Bunne et al., Nature Methods 2023
   - 理由：OT 在药物响应预测的突破

### 进阶必读（5 篇）

6. **Dynamo: Mapping transcriptomic vector fields of single cells**
   - 作者：Qiu et al., Cell 2022
   - 理由：速度场估计的里程碑

7. **moscot: Multi-modal optimal transport for single-cell multi-omics**
   - 作者：Klein et al., Nature Methods 2023
   - 理由：多组学 OT 框架

8. **TIGON: Unifying ODE and Optimal Transport for Single-Cell Dynamics**
   - 作者：Zhang et al., Nature Methods 2024
   - 理由：ODE + OT 结合的最新突破

9. **Flow Matching for Generative Modeling**
   - 作者：Lipman et al., ICLR 2023
   - 理由：连续归一化流的新范式

10. **Gromov-Wasserstein Distances Between Distributions**
    - 作者：Memoli, Foundations of Computational Mathematics 2011
    - 理由：无配对对齐的理论基础

### 前沿必读（5 篇）

11. **Manifold Interpolating Optimal-Transport**
    - 作者：Thornton et al., NeurIPS 2023
    - 理由：流形上的 OT

12. **Stochastic Interpolants**
    - 作者：Albergo et al., 2023
    - 理由：概率生成的新框架

13. **OT-based trajectory inference with uncertainty quantification**
    - 作者：Lavenant et al., 2024
    - 理由：不确定性量化

14. **Neural CDE for Irregular Time Series**
    - 作者：Kidger et al., NeurIPS 2020
    - 理由：处理不规则时间序列

15. **Geometric Neural ODE**
    - 作者：Mathieu et al., ICLR 2020
    - 理由：几何结构保持

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

---

## 未来展望

### 三者融合

未来更强的可能是**三者融合**：
- **OT + Neural ODE + 几何/图结构（GNN）**
- **与扩散模型结合**
- **与测度流结合**

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
