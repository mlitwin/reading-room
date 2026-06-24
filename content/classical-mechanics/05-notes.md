---
title: Notes
notes: true
---

Supplementary definitions referenced from the body — terms the main text uses without defining inline. Readable as a standalone glossary, or popped up on demand from the chapters.

## Configuration space

The **configuration space** $Q$ of a mechanical system is the manifold of all possible positions of the system, with constraints already enforced. For $N$ unconstrained particles in $\mathbb{R}^3$, $Q = \mathbb{R}^{3N}$. For a pendulum, $Q = S^1$. For a rigid body in space, $Q = \mathbb{R}^3 \times SO(3)$ (translations × rotations), six-dimensional. A point of $Q$ specifies the system's instantaneous geometry; its tangent space at that point is the space of allowed velocities.

## Holonomic constraint

A **holonomic constraint** is one that can be expressed as a smooth equation
$$f(q, t) = 0$$
on configuration space. It restricts motion to a submanifold of $Q$ (or, for time-dependent $f$, a time-varying submanifold). Examples: a rigid distance ($|r_a - r_b|^2 - \ell^2 = 0$), a bead on a wire, a particle on a surface. A constraint involving velocities and *not* integrable to a position constraint is **nonholonomic** — the classic example is a disk rolling without slipping, where the no-slip condition restricts $\dot q$ but doesn't reduce the dimension of $Q$.

## Functional and variation

A **functional** is a function from a space of functions to $\mathbb{R}$ (or another scalar field). The action $S[q] = \int L\, dt$ is a functional on paths $q: [t_1, t_2] \to Q$.

The **variation** of a functional $S$ at a path $q$, in the direction of another path $\delta q$ (with appropriate boundary conditions), is
$$\delta S := \frac{d}{d\epsilon} S[q + \epsilon\, \delta q] \bigg|_{\epsilon = 0}.$$
Setting $\delta S = 0$ for all admissible $\delta q$ produces the Euler–Lagrange equations. The variational calculus generalizes the usual calculus's "set the derivative to zero" to infinite-dimensional function spaces.

## Legendre transform

The **Legendre transform** of a smooth, strictly convex function $f(x)$ is the function
$$f^*(p) := \sup_x \bigl( p \cdot x - f(x) \bigr) = p \cdot x(p) - f(x(p)),$$
where $x(p)$ is determined by $p = f'(x)$. It's an involution: $(f^*)^* = f$. Geometrically, $f^*(p)$ encodes $f$ via its tangent lines (slope $p$, intercept $-f^*(p)$).

In mechanics, the Hamiltonian is the Legendre transform of the Lagrangian with respect to $\dot q$, with $p = \partial L / \partial \dot q$ playing the role of the dual variable. The transform requires non-degeneracy of $\partial^2 L / \partial \dot q^i \partial \dot q^j$.

## Cyclic coordinate

A coordinate $q^i$ is **cyclic** (or **ignorable**) if it doesn't appear in the Lagrangian: $\partial L / \partial q^i = 0$. The Euler–Lagrange equation for that coordinate becomes
$$\frac{d}{dt} \frac{\partial L}{\partial \dot q^i} = 0,$$
so the conjugate momentum $p_i$ is conserved. This is Noether's theorem in its simplest form: translation invariance in $q^i$ implies conservation of $p_i$.

## Symplectic form

A **symplectic form** on a smooth manifold $M$ is a closed, non-degenerate 2-form $\omega \in \Omega^2(M)$. *Closed* means $d\omega = 0$; *non-degenerate* means the map $X \mapsto \iota_X \omega$ from vector fields to 1-forms is an isomorphism. A symplectic manifold has even dimension.

The canonical example is $T^* Q$ with $\omega = dp_i \wedge dq^i$. The symplectic form converts a Hamiltonian function $H$ into a vector field $X_H$ (defined by $\iota_{X_H} \omega = dH$) whose integral curves are solutions of Hamilton's equations. The whole of Hamiltonian mechanics — Poisson brackets, canonical transformations, Liouville's theorem — is best read as symplectic geometry.
