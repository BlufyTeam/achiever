"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useId, useState } from "react";
import Cardview from "../_components/origin/cardview";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { LoaderCircleIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import ErrorLabel from "../_components/origin/ErrorLabel";
import Link from "next/link";
import { api } from "~/trpc/react";

export default function SignupPage() {
  const { data: session, status } = useSession();
  const [Email, setEmail] = useState("");
  const [Password, setPassword] = useState("");
  const [Name, setName] = useState("");
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isWorng, setIsWrong] = useState<boolean>(false);

  const toggleVisibility = () => setIsVisible((prevState) => !prevState);
  const id = useId();
  const signupMutation = api.signup.signup.useMutation({
    onSuccess: (data) => {
      console.log("Signup successful:", data);
      setIsWrong(false);
    },
    onError: (error) => {
      console.log(error);
      setIsWrong(true);
    },
  });

  const handleSubmit = async () => {
    signupMutation.mutate({
      email: Email,
      password: Password,
      name: Name,
    });
  };

  useEffect(() => {
    console.log(session);
  }, [session]);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <Cardview>
        <div className="mb-5 flex justify-center">
          <h1 className="text-2xl">SignUp</h1>
        </div>

        <ErrorLabel msg="Something went wrong" show={isWorng}></ErrorLabel>
        <Label htmlFor={id}>Email</Label>
        <Input
          onChange={(value) => {
            setEmail("" + value.target.value);
          }}
          id={id}
          placeholder="Email"
          type="email"
        />
        <div>
          <Label htmlFor={id}>Name</Label>
          <Input
            onChange={(value) => {
              setName("" + value.target.value);
            }}
            id={id}
            placeholder="Name"
            type="text"
          />
        </div>

        <div className="mt-5 *:not-first:mt-2">
          <Label htmlFor={id}>Password</Label>
          <div className="relative mt-2">
            <Input
              className="pe-9"
              onChange={(value) => {
                setPassword("" + value.target.value);
              }}
              id={id}
              placeholder="Password"
              type={isVisible ? "text" : "password"}
            />
            <button
              className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={toggleVisibility}
              aria-label={isVisible ? "Hide password" : "Show password"}
              aria-pressed={isVisible}
              aria-controls="password"
            >
              {isVisible ? (
                <EyeOffIcon size={16} aria-hidden="true" />
              ) : (
                <EyeIcon size={16} aria-hidden="true" />
              )}
            </button>
          </div>
          <Input
            className="pe-9"
            onChange={(value) => {}}
            id={id}
            placeholder="Confirm Password"
            type="password"
          />
        </div>

        <div className="mt-10 flex w-full justify-center">
          <Button
            onClick={() => {
              handleSubmit();
            }}
            className="min-h-12 w-full rounded-full"
          >
            {status === "loading" ? (
              <LoaderCircleIcon
                className="-ms-1 animate-spin"
                size={16}
                aria-hidden="true"
              />
            ) : null}
            Submit
          </Button>
        </div>
        <div className="mt-2 flex">
          <p>Already have an account?</p>
          <Link href={"/login"} className="text-blue-500">
            Login
          </Link>
        </div>
      </Cardview>
    </div>
  );
}
