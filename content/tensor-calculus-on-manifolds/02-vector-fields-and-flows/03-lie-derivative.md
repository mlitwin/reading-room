---
title: Lie derivative
---

The **Lie derivative** $\Lie_{\tens{X}} \tens{T}$ measures the infinitesimal rate of change of a [tensor field](note:tensor-field) $\tens{T}$ along the flow of $\tens{X}$. For each tensor type the definition is
$$\Lie_{\tens{X}} \tens{T} := \frac{d}{dt}\bigg|_{t=0} (\theta_t^* \tens{T}),$$
where $\theta_t$ is the flow of $\tens{X}$ and $\theta_t^*$ is its [pullback](note:pullback). Each $\theta_t$ is a diffeomorphism, so tensors of every type can be pulled back. On a vector field, $\theta_t^*$ means pushing forward by $\theta_{-t}$.

**Specializations.**

- On functions: $\Lie_{\tens{X}} f = \tens{X}(f) = df(\tens{X})$.
- On vector fields: $\Lie_{\tens{X}} \tens{Y} = [\tens{X}, \tens{Y}]$.
- On 1-forms: $(\Lie_{\tens{X}} \tens{\omega})(\tens{Y}) = \tens{X}\bigl(\tens{\omega}(\tens{Y})\bigr) - \tens{\omega}([\tens{X}, \tens{Y}])$.

**General properties.**

- $\mathbb{R}$-linear in both $\tens{X}$ and $\tens{T}$.
- **Leibniz** with respect to tensor products: $\Lie_{\tens{X}}(\tens{T} \otimes \tens{S}) = (\Lie_{\tens{X}} \tens{T}) \otimes \tens{S} + \tens{T} \otimes \Lie_{\tens{X}} \tens{S}$.
- Commutes with contraction.
- $\Lie_{\tens{X}} \Lie_{\tens{Y}} - \Lie_{\tens{Y}} \Lie_{\tens{X}} = \Lie_{[\tens{X}, \tens{Y}]}$.

**Cartan's magic formula.** For any $k$-form $\tens{\omega}$,
$$\Lie_{\tens{X}} \tens{\omega} = \iota_{\tens{X}} (d\tens{\omega}) + d(\iota_{\tens{X}} \tens{\omega}),$$
where $\iota_{\tens{X}}$ is the **interior product** contracting $\tens{X}$ into the first slot:
$$(\iota_{\tens{X}} \tens{\omega})(\tens{Y}_1, \ldots, \tens{Y}_{k-1}) := \tens{\omega}(\tens{X}, \tens{Y}_1, \ldots, \tens{Y}_{k-1}).$$

This is the computational workhorse for forms: it replaces differentiation along the flow by the purely algebraic operations $d$ and $\iota_{\tens{X}}$.
