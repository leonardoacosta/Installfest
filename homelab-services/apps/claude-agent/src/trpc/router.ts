import { router } from './init';
import { projectsRouter } from '../routers/projects';
import { sessionsRouter } from '../routers/sessions';
import { hooksRouter } from '../routers/hooks';

export const appRouter = router({
  projects: projectsRouter,
  sessions: sessionsRouter,
  hooks: hooksRouter,
});

export type AppRouter = typeof appRouter;
