---
title: The round metric
---

The round metric on $S^2$, induced from $S^2 \subseteq \mathbb{R}^3$, in the three charts of this chapter.

## In spherical coordinates

Pull back the Euclidean metric $dX^2 + dY^2 + dZ^2$ on $\mathbb{R}^3$ through the parametrization $\Phi(\theta, \varphi)$:
$$\tens{g} = d\theta^2 + \sin^2\theta\; d\varphi^2.$$
The component matrix is
$$[g_{\mu\nu}] = \begin{pmatrix} 1 & 0 \\ 0 & \sin^2\theta \end{pmatrix}, \qquad \det g = \sin^2\theta.$$
Riemannian (both eigenvalues positive), non-degenerate where $\sin\theta \neq 0$ — i.e. everywhere the chart covers. At the poles $\sin\theta = 0$ and the chart breaks down; the metric is fine there but $(\theta, \varphi)$ are bad coordinates.

The inverse metric is
$$[g^{\mu\nu}] = \begin{pmatrix} 1 & 0 \\ 0 & 1/\sin^2\theta \end{pmatrix}.$$

## Lengths and angles

The length of the basis vectors:
$$|\partial_\theta|^2 = g_{\theta\theta} = 1, \qquad |\partial_\varphi|^2 = g_{\varphi\varphi} = \sin^2\theta.$$
So $\partial_\theta$ has unit length everywhere; $\partial_\varphi$ has length $\sin\theta$ — short near the poles, long at the equator. The unit vector pointing east is $\frac{1}{\sin\theta}\, \partial_\varphi$.

The orthogonality $\tens{g}(\partial_\theta, \partial_\varphi) = 0$ says the spherical coordinates are an orthogonal coordinate system on $S^2$.

A curve $\gamma(t) = \Phi(\theta(t), \varphi(t))$ has length
$$\operatorname{len}(\gamma) = \int \sqrt{\dot\theta^2 + \sin^2\theta\, \dot\varphi^2}\; dt.$$
A meridian ($\varphi$ constant) from pole to pole has length $\int_0^\pi 1\, d\theta = \pi$; the equator ($\theta = \pi/2$) has length $\int_0^{2\pi} \sin(\pi/2)\, d\varphi = 2\pi$. Both as expected for a unit-radius sphere.

The area form $\mathrm{vol}_g = \sin\theta\, d\theta \wedge d\varphi$ and the total area $4\pi$ follow from $\det g = \sin^2\theta$ ([chapter 7](../07-integration/02-volume-form-and-hodge-star.md)).

## Raising and lowering

The [musical isomorphisms](note:musical-isomorphism) in action: the covector dual to $\partial_\theta$ is
$$(\partial_\theta)^\flat = g_{\theta\nu}\, dx^\nu = d\theta.$$
Similarly $(\partial_\varphi)^\flat = \sin^2\theta\, d\varphi$. Note this is *not* $d\varphi$: the metric weighting changes the magnitude.

Going the other way: the vector dual to $d\varphi$ is $(d\varphi)^\sharp = g^{\varphi\nu}\, \partial_\nu = (1/\sin^2\theta)\, \partial_\varphi$. Long basis vector → short dual covector and vice versa.

## In the skew chart

In the [skew chart](03-skew-coordinates.md) $\tilde\theta = \theta$, $\tilde\varphi = \varphi + \alpha\cos\theta$, compute each component from $g_{\tilde\mu\tilde\nu} = \tens{g}(\partial_{\tilde\mu}, \partial_{\tilde\nu})$ and the basis identities $\partial_{\tilde\theta} = \partial_\theta + \alpha\sin\tilde\theta\, \partial_\varphi$, $\partial_{\tilde\varphi} = \partial_\varphi$:

