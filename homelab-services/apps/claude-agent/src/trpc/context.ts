import { getDb, type Db } from '@homelab/db';

export function createContext(opts: { req: Request; res: any }) {
  const db = getDb();

  return {
    db,
    req: opts.req,
    res: opts.res,
  };
}

export type Context = {
  db: Db;
  req: Request;
  res: any;
};
