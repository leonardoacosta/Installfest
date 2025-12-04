import { describe, it, expect, beforeEach } from 'bun:test';
import { db, workQueue, openspecSpecs, projects } from '@homelab/db';
import { WorkQueueService } from '../services/work-queue';
import { eq } from 'drizzle-orm';

describe('WorkQueueService', () => {
  let service: WorkQueueService;
  let testProjectId: number;
  let testSpecId: string;

  beforeEach(async () => {
    service = new WorkQueueService(db);

    // Clean up test data
    await db.delete(workQueue).execute();
    await db.delete(openspecSpecs).execute();
    await db.delete(projects).execute();

    // Create test project
    const [project] = await db
      .insert(projects)
      .values({
        name: 'Test Project',
        path: '/test/path',
      })
      .returning();
    testProjectId = project!.id;

    // Create test spec
    testSpecId = '1-test-spec';
    await db.insert(openspecSpecs).values({
      id: testSpecId,
      projectId: testProjectId,
      title: 'Test Spec',
      status: 'approved',
      proposalContent: 'This is a PERSISTENT error that needs fixing',
    });
  });

  describe('addToQueue', () => {
    it('should add approved spec to queue', async () => {
      const item = await service.addToQueue(testProjectId, testSpecId);

      expect(item).toBeDefined();
      expect(item.specId).toBe(testSpecId);
      expect(item.projectId).toBe(testProjectId);
      expect(item.status).toBe('queued');
      expect(item.position).toBe(0);
    });

    it('should reject non-approved specs', async () => {
      // Create non-approved spec
      const draftSpecId = '2-draft-spec';
      await db.insert(openspecSpecs).values({
        id: draftSpecId,
        projectId: testProjectId,
        title: 'Draft Spec',
        status: 'proposing',
      });

      await expect(service.addToQueue(testProjectId, draftSpecId)).rejects.toThrow();
    });

    it('should assign position correctly for multiple items', async () => {
      const spec2Id = '2-test-spec';
      await db.insert(openspecSpecs).values({
        id: spec2Id,
        projectId: testProjectId,
        title: 'Test Spec 2',
        status: 'approved',
      });

      const item1 = await service.addToQueue(testProjectId, testSpecId);
      const item2 = await service.addToQueue(testProjectId, spec2Id);

      expect(item1.position).toBe(0);
      expect(item2.position).toBe(1);
    });
  });

  describe('calculatePriority', () => {
    it('should assign priority 5 for PERSISTENT errors', async () => {
      const spec = {
        proposalContent: 'This is a PERSISTENT error that needs fixing',
        addedAt: new Date(),
      };

      const priority = service.calculatePriority(spec);
      expect(priority).toBe(5);
    });

    it('should assign priority 4 for RECURRING errors', async () => {
      const spec = {
        proposalContent: 'This is a RECURRING error',
        addedAt: new Date(),
      };

      const priority = service.calculatePriority(spec);
      expect(priority).toBe(4);
    });

    it('should assign priority 3 for FLAKY errors', async () => {
      const spec = {
        proposalContent: 'This is a FLAKY error',
        addedAt: new Date(),
      };

      const priority = service.calculatePriority(spec);
      expect(priority).toBe(3);
    });

    it('should assign priority 2 for NEW errors', async () => {
      const spec = {
        proposalContent: 'This is a NEW error',
        addedAt: new Date(),
      };

      const priority = service.calculatePriority(spec);
      expect(priority).toBe(2);
    });

    it('should add age bonus correctly', async () => {
      // Spec added 14 days ago (2 weeks)
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const spec = {
        proposalContent: 'This is a FLAKY error',
        addedAt: twoWeeksAgo,
      };

      const priority = service.calculatePriority(spec);
      expect(priority).toBe(5); // 3 (base) + 2 (age bonus) = 5
    });
  });

  describe('getQueue', () => {
    it('should return items sorted by priority and position', async () => {
      // Create multiple specs with different priorities
      const specs = [
        { id: '2-low-priority', priority: 2 },
        { id: '3-high-priority', priority: 5 },
        { id: '4-medium-priority', priority: 3 },
      ];

      for (const spec of specs) {
        await db.insert(openspecSpecs).values({
          id: spec.id,
          projectId: testProjectId,
          title: `Spec ${spec.id}`,
          status: 'approved',
        });
      }

      // Add items to queue with explicit priorities
      await service.addToQueue(testProjectId, testSpecId, 3);
      await service.addToQueue(testProjectId, '2-low-priority', 2);
      await service.addToQueue(testProjectId, '3-high-priority', 5);
      await service.addToQueue(testProjectId, '4-medium-priority', 3);

      const queue = await service.getQueue(testProjectId);

      // Should be sorted by priority DESC, then position ASC
      expect(queue[0]?.priority).toBe(5);
      expect(queue[queue.length - 1]?.priority).toBe(2);
    });
  });

  describe('blockWorkItem', () => {
    it('should block work item with dependency', async () => {
      const item = await service.addToQueue(testProjectId, testSpecId);

      // Create blocker spec
      const blockerSpecId = '2-blocker';
      await db.insert(openspecSpecs).values({
        id: blockerSpecId,
        projectId: testProjectId,
        title: 'Blocker Spec',
        status: 'in_progress',
      });

      await service.blockWorkItem(item.id, blockerSpecId);

      const updated = await db
        .select()
        .from(workQueue)
        .where(eq(workQueue.id, item.id))
        .get();

      expect(updated?.status).toBe('blocked');
      expect(updated?.blockedBy).toBe(blockerSpecId);
    });

    it('should not block if blocker is already applied', async () => {
      const item = await service.addToQueue(testProjectId, testSpecId);

      // Create blocker spec that's already applied
      const blockerSpecId = '2-blocker';
      await db.insert(openspecSpecs).values({
        id: blockerSpecId,
        projectId: testProjectId,
        title: 'Blocker Spec',
        status: 'applied',
      });

      await service.blockWorkItem(item.id, blockerSpecId);

      const updated = await db
        .select()
        .from(workQueue)
        .where(eq(workQueue.id, item.id))
        .get();

      // Should remain queued since blocker is already applied
      expect(updated?.status).toBe('queued');
    });
  });

  describe('checkAndUnblockDependents', () => {
    it('should unblock dependent items when blocker completes', async () => {
      // Create blocker spec
      const blockerSpecId = '2-blocker';
      await db.insert(openspecSpecs).values({
        id: blockerSpecId,
        projectId: testProjectId,
        title: 'Blocker Spec',
        status: 'approved',
      });

      const item = await service.addToQueue(testProjectId, testSpecId);
      await service.blockWorkItem(item.id, blockerSpecId);

      // Unblock dependents
      await service.checkAndUnblockDependents(blockerSpecId);

      const updated = await db
        .select()
        .from(workQueue)
        .where(eq(workQueue.id, item.id))
        .get();

      expect(updated?.status).toBe('queued');
      expect(updated?.blockedBy).toBeNull();
    });
  });

  describe('reorderQueue', () => {
    it('should update positions correctly', async () => {
      // Create multiple items
      const spec2Id = '2-test-spec';
      const spec3Id = '3-test-spec';

      await db.insert(openspecSpecs).values([
        {
          id: spec2Id,
          projectId: testProjectId,
          title: 'Test Spec 2',
          status: 'approved',
        },
        {
          id: spec3Id,
          projectId: testProjectId,
          title: 'Test Spec 3',
          status: 'approved',
        },
      ]);

      const item1 = await service.addToQueue(testProjectId, testSpecId);
      const item2 = await service.addToQueue(testProjectId, spec2Id);
      const item3 = await service.addToQueue(testProjectId, spec3Id);

      // Reorder: swap first and last
      await service.reorderQueue(testProjectId, [
        { workItemId: item3.id, newPosition: 0 },
        { workItemId: item2.id, newPosition: 1 },
        { workItemId: item1.id, newPosition: 2 },
      ]);

      const reordered = await service.getQueue(testProjectId);

      expect(reordered[0]?.id).toBe(item3.id);
      expect(reordered[2]?.id).toBe(item1.id);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      // Create multiple items with different statuses
      const specs = [
        { id: '2-queued', status: 'queued' },
        { id: '3-assigned', status: 'assigned' },
        { id: '4-blocked', status: 'blocked' },
        { id: '5-completed', status: 'completed' },
      ];

      for (const spec of specs) {
        await db.insert(openspecSpecs).values({
          id: spec.id,
          projectId: testProjectId,
          title: `Spec ${spec.id}`,
          status: 'approved',
        });
      }

      await service.addToQueue(testProjectId, testSpecId, 5); // queued
      await service.addToQueue(testProjectId, '2-queued', 4); // queued

      const item3 = await service.addToQueue(testProjectId, '3-assigned', 3);
      await db
        .update(workQueue)
        .set({ status: 'assigned' })
        .where(eq(workQueue.id, item3.id));

      const item4 = await service.addToQueue(testProjectId, '4-blocked', 2);
      await db
        .update(workQueue)
        .set({ status: 'blocked' })
        .where(eq(workQueue.id, item4.id));

      const item5 = await service.addToQueue(testProjectId, '5-completed', 1);
      await db
        .update(workQueue)
        .set({ status: 'completed' })
        .where(eq(workQueue.id, item5.id));

      const stats = await service.getStats(testProjectId);

      expect(stats.totalQueued).toBe(2);
      expect(stats.totalAssigned).toBe(1);
      expect(stats.totalBlocked).toBe(1);
      expect(stats.totalCompleted).toBe(1);
      expect(stats.highestPriority).toBe(5);
    });
  });
});
