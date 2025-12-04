# Documentation Index

Complete navigation guide for homelab-services monorepo documentation.

## Quick Links

- **Getting Started**: [Development Guide](./development.md)
- **System Design**: [Architecture Guide](./architecture.md)
- **Contributing**: [Contributing Guide](./contributing.md)
- **Production**: [Deployment Guide](./deployment.md)

## Documentation Structure

### Core Guides

| Guide | Description | Audience |
|-------|-------------|----------|
| [Architecture](./architecture.md) | Better-T-Stack architecture, data flow, design patterns | All developers |
| [Development](./development.md) | Setup, workflows, debugging, tools | New developers |
| [Contributing](./contributing.md) | Code standards, PR process, testing | Contributors |
| [Deployment](./deployment.md) | Docker builds, CI/CD, production operations | DevOps/Maintainers |

### Package Documentation

| Package | Description | Link |
|---------|-------------|------|
| **@homelab/ui** | Shared React components (DataTable, StatsCard, etc.) | [Documentation](./packages/ui.md) |
| **@homelab/db** | Database utilities and Drizzle ORM schemas | [Documentation](./packages/db.md) |
| **@homelab/validators** | Zod validation schemas | [Documentation](./packages/validators.md) |
| **@homelab/api** | tRPC routers and procedures | See architecture.md |

### Applications

| Application | Purpose | Port | Documentation |
|-------------|---------|------|---------------|
| **Claude Agent** | Claude Code session management and hook tracking | 3002 | [CLAUDE.md](../../CLAUDE.md) |
| **Playwright Server** | Test report aggregation and viewing | 3000 | [CLAUDE.md](../../CLAUDE.md) |

## Documentation by Task

### Setting Up Development Environment

