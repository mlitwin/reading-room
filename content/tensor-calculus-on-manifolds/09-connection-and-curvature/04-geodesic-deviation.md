---
title: Geodesic deviation
---

The [previous page](03-torsion-and-curvature.md) defined the Riemann tensor by parallel transport around a loop. Its physical meaning in GR looks different but is equivalent: **curvature is the relative acceleration of nearby free-falling particles** — tidal force. This page derives that statement; it is the bridge between the definition of Riemann and chapter 10's reading of the Einstein equations.

## Setup

Take a one-parameter family of geodesics $\gamma_s(t)$ — for each fixed $s$, the curve $t \mapsto \gamma_s(t)$ is a geodesic. Two vector fields live along the family: the velocity $T := \partial/\partial t$, and the **deviation vector** (or **Jacobi field**) $J := \partial/\partial s$, pointing from each geodesic toward its neighbor. As coordinate vector fields of the map $(s, t) \mapsto \gamma_s(t)$ they commute, $[T, J] = 0$, so for a torsion-free connection $\nabla_T J = \nabla_J T$.

## The Jacobi equation

Two covariant derivatives along the geodesic, the definition of curvature, and the geodesic equation $\nabla_T T = 0$:
$$\nabla_T \nabla_T J = \nabla_T \nabla_J T = \nabla_J \nabla_T T + R(T, J)\, T = R(T, J)\, T.$$

$$\boxed{\quad \nabla_T \nabla_T J = R(T, J)\, T \quad}$$

This is the **Jacobi equation** (or **geodesic deviation equation**). In components, writing $D/dt := \nabla_T$ for the covariant derivative along the geodesic and using the [index convention](note:riemann-index-convention) of this book,
$$\frac{D^2 J^\rho}{dt^2} = R^\rho{}_{\sigma\mu\nu}\, T^\sigma T^\mu J^\nu = -R^\rho{}_{\sigma\mu\nu}\, T^\sigma J^\mu T^\nu.$$
Flat space: $R = 0$, so $J$ grows at most linearly — initially parallel geodesics stay parallel. Any deviation from that is curvature, measured directly.

## On the sphere

Meridians fanning out from the north pole: along each, $T = \partial_\theta$; connecting neighbors, $J = \partial_\varphi$. Compute both sides with the [sphere Christoffels](05-on-the-sphere.md):
$$\nabla_T J = \nabla_{\partial_\theta} \partial_\varphi = \cot\theta\, \partial_\varphi, \qquad \nabla_T \nabla_T J = \bigl(-\csc^2\theta + \cot^2\theta\bigr)\, \partial_\varphi = -\partial_\varphi,$$
and on the curvature side $R(\partial_\theta, \partial_\varphi)\, \partial_\theta = R^\varphi{}_{\theta\theta\varphi}\, \partial_\varphi = -\partial_\varphi$. Both sides agree.

The geometry: $|J| = \sin\theta$ solves $j'' = -K j$ with $K = 1$ — neighboring meridians separate, decelerate, and reconverge at the south pole. **Positive curvature focuses geodesics**; negative curvature would splay them exponentially.

## Physical reading

- **Tidal acceleration.** For two nearby freely falling particles with separation $J$, the Jacobi equation is the GR law of tidal forces. In the Newtonian limit, $R^i{}_{0j0} \approx \partial_i \partial_j \Phi$ — the classical tidal tensor of the potential $\Phi$. This is the precise sense in which Riemann *is* the gravitational field strength: uniform acceleration can be transformed away (equivalence principle), relative acceleration cannot.
- **Ricci is the trace.** Averaged over directions, $R_{\mu\nu} T^\mu T^\nu$ controls the volume convergence of a bundle of geodesics — the precise content of "positive Ricci focuses" quoted with the [Einstein equations](../10-general-relativity/01-einstein-equations.md). A vacuum spacetime (Ricci-flat) still distorts shapes tidally through its Weyl curvature at constant volume.
- **Measurement.** A gravitational-wave interferometer reads out $J(t)$ for pairs of freely falling test masses. Riemann is not an abstraction layered on observables; it is the directly measured object.
