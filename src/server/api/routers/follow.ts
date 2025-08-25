import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const followRouter = createTRPCRouter({
  // Follow a user
  followUser: protectedProcedure
    .input(z.object({ followingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const followerId = ctx.session.user.id;

      if (followerId === input.followingId) {
        throw new Error("You cannot follow yourself.");
      }

      return ctx.db.follow.create({
        data: {
          followerId,
          followingId: input.followingId,
        },
      });
    }),

  // Unfollow a user
  unfollowUser: protectedProcedure
    .input(z.object({ followingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const followerId = ctx.session.user.id;

      return ctx.db.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId: input.followingId,
          },
        },
      });
    }),

  // Get followers of a user
  getFollowers: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.follow.findMany({
        where: { followingId: input.userId },
        include: {
          follower: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      });
    }),

  // Get following of a user
  getFollowing: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.follow.findMany({
        where: { followerId: input.userId },
        include: {
          following: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      });
    }),

  // Check if logged-in user is following a user
  isFollowing: protectedProcedure
    .input(z.object({ userId: z.string() })) // the user to check against
    .query(async ({ ctx, input }) => {
      const followerId = ctx.session.user.id;

      const follow = await ctx.db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId: input.userId,
          },
        },
      });

      return !!follow;
    }),
});
