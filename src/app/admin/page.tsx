"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Sidebar from "../_components/admin/Sidebar";
import CategoryListPage from "./_pages/CategoriesList";
import { useRouter } from "next/navigation";
import CreateMedalPage from "./_pages/CreateMedal";
import MedalsPage from "./_pages/Medals";
import CreateUserPage from "./_pages/CreateUser";
import UsersPage from "./_pages/Users";
import CollectionsPage from "./_pages/collections";
import GiftListPage from "./_pages/gifts";

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
      case "categories-all":
        return <CategoryListPage />;
      case "medals-create":
        return <CreateMedalPage />;
      case "medals-all":
        return <MedalsPage />;
      case "users-all":
        return <UsersPage />;
      case "collection":
        return <CollectionsPage />;
      case "gifts":
        return <GiftListPage></GiftListPage>;
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
