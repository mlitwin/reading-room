---
title: Closed and exact forms
---

A $k$-form $\omega$ is **closed** if $d\omega = 0$. The closed $k$-forms are
$$Z^k(M) := \ker\bigl(d: \Omega^k(M) \to \Omega^{k+1}(M)\bigr).$$

A $k$-form $\omega$ is **exact** if $\omega = d\eta$ for some $\eta \in \Omega^{k-1}(M)$. The exact $k$-forms are
$$B^k(M) := \mathrm{im}\bigl(d: \Omega^{k-1}(M) \to \Omega^k(M)\bigr).$$

Because $d^2 = 0$,
$$B^k(M) \subseteq Z^k(M).$$

Every exact form is closed; the converse fails in general, and the obstruction is exactly the topology of $M$.

**Standard counterexample.** On $\mathbb{R}^2 \setminus \{0\}$, the 1-form
$$\omega = \frac{-y\, dx + x\, dy}{x^2 + y^2}$$
is closed (check directly that $d\omega = 0$). But it isn't exact: integrating over the unit circle counterclockwise gives $\int_{S^1} \omega = 2\pi$, and a closed-curve integral of an exact form must vanish (by Stokes's theorem on a disk that the closed curve bounds — except no such disk exists in the punctured plane, which is the point).

The form $\omega$ is "$d\theta$" in polar coordinates, but $\theta$ isn't a globally defined function on $\mathbb{R}^2 \setminus \{0\}$ — it's a multivalued angle.

**Local result.** On a contractible open set, every closed form is exact. The cohomology measuring the gap between closed and exact is therefore purely a global, topological invariant — the theme of the next section.
