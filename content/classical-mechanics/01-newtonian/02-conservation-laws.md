---
title: Conservation laws
---

The three classical conservation laws follow from N2 + special structures of the force.

**Kinetic energy.**
$$T := \frac{1}{2} \sum_a m_a |\dot r_a|^2.$$

**Energy conservation.** If forces are conservative with time-independent potential $V$,
$$E := T + V$$
is conserved along solutions. Differentiating:
$$\dot E = \sum_a m_a \dot r_a \cdot \ddot r_a + \sum_a \nabla_{r_a} V \cdot \dot r_a = \sum_a (m_a \ddot r_a + \nabla_{r_a} V) \cdot \dot r_a = 0$$
by N2. Time-dependent $V$ breaks this: $\dot E = \partial V / \partial t$.

**Linear momentum.**
$$P := \sum_a m_a \dot r_a, \qquad \dot P = \sum_a F_a^{\text{(ext)}} \quad \text{(internal forces cancel by N3).}$$
$P$ is conserved if there are no external forces — a consequence of *translation invariance* of the dynamics.

**Angular momentum.** About the origin,
$$L := \sum_a r_a \times m_a \dot r_a, \qquad \dot L = \sum_a r_a \times F_a^{\text{(ext)}} = \tau^{\text{(ext)}}.$$
If all external forces are central (parallel to $r_a$) or absent, $\tau^{\text{(ext)}} = 0$ and $L$ is conserved — a consequence of *rotational invariance*.

These three conservation laws are not independent miracles: each comes from a continuous symmetry of the action via Noether's theorem (covered in the last section). Time translation gives energy, spatial translation gives linear momentum, rotational symmetry gives angular momentum.
