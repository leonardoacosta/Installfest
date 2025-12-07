# Capability: Sync Tool

## Overview

Command-line tool for managing Claude Code configuration distribution between central repository and satellite projects.

## ADDED Requirements

### Requirement: Configuration Installation

The sync tool SHALL copy Claude Code configuration from central repository to satellite projects.

#### Scenario: Install with template selection

**Given** a user is in a new project directory

**When** the user runs `./sync.sh install nextjs-trpc`

**Then** the tool SHALL create a `.claude/` directory structure

**And** the tool SHALL copy the nextjs-trpc template CLAUDE.md

**And** the tool SHALL copy all global agents to `.claude/agents/`

**And** the tool SHALL copy all global commands to `.claude/commands/`

**And** the tool SHALL copy template-specific skills to `.claude/skills/`

**And** the tool SHALL create an empty `.claude/settings.local.json` file

**And** the tool SHALL update `.gitignore` with `.claude/settings.local.json`

#### Scenario: Install without overwriting existing config

**Given** a project already has a `.claude/` directory

**When** the user runs `./sync.sh install minimal`

**Then** the tool SHALL backup existing `.claude/` to timestamped directory

**And** the tool SHALL merge `settings.json` instead of overwriting

**And** the tool SHALL preserve existing `.claude/settings.local.json`

**And** the tool SHALL not overwrite project-specific commands or skills

### Requirement: Configuration Updates

The sync tool SHALL refresh project configuration from central repository.

#### Scenario: Update configuration

**Given** a project has Claude Code configuration installed

**When** the user runs `./sync.sh update`

**Then** the tool SHALL detect differences between project and central config

**And** the tool SHALL display a summary of changes

**And** the tool SHALL prompt for confirmation before updating

**And** the tool SHALL create a backup before making changes

**And** the tool SHALL copy updated global files (agents, commands)

**And** the tool SHALL merge updated settings.json

**And** the tool SHALL preserve settings.local.json

### Requirement: Configuration Promotion

The sync tool SHALL copy useful project-specific patterns back to central repository.

#### Scenario: Promote command to global

**Given** a project has a custom command at `.claude/commands/review-db.md`

**When** the user runs `./sync.sh promote .claude/commands/review-db.md`

**Then** the tool SHALL copy the file to central repo at `$INSTALLFEST_PATH/.claude/commands/review-db.md`

**And** the tool SHALL display a git commit message to run manually

**And** the tool SHALL remind the user to push changes to share with other projects

#### Scenario: Promote skill to global

**Given** a project has a custom skill at `.claude/skills/custom-patterns/api-versioning.md`

**When** the user runs `./sync.sh promote .claude/skills/custom-patterns/api-versioning.md`

**Then** the tool SHALL copy the file to central repo preserving directory structure

**And** the tool SHALL create the skill directory if it doesn't exist

### Requirement: Configuration Drift Detection

The sync tool SHALL identify differences between project and central configuration.

#### Scenario: Check status

**Given** a project has Claude Code configuration

**When** the user runs `./sync.sh status`

**Then** the tool SHALL compare project CLAUDE.md with central CLAUDE.md

**And** the tool SHALL compare project settings.json with central settings.json

**And** the tool SHALL list files that differ

**And** the tool SHALL display counts of commands, skills, and agents

#### Scenario: Show detailed diff

**Given** a project has configuration drift

**When** the user runs `./sync.sh diff`

**Then** the tool SHALL display line-by-line differences for each changed file

**And** the tool SHALL use color-coded output for additions/deletions

### Requirement: Backup Management

The sync tool SHALL create backups before destructive operations.

#### Scenario: Create manual backup

**Given** a user wants to backup current configuration

**When** the user runs `./sync.sh backup`

**Then** the tool SHALL create a timestamped directory at `~/.claude-backup-{YYYYMMDD-HHMMSS}/`

**And** the tool SHALL copy all files from `.claude/` to the backup directory

**And** the tool SHALL dereference symlinks (copy file contents, not links)

**And** the tool SHALL display the backup location

### Requirement: Template Listing

The sync tool SHALL display available project templates.

#### Scenario: List templates

**Given** the central repository has templates defined

**When** the user runs `./sync.sh list-templates`

**Then** the tool SHALL list all templates in `$INSTALLFEST_PATH/.claude/templates/`

**And** the tool SHALL display template names and descriptions

**And** the tool SHALL read descriptions from template README.md files

### Requirement: Error Handling

The sync tool SHALL provide helpful error messages for common failures.

#### Scenario: Central repository not found

**Given** the environment variable $INSTALLFEST_PATH is not set

**And** the default path ~/Personal/Installfest does not exist

**When** the user runs any sync.sh command

**Then** the tool SHALL display an error message "Config repo not found"

**And** the tool SHALL suggest cloning the repository or setting $INSTALLFEST_PATH

**And** the tool SHALL exit with code 1

#### Scenario: Template not found

**Given** a user requests a non-existent template

**When** the user runs `./sync.sh install nonexistent`

**Then** the tool SHALL display "Template 'nonexistent' not found"

**And** the tool SHALL list available templates

**And** the tool SHALL exit with code 1

#### Scenario: Invalid file for promotion

**Given** a user tries to promote a file that doesn't exist

**When** the user runs `./sync.sh promote .claude/commands/missing.md`

**Then** the tool SHALL display "File not found: .claude/commands/missing.md"

**And** the tool SHALL exit with code 1

## Cross-References

- **Related to**: Template System (sync tool installs templates)
- **Related to**: Agent System (sync tool distributes agents)
- **Related to**: Skill Library (sync tool manages skills)
- **Related to**: Hook Validation (sync tool copies hook scripts)
