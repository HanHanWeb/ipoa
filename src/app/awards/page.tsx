"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Award,
  Star,
  Flame,
  Heart,
  Users,
  FileText,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { NavBar } from "@/components/nav-bar";

interface AwardCategory {
  id: number;
  title: string;
  ratio: string;
  sort_order: number;
}

interface AwardEntry {
  id: number;
  category_id: number;
  work_title: string;
  authors: string;
  description: string;
  sort_order: number;
}

const awardStyles: Record<string, { icon: React.ReactNode; bg: string; iconBg: string; border: string; badge: string }> = {
  "一等奖": {
    icon: <Trophy className="size-5" />,
    bg: "bg-amber-50/50",
    iconBg: "bg-amber-100 text-amber-600",
    border: "border-amber-200/60",
    badge: "bg-amber-100 text-amber-700",
  },
  "二等奖": {
    icon: <Award className="size-5" />,
    bg: "bg-blue-50/50",
    iconBg: "bg-blue-100 text-blue-600",
    border: "border-blue-200/60",
    badge: "bg-blue-100 text-blue-700",
  },
  "三等奖": {
    icon: <Award className="size-5" />,
    bg: "bg-orange-50/50",
    iconBg: "bg-orange-100 text-orange-600",
    border: "border-orange-200/60",
    badge: "bg-orange-100 text-orange-700",
  },
  "优秀奖": {
    icon: <Star className="size-5" />,
    bg: "bg-slate-50/50",
    iconBg: "bg-slate-200 text-slate-600",
    border: "border-slate-200/60",
    badge: "bg-slate-200 text-slate-700",
  },
  "黑马突围奖": {
    icon: <Flame className="size-5" />,
    bg: "bg-red-50/50",
    iconBg: "bg-red-100 text-red-600",
    border: "border-red-200/60",
    badge: "bg-red-100 text-red-700",
  },
  "人气之星": {
    icon: <Heart className="size-5" />,
    bg: "bg-pink-50/50",
    iconBg: "bg-pink-100 text-pink-600",
    border: "border-pink-200/60",
    badge: "bg-pink-100 text-pink-700",
  },
};

const defaultStyle = {
  icon: <Trophy className="size-5" />,
  bg: "bg-gray-50/50",
  iconBg: "bg-gray-100 text-gray-600",
  border: "border-gray-200/60",
  badge: "bg-gray-100 text-gray-700",
};

export default function AwardsPage() {
  const [categories, setCategories] = useState<AwardCategory[]>([]);
  const [entries, setEntries] = useState<AwardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/awards")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories || []);
        setEntries(data.entries || []);
        setEnabled(data.enabled || false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getEntriesForCategory = (categoryId: number) => {
    return entries.filter((e) => e.category_id === categoryId);
  };

  const parseAuthors = (authors: string): string[] => {
    try {
      return JSON.parse(authors);
    } catch {
      return [];
    }
  };

  const getStyle = (title: string) => {
    return awardStyles[title] || defaultStyle;
  };

  if (loading) {
    return (
      <>
        <NavBar />
        <main className="px-4 pt-24 pb-16">
          <div className="space-y-6">
            <Skeleton className="h-8 w-32" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!enabled || categories.length === 0) {
    return (
      <>
        <NavBar />
        <main className="px-4 pt-24 pb-16">
          <div className="space-y-6">
            <h1 className="text-2xl font-semibold">获奖名单</h1>
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                获奖名单暂未公布，请稍后查看
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <main className="px-4 pt-24 pb-16">
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold">获奖名单</h1>

          {/* 统计 */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Card className="py-0">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Trophy className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{categories.length}</p>
                  <p className="text-xs text-muted-foreground">奖项类别</p>
                </div>
              </CardContent>
            </Card>
            <Card className="py-0">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{entries.length}</p>
                  <p className="text-xs text-muted-foreground">获奖作品</p>
                </div>
              </CardContent>
            </Card>
            <Card className="py-0">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {new Set(entries.flatMap((e) => parseAuthors(e.authors))).size}
                  </p>
                  <p className="text-xs text-muted-foreground">获奖作者</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 奖项列表 */}
          <div className="space-y-6">
            {categories.map((cat) => {
              const catEntries = getEntriesForCategory(cat.id);
              const style = getStyle(cat.title);
              return (
                <Card key={cat.id} className={`overflow-hidden py-0 gap-0 ${style.border}`}>
                  <div className={`flex items-center gap-3 px-6 py-4 ${style.bg}`}>
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${style.iconBg}`}>
                      {style.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold">{cat.title}</h3>
                      {cat.ratio && (
                        <p className="text-sm text-muted-foreground">{cat.ratio}</p>
                      )}
                    </div>
                    <Badge variant="secondary" className={style.badge}>
                      {catEntries.length} 件作品
                    </Badge>
                  </div>

                  {catEntries.length > 0 && (
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {catEntries.map((entry, idx) => {
                          const authors = parseAuthors(entry.authors);
                          return (
                            <div
                              key={entry.id}
                              className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-muted/30"
                            >
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                                {idx + 1}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium">{entry.work_title}</p>
                                {authors.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {authors.map((author, i) => (
                                      <Badge key={i} variant="outline" className="text-xs font-normal">
                                        {author}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                {entry.description && (
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {entry.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}

                  {catEntries.length === 0 && (
                    <CardContent className="py-6 text-center text-sm text-muted-foreground">
                      暂无获奖作品
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
