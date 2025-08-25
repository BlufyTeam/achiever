import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { Prisma } from "@prisma/client";

const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters.")
  .max(30, "Username must be at most 30 characters.")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Only letters, numbers, and underscore are allowed.",
  );

export const userRouter = createTRPCRouter({
  // Existing endpoints...

  signup: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email."),
        username: usernameSchema,
        password: z.string().min(6, "Password must be at least 6 characters."),
        name: z.string(),
        image: z.string().optional(),
        role: z.enum(["USER", "ADMIN"]).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { email, username, password, name, image, role = "USER" } = input;

      const existingByEmail = await ctx.db.user.findUnique({
        where: { email },
      });
      if (existingByEmail) throw new Error("Email is already in use.");

      const existingByUsername = await ctx.db.user.findUnique({
        where: { username },
      });
      if (existingByUsername) throw new Error("Username is already taken.");

      const hashedPassword = await bcrypt.hash(password, 10);
      const defaultImageUrl = "/images/default.png";

      const user = await ctx.db.user.create({
        data: {
          email,
          username,
          name,
          password: hashedPassword,
          image: image ?? defaultImageUrl,
          role,
        },
      });

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        image: user.image,
        role: user.role,
      };
    }),

  updateUser: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        username: usernameSchema.optional(),
        currentPassword: z.string().optional(),
        newPassword: z.string().min(6).optional(),
        image: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { name, email, username, currentPassword, newPassword, image } =
        input;
      const userId = ctx.session.user.id;

      const existingUser = await ctx.db.user.findUnique({
        where: { id: userId },
      });
      if (!existingUser) throw new Error("User not found.");

      // Password change flow
      if (newPassword) {
        if (!currentPassword) throw new Error("Current password is required.");
        const passwordMatch = await bcrypt.compare(
          currentPassword,
          existingUser.password ?? "",
        );
        if (!passwordMatch) throw new Error("Current password is incorrect.");

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await ctx.db.user.update({
          where: { id: userId },
          data: { password: hashedPassword },
        });
      }

      // Uniqueness checks if changing email/username
      if (email && email !== existingUser.email) {
        const emailHolder = await ctx.db.user.findUnique({ where: { email } });
        if (emailHolder && emailHolder.id !== userId) {
          throw new Error("Email is already in use.");
        }
      }

      if (username && username !== existingUser.username) {
        const userHolder = await ctx.db.user.findUnique({
          where: { username },
        });
        if (userHolder && userHolder.id !== userId) {
          throw new Error("Username is already taken.");
        }
      }

      const updatedUser = await ctx.db.user.update({
        where: { id: userId },
        data: { name, email, username, image },
      });

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        name: updatedUser.name,
        image: updatedUser.image,
        role: updatedUser.role,
      };
    }),

  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return ctx.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        role: true,
      },
    });
  }),

  // ✅ Get All Users (now includes username)
  getAllUsers: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        role: true,
      },
    });
  }),

  // ✅ Get User by ID, Username, or Name
  getUser: publicProcedure
    .input(
      z.object({
        id: z.string().optional(),
        username: z.string().optional(),
        name: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { id, username, name } = input;

      if (!id && !username && !name) {
        throw new Error("Provide at least one of: id, username, or name.");
      }

      return ctx.db.user.findFirst({
        where: {
          OR: [
            ...(id ? [{ id }] : []),
            ...(username ? [{ username }] : []), // exact match since it's unique
            ...(name
              ? [
                  {
                    name: {
                      contains: name,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                ]
              : []),
          ],
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          image: true,
          role: true,
        },
      });
    }),

  deleteUser: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.user.delete({ where: { id: input.id } });
      return { success: true };
    }),

  updateUserByAdmin: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        username: usernameSchema.optional(),
        password: z.string().min(6).optional(),
        image: z.string().optional(),
        role: z.enum(["USER", "ADMIN"]).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, name, email, username, password, image, role } = input;

      // Uniqueness checks for admin updates (if provided)
      if (email) {
        const holder = await ctx.db.user.findUnique({ where: { email } });
        if (holder && holder.id !== id)
          throw new Error("Email is already in use.");
      }
      if (username) {
        const holder = await ctx.db.user.findUnique({ where: { username } });
        if (holder && holder.id !== id)
          throw new Error("Username is already taken.");
      }

      const dataToUpdate: Partial<{
        name: string;
        email: string;
        username: string;
        password: string;
        image: string;
        role: "USER" | "ADMIN";
      }> = {};

      if (name) dataToUpdate.name = name;
      if (email) dataToUpdate.email = email;
      if (username) dataToUpdate.username = username;
      if (image) dataToUpdate.image = image;
      if (role) dataToUpdate.role = role;
      if (password) {
        dataToUpdate.password = await bcrypt.hash(password, 10);
      }

      const updatedUser = await ctx.db.user.update({
        where: { id },
        data: dataToUpdate,
      });

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        name: updatedUser.name,
        image: updatedUser.image,
        role: updatedUser.role,
      };
    }),
});
