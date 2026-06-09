"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LayoutDashboard, LogIn, LogOut } from "lucide-react";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

export function AuthButton() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return null;

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button className="flex items-center gap-2 rounded-full px-2.5 py-1.5 transition-colors hover:bg-accent outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          }
        >
          <Avatar size="sm" className="after:border-0">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[100px] truncate text-sm font-medium text-foreground">
            {user.name}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="min-w-48">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <div className="flex items-center gap-2">
                <Avatar className="after:border-0">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem render={<a href="/dashboard" />}>
              <LayoutDashboard data-icon="inline-start" />
              控制台
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              render={<a href="/api/auth/logout" />}
            >
              <LogOut data-icon="inline-start" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      size="default"
      className="rounded-full bg-[#38b6ff] text-white hover:bg-[#2da4eb]"
      render={<a href="/api/auth/login" />}
    >
      <LogIn data-icon="inline-start" />
      登录
    </Button>
  );
}
