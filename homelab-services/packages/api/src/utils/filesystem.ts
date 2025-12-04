import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync, statSync } from 'fs';

/**
 * Read OpenSpec file with error handling
 */
export async function readOpenSpecFile(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Write OpenSpec file with atomic write and backup
 */
export async function writeOpenSpecFile(filePath: string, content: string): Promise<void> {
  try {
    // Create backup if file exists
    if (existsSync(filePath)) {
      await backupFile(filePath);
    }

    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // Atomic write: write to temp file, then rename
    const tempPath = `${filePath}.tmp`;
    await fs.writeFile(tempPath, content, 'utf-8');
    await fs.rename(tempPath, filePath);
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get file modification time
 */
export function getFileMtime(filePath: string): Date {
  try {
    const stats = statSync(filePath);
    return stats.mtime;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    throw new Error(`Failed to get mtime for ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create backup copy of file
 */
export async function backupFile(filePath: string): Promise<void> {
  try {
    const backupPath = `${filePath}.bak`;
    await fs.copyFile(filePath, backupPath);
  } catch (error) {
    throw new Error(`Failed to backup file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if file exists
 */
export function fileExists(filePath: string): boolean {
  return existsSync(filePath);
}

/**
 * Read all OpenSpec files for a spec
 */
export async function readOpenSpecFiles(
  openspecPath: string,
  specId: string
): Promise<{
  proposalContent: string | null;
  tasksContent: string | null;
  designContent: string | null;
  proposalPath: string;
  tasksPath: string;
  designPath: string;
}> {
  const changeDir = path.join(openspecPath, 'changes', specId);

  const proposalPath = path.join(changeDir, 'proposal.md');
  const tasksPath = path.join(changeDir, 'tasks.md');
  const designPath = path.join(changeDir, 'design.md');

  let proposalContent: string | null = null;
  let tasksContent: string | null = null;
  let designContent: string | null = null;

  // Proposal is required
  if (!fileExists(proposalPath)) {
    throw new Error(`Proposal file not found: ${proposalPath}`);
  }
  proposalContent = await readOpenSpecFile(proposalPath);

  // Tasks is required
  if (!fileExists(tasksPath)) {
    throw new Error(`Tasks file not found: ${tasksPath}`);
  }
  tasksContent = await readOpenSpecFile(tasksPath);

  // Design is optional
  if (fileExists(designPath)) {
    designContent = await readOpenSpecFile(designPath);
  }

  return {
    proposalContent,
    tasksContent,
    designContent,
    proposalPath,
    tasksPath,
    designPath,
  };
}

/**
 * Write all OpenSpec files for a spec
 */
export async function writeOpenSpecFiles(
  openspecPath: string,
  specId: string,
  data: {
    proposalContent?: string;
    tasksContent?: string;
    designContent?: string;
  }
): Promise<string[]> {
  const changeDir = path.join(openspecPath, 'changes', specId);
  const filesChanged: string[] = [];

  if (data.proposalContent !== undefined) {
    const proposalPath = path.join(changeDir, 'proposal.md');
    await writeOpenSpecFile(proposalPath, data.proposalContent);
    filesChanged.push(proposalPath);
  }

  if (data.tasksContent !== undefined) {
    const tasksPath = path.join(changeDir, 'tasks.md');
    await writeOpenSpecFile(tasksPath, data.tasksContent);
    filesChanged.push(tasksPath);
  }

  if (data.designContent !== undefined && data.designContent !== null) {
    const designPath = path.join(changeDir, 'design.md');
    await writeOpenSpecFile(designPath, data.designContent);
    filesChanged.push(designPath);
  }

  return filesChanged;
}
