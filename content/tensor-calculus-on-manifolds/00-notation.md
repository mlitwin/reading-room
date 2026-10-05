---
title: Notation and conventions
---

The conventions every chapter uses: indices, signature and typefaces, and the Greek alphabet. Conventions with a narrower reach, and the symbol tables, are in the index of the chapter that introduces them, listed at the end of this page. Where standard texts disagree, the choice made here is stated with its source.

## Indices

| Indices | Range | Used for |
|---|---|---|
| $i, j, k, \ell$ | $1, \ldots, n$ | coordinate indices on a general manifold (chapter 1) and on a configuration space $Q$ |
| $\mu, \nu, \rho, \sigma, \lambda$ (mu, nu, rho, sigma, lambda) | $1, \ldots, n$; $0, \ldots, 3$ on spacetime | tensor components from chapter 2 on |
| $i, j, k$ in a spacetime context | $1, 2, 3$ | spatial components |
| $A, B$ | $1, \ldots, N$ | particle labels: $\tens{r}_A$, $m_A$, $\sum_A$ |
| $a, b$ | $0, \ldots, 3$ | orthonormal-frame (tetrad) indices, Cartan formalism only |

- **Position.** An upper index marks a $T_p M$ slot (contravariant), a lower index a $T^*_p M$ slot (covariant). Coordinates carry upper indices, $x^\mu$. Momenta carry lower ones, $p_i$.
- **[Summation](note:einstein-summation).** An index appearing once up and once down in a term is summed over its range. Pairs in the same position are never summed.
- **Coordinate names as indices.** A coordinate's name may replace its index value: $g_{\theta\varphi}$, $\Gamma^\theta{}_{\varphi\varphi}$.
- **Marks.** A prime or tilde marks a second chart: $x'^{\mu'}$, $\tilde\theta$. Brackets denote symmetrization and antisymmetrization, $T_{(\mu\nu)}$ and $T_{[\mu\nu]}$, with weight $1/k!$.

Einstein's 1916 paper, where the summation convention was introduced, used Greek indices running $1$ to $4$, wrote coordinates with lower indices $x_\nu$, and put time last. The other choices here follow Misner–Thorne–Wheeler (MTW) and Carroll.

## Signature

A Lorentzian metric has signature $(-, +, +, +)$, as in MTW, Wald and Carroll. Landau–Lifshitz and particle physics use $(+, -, -, -)$. Timelike vectors therefore have $\tens{g}(\tens{v}, \tens{v}) < 0$.

## Typefaces

| Kind | Typeface | Examples |
|---|---|---|
| Scalars, functions, components, coordinates | italic | $f$, $L$, $H$, $V$, $g_{\mu\nu}$, $v^i$, $\theta$ |
| Index-free vectors, covectors, forms, tensors | **bold italic** | $\tens{v}$, $\tens{X}$, $\tens{\omega}$, $\tens{g}$, $\tens{T}$, $\tens{R}$ |
| Named operators and functions | upright | $\operatorname{tr}$, $\det$, $\operatorname{grad}$, $\operatorname{sgn}$, $\mathrm{vol}_g$, $\mathrm{Sym}$ |
| Spaces of fields, Lie algebras | fraktur | $\mathfrak{X}(M)$, $\mathfrak{so}(3)$ |
| Number sets | blackboard | $\mathbb{R}$, $\mathbb{H}^n$ |
| [Lie derivative](note:lie-derivative) | pound sign (MTW) | $\Lie_{\tens{X}}$ |
| Flow domain, Lagrangian density | calligraphic | $\mathcal{D}$, $\mathcal{L}$ |

- **Bold applies to a tensor named without indices.** The same object written by its components is italic: $\tens{g}(\tens{v}, \tens{w}) = g_{\mu\nu}\, v^\mu w^\nu$.
- **Bold separates letters that would otherwise collide:**
  - the Lagrangian $L$ from the angular-momentum vector $\tens{L}$;
  - kinetic energy $T$ from the [stress–energy tensor](note:stress-energy-tensor) $\tens{T}$;
  - scalar curvature $R$ from the Riemann tensor $\tens{R}(\tens{X}, \tens{Y})\tens{Z}$;
  - ambient coordinates $X, Y, Z$ from vector fields $\tens{X}, \tens{Y}, \tens{Z}$.
- **Basis elements stay plain.** $\partial_\mu$ and $dx^\mu$ carry their index.
- **The differential stays italic:** $d$, as in $dx$ and $d\tens{\omega}$.
- **Source.** The bold register follows MTW's practice, and ISO 80000-2's (which sets vectors in bold italic).

## Where the other conventions are

Each chapter index ends with a **Notation** section: the conventions that chapter introduces and a table of its symbols, Greek names spelled out.

| Convention | Stated in |
|---|---|
| $k$-form components, $\tfrac{1}{k!}$ and the determinant wedge | [chapter 6](06-differential-forms/index.md) |
| Connection coefficients, torsion, Riemann and Ricci index order | [chapter 8](08-connection-and-curvature/index.md) |
| Symplectic form and Poisson bracket signs | [chapter 11](11-hamiltonian-mechanics/index.md) |
| $c = 1$; the Minkowski metric | [chapter 13](13-special-relativity/index.md) |
| Einstein-equation sign class; $G = 1$ | [chapter 15](15-general-relativity/index.md) |

Symbols by chapter: [manifolds](01-manifolds/index.md), [tensors](02-tensors/index.md), [the metric](03-metric/index.md), [the sphere](04-coordinate-systems/index.md), [vector fields](05-vector-fields-and-flows/index.md), [forms](06-differential-forms/index.md), [integration](07-integration/index.md), [connection and curvature](08-connection-and-curvature/index.md), [cohomology](09-de-rham/index.md), [Lagrangian](10-lagrangian-mechanics/index.md), [Hamiltonian](11-hamiltonian-mechanics/index.md), [symmetry](12-symmetry-and-noether/index.md), [special relativity](13-special-relativity/index.md), [fields](14-fields-and-stress-energy/index.md), [general relativity](15-general-relativity/index.md).

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

The variant forms are distinct symbols in this book. $\varepsilon$ is the Levi-Civita symbol (and, in chapter 1, a small parameter); $\epsilon$ is the Levi-Civita tensor or a family parameter. $\varphi$ is the azimuth and a chart map, and $\phi$ a scalar field.
