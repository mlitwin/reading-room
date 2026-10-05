---
title: The affine connection
---

## The problem

Given a vector field $\tens{X} = X^\mu(x)\, \partial_\mu$ on $M$, you might guess that its partial derivative with respect to $x^\nu$ — the array $\partial_\nu X^\mu$ — defines a $(1, 1)$-tensor. It does not. Under a change of coordinates, the chain rule gives
$$\partial'_{\nu'} X'^{\mu'} = \frac{\partial x^\nu}{\partial x'^{\nu'}} \frac{\partial x'^{\mu'}}{\partial x^\mu}\, \partial_\nu X^\mu \;+\; X^\mu \frac{\partial x^\nu}{\partial x'^{\nu'}} \frac{\partial^2 x'^{\mu'}}{\partial x^\nu \partial x^\mu}.$$
The first term is the correct tensor transformation. The second — the inhomogeneous piece coming from the second derivative of the coordinate change — has no business being there.

**Geometric reason.** To "compare" $\tens{X}_p$ and $\tens{X}_q$ when $p$ and $q$ are different points, you need a way to bring $\tens{X}_p$ over to $T_q M$. The two [tangent spaces](note:tangent-space) $T_p M$ and $T_q M$ are separate vector spaces; there is no canonical identification. The partial derivative tries to subtract $\tens{X}_p$ from $\tens{X}_q$ component-wise, which depends on the (arbitrary) coordinate frames at $p$ and $q$.

The piece of extra structure that does the comparison is an **affine connection** (often just *connection* in this book, since it's the only kind appearing here).

## Definition

An **affine connection** on $M$ is an $\mathbb{R}$-bilinear map
$$\nabla: \mathfrak{X}(M) \times \mathfrak{X}(M) \to \mathfrak{X}(M), \qquad (\tens{X}, \tens{Y}) \mapsto \nabla_{\tens{X}} \tens{Y},$$
satisfying:

- **$C^\infty(M)$-linear in $\tens{X}$:** $\nabla_{f\tens{X} + g\tens{Y}} \tens{Z} = f \nabla_{\tens{X}} \tens{Z} + g \nabla_{\tens{Y}} \tens{Z}$ for $f, g \in C^\infty(M)$.
- **Leibniz in $\tens{Y}$:** $\nabla_{\tens{X}} (f\tens{Y}) = \tens{X}(f)\, \tens{Y} + f\, \nabla_{\tens{X}} \tens{Y}$.

The first axiom makes $\nabla_{\tens{X}} \tens{Y}$ at $p$ depend only on $\tens{X}_p$ (a tensorial slot); the second is the failure-to-be-tensorial in $\tens{Y}$ that distinguishes connections from straight $(1, 2)$-tensors — were $\nabla$ $C^\infty(M)$-linear in $\tens{Y}$ too, it would be one. Together they say a connection differentiates vector fields along a direction at a point.

## Christoffel symbols

A choice of chart gives a coordinate basis $\partial_\mu$ for $\mathfrak{X}(M)$ locally. Define the **connection coefficients** by
$$\nabla_{\partial_\mu} \partial_\nu =: \Gamma^\rho{}_{\mu\nu}\, \partial_\rho.$$
The $n^3$ smooth functions $\Gamma^\rho{}_{\mu\nu}$ are the **Christoffel symbols** of $\nabla$ in this chart. They tell you, for each pair of basis directions, how the second basis vector "changes" as you move in the first direction.

For a general vector field $\tens{Y} = Y^\nu \partial_\nu$ differentiated along $\tens{X} = X^\mu \partial_\mu$, the Leibniz rule and bilinearity give
$$\nabla_{\tens{X}} \tens{Y} = (X^\mu \partial_\mu Y^\rho + X^\mu Y^\nu\, \Gamma^\rho{}_{\mu\nu})\, \partial_\rho.$$
The first term is the partial derivative (the part that wasn't tensorial); the second is the **correction term** that the connection adds to restore tensoriality. Together they form a true tensor field.

## Transformation rule

Under $x \mapsto x'$, the Christoffels transform as
$$\Gamma'^{\rho'}{}_{\mu'\nu'} = \frac{\partial x'^{\rho'}}{\partial x^\rho}\, \frac{\partial x^\mu}{\partial x'^{\mu'}}\, \frac{\partial x^\nu}{\partial x'^{\nu'}}\, \Gamma^\rho{}_{\mu\nu} \;+\; \frac{\partial x'^{\rho'}}{\partial x^\rho}\, \frac{\partial^2 x^\rho}{\partial x'^{\mu'} \partial x'^{\nu'}}.$$
The first term is the tensor rule; the second is the inhomogeneous piece. The Christoffel symbols are **not** the components of a tensor — they are the components of a connection, which is a different beast.

But: the *difference* of two connections **is** a tensor:
$$(\nabla - \tilde\nabla)_{\tens{X}} \tens{Y}$$
is $C^\infty(M)$-linear in *both* $\tens{X}$ and $\tens{Y}$ (the second-derivative pieces cancel), so the difference of Christoffels $\Gamma^\rho{}_{\mu\nu} - \tilde\Gamma^\rho{}_{\mu\nu}$ is a $(1, 2)$-tensor.

## Affine versus the metric

Importantly: the definition of $\nabla$ above does *not* use a metric. There are many connections on the same manifold; the choice is the additional data. A connection [compatible with a metric](note:metric) and torsion-free is unique (the Levi-Civita connection, derived on the next page), but the definition of an affine connection makes sense even on a manifold with no metric.

In Einstein–Cartan gravity ([end of the book](../10-general-relativity/03-einstein-cartan.md)), torsion is allowed and the connection is no longer determined by the metric.

## What about covector fields and tensor fields?

Once $\nabla$ is defined on vector fields, it extends uniquely to all tensor fields by the rules:

- **On scalars:** $\nabla_{\tens{X}} f = \tens{X}(f) = X^\mu \partial_\mu f$, the ordinary derivative.
- **Leibniz on tensor products:** $\nabla_{\tens{X}} (\tens{S} \otimes \tens{T}) = (\nabla_{\tens{X}} \tens{S}) \otimes \tens{T} + \tens{S} \otimes (\nabla_{\tens{X}} \tens{T})$.
- **Commutes with [contraction](note:contraction).**

These force the action on a covector $\tens{\omega}$ to be
$$(\nabla_{\tens{X}} \tens{\omega})(\tens{Y}) = \tens{X}(\tens{\omega}(\tens{Y})) - \tens{\omega}(\nabla_{\tens{X}} \tens{Y}),$$
and on higher-rank tensors by analogous bookkeeping. The next page makes this concrete.
