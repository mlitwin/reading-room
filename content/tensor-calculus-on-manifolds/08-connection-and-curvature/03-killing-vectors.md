---
title: Killing vectors
---

The symmetries of a metric, made infinitesimal, and the conserved quantities they give along geodesics.

## Isometries

A diffeomorphism $F: M \to M$ with
$$F^* \tens{g} = \tens{g}$$
is an **isometry** ([chapter 3](../03-metric/01-the-metric-tensor.md)): it preserves every length and angle the metric defines. The isometries of $(M, \tens{g})$ form a group. For the round sphere it is $O(3)$, with connected part $SO(3)$; for [Minkowski space](note:minkowski-space), the Poincaré group.

## Killing fields

A vector field $\tens{\xi} \in \mathfrak{X}(M)$ is a **Killing vector field** if its [flow](note:flow) preserves the metric:
$$\Lie_{\tens{\xi}} \tens{g} = 0.$$
The flow of a Killing field is a one-parameter family of isometries, a continuous symmetry of the geometry. In the coordinate formula for $\Lie_{\tens{\xi}} \tens{g}$ ([chapter 5](../05-vector-fields-and-flows/03-lie-derivative.md)) every partial derivative may be replaced by a Levi-Civita covariant derivative: the $\Gamma$ terms cancel by torsion-freeness, and $\nabla \tens{g} = 0$ removes the derivative of $\tens{g}$. The result is the **Killing equation**
$$(\Lie_{\tens{\xi}} \tens{g})_{\mu\nu} = \nabla_\mu \xi_\nu + \nabla_\nu \xi_\mu = 0,$$
so $\nabla_\mu \xi_\nu$ is antisymmetric.

**Coordinate shortcut.** If no component $g_{\mu\nu}$ depends on the coordinate $x^k$, then $\partial_k$ is Killing. Most Killing fields met in practice are found this way.

Killing fields are closed under the [Lie bracket](note:lie-bracket), so they form a [Lie algebra](note:lie-algebra), the Lie algebra of the isometry group. Its dimension is at most $n(n+1)/2$; spaces achieving the bound are **maximally symmetric** (spheres, Euclidean and hyperbolic spaces, and Minkowski, de Sitter and anti-de Sitter spacetimes).

## Conserved quantities along geodesics

For any [geodesic](note:geodesic) $\gamma$ and any Killing field $\tens{\xi}$, the pairing $\xi_\mu \dot\gamma^\mu$ is constant along $\gamma$:
$$\frac{d}{d\lambda}\bigl(\xi_\mu \dot\gamma^\mu\bigr) = (\nabla_\nu \xi_\mu)\, \dot\gamma^\nu \dot\gamma^\mu + \xi_\mu\, (\nabla_{\dot\gamma}\dot\gamma)^\mu = 0,$$
the first term vanishing because $\nabla \tens{\xi}$ is antisymmetric against the symmetric $\dot\gamma^\nu \dot\gamma^\mu$, the second by the geodesic equation. One Killing field, one conserved quantity of free-fall motion.

This is the geodesic instance of [Noether's theorem](note:noethers-theorem): a Killing vector is a continuous symmetry of the geodesic action $\int \tfrac12\, g_{\mu\nu}\, \dot x^\mu \dot x^\nu\, d\lambda$, and $\xi_\mu \dot\gamma^\mu$ is its Noether charge. [Chapter 12](../12-symmetry-and-noether/02-symmetry-and-the-sphere.md) extends it to motion in a potential.

## On the sphere

The round metric $\tens{g} = d\theta^2 + \sin^2\theta\, d\varphi^2$ has no $\varphi$-dependence, so $\partial_\varphi$, rotation about the $Z$-axis, is Killing. The full Killing algebra is three-dimensional, $\mathfrak{so}(3)$, one field per rotation axis:
$$\tens{\xi}_Z = \partial_\varphi, \qquad \tens{\xi}_X = -\sin\varphi\, \partial_\theta - \cot\theta\cos\varphi\, \partial_\varphi, \qquad \tens{\xi}_Y = \cos\varphi\, \partial_\theta - \cot\theta\sin\varphi\, \partial_\varphi.$$
Three is the maximum $\tfrac{1}{2}n(n+1) = 3$ for $n = 2$: the round sphere is maximally symmetric. Only $\tens{\xi}_Z$ is visible as a coordinate symmetry of the standard chart; the other two mix $\theta$ and $\varphi$, which is the usual situation: a chart adapts to at most a few symmetries at once.

The finite version: every rotation $R \in SO(3)$ restricted to $S^2$ satisfies $R^* \tens{g} = \tens{g}$, and the three Killing fields generate these rotations.

## Toward Schwarzschild

The Schwarzschild metric of [chapter 15](../15-general-relativity/02-schwarzschild.md) is independent of both $t$ and $\varphi$, so $\partial_t$ and $\partial_\varphi$ are Killing. Their conserved pairings are the energy $E$ and angular momentum $L$, which reduce the orbit problem to one dimension. The remaining rotational Killing fields keep each orbit in a plane. Killing symmetry is what makes Schwarzschild geodesics solvable.
