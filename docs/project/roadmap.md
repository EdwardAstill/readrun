# Roadmap

The current priorities are deliberately narrow:

## Content validation

- Validate standard Markdown links in addition to wikilinks and asset refs.
- Allow explicit Python dependencies in frontmatter when import scanning is not
  sufficient.

## Interactive files

- Add upload size limits and clearer file-state inspection.
- Allow uploaded files to be scoped to one executable block when required.

## Deployment

- Extend password-protected output beyond Vercel where a host provides an edge
  runtime.
- Improve deploy diagnostics without turning `rr deploy` into a publishing
  command.
