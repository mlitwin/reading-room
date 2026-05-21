---
title: On the sphere
---

The round metric on $S^2$ — the geometry inherited from $S^2 \subseteq \mathbb{R}^3$.

## In spherical coordinates

Pull back the Euclidean metric $dX^2 + dY^2 + dZ^2$ on $\mathbb{R}^3$ through the parametrization $\Phi(\theta, \varphi)$:
$$g = d\theta^2 + \sin^2\theta\; d\varphi^2.$$
The component matrix is
$$[g_{\mu\nu}] = \begin{pmatrix} 1 & 0 \\ 0 & \sin^2\theta \end{pmatrix}, \qquad \det g = \sin^2\theta.$$
Riemannian (both eigenvalues positive), non-degenerate where $\sin\theta \neq 0$ — i.e. everywhere the chart covers. At the poles $\sin\theta = 0$ and the chart breaks down; the metric is fine there but $(\theta, \varphi)$ are bad coordinates.

The inverse metric is
$$[g^{\mu\nu}] = \begin{pmatrix} 1 & 0 \\ 0 & 1/\sin^2\theta \end{pmatrix}.$$

## Lengths, angles, area

The length of the basis vectors:
$$|\partial_\theta|^2 = g_{\theta\theta} = 1, \qquad |\partial_\varphi|^2 = g_{\varphi\varphi} = \sin^2\theta.$$
So $\partial_\theta$ has unit length everywhere; $\partial_\varphi$ has length $\sin\theta$ — short near the poles, long at the equator. The vector $\sin\theta\, \partial_\varphi$ would be the unit vector pointing east, in the conventions of any geographer.

The orthogonality $g(\partial_\theta, \partial_\varphi) = 0$ says the spherical coordinates are an orthogonal coordinate system on $S^2$.

The angle between two tangent vectors at a point uses the inner product in the usual way. A curve $\gamma(t) = \Phi(\theta(t), \varphi(t))$ has length
$$L(\gamma) = \int \sqrt{\dot\theta^2 + \sin^2\theta\, \dot\varphi^2}\; dt.$$
A meridian ($\varphi$ constant) from pole to pole has length $\int_0^\pi 1\, d\theta = \pi$; the equator ($\theta = \pi/2$) has length $\int_0^{2\pi} \sin(\pi/2)\, d\varphi = 2\pi$. Both as expected for a unit-radius sphere.

The volume form is
$$\mathrm{vol}_g = \sqrt{\det g}\; d\theta \wedge d\varphi = \sin\theta\; d\theta \wedge d\varphi,$$
recovering the same form computed in the [previous section](../02-tensors/04-on-the-sphere.md) — there constructed from antisymmetry alone, here recovered as the metric volume form. Integrating gives $\int_{S^2} \mathrm{vol}_g = \int_0^\pi \int_0^{2\pi} \sin\theta\, d\varphi\, d\theta = 4\pi$, the area of the unit sphere.

## Raising and lowering

The covector dual to $\partial_\theta$ is
$$(\partial_\theta)^\flat = g_{\theta\nu}\, dx^\nu = d\theta.$$
Similarly $(\partial_\varphi)^\flat = \sin^2\theta\, d\varphi$. Note this is *not* $d\varphi$: the metric weighting changes the magnitude.

Going the other way: the vector dual to $d\varphi$ is $(d\varphi)^\sharp = g^{\varphi\nu}\, \partial_\nu = (1/\sin^2\theta)\, \partial_\varphi$. Long basis vector → short dual covector and vice versa.

## In stereographic coordinates

Pulling back the same Euclidean metric through the stereographic chart gives
$$g = \frac{4}{(1 + x^2 + y^2)^2}\, (dx^2 + dy^2).$$
**Conformally flat:** the metric is a positive scalar function times $dx^2 + dy^2$, so angles agree with Euclidean angles in this chart even though lengths don't. The conformal factor $4/(1 + r^2)^2$ blows up as $r \to \infty$ (which is where the south pole would be).

A general fact: any $2$-manifold admits isothermal (conformally flat) coordinates locally. The sphere happens to admit them on a chart missing a single point.

## Pullback by a rotation

The action of $SO(3)$ on $S^2$ preserves the round metric. For a rotation $R: S^2 \to S^2$,
$$R^* g = g.$$
Equivalently, the components of $R^* g$ in the spherical chart equal the components of $g$ in that chart, after the rotation has been worked through the transformation rule. This is the **isometry** condition; the connected isometry group of the round sphere is $SO(3)$ (with $O(3)$ if reflections are allowed). [Killing vectors](note:killing-vector) — infinitesimal generators of isometries — make this concrete in the connection section.
