# Otaku Odyssey - Claude Code Configuration

Hybrid OpenSpec + Claude-flow configuration for multi-month convention management system development.

## Quick Start

```bash
# 1. Copy this configuration to your project
cp -r .claude/ /path/to/otaku-odyssey/.claude/
cp CLAUDE.md /path/to/otaku-odyssey/CLAUDE.md

# 2. Install claude-flow MCP server (configured in settings.json)
# It will auto-install on first use via npx

# 3. Initialize OpenSpec (if not already done)
npx openspec init
```

## File Structure

```
otaku-odyssey/
├── CLAUDE.md                      # Project context, conventions, domain knowledge
├── sync.sh                        # Cross-project config management script
└── .claude/
    ├── settings.json              # Hooks, permissions, MCP servers
    ├── commands/
    │   ├── apply-batch.md         # Parallel execution with validation gates
    │   ├── archive.md             # Archive with knowledge capture
    │   ├── store-context.md       # Persist context before /clear
    │   ├── resume.md              # Resume from stored context
    │   └── recall.md              # Retrieve learnings from past specs
    ├── skills/
    │   ├── trpc-conventions/      # tRPC router patterns
    │   │   └── SKILL.md
    │   ├── drizzle-patterns/      # Drizzle schema patterns
    │   │   └── SKILL.md
    │   └── otaku-domain/          # Convention management domain
    │       └── SKILL.md
    └── agents/
        └── manager.md             # Task orchestrator agent
```

## Workflow

### 1. Propose a Feature (Same as Before)

```
> /openspec:proposal Add hotel partnership management with group rates and booking coordination
```

### 2. Refine with Parallel Groups (NEW)

```
> Let's update the spec to include room block tracking

> Before we finalize, organize tasks.md into parallel execution groups
```

Tasks should be organized as:
- **Group 1: Foundation** - Schemas, types, migrations (no dependencies)
- **Group 2: API Layer** - Routers, validations (depends on Group 1)
- **Group 3: UI Layer** - Components, pages (depends on Group 2)
- **Group 4: Tests** - Unit, integration tests (depends on Group 3)

### 3. Store Context Before Clearing (NEW)

```
> /store-context hotel-partnership
> /clear
```

This persists planning context to claude-flow memory, surviving `/clear` and session restarts.

### 4. Apply with Batch Execution (CHANGED)

```
> /apply-batch hotel-partnership
```

This replaces your old apply command. It:
- Executes each parallel group in a single batch message
- Validates after each phase (`pnpm build`, `pnpm tsc`)
- Automatically spawns fix agents if validation fails
- Uses SubagentStop hooks to catch incomplete work

### 5. Archive with Knowledge Capture (ENHANCED)

```
> /archive hotel-partnership
```

This stores learnings for future reference:
- Patterns used
- Issues encountered
- Files created
- Execution stats

### 6. Resume Interrupted Work (NEW)

```
> /resume hotel-partnership
```

Loads stored context and shows where you left off.

### 7. Recall Past Learnings (NEW)

```
> /recall sponsors
```

View learnings from completed features to inform similar work.

## Hooks Configured

| Hook | Purpose |
|------|---------|
| SessionStart | Log session start time |
| PreToolUse (Bash) | Block unsafe git commands |
| PreToolUse (Write) | Block modifications to sensitive files |
| PostToolUse (Write) | Auto-run TypeScript check, ESLint, Prettier |
| SubagentStop | Validate agent completed all tasks |
| Stop | Check for incomplete work before ending |
| PreCompact | Log context compaction |

## Skills Available

### trpc-conventions
Patterns for tRPC routers including:
- CRUD procedure templates
- Pagination patterns
- Error handling
- Client usage

### drizzle-patterns
Patterns for Drizzle ORM including:
- Table definitions
- Relations (one-to-many, many-to-many)
- Migration workflow
- Query patterns

### otaku-domain
Convention management domain knowledge:
- Applicant workflows (attendees, vendors, sponsors, etc.)
- Pricing logic
- Business rules
- Schema relationships

## Cross-Project Management

Use `sync.sh` to manage configuration across projects:

```bash
# Install global config
./sync.sh install

# Initialize new project with template
./sync.sh init nextjs-trpc

# Promote project command to global
./sync.sh promote commands/my-new-command.md

# Check status
./sync.sh status
```

## Key Differences from Native Workflow

| Aspect | Native | Hybrid |
|--------|--------|--------|
| Planning | Ad-hoc in tasks.md | Explicit parallel groups |
| Execution | Sequential agents | Batch parallel in single message |
| Validation | Manual build checks | Automatic gates + SubagentStop hooks |
| Memory | Lost on /clear | Persists in claude-flow SQLite |
| Learnings | None | Stored and recallable |
| Resume | Start over | Continue from stored state |

## Troubleshooting

### Claude-flow not loading
Check that MCP server is configured in settings.json and npx can reach npm.

### SubagentStop blocking everything
Check the prompt in settings.json - it may be too strict. Adjust completion criteria.

### Hooks running slowly
PostToolUse hooks run in parallel, but TypeScript checking can be slow. Consider increasing timeout or running only on specific file patterns.

### Context not persisting
Ensure `.swarm/` directory is created and writable. Check claude-flow memory path in settings.json.

## Customization

### Adding a new skill
```bash
mkdir .claude/skills/my-skill
# Create SKILL.md with YAML frontmatter + patterns
```

### Adding a new command
```bash
# Create .claude/commands/my-command.md
# Use $ARGUMENTS for user input
```

### Adding a new agent
```bash
# Create .claude/agents/my-agent.md
# Define identity, capabilities, execution protocol
```

### Modifying hooks
Edit `.claude/settings.json` - changes take effect next session.
