import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { Prisma } from "@prisma/client";

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

  // Get followers of a user with infinite scroll
  getFollowers: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        cursor: z.string().nullish(), // <-- The new cursor, nullable and optional
        limit: z.number().int().min(1).max(100).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userId, cursor, limit } = input;

      const followers = await ctx.db.follow.findMany({
        take: limit + 1, // Fetch one extra to check if there is more data
        where: { followingId: userId },
        cursor: cursor
          ? {
              followerId_followingId: {
                followerId: cursor,
                followingId: userId,
              },
            }
          : undefined,
        orderBy: { createdAt: "desc" },
        select: {
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

      let nextCursor: typeof cursor = undefined;
      if (followers.length > limit) {
        const nextItem = followers.pop(); // Remove the extra item
        nextCursor = nextItem?.follower.id;
      }

      // Get total count of followers to display in the UI
      const totalCount = await ctx.db.follow.count({
        where: { followingId: userId },
      });

      return {
        followers,
        totalCount,
        nextCursor,
      };
    }),

  // Get following of a user with infinite scroll
  getFollowing: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        cursor: z.string().nullish(),
        limit: z.number().int().min(1).max(100).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userId, cursor, limit } = input;

      const following = await ctx.db.follow.findMany({
        take: limit + 1,
        where: { followerId: userId },
        cursor: cursor
          ? {
              followerId_followingId: {
                followerId: userId,
                followingId: cursor,
              },
            }
          : undefined,
        orderBy: { createdAt: "desc" },
        select: {
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

      let nextCursor: typeof cursor = undefined;
      if (following.length > limit) {
        const nextItem = following.pop();
        nextCursor = nextItem?.following.id;
      }

      const totalCount = await ctx.db.follow.count({
        where: { followerId: userId },
      });

      return {
        following,
        totalCount,
        nextCursor,
      };
    }),

  // Check if logged-in user is following a user
  isFollowing: protectedProcedure
    .input(z.object({ userId: z.string() }))
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
