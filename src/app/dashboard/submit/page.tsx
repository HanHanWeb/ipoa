"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Upload, ImagePlus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Submission {
  id: number;
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
}

export default function SubmitPage() {
  const [workType, setWorkType] = useState("");
  const [owner, setOwner] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [contact, setContact] = useState("");
  const [os, setOs] = useState("");
  const [tool, setTool] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [countdown, setCountdown] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const hasSubmitted = submissions.length > 0;
  const submitted = hasSubmitted ? submissions[0] : null;

  const fetchSubmissions = () => {
    fetch("/api/submissions")
      .then((res) => res.json())
      .then((data) => setSubmissions(data.submissions || []));
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    if (!dialogOpen) {
      setCountdown(10);
      return;
    }
    setCountdown(10);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [dialogOpen]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = 5 - imageUrls.length;
    if (remaining <= 0) {
      setMessage("最多上传5张图片");
      return;
    }

    const toUpload = Array.from(files).slice(0, remaining);
    const maxSize = 3 * 1024 * 1024; // 3MB

    for (const file of toUpload) {
      if (!["image/png", "image/jpeg"].includes(file.type)) {
        setMessage("仅支持 PNG / JPG 格式");
        return;
      }
      if (file.size > maxSize) {
        setMessage(`"${file.name}" 超过 3MB 限制`);
        return;
      }
    }

    setUploading(true);
    setMessage("");

    try {
      const uploaded: string[] = [];
      for (const file of toUpload) {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "X-Filename": file.name,
          },
          body: await file.arrayBuffer(),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "上传失败" }));
          setMessage(err.error || "上传失败");
          setUploading(false);
          return;
        }

        const { imageUrl } = await res.json();
        uploaded.push(imageUrl);
      }

      setImageUrls((prev) => [...prev, ...uploaded]);
      setMessage(`成功上传 ${uploaded.length} 张图片`);
    } catch {
      setMessage("上传出错");
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!workType || !owner.trim() || !title.trim() || !description.trim() || imageUrls.length === 0) {
      setMessage("请填写所有必填字段");
      return;
    }
    if ((workType === "临摹" || workType === "改编") && !sourceUrl.trim()) {
      setMessage("临摹/改编作品请填写原作品出处");
      return;
    }

    setSubmitting(true);
    setMessage("");

    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        work_type: workType,
        owner,
        title,
        description,
        image_urls: imageUrls,
        version,
        completion_date: completionDate,
        contact,
        os,
        tool,
        source_url: sourceUrl,
      }),
    });

    if (res.ok) {
      setMessage("提交成功！");
      fetchSubmissions();
    } else {
      const err = await res.json();
      setMessage(err.error || "提交失败");
    }

    setSubmitting(false);
  };

  const needsSourceUrl = workType === "临摹" || workType === "改编";

  // If already submitted, show the submitted data
  if (submitted) {
    let urls: string[] = [];
    try {
      const parsed = JSON.parse(submitted.image_url);
      urls = Array.isArray(parsed) ? parsed : [submitted.image_url];
    } catch {
      urls = [submitted.image_url];
    }

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">作品提交</h1>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="size-5" />
              已提交作品
            </CardTitle>
            <CardDescription>您已提交过作品，以下是您提交的信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">作品类型</label>
                <p className="mt-1">{submitted.work_type || "未填写"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">作品所有人 / 组织</label>
                <p className="mt-1">{submitted.owner || "未填写"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">作品名</label>
                <p className="mt-1">{submitted.title || "未填写"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">作品版本号</label>
                <p className="mt-1">{submitted.version || "未填写"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">作品完成日期</label>
                <p className="mt-1">{submitted.completion_date || "未填写"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">作者联系方式</label>
                <p className="mt-1">{submitted.contact || "未填写"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">操作系统</label>
                <p className="mt-1">{submitted.os || "未填写"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">使用工具</label>
                <p className="mt-1">{submitted.tool || "未填写"}</p>
              </div>
              {(submitted.work_type === "临摹" || submitted.work_type === "改编") && (
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">原作品出处</label>
                  <p className="mt-1">
                    {submitted.source_url ? (
                      <a href={submitted.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        {submitted.source_url}
                      </a>
                    ) : "未填写"}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">作品简介</label>
              <p className="mt-1">{submitted.description || "未填写"}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">作品图片</label>
              <div className="mt-2 flex flex-wrap gap-3">
                {urls.map((url: string, i: number) => (
                  <img
                    key={i}
                    src={url}
                    alt={`作品图片 ${i + 1}`}
                    className="h-32 w-32 rounded-md border object-cover"
                  />
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              提交时间：{submitted.created_at ? new Date(submitted.created_at).toLocaleString("zh-CN") : ""}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Submission form
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">作品提交</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="size-5" />
            提交作品
          </CardTitle>
          <CardDescription>填写作品信息并上传作品图片（只能提交一次）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label className="text-sm font-medium">作品类型 <span className="text-red-500">*</span></label>
            <Select value={workType} onValueChange={(v) => setWorkType(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="请选择作品类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="原创">原创</SelectItem>
                <SelectItem value="临摹">临摹</SelectItem>
                <SelectItem value="改编">改编</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label className="text-sm font-medium">作品所有人 / 组织 <span className="text-red-500">*</span></label>
            <Input
              placeholder="请输入个人姓名或组织名称"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label className="text-sm font-medium">作品名 <span className="text-red-500">*</span></label>
            <Input
              placeholder="请输入作品名称"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label className="text-sm font-medium">作品简介 <span className="text-red-500">*</span></label>
            <Textarea
              placeholder="请简要描述您的作品"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label className="text-sm font-medium">作品版本号</label>
            <Input
              placeholder="例如：v1.0"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label className="text-sm font-medium">作品完成日期</label>
            <Input
              type="date"
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label className="text-sm font-medium">作者联系方式（QQ / 微信）</label>
            <Input
              placeholder="请输入 QQ 号或微信号"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label className="text-sm font-medium">操作系统</label>
              <Input
                placeholder="例如：macOS / Windows / iPadOS"
                value={os}
                onChange={(e) => setOs(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label className="text-sm font-medium">使用工具</label>
              <Input
                placeholder="例如：Keynote / PowerPoint / WPS"
                value={tool}
                onChange={(e) => setTool(e.target.value)}
              />
            </div>
          </div>

          {needsSourceUrl && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label className="text-sm font-medium">原作品出处 <span className="text-red-500">*</span></label>
              <Input
                placeholder="请输入原作品链接"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
              />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div>
              <label className="text-sm font-medium">作品图片 <span className="text-red-500">*</span></label>
              <p className="mt-1 text-xs text-muted-foreground">最多5张，仅支持 PNG / JPG，每张不超过 3MB</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg"
                multiple
                className="hidden"
                onChange={handleUpload}
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploading || imageUrls.length >= 5}
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus className="mr-1 size-4" />
                {uploading ? "上传中..." : "选择图片"}
              </Button>
            </div>
            {imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {imageUrls.map((url, i) => (
                  <div key={i} className="relative">
                    <img
                      src={url}
                      alt={`作品图片 ${i + 1}`}
                      className="h-32 w-32 rounded-md border object-cover"
                    />
                    <button
                      type="button"
                      className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                      onClick={() => setImageUrls((prev) => prev.filter((_, j) => j !== i))}
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <AlertDialogTrigger
                render={
                  <Button disabled={submitting || imageUrls.length === 0} />
                }
              >
                <Upload className="mr-1 size-4" />
                {submitting ? "提交中..." : "提交作品"}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>提交确认</AlertDialogTitle>
                  <AlertDialogDescription>
                    我承诺该作品系本人 / 组织自主创作，如有抄袭或侵权，愿意承担法律责任。提交后不可修改。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={countdown > 0}
                    onClick={handleSubmit}
                  >
                    {countdown > 0 ? `${countdown} 秒后可确认` : "确认提交"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {message && (
              <span className="text-sm text-muted-foreground">{message}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