1. Prerequisites: [Development Guide - Prerequisites](./development.md#prerequisites)
2. Initial Setup: [Development Guide - Initial Setup](./development.md#initial-setup)
3. Starting Development: [Development Guide - Development Workflow](./development.md#development-workflow)

### Creating New Features

1. Planning: [Architecture Guide - Design Patterns](./architecture.md)
2. Database Changes: [Database Package - Migrations](./packages/db.md#migrations)
3. API Endpoints: [Architecture Guide - API Layer](./architecture.md#3-api-layer-trpc)
4. UI Components: [UI Package - Components](./packages/ui.md#components)
5. Testing: [Contributing Guide - Testing Guidelines](./contributing.md#testing-guidelines)
6. Submitting PR: [Contributing Guide - Pull Request Guidelines](./contributing.md#pull-request-guidelines)

### Working with Database

| Topic | Documentation |
|-------|---------------|
| Schema Definition | [DB Package - Defining Tables](./packages/db.md#defining-tables) |
| Querying Data | [DB Package - Querying](./packages/db.md#querying) |
| Mutations | [DB Package - Mutations](./packages/db.md#mutations) |
| Transactions | [DB Package - Transactions](./packages/db.md#transactions) |
| Migrations | [DB Package - Migrations](./packages/db.md#migrations) |
| Pagination | [DB Package - Pagination](./packages/db.md#pagination) |

### Working with API

| Topic | Documentation |
|-------|---------------|
| Creating Routers | [Development Guide - Creating New Router](./development.md#creating-a-new-router) |
| Input Validation | [Validators Package](./packages/validators.md) |
| Error Handling | [Architecture Guide - Error Handling](./architecture.md#error-handling) |
| Type Safety | [Architecture Guide - Type Safety Flow](./architecture.md#type-safety-flow) |

### Working with UI

| Topic | Documentation |
|-------|---------------|
| Available Components | [UI Package - Components](./packages/ui.md#components) |
| Creating Components | [Development Guide - Adding New Component](./development.md#adding-a-new-shared-component) |
| Styling | [UI Package - Theming](./packages/ui.md#theming) |
| Hooks | [UI Package - Hooks](./packages/ui.md#hooks) |

### Deployment Tasks

| Topic | Documentation |
|-------|---------------|
| Building Docker Images | [Deployment Guide - Local Docker Builds](./deployment.md#local-docker-builds) |
| Environment Variables | [Deployment Guide - Environment Variables](./deployment.md#environment-variables) |
| CI/CD Pipeline | [Deployment Guide - CI/CD Pipeline](./deployment.md#cicd-pipeline) |
| Database Migrations | [Deployment Guide - Database Migrations](./deployment.md#database-migrations) |
| Monitoring | [Deployment Guide - Monitoring](./deployment.md#monitoring-and-health-checks) |
| Rollback | [Deployment Guide - Rollback Procedures](./deployment.md#rollback-procedures) |

## Troubleshooting Guides

### Development Issues

| Issue | Solution |
|-------|----------|
| Cannot find module '@homelab/ui' | [Development Guide - Common Issues](./development.md#issue-cannot-find-module-homelabui) |
| Port already in use | [Development Guide - Common Issues](./development.md#issue-port-already-in-use) |
| Database locked | [Development Guide - Common Issues](./development.md#issue-database-locked) |
| Type errors after schema change | [Development Guide - Common Issues](./development.md#issue-type-errors-after-schema-change) |
| Tailwind classes not working | [Development Guide - Common Issues](./development.md#issue-tailwind-classes-not-working) |

### Production Issues

| Issue | Solution |
|-------|----------|
| Container won't start | [Deployment Guide - Container Won't Start](./deployment.md#container-wont-start) |
| Health check failing | [Deployment Guide - Health Check Failing](./deployment.md#health-check-failing) |
| Port conflicts | [Deployment Guide - Port Conflicts](./deployment.md#port-conflicts) |
| Volume issues | [Deployment Guide - Volume Issues](./deployment.md#volume-issues) |

## Code Examples

### Quick References

**Create tRPC Procedure**:
```typescript
import { t } from '@homelab/api';
import { mySchema } from '@homelab/validators';

export const myRouter = t.router({
  create: t.procedure
    .input(mySchema)
    .mutation(async ({ input }) => {
      return db.insert(myTable).values(input).returning();
    })
});
```

**Query with Pagination**:
```typescript
import { createPaginatedResult } from '@homelab/db';

const items = await db.select()
  .from(table)
  .limit(input.limit)
  .offset(input.offset);

return createPaginatedResult(items, input.offset, input.limit);
```

**Use UI Component**:
```typescript
import { DataTable } from '@homelab/ui';

<DataTable
  columns={[{ key: 'name', label: 'Name' }]}
  data={items}
/>
```

## External Resources

### Technologies

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Zod Documentation](https://zod.dev/)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Bun Documentation](https://bun.sh/docs)

### Tools

- [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview) - Database GUI
- [React Query DevTools](https://tanstack.com/query/latest/docs/react/devtools) - Query debugging
- [Docker Documentation](https://docs.docker.com/)

## Contributing to Documentation

### Documentation Standards

Follow these standards when updating documentation:

1. **Clear headings**: Use descriptive H2/H3 headings
2. **Code examples**: Include working code snippets
3. **Cross-references**: Link to related documentation
4. **Keep updated**: Update docs with code changes
5. **Consistent formatting**: Follow existing style

See: [Contributing Guide - Documentation Standards](./contributing.md#documentation-standards)

### Documentation Structure

```
docs/
├── INDEX.md              # This file (navigation)
├── architecture.md       # System design
├── development.md        # Development guide
├── contributing.md       # Contributing guide
├── deployment.md         # Deployment guide
└── packages/
    ├── ui.md            # UI package docs
    ├── db.md            # Database package docs
    └── validators.md    # Validators package docs
```

## Search Tips

Use your editor's search to find documentation:

- **VS Code**: `Cmd+Shift+F` (Mac) or `Ctrl+Shift+F` (Windows/Linux)
- Search in: `homelab-services/docs/`
- Keywords: Component names, error messages, concepts

## Getting Help

1. **Check documentation**: Search this index or package docs
2. **Review examples**: Look at existing code in apps/packages
3. **Check issues**: Search [GitHub Issues](https://github.com/OWNER/REPO/issues)
4. **Ask questions**: Open a discussion on GitHub

## Related Documentation

- [Main Project CLAUDE.md](../../CLAUDE.md) - Overall project documentation
- [Installfest Documentation](../../docs/INDEX.md) - Homelab infrastructure docs
- [OpenSpec Specifications](../../openspec/) - Formal capability specs

---

**Last Updated**: 2025-12-04

**Maintained by**: Project maintainers

**Feedback**: Open an issue or PR to improve documentation
