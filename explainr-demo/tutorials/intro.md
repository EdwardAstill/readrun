# Tutorial: Getting Started

## Step 1: Create your Markdown

Create `.md` files in any directory structure you like. Use `:::` fences for executable Python code.

## Step 2: Run explainr

```bash
cd your-project
explainr
```

Open `http://localhost:3001` and you'll see your content.

## Step 3: Build for deployment

```bash
explainr build
```

This outputs static HTML to `./dist` that you can deploy anywhere.

## Try it

:::python
print("Hello from explainr!")

for i in range(5):
    print("*" * (i + 1))
:::
