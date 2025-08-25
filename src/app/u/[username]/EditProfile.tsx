"use client";

import { useState, useRef, useEffect, type ChangeEvent } from "react";
import { Pen } from "lucide-react";
import { api } from "~/trpc/react";
import ErrorLabel from "../../_components/origin/ErrorLabel";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useIsMobile } from "../../Utils/useIsMobile";
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

type UpdateState = {
  onUpdateSuccess: () => void;
  mode: string;
};
export default function EditProfilePage({
  onUpdateSuccess,
  mode,
}: UpdateState) {
  const isMobile = useIsMobile();
  const updateUser = api.user.updateUser.useMutation();
  const {
    data: userData,
    isLoading: isUserLoading,
    refetch,
  } = api.user.getCurrentUser.useQuery();

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState<string>(
    "/images/default.png",
  );

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackType, setFeedbackType] = useState<"error" | "success">(
    "success",
  );

  const [usernameError, setUsernameError] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userData) {
      setUsername(userData.username ?? "");
      setName(userData.name ?? "");
      setEmail(userData.email ?? "");
      setProfileImage(userData.image || "/images/default.png");
    }
  }, [userData]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfileImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  const handleProfileUpdate = async () => {
    setFeedbackMsg("");
    setUsernameError("");

    // Client-side username guard (mirrors server rules)
    if (username && !USERNAME_REGEX.test(username)) {
      setUsernameError(
        "Username must be 3–30 chars (letters, numbers, underscore).",
      );
      return;
    }

    if (newPassword && newPassword !== confirmNewPassword) {
      setFeedbackType("error");
      setFeedbackMsg("New password and confirmation do not match.");
      return;
    }

    try {
      await updateUser.mutateAsync({
        username: username || undefined,
        name,
        email,
        image: profileImage, // NOTE: you’ll likely want to upload and save a URL instead of base64
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      await refetch();
      setFeedbackType("success");
      setFeedbackMsg("Profile updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      onUpdateSuccess();
    } catch (error: any) {
      const zodErrors = error?.data?.zodError?.fieldErrors;
      const firstErrorMsg =
        zodErrors?.username?.[0] ||
        zodErrors?.newPassword?.[0] ||
        zodErrors?.currentPassword?.[0] ||
        zodErrors?.email?.[0] ||
        zodErrors?.name?.[0] ||
        zodErrors?.image?.[0] ||
        error?.shape?.message ||
        error?.message ||
        "Something went wrong!";

      // Surface username-specific errors under the username field
      if (firstErrorMsg.toLowerCase().includes("username")) {
        setUsernameError(firstErrorMsg);
      } else {
        setFeedbackType("error");
        setFeedbackMsg(firstErrorMsg);
      }
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex justify-center pt-20">
        <Card className="w-full max-w-2xl p-8">
          <Skeleton className="mb-6 h-6 w-40" />
          <Skeleton className="mb-4 h-6 w-full" />
          <Skeleton className="mb-4 h-6 w-full" />
          <Skeleton className="mb-4 h-6 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center pt-8 pb-20">
      <Card className="w-full max-w-2xl bg-amber-50">
        <CardHeader className="flex flex-col items-center space-y-4">
          <div className="relative">
            <img
              src={profileImage}
              alt="Profile Image"
              className="h-28 w-28 rounded-full border-4 border-white object-cover shadow"
            />
            <button
              type="button"
              onClick={triggerFileSelect}
              className="bg-primary hover:bg-primary/80 focus:ring-primary absolute right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full text-white shadow focus:ring-2 focus:ring-offset-2 focus:outline-none"
              aria-label="Change profile picture"
            >
              <Pen size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
          <CardTitle className="text-2xl font-bold">Edit Profile</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <ErrorLabel
            msg={feedbackMsg}
            show={!!feedbackMsg}
            type={feedbackType}
          />

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              autoComplete="username"
              onChange={(e) => {
                setUsername(e.target.value.trimStart()); // avoid leading spaces
                if (usernameError) setUsernameError("");
              }}
              placeholder="your_username"
            />
            {usernameError && (
              <ErrorLabel msg={usernameError} show type="error" />
            )}
            <p className="text-muted-foreground text-xs">
              3–30 chars. Letters, numbers, and underscore only.
            </p>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          {/* Passwords */}
          <div className="space-y-2 border-t border-gray-300 pt-4 dark:border-gray-700">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
            <Input
              id="confirmNewPassword"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Button
              onClick={handleProfileUpdate}
              disabled={updateUser.isPending}
            >
              {updateUser.isPending ? "Updating..." : "Update Profile"}
            </Button>
            {mode == "edit" ? null : (
              <Button onClick={onUpdateSuccess}>Cancel</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
