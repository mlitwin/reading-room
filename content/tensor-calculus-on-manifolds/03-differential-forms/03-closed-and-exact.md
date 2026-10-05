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
is closed (check directly that $d\tens{\omega} = 0$). But it isn't exact: integrating over the unit circle counterclockwise gives $\int_{S^1} \tens{\omega} = 2\pi$, and a closed-loop integral of an exact form must vanish — $\int_\gamma df = f(\text{end}) - f(\text{start}) = 0$ when the endpoints coincide. (Had $\tens{\omega}$ been defined on all of $\mathbb{R}^2$, closedness alone would force $\int_{S^1} \tens{\omega} = \int_D d\tens{\omega} = 0$ over the disk the circle bounds; in the punctured plane no such disk exists, which is the point.)

The form $\tens{\omega}$ is "$d\theta$" in polar coordinates, but $\theta$ isn't a globally defined function on $\mathbb{R}^2 \setminus \{0\}$ — it's a multivalued angle.

**Local result.** On a [contractible](note:contractible) open set, every closed form is exact. The cohomology measuring the gap between closed and exact is therefore purely a global, topological invariant — the subject of [chapter 5](../05-de-rham/index.md).
