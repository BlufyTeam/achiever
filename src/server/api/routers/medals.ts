import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const medalRouter = createTRPCRouter({
  // Get all medals
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.medal.findMany({
      include: {
        categories: { include: { category: true } },
      },
    });
  }),

  // Get medals of the logged-in user
  getUserMedals: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const medals = await ctx.db.userMedal.findMany({
      where: { userId },
      include: {
        medal: {
          include: { categories: { include: { category: true } } },
        },
      },
    });

    return medals.map((um) => um.medal);
  }),

  // Get medal by ID
  getById: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      const medal = await ctx.db.medal.findUnique({
        where: { id: input.id },
        include: {
          categories: { include: { category: true } },
          users: { include: { user: true } },
        },
      });

      if (!medal) throw new Error("Medal not found");
      return medal;
    }),

  // Create a medal (admin/public for now)
  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        image: z.string().optional(),
        categoryIds: z.array(z.string().cuid()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { name, description, image, categoryIds = [] } = input;

      return ctx.db.medal.create({
        data: {
          name,
          description,
          image,
          categories: {
            create: categoryIds.map((id) => ({
              category: { connect: { id } },
            })),
          },
        },
      });
    }),

  giveToUser: protectedProcedure
    .input(z.object({ userId: z.string().cuid(), medalId: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new Error("Only admins can give medals");
      }

      const { userId, medalId } = input;

      const alreadyGiven = await ctx.db.userMedal.findUnique({
        where: {
          userId_medalId: {
            userId,
            medalId,
          },
        },
      });

      if (alreadyGiven) {
        throw new Error("User already has this medal");
      }

      return ctx.db.userMedal.create({
        data: {
          user: { connect: { id: userId } },
          medal: { connect: { id: medalId } },
        },
      });
    }),
});
