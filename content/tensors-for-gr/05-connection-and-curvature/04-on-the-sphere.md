---
title: On the sphere
---

The Levi-Civita connection of the round metric, the Riemann tensor, and Gaussian curvature on $S^2$ — all worked out from $g = d\theta^2 + \sin^2\theta\, d\varphi^2$.

## Christoffel symbols

Plug into the [Christoffel formula](02-covariant-derivative.md). The non-trivial pieces of $g$ are $g_{\theta\theta} = 1$, $g_{\varphi\varphi} = \sin^2\theta$, with $g^{\theta\theta} = 1$, $g^{\varphi\varphi} = 1/\sin^2\theta$, and only one non-zero partial derivative: $\partial_\theta g_{\varphi\varphi} = 2 \sin\theta \cos\theta$.

Running through the formula:

- $\Gamma^\theta{}_{\theta\theta} = 0$, $\Gamma^\theta{}_{\theta\varphi} = 0$.
- $\Gamma^\theta{}_{\varphi\varphi} = -\tfrac{1}{2}\, g^{\theta\theta}\, \partial_\theta g_{\varphi\varphi} = -\sin\theta\cos\theta$.
- $\Gamma^\varphi{}_{\theta\varphi} = \Gamma^\varphi{}_{\varphi\theta} = \tfrac{1}{2}\, g^{\varphi\varphi}\, \partial_\theta g_{\varphi\varphi} = \cot\theta$.
- $\Gamma^\varphi{}_{\theta\theta} = 0$, $\Gamma^\varphi{}_{\varphi\varphi} = 0$.

Summary: only the three Christoffels
$$\Gamma^\theta{}_{\varphi\varphi} = -\sin\theta\cos\theta, \qquad \Gamma^\varphi{}_{\theta\varphi} = \Gamma^\varphi{}_{\varphi\theta} = \cot\theta$$
are non-zero (in the spherical chart). Symmetry in the lower pair holds automatically — Levi-Civita is torsion-free.

## Geodesic equation

The geodesic equation $\ddot\gamma^\rho + \Gamma^\rho{}_{\mu\nu} \dot\gamma^\mu \dot\gamma^\nu = 0$ becomes
$$\ddot\theta - \sin\theta\cos\theta\, \dot\varphi^2 = 0, \qquad \ddot\varphi + 2 \cot\theta\, \dot\theta \dot\varphi = 0.$$
Solutions: great circles. The meridians $\varphi = \mathrm{const}$ have $\dot\varphi = 0$, so both equations reduce to $\ddot\theta = 0$ — uniform-speed traversal of $\theta$. The equator $\theta = \pi/2$ has $\dot\theta = 0$ and $\sin\theta\cos\theta = 0$, so $\ddot\varphi = 0$ — uniform-speed traversal of $\varphi$. Other geodesics are rotations of these — the family of all great circles, which is what the geometry knows about $SO(3)$.

## Riemann tensor

From the component formula
$$R^\rho{}_{\sigma\mu\nu} = \partial_\mu \Gamma^\rho{}_{\nu\sigma} - \partial_\nu \Gamma^\rho{}_{\mu\sigma} + \Gamma^\rho{}_{\mu\lambda} \Gamma^\lambda{}_{\nu\sigma} - \Gamma^\rho{}_{\nu\lambda} \Gamma^\lambda{}_{\mu\sigma},$$
the antisymmetries reduce the independent components in dimension $2$ to a single one. Compute $R^\theta{}_{\varphi\theta\varphi}$:
$$\begin{aligned}
R^\theta{}_{\varphi\theta\varphi} &= \partial_\theta \Gamma^\theta{}_{\varphi\varphi} - \partial_\varphi \Gamma^\theta{}_{\theta\varphi} + \Gamma^\theta{}_{\theta\lambda} \Gamma^\lambda{}_{\varphi\varphi} - \Gamma^\theta{}_{\varphi\lambda} \Gamma^\lambda{}_{\theta\varphi} \\
&= \partial_\theta (-\sin\theta\cos\theta) - 0 + 0 - (-\sin\theta\cos\theta)(\cot\theta) \\
&= -(\cos^2\theta - \sin^2\theta) + \cos^2\theta \\
&= \sin^2\theta.
\end{aligned}$$
Lower the first index: $R_{\theta\varphi\theta\varphi} = g_{\theta\theta}\, R^\theta{}_{\varphi\theta\varphi} = \sin^2\theta$.

The full Riemann tensor in dimension $2$ takes the form
$$R_{\rho\sigma\mu\nu} = K\, (g_{\rho\mu}\, g_{\sigma\nu} - g_{\rho\nu}\, g_{\sigma\mu}),$$
with $K$ the Gaussian curvature. Solving: $R_{\theta\varphi\theta\varphi} = K\, (g_{\theta\theta} g_{\varphi\varphi} - g_{\theta\varphi}^2) = K \sin^2\theta$, so
$$K = 1.$$
Constant Gaussian curvature equal to $1$ — the canonical fact about the unit sphere.

## Ricci and scalar

