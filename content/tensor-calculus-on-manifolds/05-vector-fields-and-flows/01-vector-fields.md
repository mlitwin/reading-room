---
title: Vector fields
---

A **vector field** on $M$ is a smooth section of the [tangent bundle](note:tangent-space): a smooth map $\tens{X}: M \to TM$ with $\pi \circ \tens{X} = \mathrm{id}_M$. Equivalently, an assignment $p \mapsto \tens{X}_p \in T_p M$ varying smoothly with $p$.

The space of vector fields is $\mathfrak{X}(M)$ (also written $\Gamma(TM)$). It is a real vector space and also a $C^\infty(M)$-**module**: vector fields can be multiplied by smooth functions, which play the role of scalars.

**Coordinate expression.**
$$\tens{X} = X^i\, \partial_i, \qquad X^i \in C^\infty(U).$$

**As derivation.** Every vector field acts on $C^\infty(M)$:
$$\tens{X}(f)(p) := \tens{X}_p(f), \qquad \tens{X}: C^\infty(M) \to C^\infty(M).$$
This map is $\mathbb{R}$-linear and satisfies Leibniz:
$$\tens{X}(fg) = f \cdot \tens{X}(g) + g \cdot \tens{X}(f).$$

Conversely, every $\mathbb{R}$-linear Leibniz [derivation](note:derivation) of $C^\infty(M)$ is a vector field — vector fields and derivations are the same object up to bookkeeping.

**Push-forward.** Unlike forms, vector fields can be pushed forward only by diffeomorphisms. A general smooth map $F$ may send distinct points $p, p'$ to the same point, where $dF_p \cdot \tens{X}_p$ and $dF_{p'} \cdot \tens{X}_{p'}$ need not agree, and points outside its image receive no vector at all.

**$F$-related vector fields.** Even without push-forward, one can ask whether $\tens{X} \in \mathfrak{X}(M)$ and $\tens{Y} \in \mathfrak{X}(N)$ are *$F$-related*, meaning $dF_p \cdot \tens{X}_p = \tens{Y}_{F(p)}$ for all $p$. This is the right notion for tracking vector fields through general smooth maps.
