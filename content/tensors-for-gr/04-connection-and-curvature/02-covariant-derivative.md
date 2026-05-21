---
title: The covariant derivative
---

The covariant derivative is the connection extended to all tensor fields, with the components of a Christoffel correction added for every index. This page records the operational rules, the Levi-Civita formula, parallel transport, and geodesics.

## Components

For a $(r, s)$-tensor field $T$, the covariant derivative $\nabla T$ is the $(r, s+1)$-tensor field with components
$$\nabla_\rho T^{\mu_1 \cdots \mu_r}{}_{\nu_1 \cdots \nu_s} = \partial_\rho T^{\mu_1 \cdots \mu_r}{}_{\nu_1 \cdots \nu_s} + \sum_{k=1}^{r} \Gamma^{\mu_k}{}_{\rho \lambda}\, T^{\mu_1 \cdots \lambda \cdots \mu_r}{}_{\nu_1 \cdots \nu_s} - \sum_{\ell=1}^{s} \Gamma^{\lambda}{}_{\rho \nu_\ell}\, T^{\mu_1 \cdots \mu_r}{}_{\nu_1 \cdots \lambda \cdots \nu_s}.$$
One $+\Gamma$ correction for every upper index; one $-\Gamma$ correction for every lower index. Often written in the equivalent semicolon notation $T^{\mu \cdots}{}_{\nu \cdots ; \rho} := \nabla_\rho T^{\mu \cdots}{}_{\nu \cdots}$.

Examples:

- **Scalar:** $\nabla_\mu f = \partial_\mu f$.
- **Vector:** $\nabla_\mu v^\nu = \partial_\mu v^\nu + \Gamma^\nu{}_{\mu\rho}\, v^\rho$.
- **Covector:** $\nabla_\mu \omega_\nu = \partial_\mu \omega_\nu - \Gamma^\rho{}_{\mu\nu}\, \omega_\rho$.
- **$(0, 2)$-tensor:** $\nabla_\rho g_{\mu\nu} = \partial_\rho g_{\mu\nu} - \Gamma^\lambda{}_{\rho\mu}\, g_{\lambda\nu} - \Gamma^\lambda{}_{\rho\nu}\, g_{\mu\lambda}$.

The covariant *divergence* of a vector field is $\nabla_\mu v^\mu = \partial_\mu v^\mu + \Gamma^\mu{}_{\mu\rho} v^\rho$. With the Levi-Civita connection, this simplifies (next).

## Metric compatibility

A connection is **metric-compatible** if
$$\nabla_\rho g_{\mu\nu} = 0.$$
Equivalently $\nabla g = 0$ as a tensor equation. Equivalently, the inner product is preserved by parallel transport: $X(g(Y, Z)) = g(\nabla_X Y, Z) + g(Y, \nabla_X Z)$ — a Leibniz rule with the metric playing the role of the multiplication.

## Torsion-free

A connection is **torsion-free** (or symmetric) if its Christoffel symbols are symmetric in their lower indices:
$$\Gamma^\rho{}_{\mu\nu} = \Gamma^\rho{}_{\nu\mu}.$$
Equivalently, $\nabla_X Y - \nabla_Y X = [X, Y]$. The next page treats torsion as a tensor in its own right; for now, this is the second of the two conditions that pin down a unique connection from a metric.

## The Levi-Civita connection

**Theorem (Fundamental theorem of pseudo-Riemannian geometry).** On any pseudo-Riemannian manifold $(M, g)$, there is a unique torsion-free metric-compatible connection. Its Christoffel symbols are given by the **Christoffel formula**:
$$\Gamma^\rho{}_{\mu\nu} = \tfrac{1}{2} g^{\rho\sigma} \left( \partial_\mu g_{\nu\sigma} + \partial_\nu g_{\sigma\mu} - \partial_\sigma g_{\mu\nu} \right).$$
This is the **Levi-Civita connection**, and is the connection assumed throughout standard GR. The derivation is direct: write down the three permutations of $\nabla_\rho g_{\mu\nu} = 0$, take a signed sum, and use $\Gamma^\rho{}_{\mu\nu} = \Gamma^\rho{}_{\nu\mu}$ to solve for $\Gamma$.

Two consequences worth knowing:

- $\Gamma^\mu{}_{\mu\nu} = \partial_\nu \ln \sqrt{|\det g|}$.
- The covariant divergence simplifies: $\nabla_\mu v^\mu = \tfrac{1}{\sqrt{|\det g|}}\, \partial_\mu \! \left( \sqrt{|\det g|}\, v^\mu \right)$.

The second is the curved-space generalization of the divergence in vector calculus and lets you write conservation laws in a chart-independent form.

## Parallel transport

A vector field $V(t)$ along a curve $\gamma(t)$ is **parallel-transported** if $\nabla_{\dot\gamma} V = 0$. In coordinates,
$$\frac{dV^\rho}{dt} + \Gamma^\rho{}_{\mu\nu}\, \dot\gamma^\mu\, V^\nu = 0.$$
This is a linear ODE for $V^\rho(t)$ given initial value $V(0)$; the solution exists on the same interval as $\gamma$, defining a linear isomorphism
$$P_\gamma^{t_0, t_1}: T_{\gamma(t_0)} M \to T_{\gamma(t_1)} M,$$
the **parallel transport** along $\gamma$ from $t_0$ to $t_1$. For metric-compatible $\nabla$, parallel transport preserves the inner product.

Crucially, parallel transport depends on the *path*, not just the endpoints — this path dependence is the curvature, made tensorial in the [next page](03-torsion-and-curvature.md).

## Geodesics

A curve $\gamma$ is a **geodesic** if its velocity is parallel-transported along itself:
$$\nabla_{\dot\gamma} \dot\gamma = 0.$$
In coordinates,
$$\ddot\gamma^\rho + \Gamma^\rho{}_{\mu\nu}\, \dot\gamma^\mu \dot\gamma^\nu = 0,$$
the **geodesic equation**. This is a system of $n$ second-order ODEs; given $\gamma(0)$ and $\dot\gamma(0)$, the geodesic exists for some interval of $t$ around $0$.

For the Levi-Civita connection, geodesics are the locally length-extremizing curves — straightest possible paths and locally-shortest (Riemannian) or locally-stationary (Lorentzian) curves between their endpoints.

In Lorentzian signature, geodesics inherit a causal classification from their initial velocity: a curve with timelike $\dot\gamma$ stays timelike (since metric-compatibility preserves $g(\dot\gamma, \dot\gamma)$ along $\gamma$). **Timelike geodesics are the worldlines of free-falling massive particles in GR; null geodesics, the worldlines of light.**

The geodesic equation also follows from a variational principle: extremizing $\int g_{\mu\nu}\, \dot\gamma^\mu \dot\gamma^\nu\, d\lambda$ (the **action**) gives the geodesic equation as the Euler–Lagrange equation. The Christoffels appear as the price you pay for working in a non-trivial chart.
