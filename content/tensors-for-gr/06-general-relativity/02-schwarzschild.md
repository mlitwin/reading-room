---
title: Schwarzschild — the torsion-free worked example
---

The Schwarzschild solution is the unique spherically symmetric vacuum solution of the Einstein equations. It models the exterior geometry of a non-rotating massive body — a star, a non-rotating black hole — and is the canonical first calculation in any GR course.

## Setup

Look for a vacuum metric ($R_{\mu\nu} = 0$, $\Lambda = 0$) that is:

- **Static:** there is a timelike Killing vector field whose orbits foliate spacetime; the metric has no $t$-dependence in adapted coordinates.
- **Spherically symmetric:** there is an $SO(3)$ acting by isometries, with orbits two-dimensional spheres.

Adapted coordinates $(t, r, \theta, \varphi)$, with $(\theta, \varphi)$ the angular coordinates on $S^2$ from earlier. The most general such metric is
$$g = -A(r)\, dt^2 + B(r)\, dr^2 + r^2\, (d\theta^2 + \sin^2\theta\, d\varphi^2)$$
for two scalar functions $A, B$ of $r$ alone.

## Solving the equations

Compute the Christoffel symbols (analogous to the sphere calculation but in $4$D), then the Ricci tensor components. After some bookkeeping, the vacuum equations $R_{\mu\nu} = 0$ reduce to two ODEs that force
$$A(r)\, B(r) = \mathrm{const}.$$
Absorbing the constant into the definition of $t$ gives $AB = 1$, i.e. $B = 1/A$. The remaining equation $R_{tt} = 0$ then gives $(rA)' = 1$, so
$$A(r) = 1 - \frac{2M}{r}$$
with $M$ a constant of integration. With $G = c = 1$ units, $M$ is the **mass parameter** in geometrized units; in SI units, $2M$ is replaced by $2GM/c^2$.

## The Schwarzschild metric

$$\boxed{\; g = -\left(1 - \frac{2M}{r}\right) dt^2 + \left(1 - \frac{2M}{r}\right)^{-1} dr^2 + r^2\, (d\theta^2 + \sin^2\theta\, d\varphi^2). \;}$$

Two distinguished radii:

- $r = 2M$, the **Schwarzschild radius** or **event horizon**. The metric coefficient $g_{tt} \to 0$ and $g_{rr} \to \infty$; coordinates break down but the geometry is regular (a *coordinate* singularity).
- $r = 0$, a **true singularity**. The scalar invariant $R_{\rho\sigma\mu\nu} R^{\rho\sigma\mu\nu} = 48 M^2 / r^6$ blows up; no coordinate change removes it.

For $r > 2M$, the metric is static and spherically symmetric and approaches Minkowski as $r \to \infty$ — the exterior of a non-rotating massive body.

For $r < 2M$ (inside the horizon), the roles of $t$ and $r$ swap: $g_{tt} > 0$ and $g_{rr} < 0$, so $t$ is now spacelike and $r$ is timelike. Inside, $r$ decreases monotonically toward $r = 0$ for any future-directed worldline — the black hole interior.

## Test-particle motion

The Christoffels of the Schwarzschild metric — straightforward but tedious — feed the geodesic equation. Conserved quantities from the symmetries:

- $E := -g_{tt}\, \dot t = (1 - 2M/r)\, \dot t$ — **energy per unit mass** (from $\partial_t$ Killing).
- $L := g_{\varphi\varphi}\, \dot\varphi = r^2 \sin^2\theta\, \dot\varphi$ — **angular momentum** (from $\partial_\varphi$ Killing).
- Orbits are planar (spherical symmetry); fix $\theta = \pi/2$.

The radial geodesic equation reduces to
$$\tfrac{1}{2} \dot r^2 + V_{\mathrm{eff}}(r) = \tfrac{1}{2} (E^2 - 1), \qquad V_{\mathrm{eff}}(r) = -\frac{M}{r} + \frac{L^2}{2 r^2} - \frac{M L^2}{r^3}.$$
The first three terms — Newtonian gravity, angular-momentum barrier, GR correction — explain the classical tests:

- **Perihelion precession of Mercury** comes from the $-M L^2 / r^3$ term, which makes bound orbits not close on themselves.
- **Light deflection** comes from doing the same calculation for null geodesics ($\dot\tau \to 0$ limit).
- **Gravitational redshift** comes directly from the $g_{tt}$ coefficient: clocks at rest at small $r$ tick slower than clocks at large $r$ by a factor of $\sqrt{1 - 2M/r}$.

These three are the classical tests of GR. The numerical values are textbook.

## Why "the" example

Two more facts justify Schwarzschild as the worked example:

- **Birkhoff's theorem.** Any spherically symmetric vacuum solution of the Einstein equations is locally isometric to Schwarzschild — even *without* assuming staticity. Spherical symmetry alone forces the metric to be static outside the source. No spherically symmetric gravitational waves.
- **Generalizations.** Adding charge gives Reissner–Nordström; adding rotation gives Kerr; both retain the family-of-conserved-quantities structure that makes geodesic motion tractable. Schwarzschild is the simplest member of a hierarchy.

The next page leaves the torsion-free Levi-Civita world: Einstein–Cartan gravity, where torsion is allowed.
