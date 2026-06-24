---
title: Vector fields
---

A **vector field** on $M$ is a smooth section of the tangent bundle: a smooth map $X: M \to TM$ with $\pi \circ X = \mathrm{id}_M$. Equivalently, an assignment $p \mapsto X_p \in T_p M$ varying smoothly with $p$.

The space of vector fields is $\mathfrak{X}(M)$ (also written $\Gamma(TM)$). It is an $\mathbb{R}$-vector space and a $C^\infty(M)$-**module** — the vector-space axioms, but with smooth functions rather than real numbers as the scalars (you can scale a vector field by a function $f \in C^\infty(M)$).

**Coordinate expression.**
$$X = X^i\, \partial_i, \qquad X^i \in C^\infty(U).$$

**As derivation.** Every vector field acts on $C^\infty(M)$:
$$X(f)(p) := X_p(f), \qquad X: C^\infty(M) \to C^\infty(M).$$
This map is $\mathbb{R}$-linear and satisfies Leibniz:
$$X(fg) = f \cdot X(g) + g \cdot X(f).$$

Conversely, every $\mathbb{R}$-linear Leibniz derivation of $C^\infty(M)$ is a vector field — vector fields and derivations are the same object up to bookkeeping.

**Push-forward of vector fields.** Unlike forms, vector fields generally *cannot* be pushed forward by a smooth map $F: M \to N$ — only by a diffeomorphism. The reason: a smooth map can map two distinct points $p, p' \in M$ to the same point $q \in N$, but $dF_p \cdot X_p$ and $dF_{p'} \cdot X_{p'}$ need not agree.

**$F$-related vector fields.** Even without push-forward, one can ask whether $X \in \mathfrak{X}(M)$ and $Y \in \mathfrak{X}(N)$ are *$F$-related*, meaning $dF_p \cdot X_p = Y_{F(p)}$ for all $p$. This is the right notion for tracking vector fields through smooth maps.
