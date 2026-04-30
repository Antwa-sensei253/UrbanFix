import { useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLang, useT } from "@/lib/i18n";

export function Navbar({ rightSlot }: { rightSlot?: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { lang, setLang } = useLang();
  const t = useT();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const toggleLang = () => setLang(lang === "en" ? "ar" : "en");

  // Get user initials for the avatar
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/70 backdrop-blur-md supports-[backdrop-filter]:bg-white/40 dark:bg-slate-900/70 dark:supports-[backdrop-filter]:bg-slate-900/40">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <div className="flex items-center gap-1 sm:gap-3">
          {/* Language toggle */}
          <Button
            variant="ghost"
            onClick={toggleLang}
            className="h-9 px-3 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
            title={lang === "en" ? "تغيير اللغة" : "Change Language"}
          >
            {lang === "en" ? "Language" : "اللغة"}
          </Button>

          {/* Vertical Separator */}
          <div className="mx-1 h-6 w-px bg-border" />

          {/* Notification bell slot (passed from Protected) */}
          {rightSlot}

          {/* User Profile Dropdown */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 rounded-full pl-1 pr-3 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-600 text-white font-medium text-xs">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:block">
                    {user.full_name.split(" ")[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.role}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700 focus:bg-red-50 dark:hover:bg-red-950/50">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t.logout}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
