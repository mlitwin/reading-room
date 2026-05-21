---
title: Torsion and curvature
---

Out of any connection $\nabla$ come two tensor fields: the **torsion** $T$ and the **Riemann curvature** $R$. Both are obstructions to "$\nabla$ behaves like the partial derivative":

- $T = 0$ means partial derivatives commute in the sense $\nabla_X Y - \nabla_Y X = [X, Y]$.
- $R = 0$ means iterated covariant derivatives commute, $\nabla_X \nabla_Y - \nabla_Y \nabla_X - \nabla_{[X, Y]} = 0$.

Both are defined for any affine connection; together they characterize the connection's local non-triviality.

## Torsion

The **torsion tensor** of $\nabla$ is the $(1, 2)$-tensor
$$T(X, Y) := \nabla_X Y - \nabla_Y X - [X, Y].$$
That this is tensorial (i.e. $C^\infty(M)$-bilinear) is a one-line check from the Leibniz rule and the bracket identity. In components,
$$T^\rho{}_{\mu\nu} = \Gamma^\rho{}_{\mu\nu} - \Gamma^\rho{}_{\nu\mu},$$
the antisymmetric part of the Christoffels in their lower indices.

A connection is **torsion-free** iff $T = 0$. Levi-Civita is torsion-free by axiom. In Einstein–Cartan gravity, torsion is allowed and couples to spinning matter.

**Geometric picture.** Take two infinitesimal vectors $u, v$ at $p$; transport $u$ along $v$ and $v$ along $u$ to form a small "parallelogram." With torsion, the parallelogram doesn't close — the two endpoints differ by a $T(u, v)$ correction. Without torsion, the parallelogram closes. (Curvature is a different defect: it's about how vectors *rotate* when transported around a closed loop, not whether parallelograms close.)

## Riemann curvature

The **Riemann curvature tensor** of $\nabla$ is the $(1, 3)$-tensor
$$R(X, Y) Z := \nabla_X \nabla_Y Z - \nabla_Y \nabla_X Z - \nabla_{[X, Y]} Z.$$
In components,
$$R^\rho{}_{\sigma\mu\nu} = \partial_\mu \Gamma^\rho{}_{\nu\sigma} - \partial_\nu \Gamma^\rho{}_{\mu\sigma} + \Gamma^\rho{}_{\mu\lambda}\, \Gamma^\lambda{}_{\nu\sigma} - \Gamma^\rho{}_{\nu\lambda}\, \Gamma^\lambda{}_{\mu\sigma}.$$
Index conventions vary; the placement here puts the "differentiated" index $\rho$ up, the "differentiated" index $\sigma$ down at the start, and the two anti-symmetric directions $\mu, \nu$ last. Some texts (Misner–Thorne–Wheeler) use $R^\rho{}_{\sigma\mu\nu}$; others put indices in other orders. Be alert to conventions.

**Geometric picture.** Take a small closed loop at $p$ spanned by vectors $u, v$; parallel-transport $Z \in T_p M$ around it. The transported vector $Z'$ differs from $Z$ by
$$Z' - Z = R(u, v) Z + O(\text{area}^2).$$
The Riemann tensor measures the first-order failure of parallel-transport around a loop to return a vector to itself.

## Symmetries (Levi-Civita)

Lower the first index: $R_{\rho\sigma\mu\nu} := g_{\rho\lambda}\, R^\lambda{}_{\sigma\mu\nu}$. For the Levi-Civita connection, the lowered Riemann tensor has

- **Antisymmetry in the first pair:** $R_{\rho\sigma\mu\nu} = -R_{\sigma\rho\mu\nu}$.
- **Antisymmetry in the second pair:** $R_{\rho\sigma\mu\nu} = -R_{\rho\sigma\nu\mu}$.
- **Pair symmetry:** $R_{\rho\sigma\mu\nu} = R_{\mu\nu\rho\sigma}$.
- **First Bianchi identity:** $R_{\rho[\sigma\mu\nu]} = 0$, i.e. $R_{\rho\sigma\mu\nu} + R_{\rho\mu\nu\sigma} + R_{\rho\nu\sigma\mu} = 0$.

These reduce the $n^4$ component count down to $\tfrac{1}{12} n^2 (n^2 - 1)$ — in dimension $4$ that's $20$ independent components.

In the presence of torsion, the symmetries weaken: pair symmetry can fail and the first Bianchi acquires a torsion-dependent right-hand side.

## Ricci, scalar, Weyl

Contractions of the Riemann tensor:

- **Ricci tensor.** $R_{\mu\nu} := R^\lambda{}_{\mu\lambda\nu}$. Symmetric for Levi-Civita; $(0, 2)$-tensor; $n(n+1)/2$ independent components in dimension $n$.
- **Scalar curvature.** $R := g^{\mu\nu} R_{\mu\nu}$. A scalar function.
- **Weyl tensor.** The trace-free part of Riemann (the part that vanishes on contraction with the metric in any pair of indices); only meaningful in $n \geq 4$. Captures the "conformal" piece of curvature — the part not seen by Ricci.

In dimension $2$ and $3$, the Weyl tensor vanishes identically; Riemann is fully determined by Ricci (in $3$) or by the scalar (in $2$). In dimension $4$, Weyl is independent — and in vacuum GR ($R_{\mu\nu} = 0$), all curvature is Weyl curvature.

## Second Bianchi identity

A differential constraint on Riemann (Levi-Civita case):
$$\nabla_{[\lambda} R_{\rho\sigma]\mu\nu} = 0 \quad \Longleftrightarrow \quad \nabla_\lambda R_{\rho\sigma\mu\nu} + \nabla_\rho R_{\sigma\lambda\mu\nu} + \nabla_\sigma R_{\lambda\rho\mu\nu} = 0.$$
Contracting with $g^{\lambda\mu}$ and $g^{\rho\nu}$ gives the **contracted Bianchi identity**:
$$\nabla^\mu G_{\mu\nu} = 0, \qquad G_{\mu\nu} := R_{\mu\nu} - \tfrac{1}{2}\, R\, g_{\mu\nu}.$$
The tensor $G_{\mu\nu}$ is the **Einstein tensor**, and its automatic divergencelessness is what makes it the right object on the left of the Einstein equations (next section). Conservation of the stress–energy tensor on the right is enforced by the geometry on the left.

## Sectional curvature (Riemannian only)

For a $2$-plane $\Pi \subseteq T_p M$ spanned by $u, v$, the **sectional curvature** is
$$K(u, v) := \frac{R(u, v, v, u)}{g(u, u)\, g(v, v) - g(u, v)^2},$$
a scalar depending only on $\Pi$, not on the basis. In dimension $2$, there's only one plane in each tangent space, and $K$ is the **Gaussian curvature**. The sphere of radius $a$ has $K = 1/a^2$ everywhere.

In Lorentzian signature, sectional curvature has the same definition but the denominator can vanish or change sign, so it's less useful as a global classifier; the Ricci and scalar curvatures are the natural Lorentzian quantities.
