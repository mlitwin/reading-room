---
title: Killing vectors
---

The symmetries of a metric, made infinitesimal. This page uses the [Lie derivative](../02-vector-fields-and-flows/03-lie-derivative.md) from Part I and quotes one formula from [chapter 9](../09-connection-and-curvature/02-covariant-derivative.md).

## Isometries

A diffeomorphism $F: M \to M$ with
$$F^* g = g$$
is an **isometry** — it preserves every length and angle the metric defines. The isometries of $(M, g)$ form a group. For the round sphere it is $O(3)$, with connected part $SO(3)$; for Minkowski space, the Poincaré group.

## Killing fields

A vector field $K \in \mathfrak{X}(M)$ is a **Killing vector field** if its flow preserves the metric:
$$\mathcal{L}_K g = 0.$$
The flow of a Killing field is a one-parameter family of isometries — a continuous symmetry of the geometry. For the Levi-Civita connection this is equivalent to the **Killing equation**
$$\nabla_\mu K_\nu + \nabla_\nu K_\mu = 0$$
(with $\nabla$ the covariant derivative of [chapter 9](../09-connection-and-curvature/02-covariant-derivative.md); $\nabla K$ is antisymmetric).

**Coordinate shortcut.** If every component $g_{\mu\nu}$ is independent of some coordinate $x^k$, then $\partial_k$ is Killing — "the metric doesn't change along $x^k$." Most Killing fields met in practice are found this way.

Killing fields are closed under the Lie bracket, so they form a [Lie algebra](note:lie-algebra) — the Lie algebra of the isometry group. Its dimension is at most $n(n+1)/2$; spaces achieving the bound are **maximally symmetric** (spheres, Euclidean and hyperbolic spaces, de Sitter).

## Conserved quantities along geodesics

For any geodesic $\gamma$ and any Killing field $K$, the pairing $K_\mu \dot\gamma^\mu$ is constant along $\gamma$:
$$\frac{d}{d\lambda}\bigl(K_\mu \dot\gamma^\mu\bigr) = (\nabla_\nu K_\mu)\, \dot\gamma^\nu \dot\gamma^\mu + K_\mu\, (\nabla_{\dot\gamma}\dot\gamma)^\mu = 0,$$
the first term vanishing because $\nabla K$ is antisymmetric against the symmetric $\dot\gamma^\nu \dot\gamma^\mu$, the second by the geodesic equation. One Killing field, one conserved quantity of free-fall motion.

This is the geodesic instance of Noether's theorem (the [`classical-mechanics`](../../classical-mechanics/04-noether/01-noethers-theorem.md) review has the general statement): a Killing vector is a continuous symmetry of the geodesic action $\int g_{\mu\nu}\, \dot x^\mu \dot x^\nu\, d\lambda$, and $K_\mu \dot\gamma^\mu$ is its Noether charge.

## On the sphere

The round metric $g = d\theta^2 + \sin^2\theta\, d\varphi^2$ has no $\varphi$-dependence, so $\partial_\varphi$ is Killing — rotation about the $Z$-axis. The full Killing algebra is three-dimensional, $\mathfrak{so}(3)$, one field per rotation axis:
$$K_Z = \partial_\varphi, \qquad K_X = -\sin\varphi\, \partial_\theta - \cot\theta\cos\varphi\, \partial_\varphi, \qquad K_Y = \cos\varphi\, \partial_\theta - \cot\theta\sin\varphi\, \partial_\varphi.$$
Three is the maximum $\tfrac{1}{2}n(n+1) = 3$ for $n = 2$: the round sphere is maximally symmetric. Only $K_Z$ is visible as a coordinate symmetry of the standard chart; the other two mix $\theta$ and $\varphi$, which is the usual situation — a chart adapts to at most a few of the symmetries at once.

## Toward Schwarzschild

The Schwarzschild metric of [chapter 10](../10-general-relativity/02-schwarzschild.md) is independent of both $t$ and $\varphi$, so $\partial_t$ and $\partial_\varphi$ are Killing. Their conserved pairings are the energy $E$ and angular momentum $L$ that reduce the orbit calculation to a one-dimensional problem — the entire tractability of Schwarzschild geodesics is Killing symmetry at work.
