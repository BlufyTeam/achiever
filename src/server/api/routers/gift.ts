import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

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
        },
      });
    }),

  // Get all medals received (only pending)
  getReceivedGifts: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return ctx.db.giftedMedal.findMany({
      where: { giftedToId: userId },
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
      where: { giftedById: userId },
      include: {
        medal: true,
        giftedTo: { select: { id: true, username: true, image: true } },
      },
    });
  }),

  // Accept a gift (creates UserMedal, then deletes the gift)
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

      // Delete the gift after acceptance
      await ctx.db.giftedMedal.delete({
        where: { id: input.giftId },
      });

      return { success: true };
    }),

  // Reject a gift (just deletes it)
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

      await ctx.db.giftedMedal.delete({
        where: { id: input.giftId },
      });

      return { success: true };
    }),

  // Sender can cancel (delete) their own pending gift
  deleteGift: protectedProcedure
    .input(z.object({ giftId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const gift = await ctx.db.giftedMedal.findUnique({
        where: { id: input.giftId },
      });

      if (!gift) throw new Error("Gift not found.");
      if (gift.giftedById !== userId)
        throw new Error("You are not authorized to delete this gift.");

      return ctx.db.giftedMedal.delete({
        where: { id: input.giftId },
      });
    }),

  // Get all gifted medals (for public logs/admins)
  getAllGiftedMedals: publicProcedure
    .input(
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        user: z.string().optional(),
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
        orderBy: { createdAt: sort },
      });
    }),
});
