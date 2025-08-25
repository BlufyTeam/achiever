import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const trackedMedalRouter = createTRPCRouter({
  // Track a medal for the current user
  trackMedal: protectedProcedure
    .input(
      z.object({
        medalId: z.string().cuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { medalId } = input;

      // Use upsert to handle the unique constraint gracefully.
      // If the record exists, it does nothing; if not, it creates it.
      return ctx.db.trackedMedal.upsert({
        where: {
          userId_medalId: {
            userId: userId,
            medalId: medalId,
          },
        },
        update: {},
        create: {
          userId: userId,
          medalId: medalId,
        },
      });
    }),

  // Untrack a medal for the current user
  untrackMedal: protectedProcedure
    .input(
      z.object({
        medalId: z.string().cuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { medalId } = input;

      // Delete the tracked medal record based on the composite key.
      return ctx.db.trackedMedal.delete({
        where: {
          userId_medalId: {
            userId: userId,
            medalId: medalId,
          },
        },
      });
    }),

  // Get all medals a specific user is tracking
  getTrackedMedals: publicProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userId } = input;

      // Find all tracked medals for the user and include the full medal details with tasks
      const trackedMedals = await ctx.db.trackedMedal.findMany({
        where: { userId },
        include: {
          medal: {
            include: {
              tasks: true, // <-- add tasks here
            },
          },
        },
      });

      return trackedMedals;
    }),

  // Check if a specific medal is being tracked by a user
  isTracked: publicProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
        medalId: z.string().cuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userId, medalId } = input;

      // Look for a specific tracked medal record.
      const trackedMedal = await ctx.db.trackedMedal.findUnique({
        where: {
          userId_medalId: {
            userId: userId,
            medalId: medalId,
          },
        },
      });

      // Return a boolean indicating its existence.
      return !!trackedMedal;
    }),
});
