import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

//const prisma = new PrismaClient(); // this is wrong!!! use the ctx built in to the trpc

//
export const signupRouter = createTRPCRouter({
  signup: publicProcedure
    .input(
      z.object({
        email: z.string(),
        password: z.string(),
        name: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { email, password, name } = input;
      console.log("here" + input);
      // const existing = await prisma.user.findUnique({ where: { email } }); wrong, use ctx.db instead
      const existing = await ctx.db.user.findUnique({ where: { email } });
      if (existing) {
        throw new Error("Email is already in use.");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await ctx.db.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
        },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
      };
    }),
});
