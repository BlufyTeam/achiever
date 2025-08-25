import ProfilePageClient from "./MainPage"; // Rename your existing component

export default function UserProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const { username } = params;

  if (!username) {
    return <div>User not found.</div>;
  }

  // Pass the username to your existing client component
  return <ProfilePageClient username={username} />;
}
