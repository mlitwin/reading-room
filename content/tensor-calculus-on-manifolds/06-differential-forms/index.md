---
title: Differential forms
---

Differential forms are the alternating tensor fields, and the objects that integrate over manifolds. Three operations act on them: the wedge product, the [exterior derivative](note:exterior-derivative), and pullback. Together they give Stokes's theorem its general form and de Rham cohomology its definition.

Three pages:

1. [$k$-forms and the wedge product](01-k-forms-and-wedge.md): $\Lambda^k$, the $\tfrac{1}{k!}$ component convention, $\wedge$.
2. [Exterior derivative and pullback](02-exterior-derivative-and-pullback.md): $d$, $F^*$, the interior product, Cartan's formula.
3. [Closed and exact forms](03-closed-and-exact.md): $d\tens{\omega} = 0$ versus $\tens{\omega} = d\tens{\eta}$, and the punctured-plane example.

**Metric-free:** the whole chapter. The metric enters forms through the volume form and Hodge star ([chapter 7](../07-integration/02-volume-form-and-hodge-star.md)).

**Where this lands in GR.** The electromagnetic field strength $\tens{F}$ is a 2-form, and $d\tens{F} = 0$ is half of Maxwell's equations; "closed but not exact" is where gauge topology lives. Forms also supply the volume element of the action integrals in chapters 14–15 and the structure equations of Einstein–Cartan gravity.

## Notation

| Quantity | Convention |
|---|---|
| $k$-form components | $\tens{\omega} = \tfrac{1}{k!}\, \omega_{i_1 \cdots i_k}\, dx^{i_1} \wedge \cdots \wedge dx^{i_k}$, determinant wedge ([convention](note:wedge-convention)) |

| Symbol | Meaning |
|---|---|
| $\wedge$ | wedge product |
| $\Lambda^k$ (Lambda) | $k$-th exterior power |
| $\iota_{\tens{X}}$ (iota) | [interior product](note:interior-product) |
| $\sigma$ (sigma), $S_k$ | a permutation and the symmetric group; $\operatorname{sgn}\sigma$ its sign |
