"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClipboardList, Eye, Loader2, Search } from "lucide-react";

interface WorkItem {
  id: number;
  user_id: string;
  work_type: string;
  owner: string;
  title: string;
  description: string;
  image_url: string;
  created_at: string;
  version: string;
  completion_date: string;
  contact: string;
  os: string;
  tool: string;
  source_url: string;
  user_name: string;
  user_email: string;
  user_avatar: string;
  scored_count: number;
  total_reviewers: number;
}

interface ScoreDetail {
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar: string;
  score: number;
  comment: string;
}

interface ReviewerInfo {
  id: string;
  name: string;
  avatar: string;
}

export default function WorksPage() {
  const router = useRouter();
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [filterOs, setFilterOs] = useState("");
  const [filterTool, setFilterTool] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [scoreDialogWork, setScoreDialogWork] = useState<WorkItem | null>(null);
  const [scoreDetails, setScoreDetails] = useState<ScoreDetail[]>([]);
  const [dialogReviewers, setDialogReviewers] = useState<ReviewerInfo[]>([]);
  const [scoreDialogLoading, setScoreDialogLoading] = useState(false);

  useEffect(() => {
    fetch("/api/works")
      .then((res) => res.json())
      .then((data) => {
        setWorks(data.works || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredWorks = works.filter((work) => {
    if (filterType && work.work_type !== filterType) return false;
    if (filterOs && work.os !== filterOs) return false;
    if (filterTool && work.tool !== filterTool) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = work.title?.toLowerCase().includes(q);
      const matchDesc = work.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  const uniqueTypes = [...new Set(works.map((w) => w.work_type).filter(Boolean))];
  const uniqueOs = [...new Set(works.map((w) => w.os).filter(Boolean))];
  const uniqueTools = [...new Set(works.map((w) => w.tool).filter(Boolean))];

  const openScoreDialog = async (work: WorkItem) => {
    setScoreDialogWork(work);
    setScoreDialogLoading(true);
    try {
      const res = await fetch(`/api/scores?submissionId=${work.id}`);
      const data = await res.json();
      setScoreDetails(data.scores || []);
      setDialogReviewers(data.reviewers || []);
    } catch {
      setScoreDetails([]);
      setDialogReviewers([]);
    }
    setScoreDialogLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">作品列表</h1>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">作品列表</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="size-5" />
            已提交作品
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative flex-1 min-w-full sm:min-w-48 sm:flex-1">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索作品名或简介..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterType} onValueChange={(v) => setFilterType(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="作品类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {uniqueTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterOs} onValueChange={(v) => setFilterOs(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="操作系统" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部系统</SelectItem>
                {uniqueOs.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterTool} onValueChange={(v) => setFilterTool(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="使用工具" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部工具</SelectItem>
                {uniqueTools.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {works.length === 0 ? (
            <p className="text-muted-foreground">暂无提交</p>
          ) : filteredWorks.length === 0 ? (
            <p className="text-muted-foreground">没有匹配的作品</p>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>提交者</TableHead>
                  <TableHead>作品名</TableHead>
                  <TableHead>所有人</TableHead>
                  <TableHead>评分状态</TableHead>
                  <TableHead>提交时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorks.map((work) => (
                    <TableRow key={work.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-6 after:border-0">
                            <AvatarImage src={work.user_avatar} alt={work.user_name} />
                            <AvatarFallback>
                              {work.user_name?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{work.user_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{work.title}</TableCell>
                      <TableCell>{work.owner}</TableCell>
                      <TableCell>
                        <button
                          className={`cursor-pointer hover:underline ${work.scored_count >= work.total_reviewers && work.total_reviewers > 0 ? "text-green-600 font-medium" : "text-muted-foreground"}`}
                          onClick={() => openScoreDialog(work)}
                        >
                          {work.scored_count}/{work.total_reviewers}
                        </button>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {work.created_at
                          ? new Date(work.created_at).toLocaleDateString("zh-CN")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/dashboard/works/${work.id}`)}
                        >
                          <Eye data-icon="inline-start" />
                          查看
                        </Button>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score Details Dialog */}
      <Dialog open={!!scoreDialogWork} onOpenChange={(o) => { if (!o) { setScoreDialogWork(null); setScoreDetails([]); setDialogReviewers([]); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>评分状态：{scoreDialogWork?.title}</DialogTitle>
          </DialogHeader>
          {scoreDialogLoading ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : dialogReviewers.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无评委</p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                已打分 {dialogReviewers.filter((r) => scoreDetails.some((s) => s.reviewer_id === r.id)).length} / {dialogReviewers.length}
              </p>
              <div className="flex flex-wrap gap-3">
                {dialogReviewers.map((reviewer) => {
                  const scored = scoreDetails.find((s) => s.reviewer_id === reviewer.id);
                  return (
                    <div key={reviewer.id} className="flex flex-col items-center gap-1">
                      <div className={`relative ${!scored ? "opacity-40" : ""}`}>
                        <Avatar className="size-10 after:border-0">
                          <AvatarImage src={reviewer.avatar} alt={reviewer.name} />
                          <AvatarFallback>
                            {reviewer.name?.charAt(0)?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        {scored && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-green-500 text-[8px] text-white">✓</span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground max-w-[48px] truncate">{reviewer.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
