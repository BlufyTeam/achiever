// server/api/routers/gift.ts
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { GiftStatus } from "@prisma/client";

export const giftRouter = createTRPCRouter({
  // Send a medal to another user
  giftMedal: protectedProcedure
    .input(
      z.object({
        medalId: z.string(),
        giftedToId: z.string(),
        message: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { medalId, giftedToId, message } = input;
      const giftedById = ctx.session.user.id;

      if (giftedToId === giftedById) {
        throw new Error("You cannot gift a medal to yourself.");
      }

      const existing = await ctx.db.giftedMedal.findUnique({
        where: {
          giftedToId_medalId: {
            giftedToId,
            medalId,
          },
        },
      });

      if (existing) {
        throw new Error("You already sent this medal to this user.");
      }

      return ctx.db.giftedMedal.create({
        data: {
          medalId,
          giftedById,
          giftedToId,
          message,
          status: GiftStatus.PENDING,
        },
      });
    }),

  // Get all medals received (pending)
  getReceivedGifts: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return ctx.db.giftedMedal.findMany({
      where: {
        giftedToId: userId,
        status: GiftStatus.PENDING,
      },
      include: {
        medal: true,
        giftedBy: { select: { id: true, username: true, image: true } },
      },
    });
  }),

  // Get all medals sent by user
  getSentGifts: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return ctx.db.giftedMedal.findMany({
      where: {
        giftedById: userId,
      },
      include: {
        medal: true,
        giftedTo: { select: { id: true, username: true, image: true } },
      },
    });
  }),

  // Accept a gift and turn it into a UserMedal
  acceptGift: protectedProcedure
    .input(z.object({ giftId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const gift = await ctx.db.giftedMedal.findUnique({
        where: { id: input.giftId },
      });

      if (!gift) throw new Error("Gift not found.");
      if (gift.giftedToId !== userId)
        throw new Error("You are not authorized to accept this gift.");
      if (gift.status !== GiftStatus.PENDING)
        throw new Error("Gift is no longer pending.");

      // Create UserMedal if not already exists
      const alreadyHasMedal = await ctx.db.userMedal.findUnique({
        where: {
          userId_medalId: {
            userId,
            medalId: gift.medalId,
          },
        },
      });

      if (!alreadyHasMedal) {
        await ctx.db.userMedal.create({
          data: {
            userId,
            medalId: gift.medalId,
            earnedAt: new Date(),
            giftedById: gift.giftedById,
          },
        });
      }

      return ctx.db.giftedMedal.update({
        where: { id: input.giftId },
        data: {
          status: GiftStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      });
    }),

  // Reject a gift
  rejectGift: protectedProcedure
    .input(z.object({ giftId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const gift = await ctx.db.giftedMedal.findUnique({
        where: { id: input.giftId },
      });

      if (!gift) throw new Error("Gift not found.");
      if (gift.giftedToId !== userId)
        throw new Error("You are not authorized to reject this gift.");
      if (gift.status !== GiftStatus.PENDING)
        throw new Error("Gift is no longer pending.");

      return ctx.db.giftedMedal.update({
        where: { id: input.giftId },
        data: {
          status: GiftStatus.REJECTED,
        },
      });
    }),
  getAllGiftedMedals: publicProcedure
    .input(
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        user: z.string().optional(), // username of either sender or receiver
        sort: z.enum(["asc", "desc"]).default("desc"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { from, to, user, sort } = input;

      return ctx.db.giftedMedal.findMany({
        where: {
          AND: [
            from ? { createdAt: { gte: new Date(from) } } : {},
            to ? { createdAt: { lte: new Date(to) } } : {},
            user
              ? {
                  OR: [
                    {
                      giftedBy: {
                        username: { contains: user, mode: "insensitive" },
                      },
                    },
                    {
                      giftedTo: {
                        username: { contains: user, mode: "insensitive" },
                      },
                    },
                  ],
                }
              : {},
          ],
        },
        include: {
          giftedBy: true,
          giftedTo: true,
          medal: true,
        },
        orderBy: {
          createdAt: sort,
        },
      });
    }),
});
