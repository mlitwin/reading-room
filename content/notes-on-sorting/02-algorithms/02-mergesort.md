---
title: Merge sort
---

Split the array in half, sort each half recursively, then merge the two sorted halves into one.

```python
def mergesort(a):
    if len(a) <= 1:
        return a
    mid = len(a) // 2
    left = mergesort(a[:mid])
    right = mergesort(a[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result
```

Guaranteed $O(n \log n)$ — no bad inputs. Stable. The cost: $O(n)$ extra memory for the merge buffers.

Merge sort is the right default when stability matters or when you're sorting a linked list (no random access, but merging works element-by-element).
