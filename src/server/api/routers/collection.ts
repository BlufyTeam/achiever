// server/api/routers/collection.ts
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const collectionRouter = createTRPCRouter({
  // 1. Create Collection
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        image: z.string().optional(),
        ownerId: z.string(),
        medalIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.collection.create({
        data: {
          name: input.name,
          description: input.description,
          image: input.image,
          ownerId: input.ownerId,
          medals: {
            create:
              input.medalIds?.map((id) => ({
                medal: { connect: { id } },
              })) || [],
          },
        },
      });
    }),

  // 2. Get All Collections
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.collection.findMany({
      include: {
        medals: {
          include: { medal: true },
        },
        owner: true,
        trackedBy: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // 3. Get Collection By ID
  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.db.collection.findUnique({
      where: { id: input },
      include: {
        medals: {
          include: { medal: true },
        },
        owner: true,
        trackedBy: true,
      },
    });
  }),

  // 4. Update Collection
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        image: z.string().optional(),
        medalIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // 1. Update collection info
      const updatedCollection = await ctx.db.collection.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          image: input.image,
        },
      });

      // 2. Update medals via join table (if medals are passed)
      if (input.medalIds) {
        // Delete old relations
        await ctx.db.collectionMedal.deleteMany({
          where: {
            collectionId: input.id,
          },
        });

        // Create new relations
        await ctx.db.collectionMedal.createMany({
          data: input.medalIds.map((medalId) => ({
            collectionId: input.id,
            medalId,
          })),
        });
      }

      return updatedCollection;
    }),

  // 5. Delete Collection
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.collection.delete({ where: { id: input.id } });
      return { ok: true };
    }),
});
