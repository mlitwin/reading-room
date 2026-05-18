---
title: Lie derivative
---

The **Lie derivative** $\mathcal{L}_X T$ measures the infinitesimal rate of change of a [tensor field](note:tensor-field) $T$ along the flow of $X$. For each tensor type the definition is
$$\mathcal{L}_X T := \frac{d}{dt}\bigg|_{t=0} (\theta_t^* T),$$
where $\theta_t$ is the flow of $X$ and $\theta_t^*$ is its pullback.

**Specializations.**

- On functions: $\mathcal{L}_X f = X(f) = df(X)$.
- On vector fields: $\mathcal{L}_X Y = [X, Y]$.
- On 1-forms: $(\mathcal{L}_X \omega)(Y) = X\bigl(\omega(Y)\bigr) - \omega([X, Y])$.

**General properties.**

- $\mathbb{R}$-linear in both $X$ and $T$.
- **Leibniz** with respect to tensor products: $\mathcal{L}_X(T \otimes S) = (\mathcal{L}_X T) \otimes S + T \otimes \mathcal{L}_X S$.
- Commutes with contraction.
- $\mathcal{L}_X \mathcal{L}_Y - \mathcal{L}_Y \mathcal{L}_X = \mathcal{L}_{[X, Y]}$.

**Cartan's magic formula** — for any differential $k$-form $\omega$:
$$\mathcal{L}_X \omega = \iota_X (d\omega) + d(\iota_X \omega),$$
where $\iota_X$ is the **interior product** contracting $X$ into the first slot:
$$(\iota_X \omega)(Y_1, \ldots, Y_{k-1}) := \omega(X, Y_1, \ldots, Y_{k-1}).$$

This formula is the computational workhorse: nearly every Lie derivative of a differential form can be evaluated by computing $d\omega$ and $\iota_X \omega$ separately, neither of which requires explicitly differentiating along the flow.
