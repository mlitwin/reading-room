---
title: FizzBuzz in Three Languages
author: Matthew Litwin
date: 2026-05-10
tags: [code, programming]
summary: A code-block smoke test — the same trivial program in three syntaxes.
---

The point of this piece isn't FizzBuzz, it's to make sure fenced code blocks render cleanly across a few syntaxes.

## Python

```python
def fizzbuzz(n: int) -> None:
    for i in range(1, n + 1):
        if i % 15 == 0:
            print("FizzBuzz")
        elif i % 3 == 0:
            print("Fizz")
        elif i % 5 == 0:
            print("Buzz")
        else:
            print(i)
```

## Swift

```swift
func fizzBuzz(_ n: Int) {
    for i in 1...n {
        switch (i % 3, i % 5) {
        case (0, 0): print("FizzBuzz")
        case (0, _): print("Fizz")
        case (_, 0): print("Buzz")
        default:     print(i)
        }
    }
}
```

## JavaScript

```javascript
function fizzbuzz(n) {
  for (let i = 1; i <= n; i++) {
    let out = "";
    if (i % 3 === 0) out += "Fizz";
    if (i % 5 === 0) out += "Buzz";
    console.log(out || i);
  }
}
```

Three flavors, same answer. Worth noting how Swift's tuple pattern match is the only one of these that scales gracefully if you add a third divisor.

A short inline `code` span and an unfenced indented block too:

    just four spaces
    no language hint

so we can see what the fallback looks like.
