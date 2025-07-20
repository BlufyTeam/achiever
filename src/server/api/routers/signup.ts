import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const signupRouter = createTRPCRouter({
  signup: publicProcedure
    .input(
      z.object({
        email: z.string(),
        password: z.string(),
        name: z.string(),
        image: z.string().optional(),
        role: z.enum(["USER", "ADMIN"]).optional(), // 👈 optional role override
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { email, password, name, image, role = "USER" } = input;

      const existing = await ctx.db.user.findUnique({ where: { email } });
      if (existing) {
        throw new Error("Email is already in use.");
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const defaultImageUrl = "/images/default.png";

      const user = await ctx.db.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          image: image ?? defaultImageUrl,
          role, // 👈 add role
        },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role, // 👈 return role
      };
    }),

  updateUser: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        currentPassword: z.string().optional(),
        newPassword: z.string().min(6).optional(),
        image: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { name, email, currentPassword, newPassword, image } = input;
      const userId = ctx.session.user.id;

      const existingUser = await ctx.db.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        throw new Error("User not found.");
      }

      // Handle password change
      if (newPassword) {
        if (!currentPassword) {
          throw new Error("Current password is required to change password.");
        }

        const passwordMatch = await bcrypt.compare(
          currentPassword,
          existingUser.password ?? "",
        );

        if (!passwordMatch) {
          throw new Error("Current password is incorrect.");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await ctx.db.user.update({
          where: { id: userId },
          data: { password: hashedPassword },
        });
      }

      // Update name, email, image
      const updatedUser = await ctx.db.user.update({
        where: { id: userId },
        data: {
          name,
          email,
          image,
        },
      });

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        image: updatedUser.image,
        role: updatedUser.role, // 👈 include role
      };
    }),

  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return ctx.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true, // 👈 include role
      },
    });
  }),
});
