"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect } from "react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const handleSubmit = async () => {
    const res = await signIn("credentials", {
      email: "sepehrni@yahoo.com",
      password: "123456",
      callbackUrl: "",
      redirect: false,
    });
  };

  useEffect(() => {
    //console.log(status);
  }, [status]);

  if (status === "loading") return "loading...";
  return (
    <div>
      {status === "unauthenticated" && (
        <button
          type="button"
          className="cursor-pointer rounded-md bg-black px-5 py-2 text-white"
          onClick={() => handleSubmit()}
        >
          Log in
        </button>
      )}
      {status === "authenticated" && <p>Hi {session.user.email}</p>}
      {status === "authenticated" && (
        <button
          type="button"
          className="cursor-pointer rounded-md bg-red-500 px-5 py-2 text-white"
          onClick={() => signOut()}
        >
          Log out
        </button>
      )}
    </div>
  );
}
