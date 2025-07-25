import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { signupRouter } from "./routers/signup";
import { medalRouter } from "./routers/medals";
import { categoryRouter } from "./routers/category";
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  signup: signupRouter,
  medals: medalRouter,
  category: categoryRouter,
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
