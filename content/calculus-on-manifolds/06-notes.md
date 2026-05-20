---
title: Notes
notes: true
---

Supplementary definitions referenced from the body of this book — terms the main text uses without defining, because defining them inline would interrupt the flow. They can be read here as a standalone glossary, or popped up on demand wherever they're linked from the chapters.

## Hausdorff

A topological space is **Hausdorff** if any two distinct points $p, q$ have disjoint open neighborhoods $U \ni p$, $V \ni q$ with $U \cap V = \emptyset$. Most spaces appearing in differential geometry are Hausdorff: $\mathbb{R}^n$, every metric space, every manifold, every Lie group. The non-Hausdorff cases are exotic — the "line with two origins" is the canonical example.

## Second countable

A topological space is **second countable** if its topology has a countable base: countably many open sets such that every open set is a union of some of them. Equivalently for metric spaces, $X$ has a countable dense subset and balls of rational radius centered on that subset form a base. This is what makes paracompactness and partition-of-unity arguments work on a manifold.

## Dual space

For a vector space $V$ over a field $k$, the **dual space** is
$$V^* := \mathrm{Hom}_k(V, k),$$
the space of $k$-linear maps $V \to k$. For finite-dimensional $V$, $\dim V^* = \dim V$, and a basis $\{e_i\}$ of $V$ induces a **dual basis** $\{e^i\}$ of $V^*$ defined by $e^i(e_j) = \delta^i_j$. The cotangent space $T^*_p M$ is the dual of the tangent space $T_p M$.

## Lie algebra

A **Lie algebra** over $\mathbb{R}$ is a real vector space $\mathfrak{g}$ equipped with a bilinear, antisymmetric bracket $[\cdot, \cdot]: \mathfrak{g} \times \mathfrak{g} \to \mathfrak{g}$ satisfying the Jacobi identity
$$[X, [Y, Z]] + [Y, [Z, X]] + [Z, [X, Y]] = 0.$$
Examples: $\mathfrak{gl}_n(\mathbb{R})$ — square matrices with $[A, B] = AB - BA$; the vector fields on a manifold with the Lie bracket; the tangent space at the identity of any Lie group.

## Tensor field

A **tensor field** of type $(r, s)$ on a manifold $M$ is a smooth section of the bundle whose fiber at $p$ is
$$T_p M^{\otimes r} \otimes T^*_p M^{\otimes s}$$
— the space of multilinear functionals taking $r$ covectors and $s$ vectors and returning a real number. Vector fields are $(1, 0)$-tensors; 1-forms are $(0, 1)$-tensors; $k$-forms are alternating $(0, k)$-tensors. The Lie derivative extends to tensor fields of every type.

## Cochain complex

A **cochain complex** is a sequence of abelian groups (or vector spaces) and linear maps
$$\cdots \to C^{k-1} \xrightarrow{d^{k-1}} C^k \xrightarrow{d^k} C^{k+1} \to \cdots$$
with $d^k \circ d^{k-1} = 0$ for every $k$. The kernel of each $d^k$ ("cocycles") contains the image of the previous $d^{k-1}$ ("coboundaries"), and the quotient $\ker(d^k) / \mathrm{im}(d^{k-1})$ is the $k$-th *cohomology* of the complex. The complex $\Omega^0 \to \Omega^1 \to \Omega^2 \to \cdots$ with [exterior derivative](differential-forms/exterior-derivative-and-pullback.md) as $d$ is the **de Rham complex**.

## Singular cohomology

**Singular cohomology** $H^k(X; A)$ of a topological space $X$ with coefficients in an abelian group $A$ is built from the dual of the singular [chain complex](note:cochain-complex). A *singular $k$-simplex* in $X$ is a continuous map $\Delta^k \to X$; the free abelian group on these forms $C_k(X)$, with the boundary map $\partial_k: C_k \to C_{k-1}$. Then $C^k(X; A) := \mathrm{Hom}(C_k(X), A)$ and $d := \partial^*$. Cohomology depends only on the homotopy type of $X$, and for paracompact [Hausdorff](note:hausdorff) $X$ the singular and de Rham versions agree (de Rham's theorem).

## Star-shaped

An open set $U \subseteq \mathbb{R}^n$ is **star-shaped about $p \in U$** if for every $q \in U$, the line segment $\{(1-t)p + tq : t \in [0, 1]\}$ from $p$ to $q$ lies entirely in $U$. Convex sets are star-shaped about any of their points. Star-shaped sets are contractible — the homotopy $H(q, t) = (1-t)q + tp$ retracts $U$ to $p$ — and this contraction is the ingredient that makes the cone-operator proof of the Poincaré lemma work.

## Sheaf

A **sheaf** of abelian groups on a topological space $X$ assigns to every open $U \subseteq X$ an abelian group $\mathcal{F}(U)$ ("sections over $U$") and to every inclusion $V \subseteq U$ a restriction map $\mathcal{F}(U) \to \mathcal{F}(V)$, subject to a **gluing axiom**: local sections that agree on overlaps glue uniquely to a section on the union.

The **constant sheaf** $\underline{A}$ assigns $A$ (with the discrete topology) to each connected open set. The sheaf $C^\infty_M$ assigns $C^\infty(U)$ to each $U$. **Sheaf cohomology** $H^k(X; \mathcal{F})$ generalizes singular cohomology; an **acyclic resolution** is a long exact sequence of sheaves that's nice enough to compute cohomology from. The de Rham complex is an acyclic resolution of $\underline{\mathbb{R}}$ on $M$, which is the abstract reason de Rham cohomology computes $H^*(M; \mathbb{R})$.
