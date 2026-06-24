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
recovering the same form computed in the [previous section](../07-tensors/04-on-the-sphere.md) — there constructed from antisymmetry alone, here recovered as the metric volume form. Integrating gives $\int_{S^2} \mathrm{vol}_g = \int_0^\pi \int_0^{2\pi} \sin\theta\, d\varphi\, d\theta = 4\pi$, the area of the unit sphere.

## Raising and lowering

The covector dual to $\partial_\theta$ is
$$(\partial_\theta)^\flat = g_{\theta\nu}\, dx^\nu = d\theta.$$
Similarly $(\partial_\varphi)^\flat = \sin^2\theta\, d\varphi$. Note this is *not* $d\varphi$: the metric weighting changes the magnitude.

Going the other way: the vector dual to $d\varphi$ is $(d\varphi)^\sharp = g^{\varphi\nu}\, \partial_\nu = (1/\sin^2\theta)\, \partial_\varphi$. Long basis vector → short dual covector and vice versa.

## In the skew chart

The same round metric, expressed in the [skew chart](../06-coordinate-systems/03-skew-coordinates.md) $(\tilde\theta, \tilde\varphi)$ defined by $\tilde\theta = \theta, \tilde\varphi = \varphi + \alpha\cos\theta$:

Compute each component using $g_{\tilde\mu\tilde\nu} = g(\partial_{\tilde\mu}, \partial_{\tilde\nu})$ and the basis identities $\partial_{\tilde\theta} = \partial_\theta + \alpha\sin\tilde\theta\, \partial_\varphi$, $\partial_{\tilde\varphi} = \partial_\varphi$:

$$\begin{aligned}
g_{\tilde\theta\tilde\theta} &= g(\partial_\theta + \alpha\sin\tilde\theta\, \partial_\varphi, \; \partial_\theta + \alpha\sin\tilde\theta\, \partial_\varphi) = 1 + \alpha^2 \sin^4 \tilde\theta, \\
g_{\tilde\theta\tilde\varphi} &= g(\partial_\theta + \alpha\sin\tilde\theta\, \partial_\varphi, \; \partial_\varphi) = \alpha \sin^3 \tilde\theta, \\
g_{\tilde\varphi\tilde\varphi} &= g(\partial_\varphi, \partial_\varphi) = \sin^2 \tilde\theta.
\end{aligned}$$

Matrix form:
$$[g_{\tilde\mu\tilde\nu}] = \begin{pmatrix} 1 + \alpha^2 \sin^4\tilde\theta & \alpha\sin^3\tilde\theta \\ \alpha\sin^3\tilde\theta & \sin^2\tilde\theta \end{pmatrix}.$$

**Off-diagonal entry.** Non-zero away from the poles, confirming the basis non-orthogonality of the skew chart. This is the most visible component-level difference from the standard chart.

**Determinant.** $\det g = (1 + \alpha^2 \sin^4\tilde\theta) \sin^2\tilde\theta - \alpha^2 \sin^6\tilde\theta = \sin^2\tilde\theta$. *Same* as the standard chart — the Jacobian of the chart change has determinant $1$, so $\det g$ is unchanged. The volume form $\mathrm{vol}_g = \sin\tilde\theta\, d\tilde\theta \wedge d\tilde\varphi$ is the same intrinsic 2-form, with the same component, in both charts.

**Inverse metric.** $g^{\tilde\mu\tilde\nu}$ via the cofactor formula:
$$[g^{\tilde\mu\tilde\nu}] = \frac{1}{\sin^2\tilde\theta} \begin{pmatrix} \sin^2\tilde\theta & -\alpha\sin^3\tilde\theta \\ -\alpha\sin^3\tilde\theta & 1 + \alpha^2 \sin^4\tilde\theta \end{pmatrix} = \begin{pmatrix} 1 & -\alpha\sin\tilde\theta \\ -\alpha\sin\tilde\theta & (1 + \alpha^2 \sin^4\tilde\theta)/\sin^2\tilde\theta \end{pmatrix}.$$

Note that the inverse has off-diagonal entries with a *minus* sign — that's the consistent feature of inverses of non-diagonal symmetric matrices.

**Length of the basis vectors.** From the diagonal entries:
$$|\partial_{\tilde\theta}|^2 = 1 + \alpha^2 \sin^4\tilde\theta, \qquad |\partial_{\tilde\varphi}|^2 = \sin^2 \tilde\theta.$$
At the sample point and $\alpha = \pi/8$: $|\partial_{\tilde\theta}|^2 \approx 1.143$ (slightly longer than the standard $\partial_\theta$, which has $|\partial_\theta|^2 = 1$), and $|\partial_{\tilde\varphi}|^2 \approx 0.962$ (same as the standard $\partial_\varphi$, since they're the same vector).

The takeaways:
- The same geometric metric has different component matrices in different charts.
- Off-diagonal entries are a chart artifact, not a feature of the geometry.
- Determinant and the volume form are chart-independent (when the chart change is volume-preserving).
- The Gaussian curvature $K = 1$ (computed in [the connection-and-curvature section](../09-connection-and-curvature/04-on-the-sphere.md)) is the same in both charts because it's an intrinsic invariant.

## In stereographic coordinates

Pulling back the same Euclidean metric through the stereographic chart gives
$$g = \frac{4}{(1 + x^2 + y^2)^2}\, (dx^2 + dy^2).$$
**Conformally flat:** the metric is a positive scalar function times $dx^2 + dy^2$, so angles agree with Euclidean angles in this chart even though lengths don't. The conformal factor $4/(1 + r^2)^2$ blows up as $r \to \infty$ (which is where the south pole would be).

A general fact: any $2$-manifold admits isothermal (conformally flat) coordinates locally. The sphere happens to admit them on a chart missing a single point.

## Pullback by a rotation

The action of $SO(3)$ on $S^2$ preserves the round metric. For a rotation $R: S^2 \to S^2$,
$$R^* g = g.$$
Equivalently, the components of $R^* g$ in the spherical chart equal the components of $g$ in that chart, after the rotation has been worked through the transformation rule. This is the **isometry** condition; the connected isometry group of the round sphere is $SO(3)$ (with $O(3)$ if reflections are allowed). [Killing vectors](note:killing-vector) — infinitesimal generators of isometries — make this concrete in the connection section.
