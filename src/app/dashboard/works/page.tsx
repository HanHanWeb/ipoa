"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardList, CheckCircle, XCircle, Eye } from "lucide-react";

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
  review_status: string;
  review_comment: string;
  user_name: string;
  user_email: string;
  user_avatar: string;
}

const reviewLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "待审核", variant: "secondary" },
  approved: { label: "已通过", variant: "default" },
  rejected: { label: "已驳回", variant: "destructive" },
};

export default function WorksPage() {
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState<WorkItem | null>(null);
  const [reviewStatus, setReviewStatus] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [detailTarget, setDetailTarget] = useState<WorkItem | null>(null);

  const fetchWorks = () => {
    fetch("/api/works")
      .then((res) => res.json())
      .then((data) => {
        setWorks(data.works || []);
        setRole(data.role || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchWorks();
  }, []);

  const openReview = (work: WorkItem) => {
    setReviewTarget(work);
    setReviewStatus(work.review_status === "pending" ? "" : work.review_status);
    setReviewComment(work.review_comment || "");
  };

  const submitReview = async () => {
    if (!reviewTarget || !reviewStatus) return;
    setSubmitting(true);
    await fetch("/api/works", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId: reviewTarget.id,
        review_status: reviewStatus,
        review_comment: reviewComment,
      }),
    });
    setSubmitting(false);
    setReviewTarget(null);
    fetchWorks();
  };

  const getImageUrls = (imageUrl: string): string[] => {
    try {
      const parsed = JSON.parse(imageUrl);
      return Array.isArray(parsed) ? parsed : [imageUrl];
    } catch {
      return [imageUrl];
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">作品列表</h1>
        <p className="text-muted-foreground">加载中...</p>
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
        <CardContent>
          {works.length === 0 ? (
            <p className="text-muted-foreground">暂无提交</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>提交者</TableHead>
                  <TableHead>作品名</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>所有人</TableHead>
                  <TableHead>审核状态</TableHead>
                  <TableHead>提交时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {works.map((work) => {
                  const status = reviewLabels[work.review_status] || reviewLabels.pending;
                  return (
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
                      <TableCell>{work.work_type}</TableCell>
                      <TableCell>{work.owner}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                        {work.review_comment && (
                          <span className="ml-1 text-xs text-muted-foreground" title={work.review_comment}>
                            (有评语)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {work.created_at
                          ? new Date(work.created_at).toLocaleDateString("zh-CN")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDetailTarget(work)}
                          >
                            <Eye className="mr-1 size-3" />
                            查看
                          </Button>
                          {role === "reviewer" && (
                            <Button
                              size="sm"
                              variant={work.review_status === "pending" ? "default" : "outline"}
                              onClick={() => openReview(work)}
                            >
                              {work.review_status === "pending" ? "审核" : "修改审核"}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!detailTarget} onOpenChange={(o) => { if (!o) setDetailTarget(null); }}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailTarget?.title}</DialogTitle>
            <DialogDescription>作品详情</DialogDescription>
          </DialogHeader>
          {detailTarget && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">类型：</span>{detailTarget.work_type}</div>
                <div><span className="text-muted-foreground">所有人：</span>{detailTarget.owner}</div>
                <div><span className="text-muted-foreground">版本号：</span>{detailTarget.version || "未填写"}</div>
                <div><span className="text-muted-foreground">完成日期：</span>{detailTarget.completion_date || "未填写"}</div>
                <div><span className="text-muted-foreground">联系方式：</span>{detailTarget.contact || "未填写"}</div>
                <div><span className="text-muted-foreground">操作系统：</span>{detailTarget.os || "未填写"}</div>
                <div><span className="text-muted-foreground">使用工具：</span>{detailTarget.tool || "未填写"}</div>
                {(detailTarget.work_type === "临摹" || detailTarget.work_type === "改编") && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">原作品出处：</span>
                    {detailTarget.source_url ? (
                      <a href={detailTarget.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        {detailTarget.source_url}
                      </a>
                    ) : "未填写"}
                  </div>
                )}
              </div>
              <div>
                <span className="text-muted-foreground">简介：</span>
                <p className="mt-1">{detailTarget.description}</p>
              </div>
              <div>
                <span className="text-muted-foreground">作品图片：</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {getImageUrls(detailTarget.image_url).map((url, i) => (
                    <img key={i} src={url} alt={`作品 ${i + 1}`} className="h-24 w-24 rounded border object-cover" />
                  ))}
                </div>
              </div>
              {detailTarget.review_status !== "pending" && (
                <div className="rounded-md border p-3">
                  <span className="text-muted-foreground">审核结果：</span>
                  <Badge variant={reviewLabels[detailTarget.review_status]?.variant || "secondary"} className="ml-1">
                    {reviewLabels[detailTarget.review_status]?.label || detailTarget.review_status}
                  </Badge>
                  {detailTarget.review_comment && (
                    <p className="mt-1 text-muted-foreground">评语：{detailTarget.review_comment}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={!!reviewTarget} onOpenChange={(o) => { if (!o) setReviewTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>审核作品：{reviewTarget?.title}</DialogTitle>
            <DialogDescription>请审核该作品并给出意见</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">审核结果</label>
              <Select value={reviewStatus} onValueChange={(v) => setReviewStatus(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择审核结果" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="size-4 text-green-600" />
                      通过
                    </div>
                  </SelectItem>
                  <SelectItem value="rejected">
                    <div className="flex items-center gap-1">
                      <XCircle className="size-4 text-red-600" />
                      驳回
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">审核评语</label>
              <Textarea
                placeholder="请输入审核意见（可选）"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewTarget(null)}>取消</Button>
            <Button disabled={!reviewStatus || submitting} onClick={submitReview}>
              {submitting ? "提交中..." : "提交审核"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
