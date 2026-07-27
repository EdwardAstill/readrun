# Tables

readrun uses one table system for ordinary Markdown tables. There are no table tags, modes, or per-table directives: every Markdown table follows the same content-aware sizing algorithm.

The aim is simple: short columns stay compact, spare width goes to columns that need it, and tables become horizontally scrollable only when their useful base width cannot fit inside the reading column.

## The sizing algorithm

Each table has three important widths:

- **target column width** — the shared width requested by the table slider, initially `28ch`.
- **content width** — the measured width each column needs to keep its widest cell on one line.
- **available width** — the current readrun reading column width.

For each column, readrun first computes a base width:

```txt
base width = min(content width, target column width)
```

So a column that only needs `12ch` does not get forced to `28ch`. A column that needs `60ch` starts at the target width and may receive extra space later.

Then readrun sums the base widths.

If the base table is already wider than the available reading column, readrun stops there: the table keeps those base widths and becomes horizontally scrollable.

If the base table fits, readrun calculates the spare width and distributes it to columns with unmet content demand:

```txt
unmet demand = content width - base width
```

Columns receive spare width in proportion to their unmet demand. If all content widths are satisfied, any leftover page width remains unused, so narrow tables stay narrow and centred.

## Compact table

Short columns shrink to their content width instead of stretching across the page.

| Symbol | Meaning | Typical value |
| --- | --- | --- |
| $L$ | Span length | 6 m |
| $w$ | Uniform load | 4.2 kN/m |
| $E$ | Elastic modulus | 200 GPa |

## Worked example: proportional spare width

Suppose the target width is `30`, the available width is `100`, and the measured content widths are:

```txt
[20, 60, 40]
```

The base widths are:

```txt
[min(20, 30), min(60, 30), min(40, 30)]
= [20, 30, 30]
```

The base table is `80`, so there are `20` units of spare width.

The unmet demand is:

```txt
[0, 30, 10]
```

The second column has three quarters of the unmet demand, so it gets three quarters of the spare width. The third column gets the remaining quarter.

```txt
extra = [0, 15, 5]
final = [20, 45, 35]
```

Here is a table shaped like that example: short first columns, plus one explanation column that should receive most of the extra width.

| Step | Check | Explanation |
| --- | --- | --- |
| 1 | Inputs | Collect span, loads, support conditions, and material assumptions. |
| 2 | Model | Pick the simplest model that preserves the behaviour you are checking. |
| 3 | Result | Report the governing value and the assumption that controls it. |

## Naturally narrow table

If all content fits before the table reaches the reading column width, readrun leaves the table narrow and centres it.

| Concept | Meaning |
| --- | --- |
| Target width | Shared width requested by the slider. |
| Content width | Width needed by a column's widest one-line cell. |

## Wide table

If the base widths cannot fit, readrun does not squash the columns. The table becomes horizontally scrollable, and the first column becomes sticky while scrolling.

| Load case | Dead load | Live load | Wind load | Seismic load | Combination | Governing note |
| --- | --- | --- | --- | --- | --- | --- |
| LC1 | 12.4 kN | 8.1 kN | 0.0 kN | 0.0 kN | 1.35D + 1.5L | Long serviceability note that intentionally keeps the row wide. |
| LC2 | 12.4 kN | 0.0 kN | 6.8 kN | 0.0 kN | 1.2D + 1.5W | Wind governs lateral drift in this example. |
| LC3 | 12.4 kN | 3.5 kN | 0.0 kN | 5.2 kN | D + 0.3L + E | Seismic case included to show many columns. |

## Inline Markdown inside tables

Table cells use the same inline Markdown renderer as normal prose. Inline code, links, and math should render correctly and still participate in width measurement.

| Kind | Example | Why it matters |
| --- | --- | --- |
| Code | `very_long_identifier_name` | Code often has fewer natural wrap points. |
| Link | [readrun docs](../deployment/overview.md) | Links should keep their normal styling inside cells. |
| Math | $E = mc^2$ | Math should render through KaTeX rather than disappearing or being measured as empty text. |
