---
title: Exterior derivative and pullback
---

The **exterior derivative** is the family of $\mathbb{R}$-linear maps
$$d: \Omega^k(M) \to \Omega^{k+1}(M)$$
characterized uniquely by:

1. On $\Omega^0(M) = C^\infty(M)$: $df$ is the [ordinary differential](note:cotangent-space) of $f$.
2. **Graded Leibniz**: for $\tens{\omega} \in \Omega^k$, $\tens{\eta} \in \Omega^\ell$,
$$d(\tens{\omega} \wedge \tens{\eta}) = d\tens{\omega} \wedge \tens{\eta} + (-1)^k\, \tens{\omega} \wedge d\tens{\eta}.$$
3. **$d \circ d = 0$.**

**Coordinate formula.** For $\tens{\omega} = \tfrac{1}{k!}\, \omega_{i_1 \cdots i_k}\, dx^{i_1} \wedge \cdots \wedge dx^{i_k}$,
$$d\tens{\omega} = \frac{1}{k!}\, \frac{\partial \omega_{i_1 \cdots i_k}}{\partial x^j}\, dx^j \wedge dx^{i_1} \wedge \cdots \wedge dx^{i_k}.$$

**Coordinate-free formula:**
$$d\tens{\omega}(\tens{X}_0, \ldots, \tens{X}_k) = \sum_{i=0}^k (-1)^i \tens{X}_i\bigl(\tens{\omega}(\ldots, \widehat{\tens{X}_i}, \ldots)\bigr) + \sum_{i < j} (-1)^{i+j} \tens{\omega}([\tens{X}_i, \tens{X}_j], \ldots, \widehat{\tens{X}_i}, \ldots, \widehat{\tens{X}_j}, \ldots).$$

**Pullback.** For a smooth map $F: M \to N$ and $\tens{\omega} \in \Omega^k(N)$,
$$(F^* \tens{\omega})_p(\tens{v}_1, \ldots, \tens{v}_k) := \tens{\omega}_{F(p)}(dF_p \cdot \tens{v}_1, \ldots, dF_p \cdot \tens{v}_k).$$

Properties:

- $\mathbb{R}$-linear.
- $F^*(\tens{\omega} \wedge \tens{\eta}) = F^* \tens{\omega} \wedge F^* \tens{\eta}$.
- $(F \circ G)^* = G^* \circ F^*$.
- **Commutes with $d$**: $F^*(d\tens{\omega}) = d(F^* \tens{\omega})$.

The last property makes pullback a chain map of the [cochain complex](note:cochain-complex) $(\Omega^*, d)$, so it descends to cohomology ([chapter 9](../09-de-rham/01-cohomology.md)).

## Interior product and Cartan's formula

The **[interior product](note:interior-product)** $\iota_{\tens{X}}: \Omega^k \to \Omega^{k-1}$ inserts a vector field into the first slot:
$$(\iota_{\tens{X}} \tens{\omega})(\tens{Y}_1, \ldots, \tens{Y}_{k-1}) := \tens{\omega}(\tens{X}, \tens{Y}_1, \ldots, \tens{Y}_{k-1}).$$
**Cartan's formula** expresses the [Lie derivative](../05-vector-fields-and-flows/03-lie-derivative.md) of a form through $d$ and $\iota$:
$$\Lie_{\tens{X}} \tens{\omega} = \iota_{\tens{X}} (d\tens{\omega}) + d(\iota_{\tens{X}} \tens{\omega}).$$
It replaces differentiation along a flow by algebra and one exterior derivative. The full **Cartan calculus** is
$$\Lie_{\tens{X}} = \iota_{\tens{X}} d + d\,\iota_{\tens{X}}, \quad \Lie_{[\tens{X},\tens{Y}]} = [\Lie_{\tens{X}}, \Lie_{\tens{Y}}], \quad [\Lie_{\tens{X}}, \iota_{\tens{Y}}] = \iota_{[\tens{X},\tens{Y}]}, \quad \iota_{\tens{X}}^2 = 0, \quad d^2 = 0.$$
