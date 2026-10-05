---
title: Einstein–Cartan — gravity with torsion
---

The [Levi-Civita connection](note:levi-civita) is the unique [torsion](note:torsion)-free metric-compatible connection. Drop the torsion-free assumption and you get **Einstein–Cartan theory**: a metric-compatible (but not torsion-free) connection on spacetime, with torsion sourced by the **spin density** of matter. EC gravity agrees with standard GR wherever spin density is negligible — everywhere short of densities far beyond nuclear — and is the natural setting when fermion spin is allowed to source geometry.

## The variables

Two independent fields on $M$:

- **Metric** $g_{\mu\nu}$, as before.
- **Connection** $\Gamma^\rho{}_{\mu\nu}$, with $\nabla_\rho g_{\mu\nu} = 0$ (metric compatibility imposed) but $\Gamma^\rho{}_{\mu\nu} \neq \Gamma^\rho{}_{\nu\mu}$ allowed.

The torsion is
$$T^\rho{}_{\mu\nu} = \Gamma^\rho{}_{\mu\nu} - \Gamma^\rho{}_{\nu\mu},$$
twice the antisymmetric-in-the-lower-pair part of the Christoffels. The connection splits as
$$\Gamma^\rho{}_{\mu\nu} = \mathring{\Gamma}^\rho{}_{\mu\nu} + K^\rho{}_{\mu\nu},$$
where $\mathring{\Gamma}$ is the Levi-Civita connection of $\tens{g}$ and $K$ is the **contortion tensor**, determined by torsion and metric by
$$K^\rho{}_{\mu\nu} = \tfrac{1}{2} (T^\rho{}_{\mu\nu} + T_{\mu}{}^{\rho}{}_{\nu} + T_{\nu}{}^{\rho}{}_{\mu}).$$
Contortion is a genuine tensor (the difference of two connections), and torsion is twice its antisymmetric part: $K^\rho{}_{[\mu\nu]} = \tfrac{1}{2}\, T^\rho{}_{\mu\nu}$.

## The action

The **Einstein–Cartan action** is the Einstein–Hilbert action with the Levi-Civita curvature replaced by the curvature of the full (possibly torsionful) connection:
$$S_{\mathrm{EC}}[\tens{g}, \Gamma] = \frac{c^4}{16\pi G} \int_M R[\Gamma]\, \mathrm{vol}_g + S_{\mathrm{matter}}[\tens{g}, \Gamma, \psi],$$
where $R[\Gamma]$ is the scalar curvature constructed from $\Gamma$, not from $\mathring\Gamma$. The matter action $S_{\mathrm{matter}}$ in general depends on the connection (not just the metric) when $\psi$ contains [spinor](note:spinor) fields, since the spinor covariant derivative involves the spin connection — and once that dependence is allowed, matter couples to torsion.

## Field equations

Varying with respect to $\tens{g}$ and $\Gamma$ as independent fields (the **Palatini variation**) gives two equations:

**Einstein-like equation.**
$$G_{\mu\nu}[\Gamma] = \frac{8\pi G}{c^4}\, T_{\mu\nu},$$
identical in form to GR but with the [Einstein tensor](note:ricci-and-einstein-tensors) built from the *torsionful* connection $\Gamma$ and a generalized [stress–energy](note:stress-energy-tensor) on the right.

**Cartan equation** (the torsion equation).
$$T^\rho{}_{\mu\nu} + \delta^\rho_\mu\, T^\sigma{}_{\nu\sigma} - \delta^\rho_\nu\, T^\sigma{}_{\mu\sigma} = \frac{8\pi G}{c^4}\, S^\rho{}_{\mu\nu},$$
where $S^\rho{}_{\mu\nu}$ is the **spin density tensor** of matter — the antisymmetric-in-$\mu\nu$ object built from the spin angular momentum carried by the matter fields. Specifically, for Dirac fermions $\psi$, the spin density is bilinear in $\psi$ and $\bar\psi$.

The Cartan equation is **algebraic** — there are no derivatives of torsion on the left — so torsion is *not* a propagating field. It vanishes wherever the spin density vanishes (free space, electromagnetic fields, etc.) and is non-zero only inside spinning matter. There are no Einstein–Cartan analogues of gravitational waves carrying torsion.

## Comparison with GR

Where spin density vanishes, Einstein–Cartan reduces exactly to GR — same metric, same predictions, same Schwarzschild solution outside. The differences live inside spinning matter:

- **Spinning fluids and dust.** Macroscopic spin alignment is rare; in cosmological-fluid models EC is effectively GR.
- **Dense fermionic matter.** Inside a neutron star, fermion spins give a non-zero spin density, but the effect is tiny. Because the Cartan equation is algebraic, torsion enters the effective Einstein equations as a term *quadratic* in the spin density, with each factor carrying an $\hbar$. That term rivals ordinary stress–energy only at densities far beyond nuclear.
- **Cosmological singularities.** Some EC models avoid the initial singularity that standard GR predicts, replacing it with a bounce — torsion contributes an effective repulsive term at extreme density.

Beyond these, EC is observationally indistinguishable from GR with current data.

## Why include it

Einstein–Cartan is a tiny numerical correction to GR, but it earns its place for three reasons:

1. **Conceptual clean-up.** The "extra" degree of freedom of the connection — beyond what the metric determines — is what spinors couple to. Standard GR with spinors requires a tetrad/spin-connection formulation; EC makes the splitting natural.
2. **Coupling to fermions.** In EC, Dirac fermions couple minimally to the full connection, so their spin sources torsion and they feel it; gauge bosons, whose field strength $\tens{F} = d\tens{A}$ needs no connection, neither source nor feel it.
3. **Mathematical generality.** The non-torsion-free case is the "generic" affine connection. Treating it as a special case obscures what the metric assumption (Levi-Civita) is doing.

The further story — vielbein/tetrad formulation, spin connection, the action written as a polynomial in differential forms — is the [**Cartan formalism**](note:cartan-formalism), a separate (longer) topic; the [notes page](../16-notes.md) has a sketch.
