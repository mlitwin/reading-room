---
title: Skew coordinates
---

The skew chart tilts the grid of the standard chart: longitudes are sheared and latitudes stay horizontal ([diagram](01-the-sphere-and-two-charts.md)). It keeps $\theta$ and shears the longitude, with $\alpha = \pi/8 \approx 22.5°$ throughout:
$$\tilde\theta := \theta, \qquad \tilde\varphi := \varphi + \alpha\, \cos\theta.$$
The shift by $\alpha\cos\theta$ is largest at the poles and zero at the equator, producing the visible tilt of the longitude curves. The Jacobian of $(\theta, \varphi) \mapsto (\tilde\theta, \tilde\varphi)$ is everywhere non-singular ($\det = 1$), so this is a valid chart wherever the standard one is.

In the embedded picture,
$$\tilde\Phi(\tilde\theta, \tilde\varphi) = \Phi\big(\tilde\theta,\, \tilde\varphi - \alpha\cos\tilde\theta\big) = (\sin\tilde\theta\, \cos\psi,\; \sin\tilde\theta\, \sin\psi,\; \cos\tilde\theta), \quad \psi := \tilde\varphi - \alpha\cos\tilde\theta.$$

## Basis vectors

Differentiating the embedded formula:
$$\begin{aligned}
\partial_{\tilde\theta} &= \frac{\partial \tilde\Phi}{\partial \tilde\theta} = (\cos\tilde\theta\,\cos\psi - \alpha\sin^2\tilde\theta\,\sin\psi, \; \cos\tilde\theta\,\sin\psi + \alpha\sin^2\tilde\theta\,\cos\psi, \; -\sin\tilde\theta), \\
\partial_{\tilde\varphi} &= \frac{\partial \tilde\Phi}{\partial \tilde\varphi} = (-\sin\tilde\theta\,\sin\psi, \; \sin\tilde\theta\,\cos\psi, \; 0).
\end{aligned}$$

In terms of the **standard** basis vectors $\partial_\theta, \partial_\varphi$ evaluated at the same point in $S^2$, the chain rule gives
$$\partial_{\tilde\theta} = \partial_\theta + \alpha\sin\tilde\theta\, \partial_\varphi, \qquad \partial_{\tilde\varphi} = \partial_\varphi.$$

This is more compact and more informative than the embedded formula. The skew basis vector $\partial_{\tilde\varphi}$ is *the same* tangent vector as the standard $\partial_\varphi$ (because $\partial / \partial\tilde\varphi = \partial / \partial \varphi$ with $\theta$ held fixed). The skew $\partial_{\tilde\theta}$ is the standard $\partial_\theta$ *plus* a contribution along $\partial_\varphi$ proportional to $\alpha \sin\tilde\theta$. The shear — the $\theta$-derivative of the shift — scales with $\sin\theta$: zero at the poles, maximum at the equator.

## Non-orthogonality

The inner product of the two skew basis vectors, in the round metric:
$$\partial_{\tilde\theta} \cdot \partial_{\tilde\varphi} = (\partial_\theta + \alpha\sin\tilde\theta\, \partial_\varphi) \cdot \partial_\varphi = \partial_\theta \cdot \partial_\varphi + \alpha\sin\tilde\theta\, |\partial_\varphi|^2 = 0 + \alpha\sin\tilde\theta \cdot \sin^2\tilde\theta = \alpha \sin^3\tilde\theta.$$
Non-zero away from the poles. This is the off-diagonal component $g_{\tilde\theta\tilde\varphi}$ of the metric in the skew chart ([page 6](06-the-round-metric.md)), and the most direct sign that the chart is non-orthogonal.

