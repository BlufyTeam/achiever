"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import NavBar from "../_components/NavBar";
import Sidebar from "../_components/admin/Sidebar";
import CreateCategoryPage from "./_pages/CreateCategories";
import CategoryListPage from "./_pages/CategoriesList";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [selectedPage, setSelectedPage] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "ADMIN") {
      router.push("/");
    }
  }, [session, status]);

  const renderPage = () => {
    switch (selectedPage) {
      case "categories-create":
        return <CreateCategoryPage />;
      case "categories-all":
        return <CategoryListPage />;
      default:
        return <p className="text-5xl text-amber-50">welcome to admin page</p>;
    }
  };

  return (
    <div className="flex h-full w-full">
      <Sidebar onSelect={setSelectedPage} />
      <div className="flex h-full min-h-screen w-full items-start justify-center p-4">
        {renderPage()}
      </div>
    </div>
  );
}
