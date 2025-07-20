"use client";
import { useSession } from "next-auth/react";
import { useEffect, useId, useState } from "react";
import { useFormik } from "formik";
import { z } from "zod";
import Cardview from "../_components/origin/cardview";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { LoaderCircleIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import ErrorLabel from "../_components/origin/ErrorLabel";
import Link from "next/link";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

// ✅ Zod schema with password match validation
const signupSchema = z
  .object({
    email: z.string().email("Invalid email"),
    name: z.string().min(2, "Name is too short"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

// ✅ Helper function for Formik validation
const validateWithZod = (schema: typeof signupSchema) => (values: any) => {
  const result = schema.safeParse(values);
  if (result.success) return {};
  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path[0];
    if (path) errors[path] = issue.message;
  });
  return errors;
};

export default function SignupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isWrong, setIsWrong] = useState(false);
  const id = useId();

  const toggleVisibility = () => setIsVisible((prev) => !prev);

  const signupMutation = api.signup.signup.useMutation({
    onSuccess: (data) => {
      console.log("Signup successful:", data);
      setIsWrong(false);
      router.push("/login");
    },
    onError: (error) => {
      console.error(error);
      setIsWrong(true);
    },
  });

  const formik = useFormik({
    initialValues: {
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
    },
    validate: validateWithZod(signupSchema),
    onSubmit: async (values, { setSubmitting }) => {
      signupMutation.mutate({
        email: values.email,
        password: values.password,
        name: values.name,
      });
      setSubmitting(false);
    },
  });

  return (
    <div className="flex h-full w-full items-center justify-center">
      <Cardview>
        <div className="mb-5 flex justify-center">
          <h1 className="text-2xl">SignUp</h1>
        </div>

        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-2">
          <ErrorLabel msg="Something went wrong" show={isWrong} />

          <Label htmlFor={`${id}-email`}>Email</Label>
          <Input
            id={`${id}-email`}
            name="email"
            type="email"
            placeholder="Email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.email && formik.errors.email && (
            <ErrorLabel msg={formik.errors.email} show />
          )}

          <Label htmlFor={`${id}-name`}>Name</Label>
          <Input
            id={`${id}-name`}
            name="name"
            type="text"
            placeholder="Name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.name && formik.errors.name && (
            <ErrorLabel msg={formik.errors.name} show />
          )}

          <Label htmlFor={`${id}-password`}>Password</Label>
          <div className="relative">
            <Input
              id={`${id}-password`}
              name="password"
              type={isVisible ? "text" : "password"}
              placeholder="Password"
              className="pe-9"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <button
              type="button"
              onClick={toggleVisibility}
              className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px]"
              aria-label={isVisible ? "Hide password" : "Show password"}
            >
              {isVisible ? (
                <EyeOffIcon size={16} aria-hidden="true" />
              ) : (
                <EyeIcon size={16} aria-hidden="true" />
              )}
            </button>
          </div>
          {formik.touched.password && formik.errors.password && (
            <ErrorLabel msg={formik.errors.password} show />
          )}

          <Label htmlFor={`${id}-confirmPassword`}>Confirm Password</Label>
          <Input
            id={`${id}-confirmPassword`}
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.confirmPassword && formik.errors.confirmPassword && (
            <ErrorLabel msg={formik.errors.confirmPassword} show />
          )}

          <Button
            type="submit"
            disabled={formik.isSubmitting}
            className="mt-5 min-h-12 w-full rounded-full"
          >
            {formik.isSubmitting || status === "loading" ? (
              <LoaderCircleIcon
                className="-ms-1 animate-spin"
                size={16}
                aria-hidden="true"
              />
            ) : null}
            Submit
          </Button>
        </form>

        <div className="mt-2 flex">
          <p>Already have an account?</p>
          <Link href={"/login"} className="ml-1 text-blue-500">
            Login
          </Link>
        </div>
      </Cardview>
    </div>
  );
}
