// server/api/routers/trackedCollection.ts
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const trackedCollectionRouter = createTRPCRouter({
  // Get all tracked collections of a user
  getUserTrackedCollections: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.trackedCollection.findMany({
        where: { userId: input.userId },
        include: {
          collection: {
            include: {
              medals: {
                include: { medal: true }, // still keep medals
              },
              owner: true, // <-- add this line
            },
          },
        },
        orderBy: { startedAt: "desc" },
      });
    }),

  // Track a collection
  trackCollection: protectedProcedure
    .input(z.object({ userId: z.string(), collectionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.trackedCollection.create({
        data: {
          userId: input.userId,
          collectionId: input.collectionId,
        },
      });
    }),

  // Untrack a collection
  untrackCollection: protectedProcedure
    .input(z.object({ userId: z.string(), collectionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.trackedCollection.delete({
        where: {
          userId_collectionId: {
            userId: input.userId,
            collectionId: input.collectionId,
          },
        },
      });
    }),

  // Check if a user is tracking a collection
  isTracking: protectedProcedure
    .input(z.object({ userId: z.string(), collectionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const tracked = await ctx.db.trackedCollection.findUnique({
        where: {
          userId_collectionId: {
            userId: input.userId,
            collectionId: input.collectionId,
          },
        },
      });
      return !!tracked;
    }),
});