Contracting Riemann:
$$R_{\sigma\nu} = R^\lambda{}_{\sigma\lambda\nu} = K\, (\delta^\lambda_\lambda - 1)\, g_{\sigma\nu} = K \, g_{\sigma\nu}$$
in dimension $2$, so $R_{\mu\nu} = g_{\mu\nu}$ on the unit sphere. The Ricci tensor is the metric.

Scalar curvature: $R = g^{\mu\nu} R_{\mu\nu} = g^{\mu\nu} g_{\mu\nu} = 2$.

Note the Einstein tensor $G_{\mu\nu} = R_{\mu\nu} - \tfrac{1}{2} R\, g_{\mu\nu} = g_{\mu\nu} - g_{\mu\nu} = 0$ vanishes identically. This is *not* the vacuum Einstein equation in $4$D (where $G = 0$ is non-trivial); in dimension $2$ the Einstein tensor is always identically zero and conveys no geometric information. GR begins to be non-trivial only in dimension $\geq 3$, and the dynamical content lives entirely in dimension $\geq 4$.

## In the skew chart

The same geometry, the same Levi-Civita connection, computed in the [skew chart](../01-coordinate-systems/03-skew-coordinates.md) with $\alpha = \pi/8$ — and the same intrinsic curvature emerging at the end.

The metric components (from the [previous section's calculation](../04-metric/03-on-the-sphere.md)) are
$$g_{\tilde\theta\tilde\theta} = 1 + \alpha^2 \sin^4 \tilde\theta, \quad g_{\tilde\theta\tilde\varphi} = \alpha \sin^3\tilde\theta, \quad g_{\tilde\varphi\tilde\varphi} = \sin^2\tilde\theta.$$

Both off-diagonal terms and the dependence of $g_{\tilde\theta\tilde\theta}$ on $\tilde\theta$ contribute to the Christoffel formula. Whereas the standard chart had only the three non-zero entries $\Gamma^\theta{}_{\varphi\varphi}, \Gamma^\varphi{}_{\theta\varphi}, \Gamma^\varphi{}_{\varphi\theta}$, the skew chart has every $\Gamma^{\tilde\rho}{}_{\tilde\mu\tilde\nu}$ entry non-zero (still subject to lower-pair symmetry). The complete list is six independent functions of $\tilde\theta$ — they can be derived by writing the Christoffel formula
$$\Gamma^{\tilde\rho}{}_{\tilde\mu\tilde\nu} = \tfrac{1}{2}\, g^{\tilde\rho\tilde\sigma} (\partial_{\tilde\mu} g_{\tilde\nu\tilde\sigma} + \partial_{\tilde\nu} g_{\tilde\sigma\tilde\mu} - \partial_{\tilde\sigma} g_{\tilde\mu\tilde\nu})$$
and grinding through.

The takeaway from this calculation isn't the values of the six Christoffels — it's that they are **different** from the standard-chart Christoffels even though the connection is the same. Christoffels are *not* tensors; they carry chart-dependent information.

What **is** chart-independent: the Riemann tensor (as a tensor), the Ricci scalar, and the sectional curvature. Computing $R^{\tilde\theta}{}_{\tilde\varphi\tilde\theta\tilde\varphi}$ from the skew Christoffels and then $K = R_{\tilde\theta\tilde\varphi\tilde\theta\tilde\varphi} / (g_{\tilde\theta\tilde\theta} g_{\tilde\varphi\tilde\varphi} - g_{\tilde\theta\tilde\varphi}^2)$ recovers
$$K = 1$$
— the same Gaussian curvature as in the standard chart. The chart's shear shows up entirely in the components; the intrinsic curvature is untouched.

## Gauss–Bonnet

The integral of Gaussian curvature on a closed orientable Riemannian $2$-manifold equals $2\pi$ times the Euler characteristic:
$$\int_M K\, \mathrm{vol}_g = 2\pi\, \chi(M).$$
For $S^2$: $\int_{S^2} 1 \cdot \sin\theta\, d\theta\, d\varphi = 4\pi = 2\pi \cdot 2 = 2\pi \chi(S^2)$. The unit sphere's Gaussian curvature integrates correctly to give Euler characteristic $2$ — a topological invariant computed from purely metric data.

This is the simplest of the Chern–Gauss–Bonnet theorems, and the cleanest connection between local curvature and global topology that anything in this book displays.

## Parallel transport around a triangle

A vector parallel-transported around a closed loop on the sphere returns rotated by the loop's enclosed solid angle. For a spherical triangle with interior angles $\alpha, \beta, \gamma$, the rotation angle is the spherical excess
$$E = \alpha + \beta + \gamma - \pi,$$
which equals the triangle's area. (Total area of the sphere = $4\pi$ = sum of all possible rotation angles, mod $4\pi$.) This is the integrated Riemann tensor: $\oint = \iint R$, in the most explicit form available in dimension $2$.

The same phenomenon in dimension $4$ — parallel transport around a closed loop returning a vector rotated by an amount measured by the Riemann tensor — is the geometric content of GR's curved-spacetime picture of gravity.
