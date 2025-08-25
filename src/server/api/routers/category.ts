import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const categoryRouter = createTRPCRouter({
  // Get all categories
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.category.findMany({
      include: {
        medals: {
          include: { medal: true },
        },
      },
    });
  }),

  // Create a new category
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        image: z.string().url().optional(), // ✅ Add image input
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.category.create({
        data: {
          name: input.name,
          image: input.image ?? null, // ✅ Set image if provided
        },
      });
    }),

  // Update a category
  update: publicProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string().min(1),
        image: z.string().url().optional(), // ✅ Add image input
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.category.update({
        where: { id: input.id },
        data: {
          name: input.name,
          image: input.image ?? null, // ✅ Update image
        },
      });
    }),

  // Delete a category
  delete: publicProcedure
    .input(
      z.object({
        id: z.string().cuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.category.delete({
        where: { id: input.id },
      });
    }),
});
