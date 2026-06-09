"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User } from "lucide-react";

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
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="size-7 rounded-full object-cover" />
          ) : (
            <User className="size-4 text-slate-500" />
          )}
          <span className="text-sm text-slate-700">{user.name}</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 rounded-full px-3 text-xs"
          asChild
        >
          <a href="/api/auth/logout">
            <LogOut className="mr-1 size-3" />
            退出
          </a>
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      className="h-8 rounded-full bg-[#38b6ff] px-4 text-xs font-medium text-white hover:bg-[#2da4eb]"
      asChild
    >
      <a href="/api/auth/login">
        <LogIn className="mr-1 size-3" />
        登录
      </a>
    </Button>
  );
}
