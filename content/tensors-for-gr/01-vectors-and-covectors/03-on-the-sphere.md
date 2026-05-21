---
title: On the sphere
---

The two-sphere
$$S^2 = \{ (X, Y, Z) \in \mathbb{R}^3 : X^2 + Y^2 + Z^2 = 1 \}$$
is small enough to compute on by hand and rich enough to break flat-space intuition. Every section ends with a page that anchors that section's abstract material here.

## Spherical-coordinate chart

Take the standard parametrization
$$\Phi(\theta, \varphi) = (\sin\theta \cos\varphi, \; \sin\theta \sin\varphi, \; \cos\theta),$$
with $\theta \in (0, \pi)$ the polar angle from the north pole and $\varphi \in [0, 2\pi)$ the azimuth. This chart misses the two poles (where $\varphi$ is undefined) and the seam at $\varphi = 0$; a second chart, e.g. rotated $90^\circ$ in $Z$, covers what this one misses.

The tangent basis vectors at $p = \Phi(\theta, \varphi)$, **embedded view**, are the partial derivatives of $\Phi$:
$$\begin{aligned}
\partial_\theta &= (\cos\theta \cos\varphi, \; \cos\theta \sin\varphi, \; -\sin\theta), \\
\partial_\varphi &= (-\sin\theta \sin\varphi, \; \sin\theta \cos\varphi, \; 0).
\end{aligned}$$
These are vectors in $\mathbb{R}^3$, automatically tangent to the sphere at $p$. Their lengths are $|\partial_\theta| = 1$ and $|\partial_\varphi| = \sin\theta$ — not unit vectors. This non-trivial length is a coordinate artifact; the same basis from the **abstract view** is just $\partial/\partial \theta$ and $\partial/\partial \varphi$ acting on functions $f(\theta, \varphi)$, with no notion of length until the metric arrives.

A tangent vector at $p$ is $v = v^\theta\, \partial_\theta + v^\varphi\, \partial_\varphi$. The contravariant components $(v^\theta, v^\varphi)$ depend on the chart; in the embedded view, the *Euclidean* components in $\mathbb{R}^3$ are
$$v_{\mathrm{euc}} = v^\theta\, \partial_\theta + v^\varphi\, \partial_\varphi \in \mathbb{R}^3,$$
read off the formulas above. The two representations carry the same information but live in different vector spaces.

## Stereographic chart

A second chart covers the missing seam. Stereographic projection from the south pole gives
$$\psi_S(p) = (x, y) = \left( \frac{X}{1 + Z}, \; \frac{Y}{1 + Z} \right),$$
covering everything except the south pole itself. The basis $\{\partial_x, \partial_y\}$ at $p$ is, embedded,
$$\partial_x = \frac{\partial \Phi_S^{-1}}{\partial x}, \qquad \partial_y = \frac{\partial \Phi_S^{-1}}{\partial y},$$
with $\Phi_S^{-1}(x, y) = (2x, 2y, 1 - x^2 - y^2) / (1 + x^2 + y^2)$. These two vectors at $p$ are *different* from $\partial_\theta, \partial_\varphi$ — different basis, different components — but they span the same tangent space $T_p S^2$.

## Components transform

A vector field expressed in the spherical chart, say $V = \partial_\varphi$ (rotation around the $Z$-axis), has stereographic components determined by the Jacobian:
$$V'^{x} = \frac{\partial x}{\partial \theta}\, V^\theta + \frac{\partial x}{\partial \varphi}\, V^\varphi, \qquad V'^{y} = \frac{\partial y}{\partial \theta}\, V^\theta + \frac{\partial y}{\partial \varphi}\, V^\varphi.$$
With $V^\theta = 0, V^\varphi = 1$, this evaluates (using $x = \sin\theta\cos\varphi / (1+\cos\theta)$, $y = \sin\theta\sin\varphi / (1+\cos\theta)$) to
$$V'^{x} = -y, \qquad V'^{y} = x,$$
the familiar rotation field in the plane. The *same* vector field has *different* component functions in the two charts — both are correct, and both transform into each other via the rule from [the tangent-vectors page](01-tangent-vectors.md).

## Cotangent at a point

In the spherical chart, the dual basis to $\{\partial_\theta, \partial_\varphi\}$ is $\{d\theta, d\varphi\}$, with $d\theta(\partial_\theta) = 1$, $d\theta(\partial_\varphi) = 0$, and so on. A covector $\omega = \omega_\theta\, d\theta + \omega_\varphi\, d\varphi$ pairs with $v = v^\theta\, \partial_\theta + v^\varphi\, \partial_\varphi$ as
$$\omega(v) = \omega_\theta\, v^\theta + \omega_\varphi\, v^\varphi.$$
The arithmetic is identical to flat space; what's coordinate-dependent is the basis being paired, not the pairing itself.

A natural covector field is $d(\cos\theta) = -\sin\theta\, d\theta$ — the differential of the $Z$-coordinate function. It pairs with $\partial_\varphi$ to give zero (the $Z$-coordinate is rotation-invariant); with $\partial_\theta$ to give $-\sin\theta$ (the rate of change of $Z$ as $\theta$ increases). All of this is independent of any choice of metric; the next section is where lengths enter.
