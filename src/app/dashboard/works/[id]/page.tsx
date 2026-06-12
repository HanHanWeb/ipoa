"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PageTitle } from "@/components/page-title";

interface WorkDetail {
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
  download_url: string;
  user_name: string;
  user_email: string;
  user_avatar: string;
}

interface Score {
  id: number;
  submission_id: number;
  reviewer_id: string;
  score: number;
  comment: string;
  reviewer_name: string;
  reviewer_avatar: string;
  updated_at: string;
}

interface Reviewer {
  id: string;
  name: string;
  avatar: string;
}

export default function WorkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [work, setWork] = useState<WorkDetail | null>(null);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  const [scores, setScores] = useState<Score[]>([]);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [myScore, setMyScore] = useState("");
  const [myComment, setMyComment] = useState("");
  const [scoring, setScoring] = useState(false);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [isPublicStage, setIsPublicStage] = useState(false);
  const [selectedScore, setSelectedScore] = useState<Score | null>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [finalScoreInput, setFinalScoreInput] = useState("");
  const [settingFinalScore, setSettingFinalScore] = useState(false);
  const [finalScoreDialogOpen, setFinalScoreDialogOpen] = useState(false);

  const canScore = role === "reviewer";
  const canViewScores = ["admin", "reviewer"].includes(role);
  const isAdmin = role === "admin";

  useEffect(() => {
    fetch("/api/works")
      .then((res) => res.json())
      .then((data) => {
        const found = (data.works || []).find(
          (w: WorkDetail) => String(w.id) === String(params.id)
        );
        setWork(found || null);
        setRole(data.role || "");
        setLoading(false);
      });
  }, [params.id]);

  useEffect(() => {
    if (!canViewScores || !work) return;
    setScoreLoading(true);
    Promise.all([
      fetch(`/api/scores?submissionId=${work.id}`).then((r) => {
        if (!r.ok) throw new Error("scores failed");
        return r.json();
      }),
      fetch("/api/auth/me").then((r) => {
        if (!r.ok) throw new Error("auth failed");
        return r.json();
      }),
      fetch("/api/settings").then((r) => {
        if (!r.ok) throw new Error("settings failed");
        return r.json();
      }),
    ]).then(([scoreData, meData, settingsData]) => {
      setScores(scoreData.scores || []);
      setReviewers(scoreData.reviewers || []);
      setCurrentUserId(meData.user?.id || "");
      setFinalScore(scoreData.final_score ?? null);

      if (settingsData.stage_result_start) {
        const resultDate = new Date(settingsData.stage_result_start);
        if (!isNaN(resultDate.getTime()) && new Date() >= resultDate) {
          setIsPublicStage(true);
        }
      }

      const existing = (scoreData.scores || []).find(
        (s: Score) => s.reviewer_id === meData.user?.id
      );
      if (existing) {
        setMyScore(String(existing.score));
        setMyComment(existing.comment || "");
      }

      setScoreLoading(false);
    }).catch((err) => {
      console.error("Load scores error:", err);
      setScoreLoading(false);
    });
  }, [canViewScores, work]);

  const getImageUrls = (imageUrl: string): string[] => {
    try {
      const parsed = JSON.parse(imageUrl);
      return Array.isArray(parsed) ? parsed : [imageUrl];
    } catch {
      return [imageUrl];
    }
  };

  const handleSubmitScore = async () => {
    if (!work || !myScore) return;
    const scoreNum = parseInt(myScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      alert("分数需在0-100之间");
      return;
    }
    setScoring(true);
    const res = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId: work.id,
        score: scoreNum,
        comment: myComment,
      }),
    });
    if (res.ok) {
      const scoreRes = await fetch(`/api/scores?submissionId=${work.id}`);
      const scoreData = await scoreRes.json();
      setScores(scoreData.scores || []);
    } else {
      const err = await res.json();
      alert(err.error || "打分失败");
    }
    setScoring(false);
  };

  const handleSetFinalScore = async () => {
    if (!work || !finalScoreInput) return;
    const scoreNum = parseInt(finalScoreInput);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      alert("分数需在0-100之间");
      return;
    }
    setSettingFinalScore(true);
    const res = await fetch("/api/scores", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId: work.id,
        finalScore: scoreNum,
      }),
    });
    if (res.ok) {
      setFinalScore(scoreNum);
      setFinalScoreInput("");
    } else {
      const err = await res.json();
      alert(err.error || "设定失败");
    }
    setSettingFinalScore(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 rounded bg-muted animate-pulse" />
        <div className="h-7 w-48 rounded bg-muted animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="aspect-video w-full rounded-lg bg-muted animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                  <div className="h-5 w-24 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          <div className="h-64 rounded-lg border bg-muted/50 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 size-4" />
          返回
        </Button>
        <p className="text-muted-foreground">作品不存在</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageTitle title="作品详情" />
      <Button variant="ghost" onClick={() => router.back()} className="shrink-0">
        <ArrowLeft className="mr-1 size-4" />
        返回
      </Button>

      <div className={`flex flex-col md:flex-row gap-4 ${canViewScores ? "" : "justify-center"}`}>
        {/* 左侧 - 作品信息 */}
        <div className={canViewScores ? "w-full md:flex-1 min-w-0" : "w-full max-w-2xl"}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{work.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">提交者</p>
                  <p className="font-medium">{work.user_name || work.owner}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">所有人</p>
                  <p className="font-medium">{work.owner}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">作品类型</p>
                  <p className="font-medium">{work.work_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">操作系统</p>
                  <p className="font-medium">{work.os}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">使用工具</p>
                  <p className="font-medium">{work.tool}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">版本</p>
                  <p className="font-medium">{work.version}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">完成日期</p>
                  <p className="font-medium">{work.completion_date}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">联系方式</p>
                  <p className="font-medium">{work.contact}</p>
                </div>
              </div>

              {work.source_url && (
                <div>
                  <p className="text-sm text-muted-foreground">源文件</p>
                  <a
                    href={work.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline"
                  >
                    查看源文件
                  </a>
                </div>
              )}

              {work.download_url && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {work.download_url.includes("rains3.com/") ? "作品文件" : "下载链接"}
                  </p>
                  <a
                    href={work.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline"
                  >
                    {work.download_url.includes("rains3.com/") ? "下载文件" : "下载作品"}
                  </a>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">作品简介</p>
                <p className="mt-1 text-sm">{work.description}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">作品图片</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {getImageUrls(work.image_url).map((url, i) => (
                    <a key={i} data-fancybox="gallery" href={url}>
                      <img
                        src={url}
                        alt={`作品 ${i + 1}`}
                        className="h-20 w-20 rounded border object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">提交时间：{work.created_at}</p>

            </CardContent>
          </Card>
        </div>

        {/* 右侧 - 打分栏（admin/reviewer可见，仅reviewer可打分） */}
        {canViewScores && (
          <div className="w-full md:w-[500px] shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    评委打分
                    {isPublicStage && (
                      <span className="text-xs font-normal text-muted-foreground">
                        公示阶段，打分已锁定
                      </span>
                    )}
                  </div>
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (finalScore !== null) {
                          setFinalScoreInput(String(finalScore));
                        }
                        setFinalScoreDialogOpen(true);
                      }}
                    >
                      {finalScore !== null ? "修改最终分数" : "设定最终分数"}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {scoreLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-md border px-3 py-2">
                        <div className="size-6 rounded-full bg-muted animate-pulse" />
                        <div className="flex-1 space-y-1">
                          <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                        </div>
                        <div className="h-5 w-8 rounded bg-muted animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {/* 我的打分 - 仅评委可见 */}
                    {canScore && (
                    <div className="space-y-3 rounded-md border p-4">
                      <p className="text-sm font-medium">我的打分</p>
                      <div className="space-y-3">
                        <div className="w-24 space-y-1">
                          <Label htmlFor="my-score" className="text-xs">分数 (0-100)</Label>
                          <Input
                            id="my-score"
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={myScore}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "" || (Number.isInteger(Number(val)) && Number(val) >= 0 && Number(val) <= 100)) {
                                setMyScore(val);
                              }
                            }}
                            disabled={isPublicStage}
                            placeholder="0-100 整数"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="my-comment" className="text-xs">评语</Label>
                          <Textarea
                            id="my-comment"
                            value={myComment}
                            onChange={(e) => setMyComment(e.target.value)}
                            disabled={isPublicStage}
                            placeholder="输入评语（可选）"
                            rows={3}
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={handleSubmitScore}
                          disabled={scoring || isPublicStage || !myScore}
                        >
                          {scoring ? "提交中..." : "提交打分"}
                        </Button>
                      </div>
                    </div>
                    )}

                    {/* 最终分数 */}
                    {finalScore !== null && (
                      <div
                        className={`rounded-md border-2 border-primary p-4 text-center ${
                          isAdmin ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""
                        }`}
                        onClick={() => {
                          if (isAdmin) {
                            setFinalScoreInput(String(finalScore));
                            setFinalScoreDialogOpen(true);
                          }
                        }}
                      >
                        <p className="text-3xl font-bold text-primary">{finalScore}</p>
                        <p className="text-sm font-medium text-muted-foreground mt-1">最终分数</p>
                      </div>
                    )}

                    {/* 分数统计 */}
                    {scores.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-md border p-3 text-center">
                          <p className="text-2xl font-bold text-[#05bc5e]">{Math.max(...scores.map(s => s.score))}</p>
                          <p className="text-xs text-muted-foreground mt-1">最高分</p>
                        </div>
                        <div className="rounded-md border p-3 text-center">
                          <p className="text-2xl font-bold text-red-500">{Math.min(...scores.map(s => s.score))}</p>
                          <p className="text-xs text-muted-foreground mt-1">最低分</p>
                        </div>
                        <div className="rounded-md border p-3 text-center">
                          <p className="text-2xl font-bold text-primary">{Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length)}</p>
                          <p className="text-xs text-muted-foreground mt-1">平均分</p>
                        </div>
                      </div>
                    )}

                    {/* 所有打分列表 */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">所有打分</p>
                      {reviewers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">暂无评委</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {reviewers.map((reviewer) => {
                            const scored = scores.find((s) => s.reviewer_id === reviewer.id);
                            const isMe = reviewer.id === currentUserId;
                            return (
                              <div
                                key={reviewer.id}
                                className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
                                  isMe ? "bg-muted/50" : ""
                                } ${scored ? "cursor-pointer hover:border-primary/50 transition-colors" : ""}`}
                                onClick={() => { if (scored) setSelectedScore(scored); }}
                              >
                                <div className="flex items-center gap-2">
                                  <Avatar className="size-6 after:border-0">
                                    <AvatarImage src={reviewer.avatar} alt={reviewer.name} />
                                    <AvatarFallback>
                                      {reviewer.name?.charAt(0)?.toUpperCase() || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <span className="text-xs font-medium truncate block">
                                      {reviewer.name}
                                      {isMe && (
                                        <span className="ml-0.5 text-muted-foreground">（我）</span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                                {scored ? (
                                  <span className="text-base font-medium text-primary ml-1">{scored.score}</span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground ml-1">未打分</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Score Detail Dialog */}
      <Dialog open={!!selectedScore} onOpenChange={(o) => { if (!o) setSelectedScore(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>评分详情</DialogTitle>
          </DialogHeader>
          {selectedScore && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-10 after:border-0">
                  <AvatarImage src={selectedScore.reviewer_avatar} alt={selectedScore.reviewer_name} />
                  <AvatarFallback>
                    {selectedScore.reviewer_name?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedScore.reviewer_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedScore.updated_at ? new Date(selectedScore.updated_at).toLocaleString("zh-CN") : ""}
                  </p>
                </div>
              </div>
              <div className="rounded-md border p-4 text-center">
                <p className="text-3xl font-bold text-primary">{selectedScore.score}</p>
                <p className="text-xs text-muted-foreground mt-1">评分</p>
              </div>
              {selectedScore.comment && (
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground mb-1">评审意见</p>
                  <p className="text-sm">{selectedScore.comment}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Final Score Dialog */}
      <Dialog open={finalScoreDialogOpen} onOpenChange={setFinalScoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>设定最终分数</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="final-score">最终分数 (0-100)</Label>
              <Input
                id="final-score"
                type="number"
                min={0}
                max={100}
                step={1}
                value={finalScoreInput}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || (Number.isInteger(Number(val)) && Number(val) >= 0 && Number(val) <= 100)) {
                    setFinalScoreInput(val);
                  }
                }}
                placeholder="0-100 整数"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFinalScoreDialogOpen(false);
                  setFinalScoreInput("");
                }}
              >
                取消
              </Button>
              <Button
                onClick={async () => {
                  await handleSetFinalScore();
                  setFinalScoreDialogOpen(false);
                }}
                disabled={settingFinalScore || !finalScoreInput}
              >
                {settingFinalScore ? "设定中..." : "确认设定"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
