import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { Prisma } from "@prisma/client";

export const userMedalRouter = createTRPCRouter({
  getUserMedals: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        offset: z.number().min(0).default(0),
        limit: z.number().min(1).max(100).default(10),
        search: z.string().optional(),
        category: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const where: any = { userId: input.userId };
      if (input.search) {
        where.medal = { name: { contains: input.search, mode: "insensitive" } };
      }
      if (input.category) {
        where.medal = {
          ...where.medal,
          categories: { some: { category: { name: input.category } } },
        };
      }

      const userMedals = await ctx.db.userMedal.findMany({
        where,
        skip: input.offset,
        take: input.limit,
        select: {
          medal: {
            include: {
              categories: {
                include: { category: true },
              },
              tasks: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                },
              },
            },
          },
          earnedAt: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      });

      const medalCount = await ctx.db.userMedal.count({ where });

      return {
        medals: userMedals.map((um) => ({
          medal: {
            id: um.medal.id,
            name: um.medal.name,
            description: um.medal.description,
            image: um.medal.image,
            categories: um.medal.categories,
            tasks: um.medal.tasks,
          },
          earnedAt: um.earnedAt,
          sortOrder: um.sortOrder,
        })),
        medalCount,
      };
    }),

  addUserMedal: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        medalId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const medalCount = await ctx.db.userMedal.count({
        where: { userId: input.userId },
      });

      return ctx.db.userMedal.create({
        data: {
          userId: input.userId,
          medalId: input.medalId,
          sortOrder: medalCount,
        },
      });
    }),

  updateUserMedal: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        medalId: z.string(),
        earnedAt: z.date(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.userMedal.update({
        where: {
          userId_medalId: {
            userId: input.userId,
            medalId: input.medalId,
          },
        },
        data: {
          earnedAt: input.earnedAt,
        },
      });
    }),

  updateMedalOrder: protectedProcedure
    .input(
      z.array(
        z.object({
          userId: z.string(),
          medalId: z.string(),
          sortOrder: z.number(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = input[0]?.userId;
      if (!userId || input.some((item) => item.userId !== userId)) {
        throw new Error("All medals must belong to the same user");
      }
      if (ctx.session.user.id !== userId) {
        throw new Error("Unauthorized to update another user's medal order");
      }

      return ctx.db.$transaction(
        input.map((item) =>
          ctx.db.userMedal.update({
            where: {
              userId_medalId: { userId: item.userId, medalId: item.medalId },
            },
            data: { sortOrder: item.sortOrder },
          }),
        ),
      );
    }),

  deleteUserMedal: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        medalId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.id !== input.userId) {
        throw new Error("Unauthorized to delete another user's medal");
      }

      return ctx.db.$transaction(async (tx) => {
        await tx.userMedalVouch.deleteMany({
          where: {
            userId: input.userId,
            medalId: input.medalId,
          },
        });

        await tx.userMedal.delete({
          where: {
            userId_medalId: {
              userId: input.userId,
              medalId: input.medalId,
            },
          },
        });
      });
    }),

  getVouches: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        medalId: z.string(),
        offset: z.number().min(0).default(0),
        limit: z.number().min(1).max(100).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const vouches = await ctx.db.userMedalVouch.findMany({
        where: {
          userId: input.userId,
          medalId: input.medalId,
        },
        skip: input.offset,
        take: input.limit,
        select: {
          id: true,
          userId: true,
          medalId: true,
          createdAt: true,
          vouchedById: true,
          vouchedBy: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const vouchCount = await ctx.db.userMedalVouch.count({
        where: {
          userId: input.userId,
          medalId: input.medalId,
        },
      });

      return { vouches, vouchCount };
    }),

  addVouch: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        medalId: z.string(),
        vouchedById: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.userMedalVouch.create({
        data: {
          userId: input.userId,
          medalId: input.medalId,
          vouchedById: input.vouchedById,
        },
      });
    }),

  updateVouch: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      throw new Error("No updatable fields available for vouch.");
    }),

  deleteVouch: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const deletedVouch = await ctx.db.userMedalVouch.delete({
        where: { id: input.id },
      });
      return deletedVouch;
    }),

  getUserMedalById: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        medalId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userMedal = await ctx.db.userMedal.findUnique({
        where: {
          userId_medalId: {
            userId: input.userId,
            medalId: input.medalId,
          },
        },
        select: {
          medal: {
            include: {
              categories: {
                include: { category: true },
              },
              tasks: true,
            },
          },
          earnedAt: true,
          sortOrder: true,
        },
      });

      if (!userMedal) {
        throw new Error("User medal not found");
      }

      return {
        medal: userMedal.medal,
        earnedAt: userMedal.earnedAt,
        sortOrder: userMedal.sortOrder,
      };
    }),

  getUserMedalStatus: publicProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
        medalId: z.string().cuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userId, medalId } = input;
      const userMedal = await ctx.db.userMedal.findUnique({
        where: {
          userId_medalId: {
            userId: userId,
            medalId: medalId,
          },
        },
        select: {
          earnedAt: true,
        },
      });

      return !!userMedal;
    }),
});
