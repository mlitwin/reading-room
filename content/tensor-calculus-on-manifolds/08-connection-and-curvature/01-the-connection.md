---
title: The connection
---

## The problem

For a vector field $\tens{X} = X^\mu\, \partial_\mu$, the array of partial derivatives $\partial_\nu X^\mu$ is not a $(1, 1)$-tensor. Under a change of coordinates the chain rule gives
$$\partial'_{\nu'} X'^{\mu'} = \frac{\partial x^\nu}{\partial x'^{\nu'}} \frac{\partial x'^{\mu'}}{\partial x^\mu}\, \partial_\nu X^\mu \;+\; X^\mu \frac{\partial x^\nu}{\partial x'^{\nu'}} \frac{\partial^2 x'^{\mu'}}{\partial x^\nu \partial x^\mu}.$$
The first term is the tensor law. The second, from the second derivatives of the coordinate change, spoils it.

**Geometric reason.** To "compare" $\tens{X}_p$ and $\tens{X}_q$ when $p$ and $q$ are different points, you need a way to bring $\tens{X}_p$ over to $T_q M$. The two [tangent spaces](note:tangent-space) $T_p M$ and $T_q M$ are separate vector spaces; there is no canonical identification. Partial derivatives subtract $\tens{X}_p$ from $\tens{X}_q$ component by component, and the result depends on the arbitrary coordinate bases at $p$ and $q$.

The extra structure that makes the comparison is a **connection**. A metric determines one canonically, the Levi-Civita connection, and that is the main line of this book.

## Definition

A **connection** (affine connection) on $M$ is an $\mathbb{R}$-bilinear map
$$\nabla: \mathfrak{X}(M) \times \mathfrak{X}(M) \to \mathfrak{X}(M), \qquad (\tens{X}, \tens{Y}) \mapsto \nabla_{\tens{X}} \tens{Y},$$
satisfying:

- **$C^\infty(M)$-linear in $\tens{X}$:** $\nabla_{f\tens{X} + g\tens{Y}} \tens{Z} = f \nabla_{\tens{X}} \tens{Z} + g \nabla_{\tens{Y}} \tens{Z}$ for $f, g \in C^\infty(M)$.
- **Leibniz in $\tens{Y}$:** $\nabla_{\tens{X}} (f\tens{Y}) = \tens{X}(f)\, \tens{Y} + f\, \nabla_{\tens{X}} \tens{Y}$.

The first axiom makes $\nabla_{\tens{X}} \tens{Y}$ at $p$ depend only on $\tens{X}_p$: the $\tens{X}$ slot is tensorial. The second makes the $\tens{Y}$ slot a derivative, which is what distinguishes a connection from a $(1, 2)$-tensor. Together they say a connection differentiates $\tens{Y}$ in the direction $\tens{X}_p$.

## Christoffel symbols

A choice of chart gives a coordinate basis $\partial_\mu$ for $\mathfrak{X}(M)$ locally. Define the **connection coefficients** by
$$\nabla_{\partial_\mu} \partial_\nu =: \Gamma^\rho{}_{\mu\nu}\, \partial_\rho.$$
The $n^3$ smooth functions $\Gamma^\rho{}_{\mu\nu}$ are the **Christoffel symbols** of $\nabla$ in this chart. They tell you, for each pair of basis directions, how the second basis vector "changes" as you move in the first direction.

For a general vector field $\tens{Y} = Y^\nu \partial_\nu$ differentiated along $\tens{X} = X^\mu \partial_\mu$, the Leibniz rule and bilinearity give
$$\nabla_{\tens{X}} \tens{Y} = (X^\mu \partial_\mu Y^\rho + X^\mu Y^\nu\, \Gamma^\rho{}_{\mu\nu})\, \partial_\rho.$$
The first term is the non-tensorial partial derivative; the second is the **correction term** that the connection adds. Together they are the components of the vector field $\nabla_{\tens{X}}\tens{Y}$.

## Transformation rule

