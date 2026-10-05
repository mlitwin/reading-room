---
title: Legendre transform and Hamilton's equations
---

## Momenta are covectors

The **conjugate momentum** to $q^i$ is
$$p_i := \frac{\partial L}{\partial \dot q^i}.$$
Its index is down: $p = p_i\, dq^i$ is a [covector](note:cotangent-space) at $q$ ([previous chapter](../10-lagrangian-mechanics/03-action-and-euler-lagrange.md)). Coordinate-free, the momentum of a velocity $\dot q \in T_q Q$ is the derivative of $L$ along the fiber $T_q Q$:
$$p(\tens{w}) = \frac{d}{ds} L(q, \dot q + s\tens{w})\Big|_{s=0}, \qquad \tens{w} \in T_q Q.$$
This defines the **fiber derivative** $\mathbb{F}L: TQ \to T^*Q$, $(q, \dot q) \mapsto (q, p)$. $L$ is **regular** when $\mathbb{F}L$ is a local diffeomorphism, equivalently when $\partial^2 L / \partial \dot q^i \partial \dot q^j$ is invertible. It is **hyperregular** when $\mathbb{F}L$ is a global diffeomorphism. Then $\dot q$ can be solved for as a function of $(q, p, t)$.

**Natural Lagrangians.** For $L = \tfrac12 g_{ij}(q)\, \dot q^i \dot q^j - V(q)$, the momenta are $p_i = g_{ij}\, \dot q^j$. The fiber derivative is the [musical isomorphism](note:musical-isomorphism) $\flat$ of the kinetic metric: the Legendre transform lowers the index ([chapter 10](../10-lagrangian-mechanics/natural-systems-index.md)).

## The Hamiltonian

The **Hamiltonian** is the [Legendre transform](note:legendre-transform) of $L$ in the velocities:
$$H(q, p, t) := p_i\, \dot q^i - L(q, \dot q, t), \qquad \dot q = \dot q(q, p, t).$$
For a natural Lagrangian, $T$ is homogeneous of degree 2 in $\dot q$. Euler's theorem then gives $p_i \dot q^i = 2T$, so
$$H = \tfrac12\, g^{ij}\, p_i p_j + V = T + V,$$
the total energy, written with the inverse metric.

## Hamilton's equations

Differentiate the definition of $H$. The $d\dot q$ terms cancel because $p_i = \partial L / \partial \dot q^i$. The $dp$ terms give $\partial H / \partial p_i = \dot q^i$. The $dq$ terms give $\partial H / \partial q^i = -\partial L / \partial q^i = -\dot p_i$, using the [Euler–Lagrange equations](note:euler-lagrange-equations). So:
$$\boxed{\quad \dot q^i = \frac{\partial H}{\partial p_i}, \qquad \dot p_i = -\frac{\partial H}{\partial q^i}. \quad}$$
These are $2n$ first-order ODEs on **phase space** $T^*Q$, with coordinates $(q^i, p_i)$ ([cotangent bundle](../01-manifolds/03-cotangent-space.md)). For hyperregular $L$, $\mathbb{F}L$ carries solutions of the Euler–Lagrange equations bijectively onto solutions of Hamilton's equations. The two formulations describe the same dynamics.

**Energy.** Along solutions,
$$\frac{dH}{dt} = \frac{\partial H}{\partial q^i}\dot q^i + \frac{\partial H}{\partial p_i}\dot p_i + \frac{\partial H}{\partial t} = \frac{\partial H}{\partial t} = -\frac{\partial L}{\partial t}.$$
If $L$ has no explicit time dependence, $H$ is conserved.

## Examples

**Free particle.** $L = \tfrac12 m \lvert \dot{\tens{r}} \rvert^2$, $\tens{p} = m\dot{\tens{r}}$, $H = \lvert \tens{p} \rvert^2 / 2m$. Hamilton's equations give $\dot{\tens{r}} = \tens{p}/m$, $\dot{\tens{p}} = 0$: straight lines at constant velocity.

**Harmonic oscillator.** $L = \tfrac12 m \dot q^2 - \tfrac12 k q^2$, $p = m\dot q$, $H = p^2/2m + \tfrac12 k q^2$. Hamilton's equations give $\dot q = p/m$, $\dot p = -kq$. The phase-space orbits are the ellipses $H = \text{const}$.