$$\begin{aligned}
g_{\tilde\theta\tilde\theta} &= \tens{g}(\partial_\theta + \alpha\sin\tilde\theta\, \partial_\varphi, \; \partial_\theta + \alpha\sin\tilde\theta\, \partial_\varphi) = 1 + \alpha^2 \sin^4 \tilde\theta, \\
g_{\tilde\theta\tilde\varphi} &= \tens{g}(\partial_\theta + \alpha\sin\tilde\theta\, \partial_\varphi, \; \partial_\varphi) = \alpha \sin^3 \tilde\theta, \\
g_{\tilde\varphi\tilde\varphi} &= \tens{g}(\partial_\varphi, \partial_\varphi) = \sin^2 \tilde\theta.
\end{aligned}$$

Matrix form:
$$[g_{\tilde\mu\tilde\nu}] = \begin{pmatrix} 1 + \alpha^2 \sin^4\tilde\theta & \alpha\sin^3\tilde\theta \\ \alpha\sin^3\tilde\theta & \sin^2\tilde\theta \end{pmatrix}.$$

**Off-diagonal entry.** Non-zero away from the poles, confirming the basis non-orthogonality of the skew chart. This is the most visible component-level difference from the standard chart.

**Determinant.** $\det g = (1 + \alpha^2 \sin^4\tilde\theta) \sin^2\tilde\theta - \alpha^2 \sin^6\tilde\theta = \sin^2\tilde\theta$. The same as in the standard chart, because the chart change has Jacobian determinant $1$.

**Inverse metric.** $g^{\tilde\mu\tilde\nu}$ via the cofactor formula:
$$[g^{\tilde\mu\tilde\nu}] = \frac{1}{\sin^2\tilde\theta} \begin{pmatrix} \sin^2\tilde\theta & -\alpha\sin^3\tilde\theta \\ -\alpha\sin^3\tilde\theta & 1 + \alpha^2 \sin^4\tilde\theta \end{pmatrix} = \begin{pmatrix} 1 & -\alpha\sin\tilde\theta \\ -\alpha\sin\tilde\theta & (1 + \alpha^2 \sin^4\tilde\theta)/\sin^2\tilde\theta \end{pmatrix}.$$

The off-diagonal entry flips sign — true of any $2 \times 2$ inverse with positive determinant, not of inverses in general.

**Length of the basis vectors.** From the diagonal entries:
$$|\partial_{\tilde\theta}|^2 = 1 + \alpha^2 \sin^4\tilde\theta, \qquad |\partial_{\tilde\varphi}|^2 = \sin^2 \tilde\theta.$$
At the sample point and $\alpha = \pi/8$: $|\partial_{\tilde\theta}|^2 \approx 1.129$ (slightly longer than the standard $\partial_\theta$, which has $|\partial_\theta|^2 = 1$), and $|\partial_{\tilde\varphi}|^2 \approx 0.916$ (same as the standard $\partial_\varphi$, since they're the same vector).

The takeaways:

- The same geometric metric has different component matrices in different charts.
- Off-diagonal entries are a chart artifact, not a feature of the geometry.
- $\det g$ is unchanged here only because the chart change has Jacobian determinant $1$; in general it scales by $J^{-2}$.
- The [Gaussian curvature](note:sectional-curvature) $K = 1$ ([chapter 8](../08-connection-and-curvature/06-on-the-sphere.md)) is the same in both charts because it's an intrinsic invariant.

## In stereographic coordinates

Pulling back the same Euclidean metric through the stereographic chart gives
$$\tens{g} = \frac{4}{(1 + x^2 + y^2)^2}\, (dx^2 + dy^2).$$
**Conformally flat:** the metric is a positive scalar function times $dx^2 + dy^2$, so angles agree with Euclidean angles in this chart even though lengths don't. The conformal factor $4/(1 + r^2)^2$ tends to $0$ as $r \to \infty$, where the south pole sits at infinity.

Every Riemannian $2$-manifold admits isothermal (conformally flat) coordinates locally. The sphere happens to admit them on a chart missing a single point.
