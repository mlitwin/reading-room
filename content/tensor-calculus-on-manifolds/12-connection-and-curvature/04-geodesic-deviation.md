---
title: Geodesic deviation
---

The [previous page](03-torsion-and-curvature.md) defined the [Riemann tensor](note:riemann-tensor) by parallel transport around a loop. Its physical meaning in GR looks different but is equivalent: **curvature is the relative acceleration of nearby free-falling particles** — tidal force. This page derives that statement; it is the bridge between the definition of Riemann and chapter 16's reading of the Einstein equations.

## Setup

Take a one-parameter family of geodesics $\gamma_s(t)$ — for each fixed $s$, the curve $t \mapsto \gamma_s(t)$ is a geodesic. Two vector fields live along the family: the velocity $\tens{u} := \partial/\partial t$, and the **deviation vector** (or **Jacobi field**) $\tens{S} := \partial/\partial s$, pointing from each geodesic toward its neighbor. As coordinate vector fields of the map $(s, t) \mapsto \gamma_s(t)$ they commute, $[\tens{u}, \tens{S}] = 0$, so for a [torsion-free](note:torsion) connection $\nabla_{\tens{u}} \tens{S} = \nabla_{\tens{S}} \tens{u}$.

## The Jacobi equation

Two covariant derivatives along the geodesic, the definition of curvature, and the geodesic equation $\nabla_{\tens{u}} \tens{u} = 0$:
$$\nabla_{\tens{u}} \nabla_{\tens{u}} \tens{S} = \nabla_{\tens{u}} \nabla_{\tens{S}} \tens{u} = \nabla_{\tens{S}} \nabla_{\tens{u}} \tens{u} + \tens{R}(\tens{u}, \tens{S})\, \tens{u} = \tens{R}(\tens{u}, \tens{S})\, \tens{u}.$$

$$\boxed{\quad \nabla_{\tens{u}} \nabla_{\tens{u}} \tens{S} = \tens{R}(\tens{u}, \tens{S})\, \tens{u} \quad}$$

This is the **Jacobi equation** (or **geodesic deviation equation**). In components, writing $D/dt := \nabla_{\tens{u}}$ for the covariant derivative along the geodesic and using the [index convention](note:riemann-index-convention) of this book,
$$\frac{D^2 S^\rho}{dt^2} = R^\rho{}_{\sigma\mu\nu}\, u^\sigma u^\mu S^\nu = -R^\rho{}_{\sigma\mu\nu}\, u^\sigma S^\mu u^\nu.$$
Flat space: $\tens{R} = 0$, so $\tens{S}$ grows at most linearly — initially parallel geodesics stay parallel. Any deviation from that is curvature, measured directly.

## On the sphere

Meridians fanning out from the north pole: along each, $\tens{u} = \partial_\theta$; connecting neighbors, $\tens{S} = \partial_\varphi$. Compute both sides with the [sphere Christoffels](05-on-the-sphere.md):
$$\nabla_{\tens{u}} \tens{S} = \nabla_{\partial_\theta} \partial_\varphi = \cot\theta\, \partial_\varphi, \qquad \nabla_{\tens{u}} \nabla_{\tens{u}} \tens{S} = \bigl(-\csc^2\theta + \cot^2\theta\bigr)\, \partial_\varphi = -\partial_\varphi,$$
and on the curvature side $\tens{R}(\partial_\theta, \partial_\varphi)\, \partial_\theta = R^\varphi{}_{\theta\theta\varphi}\, \partial_\varphi = -\partial_\varphi$. Both sides agree.

The geometry: $|\tens{S}| = \sin\theta$ solves $j'' = -K j$ with $K = 1$ — neighboring meridians separate, decelerate, and reconverge at the south pole. **Positive curvature focuses geodesics**; negative curvature would splay them exponentially.

## Physical reading

- **Tidal acceleration.** For two nearby freely falling particles with separation $\tens{S}$, the Jacobi equation is the GR law of tidal forces. In the Newtonian limit, $R^i{}_{0j0} \approx \partial_i \partial_j \Phi$ — the classical tidal tensor of the potential $\Phi$. This is the precise sense in which Riemann *is* the gravitational field strength: uniform acceleration can be transformed away (equivalence principle), relative acceleration cannot.
- **[Ricci is the trace](note:ricci-and-einstein-tensors).** Averaged over directions, $R_{\mu\nu} u^\mu u^\nu$ controls the volume convergence of a bundle of geodesics — the precise content of "positive Ricci focuses" quoted with the [Einstein equations](../16-general-relativity/01-einstein-equations.md). A vacuum spacetime (Ricci-flat) still distorts shapes tidally through its Weyl curvature at constant volume.
- **Measurement.** A gravitational-wave interferometer reads out $\tens{S}(t)$ for pairs of freely falling test masses. Riemann is not an abstraction layered on observables; it is the directly measured object.
