---
title: Raising and lowering, trace, volume form
---

The metric and its inverse provide a canonical isomorphism between $T_p M$ and $T^*_p M$. This is the operation called **raising and lowering indices** — it lets the position of an index on a tensor be moved freely, with the rule that lowering uses $g_{\mu\nu}$ and raising uses $g^{\mu\nu}$.

## The musical isomorphisms

Define $\flat: T_p M \to T^*_p M$ (*flat*, lowering) and $\sharp: T^*_p M \to T_p M$ (*sharp*, raising) by
$$v^\flat(w) := g(v, w), \qquad g(\omega^\sharp, w) := \omega(w).$$
In components,
$$v_\mu = g_{\mu\nu}\, v^\nu, \qquad \omega^\mu = g^{\mu\nu}\, \omega_\nu.$$
The two maps are mutual inverses: $(v^\flat)^\sharp = v$ and $(\omega^\sharp)^\flat = \omega$.

For tensors of higher rank, raising and lowering act on a chosen index. Convention: write the same kernel letter and move the index;
$$T_\mu{}^\nu := g_{\mu\rho}\, T^{\rho\nu}, \qquad T^{\mu\nu} = g^{\mu\rho}\, T_\rho{}^\nu.$$
The horizontal position is kept (so you know which slot was originally where). Different conventions exist; the slot order is the safe disambiguator.

## Index gymnastics

A few identities that recur:

- $g^{\mu\nu} g_{\nu\rho} = \delta^\mu_\rho$ — the inverse-metric definition.
- $g_{\mu\nu} v^\mu w^\nu = v_\mu w^\mu = v^\mu w_\mu = g^{\mu\nu} v_\mu w_\nu$ — the inner product, written in any of four equivalent ways.
- $g_{\mu\nu} g^{\mu\nu} = \delta^\mu_\mu = n$ — the dimension of $M$.

The last is the trace of $\mathrm{id}_{T_p M}$ and is a constant scalar. In Lorentzian $4$-spacetime this is $4$.

## Trace of a $(1, 1)$-tensor

For a $(1, 1)$-tensor $T^\mu{}_\nu$ — equivalently a linear endomorphism of $T_p M$ — the **trace** is the contraction
$$\mathrm{tr}\, T := T^\mu{}_\mu.$$
No metric needed. For a $(0, 2)$-tensor $T_{\mu\nu}$, the trace requires raising one index:
$$\mathrm{tr}_g T := g^{\mu\nu}\, T_{\mu\nu} = T^\mu{}_\mu.$$
This is the **metric trace**. The metric trace of the metric is $n$ (above); the metric trace of the Ricci tensor will give the scalar curvature, far down the road.

## The volume form

A metric and an orientation together define a canonical **volume form** $\mathrm{vol}_g \in \Omega^n(M)$:
$$\mathrm{vol}_g = \sqrt{|\det g|}\; dx^1 \wedge \cdots \wedge dx^n$$
in any positively-oriented chart. The absolute value handles signature: $\det g > 0$ for Riemannian, $\det g < 0$ for Lorentzian of signature $(-, +, +, +)$.

Under a change to positively-oriented coordinates $x' = x'(x)$ with Jacobian $J = \det(\partial x'/\partial x)$, the components transform as
$$g'_{\mu'\nu'} = \frac{\partial x^\rho}{\partial x'^{\mu'}} \frac{\partial x^\sigma}{\partial x'^{\nu'}}\, g_{\rho\sigma}, \quad \text{so } \det g' = J^{-2}\, \det g,$$
and $\sqrt{|\det g'|}\, dx'^1 \wedge \cdots = \sqrt{|\det g|}\, dx^1 \wedge \cdots$ — the form is chart-independent.

The volume form lets you integrate scalars: $\int_M f\, \mathrm{vol}_g$ is a well-defined real number for compactly supported $f$. In components on a chart,
$$\int_M f\, \mathrm{vol}_g = \int f(x)\, \sqrt{|\det g(x)|}\; d^n x.$$
The $\sqrt{|\det g|}$ factor is what distinguishes coordinate integration from invariant integration.

## Hodge star (briefly)

A metric and orientation define the **Hodge star** $\star: \Omega^k(M) \to \Omega^{n-k}(M)$ by
$$\star (dx^{\mu_1} \wedge \cdots \wedge dx^{\mu_k}) = \frac{\sqrt{|\det g|}}{(n-k)!}\, g^{\mu_1 \nu_1} \cdots g^{\mu_k \nu_k}\, \varepsilon_{\nu_1 \cdots \nu_k \rho_1 \cdots \rho_{n-k}}\, dx^{\rho_1} \wedge \cdots \wedge dx^{\rho_{n-k}},$$
with $\varepsilon$ the [Levi-Civita symbol](note:levi-civita) (totally antisymmetric, $\varepsilon_{1 \cdots n} = 1$).

The star squares to $\pm \mathrm{id}$ on $k$-forms with a sign depending on $k$, $n$, and signature. In four-dimensional Lorentzian spacetime, $\star^2 = -\mathrm{id}$ on $2$-forms — a fact used in the dual formulation of electromagnetism (where $\star F$ is the magnetic-side dual of the field-strength $F$).

The full Hodge-star machinery is not used in this book past the volume form, but it's worth knowing the name.
