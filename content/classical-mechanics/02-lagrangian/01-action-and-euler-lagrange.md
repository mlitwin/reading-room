---
title: Action and the Euler–Lagrange equations
---

A mechanical system on configuration space $Q$ (an $n$-dimensional manifold) is specified by a smooth **Lagrangian**
$$L: TQ \times \mathbb{R} \to \mathbb{R}, \qquad (q, \dot q, t) \mapsto L(q, \dot q, t).$$
For ordinary classical mechanics, $L = T - V$ (kinetic minus potential energy).

**Action.** For a smooth path $q: [t_1, t_2] \to Q$,
$$S[q] := \int_{t_1}^{t_2} L(q(t), \dot q(t), t)\, dt.$$
$S$ is a [functional](note:functional-and-variation) on the space of paths with fixed endpoints.

**Hamilton's principle.** Physical trajectories are stationary points of $S$ — variations of $q$ that vanish at the endpoints leave $S$ unchanged to first order.

**Euler–Lagrange equations.** Variation $q \mapsto q + \delta q$ with $\delta q(t_1) = \delta q(t_2) = 0$ gives
$$\delta S = \int_{t_1}^{t_2} \left( \frac{\partial L}{\partial q^i} - \frac{d}{dt}\frac{\partial L}{\partial \dot q^i} \right) \delta q^i\, dt + \underbrace{\left[ \frac{\partial L}{\partial \dot q^i} \delta q^i \right]_{t_1}^{t_2}}_{= 0}.$$
$\delta S = 0$ for arbitrary interior $\delta q$ forces the **Euler–Lagrange equations**:
$$\boxed{\quad \frac{d}{dt}\frac{\partial L}{\partial \dot q^i} - \frac{\partial L}{\partial q^i} = 0, \quad i = 1, \ldots, n. \quad}$$

For $L = \tfrac{1}{2} m |\dot q|^2 - V(q)$ on $\mathbb{R}^n$,
$$\frac{\partial L}{\partial \dot q^i} = m \dot q^i, \qquad \frac{\partial L}{\partial q^i} = -\partial_i V,$$
and EL reads $m \ddot q^i = -\partial_i V$ — Newton's second law.

The EL equations form a system of $n$ second-order ODEs in $q$. They have a *unique* solution given initial $(q(t_0), \dot q(t_0))$ when $L$ is non-degenerate (the matrix $\partial^2 L / \partial \dot q^i \partial \dot q^j$ is invertible).
