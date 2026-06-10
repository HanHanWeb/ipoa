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
}

export default function SubmitPage() {
  const [workType, setWorkType] = useState("");
  const [owner, setOwner] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [countdown, setCountdown] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
      setMessage("请填写所有字段");
      return;
    }

    setSubmitting(true);
    setMessage("");

    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ work_type: workType, owner, title, description, image_urls: imageUrls }),
    });

    if (res.ok) {
      setMessage("提交成功！");
      setWorkType("");
      setOwner("");
      setTitle("");
      setDescription("");
      setImageUrls([]);
      if (fileRef.current) fileRef.current.value = "";
      fetchSubmissions();
    } else {
      const err = await res.json();
      setMessage(err.error || "提交失败");
    }

    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">作品提交</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="size-5" />
            提交作品
          </CardTitle>
          <CardDescription>填写作品信息并上传作品图片</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label className="text-sm font-medium">作品类型</label>
            <Select value={workType} onValueChange={(v) => setWorkType(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="请选择作品类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="原创">原创</SelectItem>
                <SelectItem value="临摹">临摹</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label className="text-sm font-medium">作品所有人 / 组织</label>
            <Input
              placeholder="请输入个人姓名或组织名称"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label className="text-sm font-medium">作品名</label>
            <Input
              placeholder="请输入作品名称"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label className="text-sm font-medium">作品简介</label>
            <Textarea
              placeholder="请简要描述您的作品"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div>
              <label className="text-sm font-medium">作品图片</label>
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
                    我承诺该作品系本人 / 组织自主创作，如有抄袭或侵权，愿意承担法律责任。
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

      {submissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>我的提交</CardTitle>
            <CardDescription>共 {submissions.length} 件作品</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {submissions.map((sub) => {
                let urls: string[] = [];
                try {
                  const parsed = JSON.parse(sub.image_url);
                  urls = Array.isArray(parsed) ? parsed : [sub.image_url];
                } catch {
                  urls = [sub.image_url];
                }
                return (
                  <div key={sub.id} className="flex gap-4 rounded-lg border p-3">
                    <div className="flex shrink-0 gap-2">
                      {urls.map((url: string, i: number) => (
                        <img
                          key={i}
                          src={url}
                          alt={sub.title}
                          className="size-20 rounded object-cover"
                        />
                      ))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{sub.title}</p>
                      <p className="text-xs text-muted-foreground">{sub.owner} · {sub.work_type || "未分类"}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {sub.description}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {sub.created_at
                          ? new Date(sub.created_at).toLocaleString("zh-CN")
                          : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
