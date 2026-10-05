---
title: Volume form and Hodge star
---

A metric and an [orientation](note:orientation) single out one $n$-form, so functions as well as forms can be integrated. They also identify $k$-forms with $(n-k)$-forms, which is how vector calculus turns forms back into vectors.

## The volume form

On an oriented $(M, \tens{g})$ the **[volume form](note:volume-form)** is the $n$-form
$$\mathrm{vol}_g = \sqrt{|\det g|}\; dx^1 \wedge \cdots \wedge dx^n$$
in any positively oriented chart. The absolute value handles signature: $\det g > 0$ for a Riemannian metric, $\det g < 0$ for a Lorentzian one.

The definition does not depend on the chart. Under $x \mapsto x'$ with Jacobian determinant $J = \det(\partial x'/\partial x) > 0$, the metric components transform as a $(0, 2)$-tensor,
$$g'_{\mu'\nu'} = \frac{\partial x^\rho}{\partial x'^{\mu'}} \frac{\partial x^\sigma}{\partial x'^{\nu'}}\, g_{\rho\sigma}, \qquad \text{so } \det g' = J^{-2} \det g,$$
while $dx'^1 \wedge \cdots \wedge dx'^n = J\, dx^1 \wedge \cdots \wedge dx^n$. The two factors of $J$ cancel. Equivalently, $\mathrm{vol}_g(\tens{e}_1, \ldots, \tens{e}_n) = 1$ on every positively oriented orthonormal basis.

**Integrating functions.** For compactly supported $f$, $\int_M f\, \mathrm{vol}_g$ is a well-defined number. In one chart,
$$\int_M f\, \mathrm{vol}_g = \int f(x)\, \sqrt{|\det g(x)|}\; d^n x.$$
The factor $\sqrt{|\det g|}$ is the difference between coordinate integration and invariant integration. Every action integral in chapters 14–15 has this form.

**Divergence.** The divergence of a vector field is defined by
$$d(\iota_{\tens{X}} \mathrm{vol}_g) = (\operatorname{div} \tens{X})\, \mathrm{vol}_g, \qquad \operatorname{div} \tens{X} = \frac{1}{\sqrt{|\det g|}}\, \partial_\mu\bigl(\sqrt{|\det g|}\, X^\mu\bigr).$$
By Cartan's formula ([chapter 6](../06-differential-forms/02-exterior-derivative-and-pullback.md)), the left side is also $\Lie_{\tens{X}} \mathrm{vol}_g$: the divergence is the rate at which the flow of $\tens{X}$ changes volume. It equals the covariant divergence $\nabla_\mu X^\mu$ of the Levi-Civita connection ([chapter 8](../08-connection-and-curvature/02-covariant-derivative.md)).

## On the sphere

For the round metric $\tens{g} = d\theta^2 + \sin^2\theta\, d\varphi^2$ ([chapter 4](../04-coordinate-systems/06-the-round-metric.md)), $\det g = \sin^2\theta$ and
$$\mathrm{vol}_g = \sin\theta\; d\theta \wedge d\varphi.$$
Evaluated on the coordinate basis, $\mathrm{vol}_g(\partial_\theta, \partial_\varphi) = \sin\theta$, the area of the coordinate parallelogram. Its components are $(\mathrm{vol}_g)_{\theta\varphi} = -(\mathrm{vol}_g)_{\varphi\theta} = \sin\theta$. Integrating gives the area of the unit sphere:
$$\int_{S^2} \mathrm{vol}_g = \int_0^\pi \!\! \int_0^{2\pi} \sin\theta\; d\varphi\, d\theta = 4\pi.$$
In the skew chart $\det g = \sin^2\tilde\theta$ as well, because the chart change has Jacobian determinant $1$, so $\mathrm{vol}_g = \sin\tilde\theta\, d\tilde\theta \wedge d\tilde\varphi$. In the stereographic chart the chain rule gives
$$\mathrm{vol}_g = \frac{4}{(1 + x^2 + y^2)^2}\; dx \wedge dy.$$
Same 2-form, three component functions.

**Without a metric.** Any nowhere-vanishing 2-form, such as $\sin\theta\, d\theta \wedge d\varphi$ written down directly, orients $S^2$ and can be integrated. The metric is what makes this one canonical.

## Hodge star

A metric and orientation define the **Hodge star** $\star: \Omega^k(M) \to \Omega^{n-k}(M)$,
$$\star (dx^{\mu_1} \wedge \cdots \wedge dx^{\mu_k}) = \frac{\sqrt{|\det g|}}{(n-k)!}\, g^{\mu_1 \nu_1} \cdots g^{\mu_k \nu_k}\, \varepsilon_{\nu_1 \cdots \nu_k \rho_1 \cdots \rho_{n-k}}\, dx^{\rho_1} \wedge \cdots \wedge dx^{\rho_{n-k}},$$
with $\varepsilon$ the [Levi-Civita symbol](note:levi-civita) ($\varepsilon_{1 \cdots n} = 1$). In particular $\star 1 = \mathrm{vol}_g$. The star squares to $\pm\mathrm{id}$, with a sign that depends on $k$, $n$ and the signature. In four-dimensional Lorentzian spacetime $\star^2 = -\mathrm{id}$ on 2-forms, and $\star \tens{F}$ exchanges the electric and magnetic parts of the Maxwell field.

**Vector calculus.** On $\mathbb{R}^3$ with the Euclidean metric, $\flat$ and $\star$ turn $d$ into the three classical operators:
$$df = (\operatorname{grad} f)^\flat, \qquad \star d(\tens{X}^\flat) = (\operatorname{curl} \tens{X})^\flat, \qquad \star d \star (\tens{X}^\flat) = \operatorname{div} \tens{X}.$$
The identities $\operatorname{curl} \operatorname{grad} = 0$ and $\operatorname{div} \operatorname{curl} = 0$ are both $d^2 = 0$. Beyond this, the book does not use the Hodge star.
