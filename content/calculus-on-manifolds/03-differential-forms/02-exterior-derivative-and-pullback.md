---
title: Exterior derivative and pullback
---

The **exterior derivative** is the family of $\mathbb{R}$-linear maps
$$d: \Omega^k(M) \to \Omega^{k+1}(M)$$
characterized uniquely by:

1. On $\Omega^0(M) = C^\infty(M)$: $df$ is the ordinary differential of $f$.
2. **Graded Leibniz**: for $\omega \in \Omega^k$, $\eta \in \Omega^\ell$,
$$d(\omega \wedge \eta) = d\omega \wedge \eta + (-1)^k\, \omega \wedge d\eta.$$
3. **$d \circ d = 0$.**

**Coordinate formula.** For $\omega = \omega_{i_1 \cdots i_k}\, dx^{i_1} \wedge \cdots \wedge dx^{i_k}$,
$$d\omega = \frac{\partial \omega_{i_1 \cdots i_k}}{\partial x^j}\, dx^j \wedge dx^{i_1} \wedge \cdots \wedge dx^{i_k}.$$

**Coordinate-free formula** (Cartan):
$$d\omega(X_0, \ldots, X_k) = \sum_{i=0}^k (-1)^i X_i\bigl(\omega(\ldots, \widehat{X_i}, \ldots)\bigr) + \sum_{i < j} (-1)^{i+j} \omega([X_i, X_j], \ldots, \widehat{X_i}, \ldots, \widehat{X_j}, \ldots).$$

**Pullback.** For a smooth map $F: M \to N$ and $\omega \in \Omega^k(N)$,
$$(F^* \omega)_p(v_1, \ldots, v_k) := \omega_{F(p)}(dF_p \cdot v_1, \ldots, dF_p \cdot v_k).$$

Properties:

- $\mathbb{R}$-linear.
- $F^*(\omega \wedge \eta) = F^* \omega \wedge F^* \eta$.
- $(F \circ G)^* = G^* \circ F^*$.
- **Commutes with $d$**: $F^*(d\omega) = d(F^* \omega)$.

This last identity is what makes the construction $(\Omega^*, d)$ functorial — pullback is a chain map of the cochain complex, and so it descends to a map on cohomology.

**Interior product** $\iota_X: \Omega^k \to \Omega^{k-1}$ — defined on the previous page (Lie derivative). Together $\iota_X$, $d$, $\mathcal{L}_X$ are the basic computational operations on $\Omega^*(M)$, and they satisfy the **Cartan calculus** identities:
$$\mathcal{L}_X = \iota_X d + d\,\iota_X, \quad \mathcal{L}_{[X,Y]} = [\mathcal{L}_X, \mathcal{L}_Y], \quad [\mathcal{L}_X, \iota_Y] = \iota_{[X,Y]}, \quad \iota_X^2 = 0, \quad d^2 = 0.$$
