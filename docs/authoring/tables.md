# Tables

readrun renders standard GitHub-Flavored Markdown tables. There are no table
tags, sizing modes, sliders, or per-table directives.

```markdown
| Symbol | Meaning | Typical value |
| --- | --- | --- |
| L | Span length | 6 m |
| w | Uniform load | 4.2 kN/m |
| E | Elastic modulus | 200 GPa |
```

| Symbol | Meaning | Typical value |
| --- | --- | --- |
| $L$ | Span length | 6 m |
| $w$ | Uniform load | 4.2 kN/m |
| $E$ | Elastic modulus | 200 GPa |

## Wide tables

Tables use the reading column width. When their content is wider than that
column, the table scrolls horizontally.

| Load case | Dead load | Live load | Wind load | Seismic load | Combination | Governing note |
| --- | --- | --- | --- | --- | --- | --- |
| LC1 | 12.4 kN | 8.1 kN | 0.0 kN | 0.0 kN | 1.35D + 1.5L | Long serviceability note that intentionally keeps the row wide. |
| LC2 | 12.4 kN | 0.0 kN | 6.8 kN | 0.0 kN | 1.2D + 1.5W | Wind governs lateral drift in this example. |
| LC3 | 12.4 kN | 3.5 kN | 0.0 kN | 5.2 kN | D + 0.3L + E | Seismic case included to show many columns. |

## Inline Markdown inside tables

Table cells support normal inline Markdown, including code, links, emphasis,
and dollar-delimited math.

| Kind | Example |
| --- | --- |
| Code | `very_long_identifier_name` |
| Link | [readrun docs](../deployment/overview.md) |
| Emphasis | **Important** |
| Math | $E = mc^2$ |