Under $x \mapsto x'$, the Christoffels transform as
$$\Gamma'^{\rho'}{}_{\mu'\nu'} = \frac{\partial x'^{\rho'}}{\partial x^\rho}\, \frac{\partial x^\mu}{\partial x'^{\mu'}}\, \frac{\partial x^\nu}{\partial x'^{\nu'}}\, \Gamma^\rho{}_{\mu\nu} \;+\; \frac{\partial x'^{\rho'}}{\partial x^\rho}\, \frac{\partial^2 x^\rho}{\partial x'^{\mu'} \partial x'^{\nu'}}.$$
The first term is the tensor rule; the second is the inhomogeneous piece. The Christoffel symbols are **not** the components of a tensor.

## The Levi-Civita connection

On $(M, \tens{g})$ two natural conditions single out one connection.

**Metric compatibility.** The metric obeys a Leibniz rule:
$$\tens{X}\bigl(\tens{g}(\tens{Y}, \tens{Z})\bigr) = \tens{g}(\nabla_{\tens{X}} \tens{Y}, \tens{Z}) + \tens{g}(\tens{Y}, \nabla_{\tens{X}} \tens{Z}).$$
On basis fields this reads $\partial_\rho g_{\mu\nu} = \Gamma^\lambda{}_{\rho\mu}\, g_{\lambda\nu} + \Gamma^\lambda{}_{\rho\nu}\, g_{\mu\lambda}$. Once $\nabla$ is extended to tensors ([next page](02-covariant-derivative.md)) it is the statement $\nabla \tens{g} = 0$, and it makes parallel transport preserve inner products.

**Torsion-free.** A connection is torsion-free (symmetric) if its Christoffel symbols are symmetric in their lower indices:
$$\Gamma^\rho{}_{\mu\nu} = \Gamma^\rho{}_{\nu\mu}.$$
Equivalently, $\nabla_{\tens{X}} \tens{Y} - \nabla_{\tens{Y}} \tens{X} = [\tens{X}, \tens{Y}]$. [Torsion](note:torsion) as a tensor is treated on [page 4](04-torsion-and-curvature.md).

**Theorem (Fundamental theorem of pseudo-Riemannian geometry).** On any [pseudo-Riemannian manifold](note:metric) $(M, \tens{g})$, there is a unique torsion-free metric-compatible connection. Its Christoffel symbols are given by the **Christoffel formula**:
$$\Gamma^\rho{}_{\mu\nu} = \tfrac{1}{2} g^{\rho\sigma} \left( \partial_\mu g_{\nu\sigma} + \partial_\nu g_{\sigma\mu} - \partial_\sigma g_{\mu\nu} \right).$$
This is the **[Levi-Civita connection](note:levi-civita)**, the connection of standard GR and of every page of this book that does not say otherwise. The derivation is direct: write the compatibility condition for the three cyclic permutations of $(\rho, \mu, \nu)$, add two and subtract the third, and use $\Gamma^\rho{}_{\mu\nu} = \Gamma^\rho{}_{\nu\mu}$ to solve for $\Gamma$.

Its contraction is $\Gamma^\mu{}_{\mu\nu} = \partial_\nu \ln \sqrt{|\det g|}$, which gives the covariant divergence its simple form ([next page](02-covariant-derivative.md)).

## Without a metric: affine connections

The axioms of a connection do not mention a metric. A manifold carries many connections, and without a metric none is preferred.

**Differences are tensors.** For two connections, $(\nabla - \tilde\nabla)_{\tens{X}} \tens{Y}$ is $C^\infty(M)$-linear in both $\tens{X}$ and $\tens{Y}$, because the second-derivative pieces of the transformation rule cancel. So $\Gamma^\rho{}_{\mu\nu} - \tilde\Gamma^\rho{}_{\mu\nu}$ is a $(1, 2)$-tensor, and every connection is the Levi-Civita connection plus a tensor.

**Where this matters.** In [Einstein–Cartan gravity](../15-general-relativity/03-einstein-cartan.md) the connection is metric-compatible but has torsion, so it is the Levi-Civita connection plus a tensor built from the torsion. In [Newton–Cartan gravity](../15-general-relativity/05-newton-cartan.md) there is no spacetime metric at all, and gravity is the curvature of a connection. The covariant derivative, parallel transport, geodesics, torsion and the Riemann tensor are defined for any connection; the pages that follow say where a result needs Levi-Civita.
