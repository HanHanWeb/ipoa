"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User } from "lucide-react";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

const EVENT_START = new Date("2026-07-01T00:00:00+08:00");
const EVENT_END = new Date("2026-08-31T23:59:59+08:00");

function useCountdown() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (now < EVENT_START) {
    const diff = EVENT_START.getTime() - now.getTime();
    return { status: "upcoming" as const, diff, label: "距活动开始" };
  }
  if (now < EVENT_END) {
    const diff = EVENT_END.getTime() - now.getTime();
    return { status: "ongoing" as const, diff, label: "距活动结束" };
  }
  return { status: "ended" as const, diff: 0, label: "活动已结束" };
}

function formatDiff(diff: number) {
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const countdown = useCountdown();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data.user));
  }, []);

  const time = formatDiff(countdown.diff);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">活动首页</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" />
              用户信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="flex items-center gap-4">
                <Avatar className="size-16 after:border-0">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-lg">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-lg font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {user.email}
                  </p>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role === "admin" ? "管理员" : "参赛者"}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">加载中...</p>
            )}
          </CardContent>
        </Card>

        {/* Countdown Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5" />
              {countdown.label}
            </CardTitle>
            <CardDescription>
              {countdown.status === "upcoming"
                ? "PPTOS 创意设计大赛即将开始"
                : countdown.status === "ongoing"
                  ? "PPTOS 创意设计大赛进行中"
                  : "感谢您的参与"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {countdown.status !== "ended" ? (
              <div className="grid grid-cols-4 gap-3 text-center">
                {[
                  { value: time.days, label: "天" },
                  { value: time.hours, label: "时" },
                  { value: time.minutes, label: "分" },
                  { value: time.seconds, label: "秒" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-muted p-3">
                    <div className="text-3xl font-bold tabular-nums">
                      {String(item.value).padStart(2, "0")}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-24 items-center justify-center">
                <p className="text-lg text-muted-foreground">
                  活动已结束，感谢您的参与！
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
