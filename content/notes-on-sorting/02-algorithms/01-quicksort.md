---
title: Quicksort
---

The intuition: pick a pivot, partition the array into "less than pivot" and "greater than pivot," recurse on each side. Pivot choice is what makes or breaks quicksort.

```python
def quicksort(a, lo=0, hi=None):
    if hi is None:
        hi = len(a) - 1
    if lo >= hi:
        return
    pivot = a[(lo + hi) // 2]
    i, j = lo, hi
    while i <= j:
        while a[i] < pivot: i += 1
        while a[j] > pivot: j -= 1
        if i <= j:
            a[i], a[j] = a[j], a[i]
            i += 1
            j -= 1
    quicksort(a, lo, j)
    quicksort(a, i, hi)
```

Average case $O(n \log n)$, worst case $O(n^2)$ if pivots are chosen badly (always the smallest or largest element). Common mitigations: randomize the pivot, use median-of-three, or fall back to a different algorithm (introsort).

Not stable. Sorts in place — only $O(\log n)$ recursion-stack memory.
