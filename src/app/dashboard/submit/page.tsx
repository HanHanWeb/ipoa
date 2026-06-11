"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, ImagePlus, X, Calendar as CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageTitle } from "@/components/page-title";

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
  download_url: string;
}

export default function SubmitPage() {
  const router = useRouter();
  const [workType, setWorkType] = useState("");
  const [owner, setOwner] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [completionDateObj, setCompletionDateObj] = useState<Date | undefined>();
  const [contact, setContact] = useState("");
  const [os, setOs] = useState("");
  const [tool, setTool] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [reviewStageStarted, setReviewStageStarted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [noticeDialogOpen, setNoticeDialogOpen] = useState(false);
  const [noticeRead, setNoticeRead] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const hasSubmitted = submissions.length > 0;
  const submitted = hasSubmitted ? submissions[0] : null;

  const fetchSubmissions = () => {
    fetch("/api/submissions")
      .then((res) => res.json())
      .then((data) => {
        const subs = data.submissions || [];
        setSubmissions(subs);
        setPageLoading(false);
        // 如果没有提交过作品，显示须知弹窗
        if (subs.length === 0) {
          setNoticeDialogOpen(true);
        }
      })
      .catch(() => setPageLoading(false));
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          const now = new Date();
          const reviewStart = data.settings.review_start_date ? new Date(data.settings.review_start_date) : null;
          setReviewStageStarted(reviewStart ? now >= reviewStart : false);
        }
      })
      .catch(() => {});
  }, []);

  // Load Turnstile script - only when form is visible
  useEffect(() => {
    // Don't render Turnstile if page is loading or if already submitted (not editing)
    if (pageLoading || (hasSubmitted && !editing)) {
      return;
    }

    const scriptId = "turnstile-script";
    let rendered = false;
    
    const tryRender = () => {
      if (rendered) return;
      const w = window as unknown as { turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => void } };
      if (w.turnstile && turnstileRef.current && turnstileRef.current.children.length === 0) {
        rendered = true;
        w.turnstile.render(turnstileRef.current, {
          sitekey: "0x4AAAAAADI34BpAkqXgFVaA",
          callback: (token: string) => setTurnstileToken(token),
        });
      }
    };

    if (document.getElementById(scriptId)) {
      // Script already loaded, try rendering after a short delay
      setTimeout(tryRender, 200);
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setTimeout(tryRender, 200);
    };
    document.head.appendChild(script);
  }, [pageLoading, hasSubmitted, editing]);

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
        setMessage(`"${file.name}" 格式不支持，仅支持 PNG / JPG`);
        return;
      }
      if (file.size > maxSize) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        setMessage(`"${file.name}" 大小为 ${sizeMB}MB，超过 3MB 限制`);
        return;
      }
    }

    setUploading(true);
    setMessage("");

    try {
      const uploaded: string[] = [];
      for (const file of toUpload) {
        let res: Response;
        try {
          res = await fetch("/api/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/octet-stream",
              "X-Filename": file.name,
            },
            body: await file.arrayBuffer(),
          });
        } catch (fetchErr) {
          setMessage(`网络错误，请检查网络连接后重试`);
          setUploading(false);
          return;
        }

        if (!res.ok) {
          let errMsg = "上传失败";
          try {
            const err = await res.json();
            errMsg = err.error || `服务器返回错误 (${res.status})`;
          } catch {
            errMsg = `服务器返回错误 (${res.status})`;
          }
          setMessage(`"${file.name}" ${errMsg}`);
          setUploading(false);
          return;
        }

        const { imageUrl } = await res.json();
        uploaded.push(imageUrl);
      }

      setImageUrls((prev) => [...prev, ...uploaded]);
      setMessage(`成功上传 ${uploaded.length} 张图片`);
    } catch (err) {
      setMessage(`上传出错：${err instanceof Error ? err.message : "未知错误"}`);
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!workType || !owner.trim() || !title.trim() || !description.trim() || !version.trim() || !completionDate || !contact.trim() || !os.trim() || !tool.trim() || imageUrls.length === 0 || !downloadUrl.trim()) {
      setMessage("请填写所有必填字段");
      return;
    }
    if ((workType === "临摹" || workType === "改编") && !sourceUrl.trim()) {
      setMessage("临摹/改编作品请填写原作品出处");
      return;
    }

    setSubmitting(true);
    setMessage("");

    if (!turnstileToken) {
      setMessage("请完成人机验证");
      setSubmitting(false);
      return;
    }

    const body: Record<string, unknown> = {
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
      download_url: downloadUrl,
      turnstile_token: turnstileToken,
    };

    if (editing && submitted) {
      body.submissionId = submitted.id;
    }

    const res = await fetch("/api/submissions", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setMessage(editing ? "修改成功！" : "提交成功！");
      if (editing) {
        setEditing(false);
      }
      fetchSubmissions();
    } else {
      const err = await res.json();
      setMessage(err.error || (editing ? "修改失败" : "提交失败"));
    }

    setSubmitting(false);
  };

  const needsSourceUrl = workType === "临摹" || workType === "改编";

  // If already submitted and not editing, show the submitted data
  if (pageLoading) {
    return (
      <div className="space-y-6">
        <PageTitle title="作品提交" />
        <h1 className="text-2xl font-semibold">作品提交</h1>
        <Card>
          <CardHeader>
            <div className="h-6 w-32 rounded bg-muted animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                <div className="h-10 w-full rounded bg-muted animate-pulse" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted && !editing) {
    let urls: string[] = [];
    try {
      const parsed = JSON.parse(submitted.image_url);
      urls = Array.isArray(parsed) ? parsed : [submitted.image_url];
    } catch {
      urls = [submitted.image_url];
    }

    return (
      <div className="space-y-6">
        <PageTitle title="作品提交" />
        <h1 className="text-2xl font-semibold">作品提交</h1>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="size-5" />
              已提交作品
              {!reviewStageStarted && (
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                  onClick={() => {
                    setEditing(true);
                    setWorkType(submitted.work_type || "");
                    setOwner(submitted.owner || "");
                    setTitle(submitted.title || "");
                    setDescription(submitted.description || "");
                    setVersion(submitted.version || "");
                    setCompletionDate(submitted.completion_date || "");
                    if (submitted.completion_date) {
                      setCompletionDateObj(new Date(submitted.completion_date));
                    }
                    setContact(submitted.contact || "");
                    setOs(submitted.os || "");
                    setTool(submitted.tool || "");
                    setSourceUrl(submitted.source_url || "");
                    setDownloadUrl(submitted.download_url || "");
                    let editUrls: string[] = [];
                    try {
                      const parsed = JSON.parse(submitted.image_url);
                      editUrls = Array.isArray(parsed) ? parsed : [submitted.image_url];
                    } catch {
                      editUrls = [submitted.image_url];
                    }
                    setImageUrls(editUrls);
                  }}
                >
                  编辑
                </Button>
              )}
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

            {submitted.download_url && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">作品下载链接</label>
                <p className="mt-1">
                  <a href={submitted.download_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    {submitted.download_url}
                  </a>
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-muted-foreground">作品图片</label>
              <div className="mt-2 flex flex-wrap gap-3">
                {urls.map((url: string, i: number) => (
                  <a key={i} data-fancybox="submitted" href={url}>
                    <img
                      src={url}
                      alt={`作品图片 ${i + 1}`}
                      className="h-32 w-32 rounded-md border object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  </a>
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
      <PageTitle title="作品提交" />
      <h1 className="text-2xl font-semibold">作品提交</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="size-5" />
            {editing ? "编辑作品" : "提交作品"}
          </CardTitle>
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
            <label className="text-sm font-medium">作品下载链接 <span className="text-red-500">*</span></label>
            <Input
              placeholder="请输入作品下载链接"
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label className="text-sm font-medium">作品版本号 <span className="text-red-500">*</span></label>
            <Input
              placeholder="v1.0"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <Label className="text-sm font-medium">作品完成日期 <span className="text-red-500">*</span></Label>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    data-empty={!completionDateObj}
                    className="justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                  />
                }
              >
                <CalendarIcon />
                {completionDateObj && !isNaN(completionDateObj.getTime())
                  ? format(completionDateObj, "PPP", { locale: zhCN })
                  : "选择日期"}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={completionDateObj}
                  onSelect={(date) => {
                    setCompletionDateObj(date);
                    if (date) {
                      setCompletionDate(format(date, "yyyy-MM-dd"));
                    }
                  }}
                  locale={zhCN}
                  disabled={(date) => date < new Date("2000-01-01") || date > new Date("2099-12-31")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label className="text-sm font-medium">作者联系方式 <span className="text-red-500">*</span></label>
            <Input
              placeholder="请输入 QQ 号或微信号"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Label className="text-sm font-medium">操作系统 <span className="text-red-500">*</span></Label>
              <Select value={os} onValueChange={(v) => v && setOs(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择操作系统" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="macOS">macOS</SelectItem>
                  <SelectItem value="Windows">Windows</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Label className="text-sm font-medium">使用工具 <span className="text-red-500">*</span></Label>
              <Select value={tool} onValueChange={(v) => v && setTool(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择使用工具" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Keynote">Keynote</SelectItem>
                  <SelectItem value="PowerPoint">PowerPoint</SelectItem>
                  <SelectItem value="WPS">WPS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
                    <a data-fancybox="upload" href={url}>
                      <img
                        src={url}
                        alt={`作品图片 ${i + 1}`}
                        className="h-32 w-32 rounded-md border object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    </a>
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

          <div className="flex justify-start py-2">
            <div ref={turnstileRef} />
          </div>

          <div className="flex items-center gap-3">
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <AlertDialogTrigger
                render={
                  <Button disabled={submitting || imageUrls.length === 0 || !turnstileToken} />
                }
              >
                <Upload className="mr-1 size-4" />
                {editing ? (submitting ? "保存中..." : "保存修改") : (submitting ? "提交中..." : "提交作品")}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{editing ? "保存确认" : "提交确认"}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {editing ? "确认保存修改后的内容？" : "我承诺该作品系本人 / 组织自主创作，如有抄袭或侵权，愿意承担法律责任。提交后不可修改。"}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleSubmit}
                  >
                    {editing ? "确认保存" : "确认提交"}
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

      {/* 作品提交须知弹窗 */}
      <Dialog open={noticeDialogOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              作品提交须知
            </DialogTitle>
            <DialogDescription>
              提交作品前，请仔细阅读并同意以下条款
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <a
              href="https://intereco.feishu.cn/wiki/KcEbw0c5riLNRmkGltccQ7O8nec"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary shrink-0"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <div className="min-w-0">
                <p className="font-medium">《IPOA 赛事作品提交须知》</p>
                <p className="text-xs text-muted-foreground">点击查看完整条款内容</p>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-auto shrink-0 text-muted-foreground"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </a>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notice-checkbox"
                checked={noticeRead}
                onChange={(e) => setNoticeRead(e.target.checked)}
                className="size-4 rounded border-gray-300 cursor-pointer"
              />
              <label htmlFor="notice-checkbox" className="text-sm cursor-pointer select-none">
                我已阅读并同意遵守
              </label>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setNoticeDialogOpen(false);
                  router.back();
                }}
              >
                取消
              </Button>
              <Button
                className="flex-1"
                disabled={!noticeRead}
                onClick={() => setNoticeDialogOpen(false)}
              >
                继续提交
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
