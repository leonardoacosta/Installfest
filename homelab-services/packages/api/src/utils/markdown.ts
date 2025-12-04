import type { ProposalMarkdown, TaskItem, TasksMarkdown, DesignMarkdown } from '@repo/validators';

/**
 * Parse proposal.md markdown file
 * Expected structure:
 * # Change: <title>
 * ## Why
 * <content>
 * ## What Changes
 * <content>
 * ## Impact
 * <content>
 */
export function parseProposalMd(content: string): ProposalMarkdown {
  try {
    // Extract title from first heading
    const titleMatch = content.match(/^#\s+Change:\s+(.+?)$/m);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract "Why" section
    const whyMatch = content.match(/##\s+Why\s*\n([\s\S]*?)(?=\n##|$)/i);
    const why = whyMatch ? whyMatch[1].trim() : '';

    // Extract "What Changes" section
    const whatMatch = content.match(/##\s+What Changes\s*\n([\s\S]*?)(?=\n##|$)/i);
    const whatChanges = whatMatch ? whatMatch[1].trim() : '';

    // Extract "Impact" section
    const impactMatch = content.match(/##\s+Impact\s*\n([\s\S]*?)(?=\n##|$)/i);
    const impact = impactMatch ? impactMatch[1].trim() : '';

    if (!title) {
      throw new Error('Missing title in proposal.md (expected "# Change: <title>")');
    }
    if (!why) {
      throw new Error('Missing "Why" section in proposal.md');
    }
    if (!whatChanges) {
      throw new Error('Missing "What Changes" section in proposal.md');
    }
    if (!impact) {
      throw new Error('Missing "Impact" section in proposal.md');
    }

    return { title, why, whatChanges, impact };
  } catch (error) {
    throw new Error(`Failed to parse proposal.md: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse tasks.md markdown file with checkbox detection
 * Expected structure:
 * ## 1. Section Name
 * - [ ] 1.1 Task title
 *   - [ ] Subtask title
 * - [x] 1.2 Completed task
 */
export function parseTasksMd(content: string): TasksMarkdown {
  try {
    const tasks: TaskItem[] = [];

    // Match all task lines with checkboxes
    const taskRegex = /^-\s+\[([ xX])\]\s+(\d+(?:\.\d+)?)\s+(.+?)$/gm;
    let match;

    const lines = content.split('\n');
    let currentTask: TaskItem | null = null;

    for (const line of lines) {
      // Main task pattern (e.g., "- [ ] 1.1 Task title")
      const taskMatch = line.match(/^-\s+\[([ xX])\]\s+(\d+(?:\.\d+)?)\s+(.+?)$/);
      if (taskMatch) {
        const [, checkbox, id, title] = taskMatch;
        currentTask = {
          id,
          title: title.trim(),
          completed: checkbox.toLowerCase() === 'x',
          subtasks: [],
        };
        tasks.push(currentTask);
        continue;
      }

      // Subtask pattern (e.g., "  - [ ] Subtask title")
      const subtaskMatch = line.match(/^\s{2,}-\s+\[([ xX])\]\s+(.+?)$/);
      if (subtaskMatch && currentTask) {
        const [, checkbox, title] = subtaskMatch;
        if (!currentTask.subtasks) {
          currentTask.subtasks = [];
        }
        currentTask.subtasks.push({
          id: `${currentTask.id}.${(currentTask.subtasks.length + 1)}`,
          title: title.trim(),
          completed: checkbox.toLowerCase() === 'x',
        });
      }
    }

    return { tasks };
  } catch (error) {
    throw new Error(`Failed to parse tasks.md: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse design.md markdown file
 * Flexible structure, extracts sections by ## headings
 */
export function parseDesignMd(content: string): DesignMarkdown {
  try {
    const sections: { title: string; content: string }[] = [];

    // Split by ## headings
    const parts = content.split(/^##\s+(.+?)$/gm);

    // First part is before any heading (if any)
    if (parts.length > 1) {
      for (let i = 1; i < parts.length; i += 2) {
        const title = parts[i].trim();
        const sectionContent = parts[i + 1]?.trim() || '';
        sections.push({ title, content: sectionContent });
      }
    }

    return { content, sections };
  } catch (error) {
    throw new Error(`Failed to parse design.md: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Serialize tasks back to markdown format
 */
export function serializeTasksMd(tasks: TasksMarkdown): string {
  let markdown = '# Implementation Tasks\n\n';

  tasks.tasks.forEach((task, idx) => {
    const checkbox = task.completed ? 'x' : ' ';
    markdown += `- [${checkbox}] ${task.id} ${task.title}\n`;

    if (task.subtasks && task.subtasks.length > 0) {
      task.subtasks.forEach((subtask) => {
        const subCheckbox = subtask.completed ? 'x' : ' ';
        markdown += `  - [${subCheckbox}] ${subtask.title}\n`;
      });
    }

    // Add spacing between main tasks (but not after last one)
    if (idx < tasks.tasks.length - 1) {
      markdown += '\n';
    }
  });

  return markdown;
}
