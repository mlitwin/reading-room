---
title: Connection and curvature
---

The metric gives lengths and angles at a point. Differentiating a vector field, or comparing vectors at different points, needs more structure: a **connection**. A metric determines one, the **[Levi-Civita connection](note:levi-civita)**, the unique connection that is torsion-free and compatible with the metric. It is the connection of this book and of standard GR. Its curvature is the gravitational field's tidal content.

Six pages:

1. [The connection](01-the-connection.md): why partial derivatives fail, Christoffel symbols, the Levi-Civita connection; affine connections without a metric.
2. [Covariant derivative, transport, geodesics](02-covariant-derivative.md): $\nabla$ on tensors, the divergence, parallel transport, the geodesic equation.
3. [Killing vectors](03-killing-vectors.md): the Killing equation, conserved quantities along geodesics, the symmetries of $S^2$.
4. [Torsion and curvature](04-torsion-and-curvature.md): the torsion and Riemann tensors, Ricci and scalar curvature, the Bianchi identities.
5. [Geodesic deviation](05-geodesic-deviation.md): the Jacobi equation; curvature as tidal acceleration.
6. [On the sphere](06-on-the-sphere.md): Christoffels, Riemann and Gaussian curvature of $S^2$, holonomy.

Pages 1–3 are all that the mechanics chapters need.

**Without a metric:** affine connections, the covariant derivative, parallel transport, geodesics, torsion and the Riemann tensor are defined for any connection. Levi-Civita is needed for the Christoffel formula, the divergence, Killing vectors, the symmetries of Riemann and sectional curvature.

The longest chapter of the book; most confusion in GR lives here.

## Notation

| Quantity | Convention |
|---|---|
| Connection coefficients | $\nabla_{\partial_\mu} \partial_\nu = \Gamma^\rho{}_{\mu\nu}\, \partial_\rho$; geodesic equation $\ddot x^\rho + \Gamma^\rho{}_{\mu\nu}\, \dot x^\mu \dot x^\nu = 0$ (Einstein's 1916 $\Gamma$ had the opposite sign) |
| Torsion | $T^\rho{}_{\mu\nu} = \Gamma^\rho{}_{\mu\nu} - \Gamma^\rho{}_{\nu\mu}$ |
| [Riemann tensor](note:riemann-tensor) | $\tens{R}(\tens{X}, \tens{Y}) \tens{Z} = \nabla_{\tens{X}} \nabla_{\tens{Y}} \tens{Z} - \nabla_{\tens{Y}} \nabla_{\tens{X}} \tens{Z} - \nabla_{[\tens{X}, \tens{Y}]} \tens{Z}$; [component form](note:riemann-index-convention) as in MTW and Carroll |
| Ricci tensor | $R_{\mu\nu} = R^\lambda{}_{\mu\lambda\nu}$ |

| Symbol | Meaning |
|---|---|
| $\nabla$ (nabla) | connection, covariant derivative; $\nabla_\mu$, or a semicolon $T_{\nu;\mu}$ |
| $\Gamma^\rho{}_{\mu\nu}$ (Gamma) | [connection coefficients (Christoffel symbols)](note:affine-connection) |
| $\Tor(\tens{X}, \tens{Y})$; $T^\rho{}_{\mu\nu}$ | [torsion](note:torsion), index-free and in components |
| $\tens{R}$; $R^\rho{}_{\sigma\mu\nu}$ | Riemann tensor |
| $R_{\mu\nu}$, $R$ | [Ricci tensor, scalar curvature](note:ricci-and-einstein-tensors) |
| $G_{\mu\nu}$ | Einstein tensor |
| $K$ | [sectional or Gaussian curvature](note:sectional-curvature) |
| $P_\gamma$ | [parallel transport along](note:parallel-transport) $\gamma$ |
| $\tens{u}$, $\tens{S}$ | [tangent and deviation vectors in geodesic deviation](note:geodesic-deviation) |
| $\tens{\xi}$ (xi) | [Killing vector field](note:killing-vector); generator of a symmetry |
