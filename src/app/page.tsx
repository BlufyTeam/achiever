import { getServerAuthSession } from "~/server/auth/config";
import { api } from "~/trpc/server";

export default async function Home() {
  const session = await getServerAuthSession();
  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#cc7135] to-[#15162c] text-white"></main>
  );
}
