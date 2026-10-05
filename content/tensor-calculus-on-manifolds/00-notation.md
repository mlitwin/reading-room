---
title: Notation and conventions
---

The index, sign and typeface conventions of this book, and a table of its symbols. Where standard texts disagree, the choice made here is stated with its source.

## Indices

| Indices | Range | Used for |
|---|---|---|
| $i, j, k, \ell$ | $1, \ldots, n$ | coordinate indices on a general manifold (Part I) and on a configuration space $Q$ |
| $\mu, \nu, \rho, \sigma, \lambda$ (mu, nu, rho, sigma, lambda) | $1, \ldots, n$; $0, \ldots, 3$ on spacetime | tensor components from chapter 6 on |
| $i, j, k$ in a spacetime context | $1, 2, 3$ | spatial components |
| $A, B$ | $1, \ldots, N$ | particle labels: $r_A$, $m_A$, $\sum_A$ |
| $a, b$ | $0, \ldots, 3$ | orthonormal-frame (tetrad) indices, Cartan formalism only |

- **Position.** An upper index marks a $T_p M$ slot (contravariant), a lower index a $T^*_p M$ slot (covariant). Coordinates carry upper indices, $x^\mu$. Momenta carry lower ones, $p_i$.
- **[Summation](note:einstein-summation).** An index appearing once up and once down in a term is summed over its range. Pairs in the same position are never summed.
- **Coordinate names as indices.** A coordinate's name may replace its index value: $g_{\theta\varphi}$, $\Gamma^\theta{}_{\varphi\varphi}$.
- **Marks.** A prime or tilde marks a second chart: $x'^{\mu'}$, $\tilde\theta$. Brackets denote symmetrization and antisymmetrization, $T_{(\mu\nu)}$ and $T_{[\mu\nu]}$, with weight $1/k!$.

Einstein's 1916 paper, where the summation convention was introduced, used Greek indices running $1$ to $4$, wrote coordinates with lower indices $x_\nu$, and put time last. The other choices here follow Misner–Thorne–Wheeler (MTW) and Carroll.

## Signs