The angle between the skew basis vectors:
$$\cos \angle(\partial_{\tilde\theta}, \partial_{\tilde\varphi}) = \frac{\partial_{\tilde\theta} \cdot \partial_{\tilde\varphi}}{|\partial_{\tilde\theta}|\, |\partial_{\tilde\varphi}|} = \frac{\alpha\sin^3\tilde\theta}{\sqrt{1 + \alpha^2 \sin^4 \tilde\theta} \, \cdot \sin\tilde\theta} = \frac{\alpha\sin^2\tilde\theta}{\sqrt{1 + \alpha^2 \sin^4\tilde\theta}}.$$
At $\tilde\theta = \pi/2$ (equator) and $\alpha = \pi/8$ the cosine is $\alpha/\sqrt{1+\alpha^2} \approx 0.366$, so the angle is about $69°$ — visibly off-$90°$.

## At the sample point

With $\tilde\theta_0 = \theta_0 = 13\pi/32, \tilde\varphi_0 = \varphi_0 + \alpha\cos\theta_0$:
$$|\partial_{\tilde\theta}|^2 = 1 + \alpha^2 \sin^4 \tilde\theta_0 \approx 1 + (\pi/8)^2 (0.957)^4 \approx 1.129.$$
$$|\partial_{\tilde\varphi}|^2 = \sin^2 \tilde\theta_0 \approx 0.916.$$
$$\cos \angle \approx \frac{(\pi/8)(0.957)^2}{\sqrt{1.129}} \approx 0.338,$$
so the angle is about $70.2°$.

The tangent-plane diagram in the skew chart:

![Tangent basis at the sample point in the skew chart — two oblique arrows ∂θ̃ and ∂φ̃](../figures/tangent-skew.svg)

The diagram exaggerates the obliqueness slightly (it's drawn at $60°$ for visual clarity), but the qualitative picture is right: the basis pair is sheared compared to the standard chart.

## Dual basis

The **dual basis** $d\tilde\theta, d\tilde\varphi$ is defined by $d\tilde\theta(\partial_{\tilde\theta}) = 1$, $d\tilde\theta(\partial_{\tilde\varphi}) = 0$, etc. To draw a covector as an arrow beside the basis vectors, convert it to a vector with the [musical isomorphism](note:musical-isomorphism) $\sharp$. Drawn that way, each dual covector is perpendicular to the *other* coordinate basis vector, because $d\tilde\theta(\partial_{\tilde\varphi}) = d\tilde\varphi(\partial_{\tilde\theta}) = 0$. In an orthogonal chart that makes each parallel to its own basis vector; in a non-orthogonal chart it does not:

- $d\tilde\theta \perp \partial_{\tilde\varphi}$, so $d\tilde\theta$ is not parallel to $\partial_{\tilde\theta}$.
- $d\tilde\varphi \perp \partial_{\tilde\theta}$, so $d\tilde\varphi$ is not parallel to $\partial_{\tilde\varphi}$.

![Skew tangent plane with coordinate basis (solid black) and dual basis (dashed grey). Each dual covector is perpendicular to the "wrong" axis.](../figures/dual-basis-skew.svg)

The angle between $d\tilde\theta$ and $d\tilde\varphi$, measured the same way, is not $\pi/2$ either. It is the **supplement** of the angle between $\partial_{\tilde\theta}$ and $\partial_{\tilde\varphi}$. Angles between covectors use the *inverse* metric, and inverting a $2 \times 2$ matrix flips the sign of the off-diagonal entry ($g^{\tilde\theta\tilde\varphi} = -g_{\tilde\theta\tilde\varphi}/\det g$), so the cosine flips sign: basis vectors at $\approx 70°$ put the dual covectors at $\approx 110°$.

## Coordinate functions

As functions on $S^2$, the skew coordinates are
$$\tilde\theta(p) = \theta(p), \qquad \tilde\varphi(p) = \varphi(p) + \alpha\, \cos\theta(p),$$
with $\theta, \varphi$ the standard coordinate functions; $d\tilde\theta$ and $d\tilde\varphi$ are their differentials.

The next page works out the Jacobian between the two charts and how components transform.
