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
import { Button } from "@/components/ui/button";
import { Clock, User, Megaphone, Pin, ChevronDown, ChevronUp, Loader2, ListChecks, Check } from "lucide-react";
import { PageTitle } from "@/components/page-title";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

interface Notice {
  id: number;
  title: string;
  content: string;
  pinned: number;
  created_at: string;
}

function useCountdown() {
  const [now, setNow] = useState(new Date());
  const [eventStart, setEventStart] = useState<Date | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.stage_upload_start) {
          const d = new Date(data.stage_upload_start);
          if (!isNaN(d.getTime())) setEventStart(d);
        }
      });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!eventStart) {
    return { status: "loading" as const, diff: 0, label: "加载中..." };
  }

  if (now < eventStart) {
    const diff = eventStart.getTime() - now.getTime();
    return { status: "upcoming" as const, diff, label: "距活动开始" };
  }
  return { status: "ongoing" as const, diff: 0, label: "活动进行中" };
}

function formatDiff(diff: number) {
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

function NoticeCard({ notice }: { notice: Notice }) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncate = notice.content.length > 80;

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-2">
        {notice.pinned ? (
          <Badge variant="default" className="gap-1 shrink-0 text-xs">
            <Pin className="size-2.5" />
            置顶
          </Badge>
        ) : null}
        <h3 className="truncate text-sm font-medium">{notice.title}</h3>
      </div>
      <p className={`mt-2 text-sm text-muted-foreground ${!expanded && needsTruncate ? "line-clamp-3" : ""}`}>
        {notice.content}
      </p>
      {needsTruncate && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 h-6 px-2 text-xs text-muted-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>收起 <ChevronUp className="ml-0.5 size-3" /></>
          ) : (
            <>展开 <ChevronDown className="ml-0.5 size-3" /></>
          )}
        </Button>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        {notice.created_at
          ? new Date(notice.created_at).toLocaleDateString("zh-CN")
          : ""}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [noticesLoaded, setNoticesLoaded] = useState(false);
  const [stages, setStages] = useState<{ label: string; start: Date }[]>([]);
  const countdown = useCountdown();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data.user));
    fetch("/api/submissions")
      .then((res) => res.json())
      .then((data) => setHasSubmitted((data.submissions || []).length > 0));
    fetch("/api/notices")
      .then((res) => res.json())
      .then((data) => {
        setNotices(data.notices || []);
        setNoticesLoaded(true);
      });
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        const stageList = [
          { label: "作品提交", key: "stage_upload_start" },
          { label: "作品评审", key: "stage_review_start" },
          { label: "结果公布", key: "stage_result_start" },
        ];
        const parsed = stageList
          .map((s) => {
            const val = data[s.key];
            if (!val) return null;
            const d = new Date(val);
            if (isNaN(d.getTime())) return null;
            return { label: s.label, start: d };
          })
          .filter(Boolean) as { label: string; start: Date }[];
        setStages(parsed);
      });
  }, []);

  const time = formatDiff(countdown.diff);

  return (
    <div className="space-y-6">
      <PageTitle title="活动首页" />
      <h1 className="text-2xl font-semibold">活动首页</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {/* User Info Card */}
        <Card data-size="sm">
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
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-medium">{user.name}</p>
                    <Badge variant="default" style={user.role === "reviewer" ? { backgroundColor: "#e34b6e" } : undefined}>
                      {user.role === "admin" ? "管理" : user.role === "reviewer" ? "评委" : "参赛"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {user.email}
                  </p>
                  {hasSubmitted !== null ? (
                    <Badge
                      variant="default"
                      className="mt-1"
                      style={{ backgroundColor: hasSubmitted ? "#05bc5e" : "#e34b6e" }}
                    >
                      {hasSubmitted ? "已提交作品" : "未提交作品"}
                    </Badge>
                  ) : (
                    <div className="mt-1 h-5 w-20 rounded-full bg-muted animate-pulse" />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-full bg-muted animate-pulse" />
                <div className="space-y-2">
                  <div className="h-5 w-24 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                  <div className="h-5 w-20 rounded bg-muted animate-pulse" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Countdown / Progress Card */}
        <Card data-size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {countdown.status === "ongoing" ? (
                <ListChecks className="size-5" />
              ) : (
                <Clock className="size-5" />
              )}
              {countdown.status === "loading" ? (
                <div className="h-5 w-20 rounded bg-muted animate-pulse" />
              ) : countdown.status === "ongoing" ? (
                "活动进度"
              ) : (
                countdown.label
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {countdown.status === "loading" ? (
              <div className="grid grid-cols-4 gap-2 md:gap-3 text-center">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg bg-muted p-2 md:p-3">
                    <div className="h-8 w-12 mx-auto rounded bg-muted-foreground/10 animate-pulse" />
                    <div className="mt-1 h-3 w-6 mx-auto rounded bg-muted-foreground/10 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : countdown.status === "upcoming" ? (
              <div className="grid grid-cols-4 gap-2 md:gap-3 text-center">
                {[
                  { value: time.days, label: "天" },
                  { value: time.hours, label: "时" },
                  { value: time.minutes, label: "分" },
                  { value: time.seconds, label: "秒" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-muted p-2 md:p-3">
                    <div className={`text-2xl md:text-3xl tabular-nums ${item.label === "天" ? "font-bold text-primary" : "font-medium"}`}>
                      {String(item.value).padStart(2, "0")}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            ) : stages.length > 0 ? (
              <div className="flex items-center gap-1.5">
                {stages.map((stage, i) => {
                  const now = new Date();
                  const isLast = i === stages.length - 1;
                  const nextStart = !isLast ? stages[i + 1].start : null;
                  const isActive = now >= stage.start && (isLast || (nextStart && now < nextStart));
                  const isCompleted = !isLast && nextStart ? now >= nextStart : false;
                  const isFuture = now < stage.start;

                  let barPercent = 0;
                  if (nextStart) {
                    if (isCompleted) {
                      barPercent = 100;
                    } else if (isActive) {
                      const total = nextStart.getTime() - stage.start.getTime();
                      const elapsed = now.getTime() - stage.start.getTime();
                      barPercent = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
                    }
                  }

                  return (
                    <div key={stage.label} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <div
                          className={`flex size-8 items-center justify-center rounded-full text-xs font-medium ${
                            isCompleted
                              ? "bg-primary text-primary-foreground"
                              : isActive
                                ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isCompleted ? <Check className="size-4" /> : i + 1}
                        </div>
                        <span
                          className={`text-xs font-medium whitespace-nowrap ${
                            isActive ? "text-primary" : isFuture ? "text-muted-foreground" : "text-foreground"
                          }`}
                        >
                          {stage.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {stage.start.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
                        </span>
                      </div>
                      {i < stages.length - 1 && (
                        <div className="mx-2 h-1 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${barPercent}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-24 items-center justify-center">
                <p className="text-lg text-muted-foreground">活动进行中</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Announcements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="size-5" />
            活动公告
          </CardTitle>
        </CardHeader>
        <CardContent className="min-h-24">
          {!noticesLoaded ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-lg border p-4 space-y-2">
                  <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-1/4 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          ) : notices.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {notices.map((notice) => (
                <NoticeCard key={notice.id} notice={notice} />
              ))}
            </div>
          ) : (
            <div className="flex h-24 items-center justify-center">
              <p className="text-sm text-muted-foreground">暂无公告</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
