---
title: Tensors
---

A tensor is a multilinear map that takes some vectors and some [covectors](note:cotangent-space) and returns a real number. Physicists call it an $(r, s)$-tensor with $r$ upper and $s$ lower indices. Mathematicians call it an element of $T_p M^{\otimes r} \otimes T^*_p M^{\otimes s}$. The two are the same object.

Three pages:

1. [Multilinear maps and rank](01-multilinear-and-rank.md): the definition, the tensor product, contraction, tensor fields.
2. [Coordinate components](02-coordinate-components.md): the transformation law, summation, the tensoriality test.
3. [Two languages](03-co-contra-vs-k-forms.md): index and coordinate-free notation side by side; $k$-forms and symmetric tensors.

The metric of [chapter 3](../03-metric/index.md) is the first tensor field the book adds as structure. A worked $(1, 1)$-tensor on $S^2$ is in [chapter 4](../04-coordinate-systems/07-a-tensor-on-the-sphere.md).

**Metric-free:** the whole chapter. Index positions cannot be changed until the metric supplies $\flat$ and $\sharp$.

## Notation

| Symbol | Meaning |
|---|---|
| $\otimes$ | tensor product |
| $(r, s)$; $T^r_s(T_p M)$ | tensor type; space of $(r, s)$-tensors |
| $\tens{T}$; $T^{\mu \cdots}{}_{\nu \cdots}$ | a generic tensor; its components |
