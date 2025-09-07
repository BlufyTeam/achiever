import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { userRouter } from "./routers/users";
import { medalRouter } from "./routers/medals";
import { categoryRouter } from "./routers/category";
import { userMedalRouter } from "./routers/userMedal";
import { collectionRouter } from "./routers/collection";
import { giftRouter } from "./routers/gift";
import { followRouter } from "./routers/follow";
import { userTaskRouter } from "./routers/userTask";
import { trackedMedalRouter } from "./routers/trackedMedal";
import { trackedCollectionRouter } from "./routers/trackedCollection";
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  medals: medalRouter,
  category: categoryRouter,
  userMedal: userMedalRouter,
  collection: collectionRouter,
  gift: giftRouter,
  follow: followRouter,
  userTask: userTaskRouter,
  trackMedal: trackedMedalRouter,
  trackCollection: trackedCollectionRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
