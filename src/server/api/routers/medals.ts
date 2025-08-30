import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { Prisma, MedalStatus } from "@prisma/client";

const usernameSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[a-zA-Z0-9_]+$/);

export const medalRouter = createTRPCRouter({
  // Get all medals
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.medal.findMany({
      include: {
        categories: { include: { category: true } },
        tasks: true,
        _count: { select: { users: true } },
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
          include: {
            categories: { include: { category: true } },
            tasks: true,
          },
        },
      },
    });

    return medals.map((um) => um.medal);
  }),

  // Get medal by ID
  getMedalById: publicProcedure
    .input(z.object({ medalId: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      const medal = await ctx.db.medal.findUnique({
        where: { id: input.medalId },
        include: {
          categories: { include: { category: true } },
          tasks: true,
        },
      });

      if (!medal) throw new Error("Medal not found");
      return medal;
    }),

  // Create a medal
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        image: z.string().optional(),
        status: z.nativeEnum(MedalStatus).default(MedalStatus.EARNABLE),
        price: z.number().int().positive().optional(),
        categoryIds: z.array(z.string().cuid()).optional(),
        tasks: z
          .array(
            z.object({
              title: z.string().min(1),
              description: z.string().optional(),
            }),
          )
          .optional()
          .default([]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new Error("Only admins can create medals");
      }

      const {
        name,
        description,
        image,
        status,
        price,
        categoryIds = [],
        tasks = [],
      } = input;

      // If medal is GIFT_ONLY or UNAVAILABLE, tasks must not be attached
      if (
        (status === "GIFT_ONLY" || status === "UNAVAILABLE") &&
        tasks.length > 0
      ) {
        throw new Error("This medal type cannot have tasks");
      }

      return ctx.db.medal.create({
        data: {
          name,
          description,
          image,
          status,
          price,
          categories: {
            create: categoryIds.map((id) => ({
              category: { connect: { id } },
            })),
          },
          tasks: {
            create: tasks.map((task) => ({
              title: task.title,
              description: task.description,
            })),
          },
        },
      });
    }),

  // Give medal to user
  giveToUser: protectedProcedure
    .input(
      z
        .object({
          medalId: z.string().cuid(),
          userId: z.string().cuid().optional(),
          username: usernameSchema.optional(),
        })
        .refine((v) => !!v.userId || !!v.username, {
          message: "Provide either userId or username.",
          path: ["userId"],
        }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new Error("Only admins can give medals");
      }

      const { medalId } = input;

      const medal = await ctx.db.medal.findUnique({
        where: { id: medalId },
        select: { status: true },
      });
      if (!medal) throw new Error("Medal not found");

      if (medal.status === "UNAVAILABLE") {
        throw new Error("This medal is unavailable and cannot be given");
      }

      // Resolve userId
      let userId = input.userId ?? null;
      if (!userId && input.username) {
        const user = await ctx.db.user.findUnique({
          where: { username: input.username },
          select: { id: true },
        });
        if (!user) throw new Error("User not found with that username");
        userId = user.id;
      }
      if (!userId) throw new Error("User not found");

      const alreadyGiven = await ctx.db.userMedal.findUnique({
        where: { userId_medalId: { userId, medalId } },
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

  // Delete medal
  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new Error("Only admins can delete medals");
      }

      return ctx.db.$transaction(async (tx) => {
        await tx.userMedal.deleteMany({ where: { medalId: input.id } });
        await tx.categoryMedal.deleteMany({ where: { medalId: input.id } });
        await tx.task.deleteMany({ where: { medalId: input.id } });
        await tx.trackedMedal.deleteMany({ where: { medalId: input.id } });

        return tx.medal.delete({ where: { id: input.id } });
      });
    }),

  // Update medal
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string(),
        description: z.string().optional(),
        image: z.string().optional(),
        status: z.nativeEnum(MedalStatus),
        price: z.number().int().positive().optional().nullable(),
        categoryIds: z.array(z.string().cuid()).default([]),
        tasks: z
          .array(
            z.object({
              title: z.string().min(1),
              description: z.string().optional(),
            }),
          )
          .optional()
          .default([]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new Error("Only admins can update medals");
      }

      const {
        id,
        name,
        description,
        image,
        status,
        price,
        categoryIds,
        tasks,
      } = input;

      // If medal is GIFT_ONLY or UNAVAILABLE, tasks must not be attached
      if (
        (status === "GIFT_ONLY" || status === "UNAVAILABLE") &&
        tasks.length > 0
      ) {
        throw new Error("This medal type cannot have tasks");
      }

      return ctx.db.$transaction(async (tx) => {
        // Fetch existing tasks
        const existingTasks = await tx.task.findMany({
          where: { medalId: id },
          select: { id: true, title: true, description: true },
        });

        // Map existing tasks by title for comparison
        const existingTasksMap = new Map(
          existingTasks.map((task) => [task.title, task]),
        );

        // Prepare tasks to update or create
        const tasksToUpdate = [];
        const tasksToCreate = [];

        for (const inputTask of tasks) {
          const existingTask = existingTasksMap.get(inputTask.title);
          if (existingTask) {
            // Update existing task if description has changed
            if (existingTask.description !== inputTask.description) {
              tasksToUpdate.push({
                where: { id: existingTask.id },
                data: { description: inputTask.description },
              });
            }
            existingTasksMap.delete(inputTask.title); // Remove matched task
          } else {
            // Create new task
            tasksToCreate.push({
              title: inputTask.title,
              description: inputTask.description,
            });
          }
        }

        // Note: We are not deleting unmatched tasks to preserve UserTask records

        // Update categories (delete and recreate as before)
        await tx.categoryMedal.deleteMany({ where: { medalId: id } });

        // Perform updates and creations
        await Promise.all([
          ...tasksToUpdate.map((taskUpdate) => tx.task.update(taskUpdate)),
          tx.task.createMany({
            data: tasksToCreate.map((task) => ({
              ...task,
              medalId: id,
            })),
          }),
        ]);

        // Update the medal
        return tx.medal.update({
          where: { id },
          data: {
            name,
            description,
            image,
            status,
            price,
            categories: {
              create: categoryIds.map((categoryId) => ({
                category: { connect: { id: categoryId } },
              })),
            },
          },
          include: {
            categories: { include: { category: true } },
            tasks: true,
          },
        });
      });
    }),

  // Track medal
  trackMedal: protectedProcedure
    .input(z.object({ medalId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const { medalId } = input;

      const medal = await ctx.db.medal.findUnique({
        where: { id: medalId },
        select: { status: true },
      });
      if (!medal) throw new Error("Medal not found");

      if (medal.status !== "EARNABLE") {
        throw new Error("Only EARNABLE medals can be tracked");
      }

      return ctx.db.trackedMedal.upsert({
        where: {
          userId_medalId: {
            userId: ctx.session.user.id,
            medalId,
          },
        },
        update: {},
        create: { userId: ctx.session.user.id, medalId },
      });
    }),

  // Untrack medal
  untrackMedal: protectedProcedure
    .input(z.object({ medalId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.trackedMedal.delete({
        where: {
          userId_medalId: {
            userId: ctx.session.user.id,
            medalId: input.medalId,
          },
        },
      });
    }),

  // Check tracking
  isTracked: publicProcedure
    .input(z.object({ userId: z.string().cuid(), medalId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const trackedMedal = await ctx.db.trackedMedal.findUnique({
        where: { userId_medalId: input },
      });
      return !!trackedMedal;
    }),
  search: publicProcedure
    .input(z.object({ q: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      return ctx.db.medal.findMany({
        where: {
          name: { contains: input.q, mode: Prisma.QueryMode.insensitive },
        },
        select: {
          id: true,
          name: true,
          image: true,
        },
        take: 5,
      });
    }),
});
