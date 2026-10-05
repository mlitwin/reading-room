---
title: Covariant Newton
---

## The Euler–Lagrange equations of a natural system

For $L = \tfrac12\, g_{ij}\, \dot q^i \dot q^j - V$,
$$\frac{d}{dt}\frac{\partial L}{\partial \dot q^i} = g_{ij}\, \ddot q^j + \partial_k g_{ij}\, \dot q^k \dot q^j, \qquad \frac{\partial L}{\partial q^i} = \tfrac12\, \partial_i g_{jk}\, \dot q^j \dot q^k - \partial_i V.$$
Symmetrize the middle term in $j, k$ and raise the free index with $g^{li}$. The [Euler–Lagrange equations](note:euler-lagrange-equations) become
$$\ddot q^l + \Gamma^l{}_{jk}\, \dot q^j \dot q^k = -g^{li}\, \partial_i V, \qquad \Gamma^l{}_{jk} = \tfrac12\, g^{li}\bigl(\partial_j g_{ki} + \partial_k g_{ij} - \partial_i g_{jk}\bigr).$$
The coefficients are the [Christoffel symbols](note:covariant-derivative) of the kinetic metric, and the left side is the [covariant derivative](note:covariant-derivative) of the velocity along the path. In index-free form:
$$\boxed{\quad \nabla_{\dot q}\, \dot q = -\operatorname{grad} V, \qquad \operatorname{grad} V = (dV)^\sharp. \quad}$$
This is Newton's second law, mass × acceleration = force, written covariantly. The kinetic metric supplies both the mass (through $\flat$, $\sharp$) and the meaning of acceleration (through $\nabla$). The force 1-form $-dV$ is turned into a vector with $\sharp$. A non-conservative force 1-form $\tens{F}$ enters the same way: $\nabla_{\dot q}\dot q = \tens{F}^\sharp$.

**Free motion is geodesic motion.** With $V = 0$ the equation is $\nabla_{\dot q}\dot q = 0$: free particles follow [geodesics](note:geodesic) of the kinetic metric, at constant speed since $T$ is conserved.

## Flat reductions

- **Cartesian coordinates, $\tens{g} = \sum_A m_A\, \delta$.** Every $\Gamma$ vanishes, $\nabla_{\dot q}$ is $d/dt$, and $(\operatorname{grad} V)$ has components $m_A^{-1}\, \partial V / \partial \tens{r}_A$. The equation is $m_A \ddot{\tens{r}}_A = -\partial V / \partial \tens{r}_A$.
- **Polar coordinates, $\tens{g} = m\,(dr^2 + r^2 d\varphi^2)$.** The non-zero Christoffel symbols are $\Gamma^r{}_{\varphi\varphi} = -r$ and $\Gamma^\varphi{}_{r\varphi} = \Gamma^\varphi{}_{\varphi r} = 1/r$. So
$$\ddot r - r\dot\varphi^2 = -\frac{1}{m}\, \partial_r V, \qquad \ddot\varphi + \frac{2}{r}\, \dot r \dot\varphi = -\frac{1}{m r^2}\, \partial_\varphi V.$$
The centrifugal term $-r\dot\varphi^2$ and the Coriolis-type term $2\dot r\dot\varphi / r$ are Christoffel symbols: $\Gamma \neq 0$ but $\tens{R} = 0$. A [chart](note:chart) artifact is not curvature.

## The Jacobi metric

At fixed energy $E$, the trajectories of a natural system in the region $V < E$ are, after reparametrization, the geodesics of the **Jacobi metric**
$$\tens{g}_J = 2\,(E - V)\, \tens{g}$$
(Maupertuis' principle). The potential is absorbed into a spatial metric, one energy at a time. [Newton–Cartan gravity](../16-general-relativity/05-newton-cartan.md) absorbs it into a spacetime connection for all energies at once, which is the version general relativity extends.
