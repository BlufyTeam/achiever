"use client";
import { signIn, useSession } from "next-auth/react";
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
import { useRouter } from "next/navigation";

// ✅ Zod schema
const loginSchema = z.object({
  identifier: z.string().min(1, "Enter your username or email"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

// ✅ Helper to use Zod with Formik
const validateWithZod = (schema: typeof loginSchema) => (values: any) => {
  const result = schema.safeParse(values);
  if (result.success) return {};
  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path[0];
    if (path) errors[path] = issue.message;
  });
  return errors;
};

export default function LoginPage() {
  const { status } = useSession();
  const [isVisible, setIsVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // State for network errors
  const id = useId();
  const router = useRouter();

  const toggleVisibility = () => setIsVisible((p) => !p);

  const formik = useFormik({
    initialValues: {
      identifier: "",
      password: "",
    },
    validate: validateWithZod(loginSchema),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const res = await signIn("credentials", {
          identifier: values.identifier,
          password: values.password,
          redirect: false,
        });

        if (res?.error) {
          setErrorMessage("Invalid username or password. Please try again.");
        } else {
          setErrorMessage(null);
          router.push("/");
        }
      } catch (error) {
        // Handle network or unexpected errors
        setErrorMessage(
          "Failed to connect to the server. Please check your internet connection and try again.",
        );
        console.error("Sign-in error:", error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Optional: Clear error message after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Cardview>
        <div className="mb-5 flex justify-center">
          <h1 className="text-2xl">Login</h1>
        </div>

        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-2">
          {/* Display network or auth error */}
          <ErrorLabel msg={"" + errorMessage} show={!!errorMessage} />

          <Label htmlFor={`${id}-identifier`}>Username or Email</Label>
          <Input
            id={`${id}-identifier`}
            name="identifier"
            type="text"
            placeholder="username or email"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.identifier}
            autoComplete="username"
          />
          {formik.touched.identifier && formik.errors.identifier && (
            <ErrorLabel msg={formik.errors.identifier} show />
          )}

          <Label htmlFor={`${id}-password`}>Password</Label>
          <div className="relative">
            <Input
              id={`${id}-password`}
              name="password"
              type={isVisible ? "text" : "password"}
              placeholder="Password"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.password}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={toggleVisibility}
              className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px]"
              aria-label={isVisible ? "Hide password" : "Show password"}
            >
              {isVisible ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
            </button>
          </div>
          {formik.touched.password && formik.errors.password && (
            <ErrorLabel msg={formik.errors.password} show />
          )}

          <Button
            type="submit"
            disabled={formik.isSubmitting}
            className="mt-5 min-h-12 w-full rounded-full"
          >
            {formik.isSubmitting || status === "loading" ? (
              <LoaderCircleIcon className="-ms-1 animate-spin" size={16} />
            ) : null}
            Login
          </Button>
        </form>

        <div className="mt-2 flex">
          <p>Do not have an account?</p>
          <Link href={"/signup"} className="ml-1 text-blue-500">
            Signup
          </Link>
        </div>
      </Cardview>
    </div>
  );
}
