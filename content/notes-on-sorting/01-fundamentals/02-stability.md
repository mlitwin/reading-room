---
title: Stability
---

A sort is **stable** if elements that compare equal stay in their original order. It doesn't matter for sorting integers — there's nothing to keep stable. It matters a lot when you sort records by a key and want to preserve secondary ordering.

For example: sort a list of `(name, age)` pairs first by name, then by age. If the age sort is stable, the result is sorted by age primarily and by name within each age. If it's unstable, the name ordering within each age is arbitrary.

| Algorithm   | Stable |
|-------------|--------|
| Merge sort  | yes    |
| Insertion   | yes    |
| Bubble      | yes    |
| Quicksort   | no     |
| Heap sort   | no     |
| Selection   | no     |

Stability can be added to an unstable sort at $O(n)$ extra space — pair each element with its original index, break ties by index — but the cleaner choice is usually picking a stable algorithm to begin with.
