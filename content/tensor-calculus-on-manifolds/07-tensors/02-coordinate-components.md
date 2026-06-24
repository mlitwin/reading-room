---
title: Coordinate components and the transformation rule
---

The physicist's working definition of a tensor is exactly the multilinear-map definition expressed in components.

## The transformation rule

A choice of chart $x^\mu$ around $p$ gives a coordinate basis for $T^r_s(T_p M)$ and so a component array $T^{\mu_1 \cdots \mu_r}{}_{\nu_1 \cdots \nu_s}$. Under $x^\mu \mapsto x'^{\mu'}(x)$, the components transform as
$$T'^{\mu'_1 \cdots \mu'_r}{}_{\nu'_1 \cdots \nu'_s} = \frac{\partial x'^{\mu'_1}}{\partial x^{\mu_1}} \cdots \frac{\partial x'^{\mu'_r}}{\partial x^{\mu_r}}\; \frac{\partial x^{\nu_1}}{\partial x'^{\nu'_1}} \cdots \frac{\partial x^{\nu_s}}{\partial x'^{\nu'_s}}\; T^{\mu_1 \cdots \mu_r}{}_{\nu_1 \cdots \nu_s}.$$
Every upper index gets one factor of $\partial x'/\partial x$; every lower index gets one factor of $\partial x/\partial x'$. This is the **tensor transformation law**.

A component array satisfying this rule on every chart overlap defines a tensor — and conversely, the rule is exactly what's needed for the abstract multilinear map to be coordinate-independent.

## Einstein summation

A repeated index appearing once up and once down in the same monomial is summed from $1$ to $n$:
$$v^\mu \omega_\mu := \sum_{\mu=1}^{n} v^\mu \omega_\mu, \qquad T^\mu{}_\nu v^\nu := \sum_{\nu=1}^{n} T^\mu{}_\nu v^\nu.$$
Indices in the same position (both up, or both down) are *not* summed and usually indicate an error in the calculation. The convention is so consistent that the summation symbol can be omitted everywhere; the index positions enforce the rule.

A **free index** appears once on each side of an equation, at the same vertical position; equations are read as holding for every value of every free index. A **dummy** (or summed) index appears as an up-down pair on the same side and can be renamed at will.

## Operations in component form

The operations on tensors all have one-line component expressions.

- **Tensor product:** $(S \otimes T)^{\mu_1 \cdots \mu_{r_1+r_2}}{}_{\nu_1 \cdots \nu_{s_1+s_2}} = S^{\mu_1 \cdots \mu_{r_1}}{}_{\nu_1 \cdots \nu_{s_1}}\; T^{\mu_{r_1+1} \cdots}{}_{\nu_{s_1+1} \cdots}$.
- **Contraction** of the $k$-th upper with the $\ell$-th lower index: set them equal and sum.
- **Symmetrization:** $T_{(\mu\nu)} := \tfrac{1}{2}(T_{\mu\nu} + T_{\nu\mu})$; for $k$ indices, average over all permutations.
- **Antisymmetrization:** $T_{[\mu\nu]} := \tfrac{1}{2}(T_{\mu\nu} - T_{\nu\mu})$; for $k$ indices, sign-weighted average.

Symmetric and antisymmetric parts are themselves tensors and add to the original when $T$ has only two indices: $T_{\mu\nu} = T_{(\mu\nu)} + T_{[\mu\nu]}$.

## The "transforms like a tensor" diagnostic

Not every indexed quantity is a tensor. The Christoffel symbols of the [connection section](../09-connection-and-curvature/02-covariant-derivative.md), for example, are *not* tensors — they pick up an inhomogeneous piece in their transformation law:
$$\Gamma'^{\rho'}{}_{\mu'\nu'} = \frac{\partial x'^{\rho'}}{\partial x^\rho} \frac{\partial x^\mu}{\partial x'^{\mu'}} \frac{\partial x^\nu}{\partial x'^{\nu'}}\, \Gamma^{\rho}{}_{\mu\nu} \;+\; \frac{\partial x'^{\rho'}}{\partial x^\rho} \frac{\partial^2 x^\rho}{\partial x'^{\mu'} \partial x'^{\nu'}}.$$
The second-derivative term spoils tensoriality. The presence or absence of such a term, in any candidate construction, is the diagnostic: if the array transforms multiplicatively as above, it's a tensor; otherwise it isn't.

The equivalent abstract diagnostic is **$C^\infty(M)$-linearity in every slot.** A multilinear map on vector fields and 1-forms that is $\mathbb{R}$-linear *and* $C^\infty(M)$-linear (not merely $\mathbb{R}$-linear) comes from a tensor field. Multilinearity over the smooth functions is the operational reason the value at a point depends only on values at that point.
