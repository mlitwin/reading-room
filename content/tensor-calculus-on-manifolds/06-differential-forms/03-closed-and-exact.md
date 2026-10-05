---
title: Closed and exact forms
---

A $k$-form $\tens{\omega}$ is **closed** if $d\tens{\omega} = 0$. The closed $k$-forms are
$$Z^k(M) := \ker\bigl(d: \Omega^k(M) \to \Omega^{k+1}(M)\bigr).$$

A $k$-form $\tens{\omega}$ is **exact** if $\tens{\omega} = d\tens{\eta}$ for some $\tens{\eta} \in \Omega^{k-1}(M)$. The exact $k$-forms are
$$B^k(M) := \mathrm{im}\bigl(d: \Omega^{k-1}(M) \to \Omega^k(M)\bigr).$$

Because $d^2 = 0$,
$$B^k(M) \subseteq Z^k(M).$$

Every exact form is closed; the converse fails in general, and the obstruction is exactly the topology of $M$.

**Standard counterexample.** On $\mathbb{R}^2 \setminus \{0\}$, the 1-form
$$\tens{\omega} = \frac{-y\, dx + x\, dy}{x^2 + y^2}$$
is closed (a direct check). It is not exact: its integral counterclockwise around the unit circle is $2\pi$, while the integral of an exact form around a closed loop vanishes, $\oint df = 0$. Were $\tens{\omega}$ defined on all of $\mathbb{R}^2$, Stokes's theorem on the unit disk would give $\oint \tens{\omega} = \int_D d\tens{\omega} = 0$; the puncture removes that disk.

In polar coordinates $\tens{\omega} = d\theta$, but the angle $\theta$ is not a single-valued function on $\mathbb{R}^2 \setminus \{0\}$.

**Local result.** On a [contractible](note:contractible) open set, every closed form is exact. The gap between closed and exact is therefore global and topological: it is the subject of [chapter 9](../09-de-rham/index.md).
