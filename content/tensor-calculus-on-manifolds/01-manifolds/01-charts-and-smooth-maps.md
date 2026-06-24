---
title: Manifolds, charts, smooth maps
---

A **topological manifold** of dimension $n$ is a [Hausdorff](note:hausdorff), [second-countable](note:second-countable) topological space in which every point has an open neighborhood homeomorphic to an open subset of $\mathbb{R}^n$.

A **chart** is a pair $(U, \varphi)$ with $U \subseteq M$ open and $\varphi: U \to \varphi(U) \subseteq \mathbb{R}^n$ a homeomorphism. The components $x^i := \varphi^i$ are **local coordinates** on $U$.

Two charts $(U, \varphi)$ and $(V, \psi)$ are **smoothly compatible** if $U \cap V = \emptyset$ or the transition map
$$\psi \circ \varphi^{-1}: \varphi(U \cap V) \to \psi(U \cap V)$$
is a $C^\infty$ diffeomorphism between open subsets of $\mathbb{R}^n$.

A **smooth atlas** is a collection of pairwise smoothly compatible charts whose domains cover $M$. A maximal smooth atlas is a **smooth structure**.

**Smooth function.** $f: M \to \mathbb{R}$ is smooth if $f \circ \varphi^{-1}: \varphi(U) \to \mathbb{R}$ is $C^\infty$ for every chart $(U, \varphi)$. Smooth functions form an $\mathbb{R}$-algebra $C^\infty(M)$.

**Smooth map.** $F: M \to N$ is smooth if its coordinate representation $\psi \circ F \circ \varphi^{-1}$ is $C^\infty$ for every pair of charts where the composition is defined.

**Diffeomorphism.** A smooth map with a smooth inverse. Two manifolds are diffeomorphic iff there's a diffeomorphism between them; this is the equivalence relation for the category.

**Partition of unity.** On any (second-countable, Hausdorff) smooth manifold, given any open cover, a smooth partition of unity subordinate to it exists. This is the lever that turns local constructions into global ones — used constantly for integration, gluing of metrics, extending sections.
