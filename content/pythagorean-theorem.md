---
title: A Note on the Pythagorean Theorem
author: Matthew Litwin
date: 2026-05-14
tags: [math, geometry]
summary: Math rendering smoke test using one of the oldest theorems we have.
---

For a right triangle with legs $a$ and $b$ and hypotenuse $c$:

$$
a^2 + b^2 = c^2
$$

Rearranging:

$$
c = \sqrt{a^2 + b^2}
$$

A worked example with $a = 3$, $b = 4$:

$$
c = \sqrt{3^2 + 4^2} = \sqrt{25} = 5
$$

There is something pleasingly tidy about this case — three integers, no leftover. Such triples ($3, 4, 5$) are called **Pythagorean triples**, and they have a parametric form: for any integers $m > n > 0$,

$$
a = m^2 - n^2, \quad b = 2mn, \quad c = m^2 + n^2
$$

A small table to keep math and prose neighbors:

| $m$ | $n$ | $a$ | $b$ | $c$ |
|-----|-----|-----|-----|-----|
| 2   | 1   | 3   | 4   | 5   |
| 3   | 2   | 5   | 12  | 13  |
| 4   | 1   | 15  | 8   | 17  |
| 4   | 3   | 7   | 24  | 25  |
