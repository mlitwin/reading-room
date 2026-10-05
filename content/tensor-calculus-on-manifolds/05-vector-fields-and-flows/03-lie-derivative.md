---
title: Lie derivative
---

The **Lie derivative** $\Lie_{\tens{X}} \tens{T}$ measures the infinitesimal rate of change of a [tensor field](note:tensor-field) $\tens{T}$ along the flow of $\tens{X}$. For each tensor type the definition is
$$\Lie_{\tens{X}} \tens{T} := \frac{d}{dt}\bigg|_{t=0} (\theta_t^* \tens{T}),$$
where $\theta_t$ is the flow of $\tens{X}$ and $\theta_t^*$ is its [pullback](note:pullback). Each $\theta_t$ is a diffeomorphism onto its image, so tensors of every type can be pulled back. On a vector field, $\theta_t^*$ means pushing forward by $\theta_{-t}$.

**Specializations.**

- On functions: $\Lie_{\tens{X}} f = \tens{X}(f) = df(\tens{X})$.
- On vector fields: $\Lie_{\tens{X}} \tens{Y} = [\tens{X}, \tens{Y}]$.
- On 1-forms: $(\Lie_{\tens{X}} \tens{\omega})(\tens{Y}) = \tens{X}\bigl(\tens{\omega}(\tens{Y})\bigr) - \tens{\omega}([\tens{X}, \tens{Y}])$.

**General properties.**

- $\mathbb{R}$-linear in both $\tens{X}$ and $\tens{T}$.
- **Leibniz** with respect to tensor products: $\Lie_{\tens{X}}(\tens{T} \otimes \tens{S}) = (\Lie_{\tens{X}} \tens{T}) \otimes \tens{S} + \tens{T} \otimes \Lie_{\tens{X}} \tens{S}$.
- Commutes with contraction.
- $\Lie_{\tens{X}} \Lie_{\tens{Y}} - \Lie_{\tens{Y}} \Lie_{\tens{X}} = \Lie_{[\tens{X}, \tens{Y}]}$.

**The metric.** On a $(0, 2)$-tensor the definition gives, in coordinates,
$$(\Lie_{\tens{X}} \tens{g})_{\mu\nu} = X^\rho\, \partial_\rho g_{\mu\nu} + g_{\rho\nu}\, \partial_\mu X^\rho + g_{\mu\rho}\, \partial_\nu X^\rho.$$
The flow of $\tens{X}$ consists of [isometries](note:isometry) exactly when $\Lie_{\tens{X}} \tens{g} = 0$. Such an $\tens{X}$ is a **Killing field**. If no $g_{\mu\nu}$ depends on $x^k$, the formula shows at once that $\partial_k$ is Killing: on the round sphere, $\partial_\varphi$. Killing fields and the conserved quantities they produce are treated in [chapter 8](../08-connection-and-curvature/03-killing-vectors.md), once geodesics are available.

**On forms.** On differential forms the Lie derivative reduces to the exterior derivative and the interior product by Cartan's formula, $\Lie_{\tens{X}} = \iota_{\tens{X}} d + d\, \iota_{\tens{X}}$ ([chapter 6](../06-differential-forms/02-exterior-derivative-and-pullback.md)).
