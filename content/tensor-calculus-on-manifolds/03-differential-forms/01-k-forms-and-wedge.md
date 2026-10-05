---
title: k-forms and the wedge product
---

A **$k$-form at $p$** is an **alternating multilinear map**
$$\tens{\omega}_p: \underbrace{T_p M \times \cdots \times T_p M}_{k \text{ copies}} \to \mathbb{R}$$
*Multilinear* means linear in each argument with the others fixed. *Alternating* means changing sign under any swap of two arguments, the same property the [tensor chapter](../10-tensors/03-co-contra-vs-k-forms.md) calls *totally antisymmetric*.

The space of $k$-forms at $p$ is $\Lambda^k T^*_p M$, of dimension $\binom{n}{k}$. By convention $\Lambda^0 = \mathbb{R}$ (numbers), $\Lambda^1 = T^*_p M$ (covectors). $\Lambda^k = 0$ for $k > n$.

A **differential $k$-form** on $M$ is a smooth section of the bundle $\Lambda^k T^* M$ whose fiber at $p$ is $\Lambda^k T^*_p M$. The space of them is $\Omega^k(M)$; in particular $\Omega^0(M) = C^\infty(M)$ and $\Omega^1(M)$ is the space of 1-forms.

**Coordinate expression.** This book uses the $\tfrac{1}{k!}$ [convention](note:wedge-convention) throughout:
$$\tens{\omega} = \frac{1}{k!}\, \omega_{i_1 \cdots i_k}\, dx^{i_1} \wedge \cdots \wedge dx^{i_k},$$
with $\omega_{i_1 \cdots i_k} \in C^\infty(U)$ totally antisymmetric and the sum running over all index tuples. (Equivalently, restrict to strictly increasing tuples $i_1 < \cdots < i_k$ and drop the $\tfrac{1}{k!}$; the component array on ordered tuples is the same.)

**Wedge product.** The wedge $\wedge: \Omega^k(M) \times \Omega^\ell(M) \to \Omega^{k+\ell}(M)$ is the antisymmetrized tensor product,
$$\tens{\omega} \wedge \tens{\eta} = \frac{(k + \ell)!}{k!\, \ell!}\, \mathrm{Alt}(\tens{\omega} \otimes \tens{\eta}),$$
where $\mathrm{Alt}$ averages over permutations of the arguments with signs. On coordinate differentials,
$$dx^{i_1} \wedge \cdots \wedge dx^{i_k} := \sum_{\sigma \in S_k} \mathrm{sgn}(\sigma)\; dx^{i_{\sigma(1)}} \otimes \cdots \otimes dx^{i_{\sigma(k)}},$$
and wedging concatenates factors:
$$(dx^{i_1} \wedge \cdots \wedge dx^{i_k}) \wedge (dx^{j_1} \wedge \cdots \wedge dx^{j_\ell}) = dx^{i_1} \wedge \cdots \wedge dx^{i_k} \wedge dx^{j_1} \wedge \cdots \wedge dx^{j_\ell}.$$

Properties:

- **Associative**: $(\tens{\omega} \wedge \tens{\eta}) \wedge \tens{\zeta} = \tens{\omega} \wedge (\tens{\eta} \wedge \tens{\zeta})$.
- **Graded-commutative**: $\tens{\omega} \wedge \tens{\eta} = (-1)^{k\ell}\, \tens{\eta} \wedge \tens{\omega}$ for $\tens{\omega} \in \Omega^k$, $\tens{\eta} \in \Omega^\ell$.
- **Bilinear** over $\mathbb{R}$ and $C^\infty(M)$.
- $dx^i \wedge dx^i = 0$; any wedge with repeated factors vanishes.

The total exterior algebra is $\Omega^*(M) := \bigoplus_{k=0}^n \Omega^k(M)$, a graded-commutative $C^\infty(M)$-algebra.
