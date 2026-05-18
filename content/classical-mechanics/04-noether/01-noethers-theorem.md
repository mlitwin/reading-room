---
title: The theorem
---

Consider a smooth one-parameter family of transformations of paths:
$$q(t) \mapsto q_\epsilon(t), \qquad q_0(t) = q(t),$$
and the corresponding infinitesimal variation
$$\delta q^i := \frac{\partial q_\epsilon^i}{\partial \epsilon}\bigg|_{\epsilon = 0}.$$

The transformation is a **symmetry of the action** if for every smooth path $q$,
$$\frac{d}{d\epsilon} S[q_\epsilon]\bigg|_{\epsilon=0} = 0$$
— the variation $\delta S$ vanishes for *all* paths, not only solutions.

**Noether's theorem.** For each such symmetry, the quantity
$$\boxed{\quad Q := \frac{\partial L}{\partial \dot q^i}\, \delta q^i = p_i\, \delta q^i \quad}$$
is conserved along solutions of the Euler–Lagrange equations: $dQ/dt = 0$.

**Sketch.** Compute $\delta S$ on an arbitrary path:
$$\delta S = \int_{t_1}^{t_2} \left( \frac{\partial L}{\partial q^i} - \frac{d}{dt}\frac{\partial L}{\partial \dot q^i} \right) \delta q^i\, dt \;+\; \left[ \frac{\partial L}{\partial \dot q^i}\, \delta q^i \right]_{t_1}^{t_2}.$$
On a *solution*, the bracketed integrand vanishes (EL), so $\delta S = [Q]_{t_1}^{t_2}$. But the symmetry hypothesis says $\delta S = 0$ identically. So $Q(t_2) = Q(t_1)$ for arbitrary endpoints, i.e., $Q$ is constant along the solution. $\square$

**Quasi-symmetries (action shifts by a total derivative).** If the variation produces
$$\delta L = \frac{dF}{dt}$$
for some function $F(q, t)$ — rather than vanishing — the symmetry is called a **quasi-symmetry** (or "Noether symmetry up to a total derivative"). The conserved quantity is
$$Q = \frac{\partial L}{\partial \dot q^i}\, \delta q^i - F.$$
The $F$ term picks up the would-be boundary contribution from $\delta L$.

**Generalization to time.** Symmetries can also act on time: $t \mapsto t + \epsilon \xi(q, t)$, $q \mapsto q + \epsilon \delta q$. Energy conservation is the canonical example (next page).
