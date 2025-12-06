# Capability: Template System

## Overview

Project templates for bootstrapping Claude Code configuration based on project type.

## ADDED Requirements

### Requirement: Template Collection

The system SHALL provide three project templates for common use cases.

#### Scenario: Minimal template for existing projects

**Given** an existing project needs Claude Code configuration

**When** the minimal template is installed

**Then** the template SHALL provide a CLAUDE.md that imports global configuration

**And** the template SHALL include minimal build commands (dev, build, test)

**And** the template SHALL not include project-specific skills or settings

**Example CLAUDE.md:**
```markdown
# Project Name

@~/.claude/CLAUDE.md

## Build Commands
- `pnpm dev` - Start dev server
- `pnpm build` - Production build
- `pnpm test` - Run tests
```

#### Scenario: Next.js + tRPC template for new monorepos

**Given** a new T3 Stack monorepo project

**When** the nextjs-trpc template is installed

**Then** the template SHALL provide a CLAUDE.md importing global + project-specific documentation

**And** the template SHALL include settings.json with T3 Stack hooks (typecheck on .ts/.tsx edits)

**And** the template SHALL include skills directory for project-specific patterns

**And** the template SHALL document tech stack (Next.js, tRPC, Drizzle, Tailwind, ShadCN, Playwright, Vitest)

**And** the template SHALL include monorepo structure documentation (apps/, packages/, tooling/)

#### Scenario: Python template for Python projects

**Given** a Python project needs Claude Code configuration

**When** the python template is installed

**Then** the template SHALL provide a CLAUDE.md importing global + Python-specific patterns

**And** the template SHALL document Poetry package management

**And** the template SHALL include pytest testing patterns

**And** the template SHALL document FastAPI conventions if applicable

**And** the template SHALL include skills directory for Python-specific patterns

### Requirement: Template Structure

Each template SHALL follow a consistent directory structure.

#### Scenario: Template directory layout

**Given** a template exists

**When** the template directory is inspected

**Then** the template SHALL contain:
- `CLAUDE.md` (project-level documentation)
- `settings.json` (optional, project-specific hooks)
- `skills/` (optional, project-specific pattern directory)
- `README.md` (optional, template description)

**And** the template SHALL not include global agents or commands (copied from central repo during install)

### Requirement: Template Import Mechanism

Templates SHALL use `@import` syntax to reference global configuration.

#### Scenario: Importing global CLAUDE.md

**Given** a project template CLAUDE.md

**When** the file contains `@~/.claude/CLAUDE.md`

**Then** Claude Code SHALL load the global CLAUDE.md content

**And** project-specific sections SHALL override or extend global sections

**And** the import SHALL resolve to the central repository's CLAUDE.md if ~/.claude/ is symlinked

#### Scenario: Hierarchical configuration merging

**Given** global CLAUDE.md defines "No `any` types"

**And** project CLAUDE.md adds "Use domain-driven design patterns"

**When** Claude Code loads the configuration

**Then** both rules SHALL be active

**And** project rules SHALL take precedence if conflicts exist

### Requirement: Template Selection

Users SHALL be able to choose templates during installation.

#### Scenario: Template selection via sync tool

**Given** a user runs `./sync.sh install`

**When** no template is specified

**Then** the tool SHALL default to `minimal` template

**And** the tool SHALL display a message about available templates

#### Scenario: Explicit template selection

**Given** a user runs `./sync.sh install nextjs-trpc`

**When** the command executes

**Then** the tool SHALL install the nextjs-trpc template

**And** the tool SHALL copy template-specific files

**And** the tool SHALL display success message mentioning the chosen template

#### Scenario: Invalid template selection

**Given** a user runs `./sync.sh install nonexistent`

**When** the command executes

**Then** the tool SHALL display an error "Template 'nonexistent' not found"

**And** the tool SHALL list available templates

**And** the tool SHALL exit with code 1

### Requirement: Template Customization

Projects SHALL be able to extend templates with project-specific configuration.

#### Scenario: Adding project-specific commands

**Given** a project installed with nextjs-trpc template

**When** the user creates `.claude/commands/seed-db.md`

**Then** the command SHALL be available alongside global commands

**And** the command SHALL not be overwritten by `./sync.sh update`

**And** the command SHALL be promotable to global with `./sync.sh promote`

#### Scenario: Adding project-specific skills

**Given** a project installed with nextjs-trpc template

**When** the user creates `.claude/skills/project-patterns/custom-auth.md`

**Then** the skill SHALL be loadable with `@skill project-patterns/custom-auth`

**And** the skill SHALL coexist with global skills

**And** the skill SHALL not be overwritten by `./sync.sh update`

## Cross-References

- **Related to**: Sync Tool (sync tool installs templates)
- **Related to**: Agent System (templates reference agents)
- **Related to**: Skill Library (templates include skill directories)
- **Related to**: Hook Validation (templates include settings.json with hooks)
