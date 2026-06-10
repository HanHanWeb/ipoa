"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Megaphone, Plus, Trash2, Pin, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PageTitle } from "@/components/page-title";

interface Notice {
  id: number;
  title: string;
  content: string;
  pinned: number;
  created_at: string;
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchNotices = () => {
    fetch("/api/notices")
      .then((res) => res.json())
      .then((data) => {
        setNotices(data.notices || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    await fetch("/api/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, pinned }),
    });
    setTitle("");
    setContent("");
    setPinned(false);
    setSubmitting(false);
    fetchNotices();
  };

  const handleDelete = async (id: number) => {
    await fetch("/api/notices", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchNotices();
  };

  return (
    <div className="space-y-6">
      <PageTitle title="公告管理" />
      <h1 className="text-2xl font-semibold">公告管理</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="size-5" />
            发布公告
          </CardTitle>
          <CardDescription>发布新的公告通知</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label className="text-sm font-medium leading-none">公告标题</label>
            <Input
              placeholder="请输入公告标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label className="text-sm font-medium leading-none">公告内容</label>
            <Textarea
              placeholder="请输入公告内容"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={pinned}
                onCheckedChange={(checked) => setPinned(checked === true)}
              />
              置顶
            </Label>
            <Button onClick={handleCreate} disabled={submitting}>
              <Megaphone className="mr-1 size-4" />
              {submitting ? "发布中..." : "发布"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="size-5" />
            已发布公告
          </CardTitle>
          <CardDescription>共 {notices.length} 条公告</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <div className="h-10 w-full rounded bg-muted animate-pulse" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 w-full rounded bg-muted animate-pulse" />
              ))}
            </div>
          ) : notices.length === 0 ? (
            <p className="text-muted-foreground">暂无公告</p>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标题</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>发布时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.map((notice) => (
                  <TableRow key={notice.id}>
                    <TableCell className="font-medium">
                      {notice.title}
                    </TableCell>
                    <TableCell>
                      {notice.pinned ? (
                        <Badge variant="default">
                          <Pin className="mr-1 size-3" />
                          置顶
                        </Badge>
                      ) : (
                        <Badge variant="secondary">普通</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {notice.created_at
                        ? new Date(notice.created_at).toLocaleString("zh-CN")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(notice.id)}
                      >
                        <Trash2 className="mr-1 size-3" />
                        删除
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
    </div>
  );
}
