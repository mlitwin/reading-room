---
title: Vector fields
---

A **vector field** on $M$ is a smooth section of the [tangent bundle](note:tangent-space): a smooth map $\tens{X}: M \to TM$ with $\pi \circ \tens{X} = \mathrm{id}_M$. Equivalently, an assignment $p \mapsto \tens{X}_p \in T_p M$ varying smoothly with $p$.

The space of vector fields is $\mathfrak{X}(M)$ (also written $\Gamma(TM)$). It is an $\mathbb{R}$-vector space and a $C^\infty(M)$-**module** — the vector-space axioms, but with smooth functions rather than real numbers as the scalars (you can scale a vector field by a function $f \in C^\infty(M)$).

**Coordinate expression.**
$$\tens{X} = X^i\, \partial_i, \qquad X^i \in C^\infty(U).$$

**As derivation.** Every vector field acts on $C^\infty(M)$:
$$\tens{X}(f)(p) := \tens{X}_p(f), \qquad \tens{X}: C^\infty(M) \to C^\infty(M).$$
This map is $\mathbb{R}$-linear and satisfies Leibniz:
$$\tens{X}(fg) = f \cdot \tens{X}(g) + g \cdot \tens{X}(f).$$

Conversely, every $\mathbb{R}$-linear Leibniz [derivation](note:derivation) of $C^\infty(M)$ is a vector field — vector fields and derivations are the same object up to bookkeeping.

**Push-forward of vector fields.** Unlike forms, vector fields generally *cannot* be pushed forward by a smooth map $F: M \to N$ — only by a diffeomorphism. The reason: a smooth map can send two distinct points $p, p' \in M$ to the same point $q \in N$, and $dF_p \cdot \tens{X}_p$ and $dF_{p'} \cdot \tens{X}_{p'}$ need not agree; and if $F$ isn't surjective, points outside its image get no vector at all.

**$F$-related vector fields.** Even without push-forward, one can ask whether $\tens{X} \in \mathfrak{X}(M)$ and $\tens{Y} \in \mathfrak{X}(N)$ are *$F$-related*, meaning $dF_p \cdot \tens{X}_p = \tens{Y}_{F(p)}$ for all $p$. This is the right notion for tracking vector fields through smooth maps.
