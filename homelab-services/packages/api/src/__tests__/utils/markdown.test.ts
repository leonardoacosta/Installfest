import { describe, it, expect } from 'vitest';
import { parseProposalMd, parseTasksMd, parseDesignMd, serializeTasksMd } from '../../utils/markdown';

describe('parseProposalMd', () => {
  it('should parse valid proposal.md', () => {
    const content = `# Change: Add OpenSpec Sync

## Why

We need bidirectional sync.

## What Changes

Adding sync service.

## Impact

Affects database and API.
`;

    const result = parseProposalMd(content);

    expect(result.title).toBe('Add OpenSpec Sync');
    expect(result.why).toContain('bidirectional sync');
    expect(result.whatChanges).toContain('sync service');
    expect(result.impact).toContain('database and API');
  });

  it('should throw on missing title', () => {
    const content = `## Why\nContent`;
    expect(() => parseProposalMd(content)).toThrow('Missing title');
  });

  it('should throw on missing Why section', () => {
    const content = `# Change: Test\n## What Changes\nContent`;
    expect(() => parseProposalMd(content)).toThrow('Missing "Why" section');
  });
});

describe('parseTasksMd', () => {
  it('should parse tasks with checkboxes', () => {
    const content = `# Implementation Tasks

## 1. Database Schema
- [ ] 1.1 Create openspecSpecs table
  - [ ] Add id field
  - [x] Add projectId field
- [x] 1.2 Create syncHistory table

## 2. Services
- [ ] 2.1 Implement sync service
`;

    const result = parseTasksMd(content);

    expect(result.tasks).toHaveLength(3);
    expect(result.tasks[0].id).toBe('1.1');
    expect(result.tasks[0].completed).toBe(false);
    expect(result.tasks[0].subtasks).toHaveLength(2);
    expect(result.tasks[0].subtasks?.[0].completed).toBe(false);
    expect(result.tasks[0].subtasks?.[1].completed).toBe(true);
    expect(result.tasks[1].id).toBe('1.2');
    expect(result.tasks[1].completed).toBe(true);
  });

  it('should handle tasks without subtasks', () => {
    const content = `- [ ] 1.1 Simple task`;
    const result = parseTasksMd(content);

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].subtasks).toEqual([]);
  });
});

describe('parseDesignMd', () => {
  it('should parse design.md with sections', () => {
    const content = `# Design

## Context
This is context.

## Goals
- Goal 1
- Goal 2

## Decisions
Decision content.
`;

    const result = parseDesignMd(content);

    expect(result.content).toBe(content);
    expect(result.sections).toHaveLength(3);
    expect(result.sections?.[0].title).toBe('Context');
    expect(result.sections?.[0].content).toContain('This is context');
  });
});

describe('serializeTasksMd', () => {
  it('should serialize tasks back to markdown', () => {
    const tasks = {
      tasks: [
        {
          id: '1.1',
          title: 'Task one',
          completed: false,
          subtasks: [
            { id: '1.1.1', title: 'Subtask one', completed: true },
          ],
        },
        {
          id: '1.2',
          title: 'Task two',
          completed: true,
          subtasks: [],
        },
      ],
    };

    const markdown = serializeTasksMd(tasks);

    expect(markdown).toContain('- [ ] 1.1 Task one');
    expect(markdown).toContain('  - [x] Subtask one');
    expect(markdown).toContain('- [x] 1.2 Task two');
  });
});
