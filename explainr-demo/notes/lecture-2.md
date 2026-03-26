# Lecture 2: Functions

## Defining Functions

:::python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("World"))
print(greet("Alice", "Hey"))
print(greet("Bob", "G'day"))
:::

## Lambda Functions

:::python
square = lambda x: x ** 2
numbers = [1, 2, 3, 4, 5]
squared = list(map(square, numbers))
print(f"Original: {numbers}")
print(f"Squared:  {squared}")
:::
