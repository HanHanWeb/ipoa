"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Upload, ImagePlus, X, Calendar as CalendarIcon, Clock, FileUp, File, Link2, Loader2 } from "lucide-react";
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
  work_note: string;
  final_score: number | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
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
  const [workNote, setWorkNote] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [uploadMode, setUploadMode] = useState<"file" | "link">("file");
  const [uploadedFile, setUploadedFile] = useState<{ key: string; name: string; size: number; url: string } | null>(null);
  const [workUploading, setWorkUploading] = useState(false);
  const [workUploadProgress, setWorkUploadProgress] = useState(0);
  const workFileRef = useRef<HTMLInputElement>(null);
  const [reviewStageStarted, setReviewStageStarted] = useState(false);
  const [stageUploadStarted, setStageUploadStarted] = useState(false);
  const [resultStageStarted, setResultStageStarted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [noticeDialogOpen, setNoticeDialogOpen] = useState(false);
  const [noticeRead, setNoticeRead] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const originalImageUrls = useRef<string[]>([]);
  const originalDownloadUrl = useRef<string>("");

  const hasSubmitted = submissions.length > 0;
  const submitted = hasSubmitted ? submissions[0] : null;

  useEffect(() => {
    Promise.all([
      fetch("/api/submissions").then((res) => res.json()),
      fetch("/api/settings").then((res) => res.json()),
    ])
      .then(([subData, settingsData]) => {
        const subs = subData.submissions || [];
        setSubmissions(subs);
        if (subs.length === 0) {
          setNoticeDialogOpen(true);
        }

        const now = new Date();
        const reviewStart = settingsData.stage_review_start ? new Date(settingsData.stage_review_start) : null;
        setReviewStageStarted(reviewStart ? now >= reviewStart : false);
        const uploadStart = settingsData.stage_upload_start ? new Date(settingsData.stage_upload_start) : null;
        setStageUploadStarted(uploadStart ? now >= uploadStart : false);
        const resultStart = settingsData.stage_result_start ? new Date(settingsData.stage_result_start) : null;
        setResultStageStarted(resultStart ? now >= resultStart : false);
      })
      .catch(() => {})
      .finally(() => setPageLoading(false));
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
      let successCount = 0;
      for (const file of toUpload) {
        let presignRes: Response;
        try {
          presignRes = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`);
        } catch {
          setMessage(`"${file.name}" 网络错误，已成功上传 ${successCount} 张`);
          setUploading(false);
          if (fileRef.current) fileRef.current.value = "";
          return;
        }

        if (!presignRes.ok) {
          let errMsg = "上传失败";
          try {
            const err = await presignRes.json();
            errMsg = err.error || `服务器返回错误 (${presignRes.status})`;
          } catch {
            errMsg = `服务器返回错误 (${presignRes.status})`;
          }
          setMessage(`"${file.name}" ${errMsg}，已成功上传 ${successCount} 张，请检查文件格式或大小后重新上传`);
          setUploading(false);
          if (fileRef.current) fileRef.current.value = "";
          return;
        }

        const { uploadUrl, imageUrl } = await presignRes.json();

        let cosRes: Response;
        try {
          cosRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type || "image/jpeg" },
            body: file,
          });
        } catch {
          setMessage(`"${file.name}" 上传失败，已成功上传 ${successCount} 张，请检查文件格式或大小后重新上传`);
          setUploading(false);
          if (fileRef.current) fileRef.current.value = "";
          return;
        }

        if (!cosRes.ok) {
          setMessage(`"${file.name}" 上传失败 (${cosRes.status})，已成功上传 ${successCount} 张，请检查文件格式或大小后重新上传`);
          setUploading(false);
          if (fileRef.current) fileRef.current.value = "";
          return;
        }

        setImageUrls((prev) => [...prev, imageUrl]);
        successCount++;
      }

      setMessage(`成功上传 ${successCount} 张图片`);
    } catch (err) {
      setMessage(`上传出错：${err instanceof Error ? err.message : "未知错误"}，请检查文件格式或大小后重新上传`);
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleWorkFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExts = [".zip"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedExts.includes(ext)) {
      setMessage("仅支持 .zip 格式文件");
      return;
    }

    if (file.size > 200 * 1024 * 1024) {
      setMessage("文件超过 200MB 限制");
      return;
    }

    // Delete old file if re-uploading
    if (uploadedFile) {
      try {
        await fetch("/api/upload/work", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: uploadedFile.key || undefined, url: uploadedFile.url || undefined }),
        });
      } catch { /* ignore delete error */ }
    }

    setWorkUploading(true);
    setWorkUploadProgress(0);
    setMessage("");

    try {
      // Get presigned URL
      const params = new URLSearchParams({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        fileSize: String(file.size),
      });
      const res = await fetch(`/api/upload/work?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "获取上传地址失败");

      // Upload directly to S3 with progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setWorkUploadProgress(Math.round((ev.loaded / ev.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`上传失败 (${xhr.status})`));
          }
        };
        xhr.onerror = () => reject(new Error("上传失败"));
        xhr.open("PUT", data.uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        xhr.send(file);
      });

      setUploadedFile({ key: data.key, name: file.name, size: file.size, url: data.fileUrl });
      setDownloadUrl(data.fileUrl);
      setMessage("");
    } catch (err) {
      setMessage(`上传出错：${err instanceof Error ? err.message : "未知错误"}，请检查文件格式或大小后重新上传`);
    }

    setWorkUploading(false);
    if (workFileRef.current) workFileRef.current.value = "";
  };

  const handleDeleteUploadedFile = async () => {
    if (!uploadedFile) return;
    try {
      await fetch("/api/upload/work", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: uploadedFile.key || undefined, url: uploadedFile.url || undefined }),
      });
    } catch { /* ignore */ }
    setUploadedFile(null);
    setDownloadUrl("");
    setWorkUploadProgress(0);
  };

  const refetchSubmissions = () => {
    fetch("/api/submissions")
      .then((res) => res.json())
      .then((data) => setSubmissions(data.submissions || []))
      .catch(() => {});
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

    if (!turnstileToken) {
      setMessage("请完成人机验证");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
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
        work_note: workNote,
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
        setDialogOpen(false);
        setMessage(editing ? "修改成功！" : "提交成功！");

        // Clean up orphaned files after successful edit
        if (editing) {
          setEditing(false);
          // Delete removed images from COS
          const removedImages = originalImageUrls.current.filter((url) => !imageUrls.includes(url));
          for (const imgUrl of removedImages) {
            fetch("/api/upload", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: imgUrl }),
            }).catch(() => {});
          }
          // Delete old S3 file if download URL changed
          if (originalDownloadUrl.current && originalDownloadUrl.current !== downloadUrl && originalDownloadUrl.current.includes("rains3.com/")) {
            fetch("/api/upload/work", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: originalDownloadUrl.current }),
            }).catch(() => {});
          }
        }

        refetchSubmissions();
        return;
      } else {
        const err = await res.json();
        setMessage(err.error || (editing ? "修改失败" : "提交失败"));
      }
    } catch {
      setMessage("网络错误，请检查网络连接后重试");
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

    const reviewComplete = submitted.final_score !== null;

    return (
      <div className="space-y-6">
        <PageTitle title="作品提交" />
        <h1 className="text-2xl font-semibold">作品提交</h1>

        <div className="flex flex-col gap-6 lg:flex-row">
          <Card className="flex-1 min-w-0">
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
                    setWorkNote(submitted.work_note || "");
                    setDownloadUrl(submitted.download_url || "");
                    if (submitted.download_url?.includes("rains3.com/")) {
                      setUploadMode("file");
                      const parts = submitted.download_url.split("/");
                      const fileName = parts[parts.length - 1]?.replace(/^\d+_/, "") || "文件";
                      setUploadedFile({ key: "", name: fileName, size: 0, url: submitted.download_url });
                    } else {
                      setUploadMode("link");
                      setUploadedFile(null);
                    }
                    originalDownloadUrl.current = submitted.download_url || "";
                    let editUrls: string[] = [];
                    try {
                      const parsed = JSON.parse(submitted.image_url);
                      editUrls = Array.isArray(parsed) ? parsed : [submitted.image_url];
                    } catch {
                      editUrls = [submitted.image_url];
                    }
                    setImageUrls(editUrls);
                    originalImageUrls.current = [...editUrls];
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
                <Label className="text-sm text-muted-foreground">作品类型</Label>
                <p className="mt-1">{submitted.work_type || "未填写"}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">作品所有人 / 组织</Label>
                <p className="mt-1">{submitted.owner || "未填写"}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">作品名</Label>
                <p className="mt-1">{submitted.title || "未填写"}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">作品版本号</Label>
                <p className="mt-1">{submitted.version || "未填写"}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">作品完成日期</Label>
                <p className="mt-1">{submitted.completion_date || "未填写"}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">作者联系方式</Label>
                <p className="mt-1">{submitted.contact || "未填写"}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">操作系统</Label>
                <p className="mt-1">{submitted.os || "未填写"}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">使用工具</Label>
                <p className="mt-1">{submitted.tool || "未填写"}</p>
              </div>
              {(submitted.work_type === "临摹" || submitted.work_type === "改编") && (
                <div className="sm:col-span-2">
                  <Label className="text-sm text-muted-foreground">原作品出处</Label>
                  <p className="mt-1">
                    {submitted.source_url ? (
                      <a href={submitted.source_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        {submitted.source_url}
                      </a>
                    ) : "未填写"}
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">作品简介</Label>
              <p className="mt-1">{submitted.description || "未填写"}</p>
            </div>

            {submitted.work_note && (
              <div>
                <Label className="text-sm text-muted-foreground">作品说明</Label>
                <p className="mt-1 whitespace-pre-wrap">{submitted.work_note}</p>
              </div>
            )}

            {submitted.download_url && (
              <div>
                <Label className="text-sm text-muted-foreground">作品文件</Label>
                <p className="mt-1">
                  {submitted.download_url.includes("rains3.com/") ? (
                    <a href={submitted.download_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary underline">
                      <File className="size-4" />
                      {submitted.download_url.split("/").pop()?.replace(/^\d+_/, "") || "下载文件"}
                    </a>
                  ) : (
                    <a href={submitted.download_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      {submitted.download_url}
                    </a>
                  )}
                </p>
              </div>
            )}

            <div>
              <Label className="text-sm text-muted-foreground">作品图片</Label>
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

          {/* 审核记录 */}
          <Card className="w-full lg:w-96 shrink-0">
            <CardHeader>
              <CardTitle className="text-base">参赛进度</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6">
                {/* 竖线 */}
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

                <div className="space-y-6">
                  {/* 作品已提交 */}
                  <div className="relative">
                    <div className="absolute -left-6 top-1 size-3.5 rounded-full border-2 bg-primary border-primary" />
                    <div>
                      <p className="font-medium text-sm">作品已提交</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {submitted.created_at ? new Date(submitted.created_at).toLocaleString("zh-CN") : ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">您的参赛作品已成功提交，我们将尽快审核。</p>
                    </div>
                  </div>

                  {/* 评审中 */}
                  <div className="relative">
                    <div className={`absolute -left-6 top-1 size-3.5 rounded-full border-2 ${reviewStageStarted ? "bg-primary border-primary" : "bg-background border-muted-foreground/30"}`} />
                    <div>
                      <p className={`font-medium text-sm ${reviewStageStarted ? "" : "text-muted-foreground"}`}>评审中</p>
                      {reviewStageStarted && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          评委正在评审您的报名信息，请耐心等待。
                        </p>
                      )}
                      {!reviewStageStarted && (
                        <p className="text-xs text-muted-foreground mt-1">等待评审开始</p>
                      )}
                    </div>
                  </div>

                  {/* 评审完成 */}
                  <div className="relative">
                    <div className={`absolute -left-6 top-1 size-3.5 rounded-full border-2 ${reviewComplete ? "bg-primary border-primary" : "bg-background border-muted-foreground/30"}`} />
                    <div>
                      <p className={`font-medium text-sm ${reviewComplete ? "" : "text-muted-foreground"}`}>评审完成</p>
                      {reviewComplete && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          恭喜！您的参赛作品已完成评审。
                        </p>
                      )}
                      {!reviewComplete && (
                        <p className="text-xs text-muted-foreground mt-1">评审进行中</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Upload stage not started yet
  if (!stageUploadStarted && !hasSubmitted) {
    return (
      <div className="space-y-6">
        <PageTitle title="作品提交" />
        <h1 className="text-2xl font-semibold">作品提交</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="mb-4 size-12 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">作品提交暂未开放</p>
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
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">作品类型 <span className="text-red-500">*</span></Label>
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
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">原作品出处 <span className="text-red-500">*</span></Label>
              <Input
                placeholder="请输入原作品链接"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">作品所有人 / 组织 <span className="text-red-500">*</span></Label>
            <Input
              placeholder="请输入个人姓名或组织名称"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">作品名 <span className="text-red-500">*</span></Label>
            <Input
              placeholder="请输入作品名称"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">作品简介 <span className="text-red-500">*</span></Label>
            <Textarea
              placeholder="请简要描述您的作品"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div>
              <Label className="text-sm">作品文件 <span className="text-red-500">*</span></Label>
              <p className="mt-1 text-xs text-muted-foreground">如有额外字体请随作品一并打包提交，避免作品打开异常、字体缺失问题。</p>
            </div>
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                variant={uploadMode === "file" ? "default" : "outline"}
                size="sm"
                onClick={() => { setUploadMode("file"); if (!uploadedFile) setDownloadUrl(""); }}
              >
                <FileUp className="size-4 mr-1" />
                在线上传
              </Button>
              <Button
                type="button"
                variant={uploadMode === "link" ? "default" : "outline"}
                size="sm"
                onClick={() => { setUploadMode("link"); setDownloadUrl(""); }}
              >
                <Link2 className="size-4 mr-1" />
                填写网盘链接
              </Button>
            </div>

            {uploadMode === "file" ? (
              <div className="space-y-2">
                <input
                  ref={workFileRef}
                  type="file"
                  accept=".zip"
                  onChange={handleWorkFileSelect}
                  className="hidden"
                />
                {uploadedFile ? (
                  <div className="flex items-center gap-3 rounded-md border p-3">
                    <File className="size-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                      {uploadedFile.size > 0 && (
                        <p className="text-xs text-muted-foreground">{formatFileSize(uploadedFile.size)}</p>
                      )}
                    </div>
                    {!workUploading && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => workFileRef.current?.click()}
                      >
                        重新上传
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={handleDeleteUploadedFile}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => workFileRef.current?.click()}
                    disabled={workUploading}
                  >
                    <Upload className="size-4 mr-2" />
                    {workUploading ? "上传中..." : "选择文件"}
                  </Button>
                )}
                {workUploading && (
                  <div className="space-y-1">
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${workUploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">{workUploadProgress}%</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">仅支持 .zip 格式，最大 200MB</p>
              </div>
            ) : (
              <Input
                placeholder="请输入作品下载链接"
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
              />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div>
              <Label className="text-sm">作品说明</Label>
              <p className="mt-1 text-xs text-muted-foreground">同步提交作品说明文档以辅助评委快速理解作品创作思路与设计理念（可选）</p>
            </div>
            <Textarea
              placeholder="请输入作品创作思路与设计理念"
              value={workNote}
              onChange={(e) => setWorkNote(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">作品版本号 <span className="text-red-500">*</span></Label>
            <Input
              placeholder="v1.0"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">作品完成日期 <span className="text-red-500">*</span></Label>
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

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">作者联系方式 <span className="text-red-500">*</span></Label>
            <Input
              placeholder="请输入 QQ 号或微信号"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">操作系统 <span className="text-red-500">*</span></Label>
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

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">使用工具 <span className="text-red-500">*</span></Label>
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

          <div className="flex flex-col gap-1.5">
            <div>
              <Label className="text-sm">作品图片 <span className="text-red-500">*</span></Label>
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
                      onClick={async () => {
                        const deletedUrl = url;
                        setImageUrls((prev) => prev.filter((_, j) => j !== i));
                        try {
                          await fetch("/api/upload", {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ url: deletedUrl }),
                          });
                        } catch { /* ignore */ }
                      }}
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
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        {editing ? "正在保存修改..." : "正在提交作品..."}
                      </span>
                    ) : (
                      editing ? "确认保存修改后的内容？" : "我承诺该作品系本人 / 组织自主创作，如有抄袭或侵权，愿意承担法律责任。提交后不可修改。"
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={submitting}>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting && <Loader2 className="mr-1 size-4 animate-spin" />}
                    {editing ? (submitting ? "保存中..." : "确认保存") : (submitting ? "提交中..." : "确认提交")}
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
        <DialogContent className="sm:max-w-[425px]">
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
              <Label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={noticeRead}
                  onCheckedChange={(checked) => setNoticeRead(checked === true)}
                />
                我已阅读并同意遵守
              </Label>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setNoticeDialogOpen(false);
                  router.push("/dashboard");
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