| Quantity | Convention |
|---|---|
| Metric signature | $(-, +, +, +)$ when Lorentzian (MTW, Wald, Carroll); Landau–Lifshitz and particle physics use $(+, -, -, -)$ |
| Connection coefficients | $\nabla_{\partial_\mu} \partial_\nu = \Gamma^\rho{}_{\mu\nu}\, \partial_\rho$; geodesic equation $\ddot x^\rho + \Gamma^\rho{}_{\mu\nu}\, \dot x^\mu \dot x^\nu = 0$ (Einstein's 1916 $\Gamma$ had the opposite sign) |
| Torsion | $T^\rho{}_{\mu\nu} = \Gamma^\rho{}_{\mu\nu} - \Gamma^\rho{}_{\nu\mu}$ |
| [Riemann tensor](note:riemann-tensor) | $R(X, Y) Z = \nabla_X \nabla_Y Z - \nabla_Y \nabla_X Z - \nabla_{[X, Y]} Z$; [component form](note:riemann-index-convention) as in MTW and Carroll |
| Ricci tensor | $R_{\mu\nu} = R^\lambda{}_{\mu\lambda\nu}$ |
| Einstein equations | $G_{\mu\nu} + \Lambda g_{\mu\nu} = 8\pi G\, T_{\mu\nu}$. Together with the two rows above, this is MTW's sign class $(+, +, +)$ |
| $k$-form components | $\omega = \tfrac{1}{k!}\, \omega_{i_1 \cdots i_k}\, dx^{i_1} \wedge \cdots \wedge dx^{i_k}$, determinant wedge ([convention](note:wedge-convention)) |
| Symplectic form | $\boldsymbol\theta = p_i\, dq^i$, $\boldsymbol\omega = d\boldsymbol\theta = dp_i \wedge dq^i$, $\iota_{X_H} \boldsymbol\omega = -dH$ (Arnold). Abraham–Marsden's $dq \wedge dp$ with $+dH$ gives the same equations |
| Poisson bracket | $\{f, g\} = \partial_{q^i} f\, \partial_{p_i} g - \partial_{p_i} f\, \partial_{q^i} g$, so $\{q^i, p_j\} = \delta^i_j$ |
| Units | $G = c = 1$ in the general-relativity chapters unless constants are shown |

## Typefaces

| Kind | Typeface | Examples |
|---|---|---|
| Scalars, functions, components, coordinates | italic | $f$, $L$, $H$, $V$, $g_{\mu\nu}$, $v^i$, $\theta$ |
| Index-free vectors, covectors, forms, tensors | **bold italic** | $\boldsymbol v$, $\boldsymbol X$, $\boldsymbol\omega$, $\boldsymbol g$, $\boldsymbol T$, $\boldsymbol R$ |
| Named operators and functions | upright | $\operatorname{tr}$, $\det$, $\operatorname{grad}$, $\operatorname{sgn}$, $\mathrm{vol}_g$, $\mathrm{Sym}$ |
| Spaces of fields, Lie algebras | fraktur | $\mathfrak{X}(M)$, $\mathfrak{so}(3)$ |
| Number sets | blackboard | $\mathbb{R}$, $\mathbb{H}^n$ |
| [Lie derivative](note:lie-derivative), flow domain | calligraphic | $\mathcal{L}_X$, $\mathcal{D}$ |

- **Bold applies to a tensor named without indices.** The same object written by its components is italic: $\boldsymbol g(\boldsymbol v, \boldsymbol w) = g_{\mu\nu}\, v^\mu w^\nu$.
- **Bold separates letters that would otherwise collide:**
  - the Lagrangian $L$ from the angular-momentum vector $\boldsymbol L$;
  - kinetic energy $T$ from the [stress–energy tensor](note:stress-energy-tensor) $\boldsymbol T$;
  - Gaussian curvature $K$ from a Killing field $\boldsymbol K$;
  - ambient coordinates $X, Y, Z$ from vector fields $\boldsymbol X, \boldsymbol Y, \boldsymbol Z$.
- **Basis elements stay plain.** $\partial_\mu$ and $dx^\mu$ carry their index.
- **Differentials stay italic:** $d$, as in $dx$ and $d\omega$.
- **Source.** The bold register follows MTW's practice, and ISO 80000-2's (which sets vectors in bold italic).

## Symbols

### Manifolds and maps

| Symbol | Meaning |
|---|---|
| $M, N$ | smooth manifolds; $n = \dim M$ |
| $p, q$ | points of $M$ (Part I). In mechanics $q$ is a configuration and $p$ a momentum |
| $U, V$ | open sets |
| $(U, \varphi)$ — $\varphi$ (phi) | chart; local coordinates $x^i = \varphi^i$ |
| $\Phi$ (Phi) | parametrization $\Phi = \varphi^{-1}$ (chapter 6) |
| $F, G$ | smooth maps; $dF_p$ or $F_*$ differential (pushforward), $F^*$ pullback |
| $\gamma$ (gamma) | curve, with velocity $\dot\gamma$ |
| $\lambda$ (lambda) | curve parameter (affine for geodesics) |
| $f, g, h$ | smooth functions (italic $g$ is a function; the metric is $\boldsymbol g$) |
| $C^\infty(M)$, $\mathfrak{X}(M)$, $\Omega^k(M)$ | smooth functions, vector fields, $k$-forms; $\Omega^k_c$ compactly supported |
| $\mathbb{R}^n$, $\mathbb{H}^n$, $S^n$, $T^n$ | Euclidean space, half-space, sphere, torus |

### Vectors, forms, operators

| Symbol | Meaning |
|---|---|
| $T_p M$, $T^*_p M$ | [tangent and cotangent spaces](note:tangent-space) at $p$ |
| $TM$, $T^*M$; $\pi$ (pi) | tangent and cotangent bundles; bundle projection |
| $\boldsymbol v, \boldsymbol w$ | tangent vectors, components $v^i$ |
| $\boldsymbol X, \boldsymbol Y, \boldsymbol Z$ | vector fields, components $X^i$ |
| $\boldsymbol\omega, \boldsymbol\eta$ (omega, eta) | covectors and forms, components $\omega_i$ |
| $\partial_i$, $dx^i$ | coordinate basis and dual basis |
| $\delta^i_j$ (delta) | Kronecker delta. $\delta q$ is a variation (mechanics) |
| $d$ | [differential, exterior derivative](note:exterior-derivative) |
| $\wedge$, $\otimes$ | wedge and tensor products |
| $\Lambda^k$ (Lambda) | $k$-th exterior power |
| $\iota_X$ (iota) | [interior product](note:interior-product) |
| $\mathcal{L}_X$ | Lie derivative |
| $[\boldsymbol X, \boldsymbol Y]$ | [Lie bracket](note:lie-bracket) |
| $\theta_t$ (theta) | [flow of a vector field](note:flow), on the domain $\mathcal{D}$ |
| $\sigma$ (sigma), $S_k$ | a permutation and the symmetric group; $\operatorname{sgn}\sigma$ its sign |

### Integration and cohomology

| Symbol | Meaning |
|---|---|
| $\boldsymbol\Omega$ (Omega) | [orientation](note:orientation) $n$-form |
| $\partial M$; $\boldsymbol\nu$ (nu) | boundary; outward-pointing vector field |
| $\rho_\alpha$ (rho, alpha) | partition of unity |
| $Z^k$, $B^k$, $H^k_{dR}$ | closed forms, exact forms, [de Rham cohomology](note:de-rham-cohomology) |
| $h$ | cone operator (Poincaré lemma) |
| $\chi$ (chi) | [Euler characteristic](note:euler-characteristic) |

### The sphere

| Symbol | Meaning |
|---|---|
| $X, Y, Z$ | Cartesian coordinates of the ambient $\mathbb{R}^3$ |
| $\theta$ (theta), $\varphi$ (phi) | polar angle, azimuth (standard chart) |
| $\tilde\theta, \tilde\varphi$ | skew chart, $\tilde\varphi = \varphi + \alpha\cos\theta$ |
| $\alpha$ (alpha) | skew-chart shear, fixed at $\pi/8$ |
| $\theta_0, \varphi_0$ | sample point, $(13\pi/32,\ 29\pi/32)$ |
| $(x, y)$; $\psi_S$ (psi), $\Phi_S$ | stereographic coordinates; their chart and parametrization |
| $J$ | Jacobian of a chart change (chapter 6) |
| $\boldsymbol J$ | complex structure on $S^2$ (chapter 7) |

### Tensors and the metric

| Symbol | Meaning |
|---|---|
| $(r, s)$; $T^r_s(T_p M)$ | tensor type; space of $(r, s)$-tensors |
| $\boldsymbol T$; $T^{\mu \cdots}{}_{\nu \cdots}$ | a generic tensor; its components |
| $\boldsymbol g$; $g_{\mu\nu}$, $g^{\mu\nu}$ | [metric; components and inverse](note:metric); $\det g$ |
| $(n_+, n_-)$ | signature |
| $\flat$, $\sharp$ (flat, sharp) | [musical isomorphisms](note:musical-isomorphism) |
| $\mathrm{vol}_g$ | [metric volume form](note:volume-form) |
| $\star$ | Hodge star |
| $\varepsilon_{\mu_1 \cdots \mu_n}$, $\epsilon_{\mu_1 \cdots \mu_n}$ (epsilon) | Levi-Civita symbol (a density) and tensor ([note](note:levi-civita)) |
| $\boldsymbol\eta$ (eta); $\eta_{\mu\nu}$ | [Minkowski metric](note:minkowski-space) |
| $\boldsymbol K$ | [Killing vector field](note:killing-vector) |

### Connection and curvature

| Symbol | Meaning |
|---|---|
| $\nabla$ (nabla) | connection, covariant derivative; $\nabla_\mu$, or a semicolon $T_{\nu;\mu}$ |
| $\Gamma^\rho{}_{\mu\nu}$ (Gamma) | [connection coefficients (Christoffel symbols)](note:affine-connection) |
| $T^\rho{}_{\mu\nu}$ | [torsion](note:torsion) |
| $\boldsymbol R$; $R^\rho{}_{\sigma\mu\nu}$ | Riemann tensor |
| $R_{\mu\nu}$, $R$ | [Ricci tensor, scalar curvature](note:ricci-and-einstein-tensors) |
| $G_{\mu\nu}$ | Einstein tensor |
| $K$ | [sectional or Gaussian curvature](note:sectional-curvature) |
| $P_\gamma$ | [parallel transport along](note:parallel-transport) $\gamma$ |
| $\boldsymbol T$, $\boldsymbol J$ | [tangent and deviation vectors in geodesic deviation](note:geodesic-deviation) |

### Relativity

| Symbol | Meaning |
|---|---|
| $\Lambda$ (Lambda) | cosmological constant |
| $G$, $c$ | Newton's constant, speed of light |
| $\boldsymbol T$; $T_{\mu\nu}$ | stress–energy tensor |
| $\rho$ (rho), $p$ | energy density, pressure |
| $\boldsymbol u$; $u^\mu$ | four-velocity |
| $F_{\mu\nu}$ | electromagnetic field strength |
| $\phi$ (phi), $V(\phi)$ | scalar field and its potential |
| $\tau$ (tau) | [proper time](note:proper-time) |
| $M$; $t, r$ | Schwarzschild mass parameter; Schwarzschild coordinates |
| $E$, $L$; $V_{\mathrm{eff}}$ | energy and angular momentum per unit mass; effective potential |
| $\Phi$ (Phi) | Newtonian gravitational potential |
| $\mathring\Gamma$ | Levi-Civita part of a connection with torsion |
| $K^\rho{}_{\mu\nu}$ | contortion |
| $S^\rho{}_{\mu\nu}$ | spin density |
| $\boldsymbol e^a$; $\omega^a{}_b$ (omega) | tetrad (orthonormal coframe); spin connection |

### Mechanics

| Symbol | Meaning |
|---|---|
| $Q$; $TQ$, $T^*Q$ | configuration space; velocity phase space and phase space |
| $q^i$, $\dot q^i$, $p_i$ | generalized coordinates, velocities, conjugate momenta |
| $L$, $H$ | Lagrangian, Hamiltonian |
| $T$, $V$, $E$ | kinetic energy, potential energy, total energy |
| $S[q]$ | action |
| $\epsilon$ (epsilon) | parameter of a family of paths or transformations |
| $\boldsymbol\theta$ (theta), $\boldsymbol\omega$ (omega) | tautological 1-form $p_i\, dq^i$; symplectic form $d\boldsymbol\theta$ |
| $\boldsymbol X_H$ | Hamiltonian vector field |
| $\{f, g\}$ | Poisson bracket |
| $\lambda$ (lambda) | Lagrange multiplier |
| $\boldsymbol r_A$, $m_A$, $\boldsymbol F_A$ | position, mass, force of particle $A$ |
| $\boldsymbol P$, $\boldsymbol L$, $M$ | total momentum, angular momentum, total mass |
| $Q$ | Noether charge (context separates it from configuration space) |

## Greek alphabet

| Letter | Name | Letter | Name | Letter | Name |
|---|---|---|---|---|---|
| $\alpha$, A | alpha | $\iota$, I | iota | $\rho$, P | rho |
| $\beta$, B | beta | $\kappa$, K | kappa | $\sigma$, $\Sigma$ | sigma |
| $\gamma$, $\Gamma$ | gamma | $\lambda$, $\Lambda$ | lambda | $\tau$, T | tau |
| $\delta$, $\Delta$ | delta | $\mu$, M | mu | $\upsilon$, $\Upsilon$ | upsilon |
| $\epsilon$ / $\varepsilon$, E | epsilon | $\nu$, N | nu | $\phi$ / $\varphi$, $\Phi$ | phi |
| $\zeta$, Z | zeta | $\xi$, $\Xi$ | xi | $\chi$, X | chi |
| $\eta$, H | eta | $o$, O | omicron | $\psi$, $\Psi$ | psi |
| $\theta$ / $\vartheta$, $\Theta$ | theta | $\pi$, $\Pi$ | pi | $\omega$, $\Omega$ | omega |

The variant forms are distinct symbols in this book. $\varepsilon$ is the Levi-Civita symbol (and, in Part I, a small parameter); $\epsilon$ is the Levi-Civita tensor or a family parameter. $\varphi$ is the azimuth and a chart map, and $\phi$ a scalar field.
