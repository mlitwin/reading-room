---
title: Classical Mechanics — A Mathematical Review
author: Matthew Litwin
date: 2026-05-18
tags: [physics, classical-mechanics, lagrangian, hamiltonian]
summary: A rigorous, succinct review of the three formalisms of classical mechanics — Newtonian, Lagrangian, Hamiltonian — and Noether's theorem on the symmetry origin of conservation laws.
---

Classical mechanics has three formalisms. **Newton's** is the most elementary: forces act on particles, and $F = ma$ is a second-order ODE for trajectories in $\mathbb{R}^3$. **Lagrangian** mechanics reformulates that as the stationarity of an action functional, handles constraints natively, and respects coordinate changes. **Hamiltonian** mechanics is in turn the Legendre transform of the Lagrangian system — first-order on phase space, with a Poisson-bracket structure that is the geometric core of the theory. All three describe the same dynamics from different angles.

This review is at the working mathematical level: precise definitions and statements, derivations sketched, examples used only when they sharpen a point. The closing section is Noether's theorem, which is the structural reason all three formalisms exhibit the same conservation laws.

Notation: $q = (q^1, \ldots, q^n)$ are generalized coordinates on configuration space $Q$; $\dot q^i = dq^i/dt$; $p_i$ is the conjugate momentum; $L(q, \dot q, t)$ is the Lagrangian; $H(q, p, t)$ is the Hamiltonian; Einstein summation is in force.

## Contents

1. [Newtonian mechanics](01-newtonian/index.md) — laws, configurations, constraints, conservation.
2. [Lagrangian mechanics](02-lagrangian/index.md) — the action principle and the Euler–Lagrange equations.
3. [Hamiltonian mechanics](03-hamiltonian/index.md) — Legendre transform, Hamilton's equations, phase space, Poisson brackets.
4. [Noether's theorem](04-noether/index.md) — continuous symmetries of the action and the conserved quantities they produce.
