---
title: Complexity
---

Sorting $n$ items by comparison can't be faster than $O(n \log n)$. The lower bound comes from information theory: there are $n!$ possible orderings, each comparison gives one bit of information, so any decision tree resolving the ordering has height at least $\log_2(n!) = \Theta(n \log n)$.

Below that bound live the non-comparison sorts — counting sort and radix sort — which exploit structure in the keys to beat $n \log n$ for specific inputs. They're a different beast.

For comparison sorts, the spectrum is:

- $O(n^2)$ — bubble, insertion, selection. Fine for very small arrays.
- $O(n \log n)$ average — quicksort, the workhorse.
- $O(n \log n)$ worst case — merge sort, heap sort. Quicksort's worst case is $O(n^2)$ unless you randomize the pivot.

Constants matter more than the asymptotic class for the inputs you actually see. Quicksort beats merge sort on most real inputs despite the same big-O.
