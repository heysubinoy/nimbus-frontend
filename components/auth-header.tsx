"use client";

import { useState } from "react";
import { UserIcon, LogOut, Settings, History, Zap, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AuthModal } from "./auth-modal";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { UserDetailsDto } from "@/types/user.dto";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: "free" | "pro" | "enterprise";
  imagesProcessed: number;
}

// Format large numbers for display (e.g., 1000 -> 1K)
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

export function AuthHeader({ details }: { details: UserDetailsDto | null }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { data: session } = useSession();
  const user = session?.user || undefined;
  console.log("Debug User:", details);
  // const getPlanColor = (plan: string) => {
  //   switch (plan) {
  //     case "pro":
  //       return "bg-primary";
  //     case "enterprise":
  //       return "bg-secondary";
  //     default:
  //       return "bg-muted";
  //   }
  // };

  return (
    <>
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Image src="/icon.png" width={50} height={50} alt="Nimbus" />

              <div>
                <h1 className="text-xl font-bold text-foreground">Nimbus</h1>
                <p className="text-xs text-muted-foreground">
                  Image Compression
                </p>
              </div>
            </div>

            {/* Auth Section */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  {/* Usage Stats */}
                  <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                    {/* <Badge className={getPlanColor(user.plan)}>
                      {user.plan.toUpperCase()}
                    </Badge> */}
                  </div>

                  {/* Profile Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-10 w-10 rounded-full"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={user.image || "/placeholder.svg"}
                            alt={user.name || "User "}
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {(user?.name || "User")
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-56"
                      align="end"
                      forceMount
                    >
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {user.name}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      {/* Credits Information */}
                      {details && (
                        <>
                          <DropdownMenuLabel className="font-medium text-xs text-muted-foreground">
                            Your Credits
                          </DropdownMenuLabel>

                          <div className="px-2 py-1.5">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <Upload className="mr-2 h-4 w-4 text-primary" />
                                <span className="text-sm">Uploads</span>
                              </div>
                              <Badge variant="outline" className="ml-auto">
                                {formatNumber(details.credits)} left
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Zap className="mr-2 h-4 w-4 text-amber-500" />
                                <span className="text-sm">Transformsa</span>
                              </div>
                              <Badge variant="outline" className="ml-auto">
                                {formatNumber(details.convertCredits)} left
                              </Badge>
                            </div>
                          </div>

                          <DropdownMenuSeparator />
                        </>
                      )}

                      {/* <DropdownMenuItem>
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <History className="mr-2 h-4 w-4" />
                        <span>History</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator /> */}
                      <DropdownMenuItem onClick={() => signOut()}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowAuthModal(true)}
                  >
                    Sign In
                  </Button>
                  <Button onClick={() => setShowAuthModal(true)}>
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        // onLogin={onLogin}
      />
    </>
  );
}
