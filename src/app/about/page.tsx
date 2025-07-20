"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect } from "react";
import NavBar from "../_components/NavBar";
import TabBar from "../_components/TabBar";

export default function About() {
  return (
    <div>
      <NavBar></NavBar>
      <TabBar></TabBar>
    </div>
  );
}
