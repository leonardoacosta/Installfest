# Global Development Standards

## Code Style

- Use ES modules (import/export), not CommonJS
- Prefer TypeScript strict mode
- Use functional components in React
- Named exports over default exports
- No `any` types - use `unknown` and narrow

## Commits

- Use conventional commits: feat:, fix:, chore:, docs:, refactor:
- Keep commits atomic and focused
- Write descriptive commit messages

## Quality Gates

Before any push:

1. `pnpm typecheck`
2. `pnpm build`
3. `pnpm test`
4. `pnpm lint`

## AI Workflow

- Use OpenSpec for features requiring specs
- Organize tasks into parallel groups before applying
- Store context before clearing: /store-context [name]
- Archive completed specs with /archive [name]
