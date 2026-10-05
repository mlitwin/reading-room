---
title: The Einstein equations
---

## Setup

Spacetime is a four-dimensional smooth manifold $M$ equipped with a Lorentzian metric $\tens{g}$ of signature $(-, +, +, +)$. Test particles follow timelike (massive) or null (massless) [geodesics](note:geodesic) of the [Levi-Civita connection](note:levi-civita) of $\tens{g}$. The geometry of $\tens{g}$ is the gravitational field; the dynamical content of GR is the equation that determines $\tens{g}$ from matter content.

## The equations

The **Einstein field equations** are
$$\boxed{\; G_{\mu\nu} + \Lambda\, g_{\mu\nu} = \frac{8\pi G}{c^4}\, T_{\mu\nu}, \;}$$
where:

- $G_{\mu\nu} = R_{\mu\nu} - \tfrac{1}{2}\, R\, g_{\mu\nu}$ is the **Einstein tensor** built from the [Ricci tensor](note:ricci-and-einstein-tensors) and scalar curvature of $\tens{g}$.
- $\Lambda$ is the **cosmological constant** — a scalar parameter; observationally non-zero and positive.
- $G$ is Newton's gravitational constant and $c$ the speed of light; $8\pi G / c^4 \approx 2.08 \times 10^{-43}\, \mathrm{N}^{-1}$ in SI units. Most GR work sets $c = 1$ and $G = 1$, in which case the prefactor is $8\pi$.
- $T_{\mu\nu}$ is the **[stress–energy tensor](note:stress-energy-tensor)** of matter and non-gravitational fields. Symmetric, $(0, 2)$-tensor; its components encode energy density, momentum density, and stress.

Ten components on each side (symmetric $4 \times 4$). The contracted Bianchi identity imposes four identities among the ten equations, and diffeomorphism invariance makes four of the ten components of $g_{\mu\nu}$ gauge: six equations for six components.

## Why this combination?

The left-hand side is forced by three requirements:

1. **A symmetric $(0, 2)$-tensor.** Same shape as $T_{\mu\nu}$.
2. **Built from $\tens{g}$ and at most its second derivatives.**
3. **Divergence-free.** Local conservation of stress–energy $\nabla^\mu T_{\mu\nu} = 0$ requires the same on the left. The [contracted Bianchi identity](../09-connection-and-curvature/03-torsion-and-curvature.md) gives $\nabla^\mu G_{\mu\nu} = 0$ automatically; $\nabla^\mu g_{\mu\nu} = 0$ by metric compatibility. So $G_{\mu\nu} + \Lambda\, g_{\mu\nu}$ has divergence zero for *any* $\Lambda$.

[Lovelock's theorem](note:lovelocks-theorem): in $4$D the only tensors meeting all three are $a\, G_{\mu\nu} + b\, g_{\mu\nu}$. This is essentially the entire derivation, and explains why the Einstein equations are nearly inescapable once you ask for a tensorial second-order classical theory of a metric.

## Variational form

The Einstein equations are the Euler–Lagrange equations of the **Einstein–Hilbert action** (the first term) plus matter:
$$S[\tens{g}, \psi] = \frac{c^4}{16\pi G} \int_M (R - 2\Lambda)\, \mathrm{vol}_g + S_{\mathrm{matter}}[\tens{g}, \psi],$$
where $\psi$ collectively denotes matter fields. Varying $S$ with respect to $g^{\mu\nu}$ and integrating by parts yields the field equations with
$$T_{\mu\nu} = -\frac{2}{\sqrt{|\det g|}}\, \frac{\delta (\sqrt{|\det g|}\, \mathcal{L}_{\mathrm{matter}})}{\delta g^{\mu\nu}}.$$
This is the "definition" of $T_{\mu\nu}$ in field-theoretic GR — the response of the matter Lagrangian to a perturbation of the metric. Stress–energy is what couples to gravity.

## Vacuum and matter

**Vacuum.** With $T_{\mu\nu} = 0$ and $\Lambda = 0$:
$$G_{\mu\nu} = 0 \quad \Longleftrightarrow \quad R_{\mu\nu} = 0.$$
The trace of $G_{\mu\nu} = 0$ gives $-R = 0$, so $R = 0$ and the equation collapses to $R_{\mu\nu} = 0$. Vacuum solutions are **Ricci-flat** Lorentzian $4$-manifolds. The Riemann tensor need not vanish — Weyl curvature can carry the gravitational degrees of freedom — and there are non-trivial solutions like Schwarzschild and gravitational waves.

**With matter.** A few stress–energy tensors that come up:

- **Perfect fluid:** $T_{\mu\nu} = (\rho + p)\, u_\mu u_\nu + p\, g_{\mu\nu}$, with $\rho$ energy density, $p$ pressure, $u^\mu$ four-velocity of the fluid ($g_{\mu\nu} u^\mu u^\nu = -1$).
- **Electromagnetism:** $T_{\mu\nu} = \tfrac{1}{4\pi}(F_{\mu\lambda}\, F_\nu{}^\lambda - \tfrac{1}{4} g_{\mu\nu}\, F_{\rho\sigma} F^{\rho\sigma})$, with $\tens{F}$ the field-strength $2$-form.
- **Scalar field:** $T_{\mu\nu} = \nabla_\mu \phi\, \nabla_\nu \phi - \tfrac{1}{2}\, g_{\mu\nu}\, (\nabla \phi)^2 - g_{\mu\nu}\, V(\phi)$.

In all three, $\nabla^\mu T_{\mu\nu} = 0$ follows from the matter field equations — energy conservation is consistent with the geometry, by design.

## Geometric content, briefly

A few phrases for the geometric meaning:

- The **Ricci tensor** $R_{\mu\nu}$ measures how the volume of a small ball of freely falling test particles changes; positive Ricci → focusing, negative → defocusing. ([Geodesic deviation](../09-connection-and-curvature/04-geodesic-deviation.md) is the precise statement: Riemann drives the relative acceleration of nearby geodesics, and Ricci is its trace.)
- The **Weyl tensor** measures tidal distortion at fixed volume — the trace-free shearing component of curvature.
- A **vacuum solution** has all curvature in the Weyl tensor: Ricci vanishes, so a small ball initially at rest keeps its volume to leading order, but tidal distortion remains.

The single most important consequence — the geodesic equation as the equation of motion for free particles — is what makes the Einstein equations a theory of *gravity*: matter tells spacetime how to curve, and spacetime tells matter how to move.
