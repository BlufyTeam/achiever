import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const userTaskRouter = createTRPCRouter({
  // Mark a task as completed for the current user
  markTaskAsCompleted: protectedProcedure
    .input(
      z.object({
        taskId: z.string().cuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { taskId } = input;

      return ctx.db.userTask.upsert({
        where: {
          userId_taskId: {
            userId: userId,
            taskId: taskId,
          },
        },
        update: {},
        create: {
          userId: userId,
          taskId: taskId,
        },
      });
    }),

  // Unmark a task as completed for the current user
  unmarkTaskAsCompleted: protectedProcedure
    .input(
      z.object({
        taskId: z.string().cuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { taskId } = input;

      return ctx.db.userTask.delete({
        where: {
          userId_taskId: {
            userId: userId,
            taskId: taskId,
          },
        },
      });
    }),

  // Get all completed tasks for a specific user and medal
  getCompletedTasksForMedal: publicProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
        medalId: z.string().cuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userId, medalId } = input;

      const medalTasks = await ctx.db.task.findMany({
        where: { medalId: medalId },
        select: { id: true },
      });
      const taskIds = medalTasks.map((task) => task.id);

      const completedUserTasks = await ctx.db.userTask.findMany({
        where: {
          userId: userId,
          taskId: { in: taskIds },
        },
        select: {
          taskId: true,
          completedAt: true,
        },
      });

      return { completedTasks: completedUserTasks };
    }),

  // NEW: Get completed task count for a user across multiple medals
  getCompletedTasksCountByMedal: publicProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
        medalIds: z.array(z.string().cuid()),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userId, medalIds } = input;

      const completedTasks = await ctx.db.userTask.findMany({
        where: {
          userId: userId,
          task: {
            medalId: { in: medalIds },
          },
        },
        include: {
          task: {
            select: { medalId: true },
          },
        },
      });

      // Map completed tasks to a count per medal ID
      const completedTasksCountByMedal: Record<string, number> = {};
      for (const task of completedTasks) {
        const medalId = task.task.medalId;
        completedTasksCountByMedal[medalId] =
          (completedTasksCountByMedal[medalId] || 0) + 1;
      }

      return completedTasksCountByMedal;
    }),

  // Check if a single task is completed by a user
  isTaskCompleted: publicProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
        taskId: z.string().cuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userId, taskId } = input;
      const userTask = await ctx.db.userTask.findUnique({
        where: {
          userId_taskId: {
            userId: userId,
            taskId: taskId,
          },
        },
      });

      return !!userTask;
    }),
});
