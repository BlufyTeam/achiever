"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect } from "react";

export default function explore() {
  const { data: session, status } = useSession();
  const handleSubmit = async () => {
    const res = await signIn("Credentials", {
      email: "sepehrni@yahoo.com",
      password: "123456",
    });
  };

  useEffect(() => {
    //console.log(status);
  }, [status]);

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (status === "authenticated") {
    return <p>Welcome, {session.user?.email}</p>;
  }

  return <p onClick={() => handleSubmit()}>You are not logged in</p>;
}
