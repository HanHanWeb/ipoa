"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageTitle } from "@/components/page-title";
import { ThumbsUp, Timer, CheckCircle2, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface VoteWork {
  id: number;
  title: string;
  images: string[];
  work_type: string;
  os: string;
  tool: string;
  vote_count: number;
}

function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % images.length);
        setFade(true);
      }, 400);
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div className="aspect-video bg-muted flex items-center justify-center text-muted-foreground text-sm">
        暂无图片
      </div>
    );
  }

  return (
    <div className="aspect-video bg-muted overflow-hidden relative">
      <img
        src={images[current]}
        alt={alt}
        crossOrigin="anonymous"
        className={`w-full h-full object-cover transition-opacity duration-500 ${fade ? "opacity-100" : "opacity-0"}`}
      />
      {images.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
          {images.map((_, i) => (
            <span
              key={i}
              className={`block w-1.5 h-1.5 rounded-full transition-colors ${i === current ? "bg-white" : "bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function VotePage() {
  const [works, setWorks] = useState<VoteWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<number | null>(null);
  const [votedSubmissionId, setVotedSubmissionId] = useState<number | null>(null);
  const [votingOpen, setVotingOpen] = useState(true);
  const [voteEnd, setVoteEnd] = useState("");
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: false });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"success" | "error">("success");
  const [dialogMessage, setDialogMessage] = useState("");

  const showDialog = useCallback((message: string, type: "success" | "error") => {
    setDialogMessage(message);
    setDialogType(type);
    setDialogOpen(true);
  }, []);

  const fetchVotes = useCallback(async () => {
    try {
      const res = await fetch("/api/votes");
      const data = await res.json();
      setWorks(data.works || []);
      setVotedSubmissionId(data.votedSubmissionId);
      setVotingOpen(data.votingOpen);
      setVoteEnd(data.voteEnd || "");
    } catch {
      showDialog("加载投票数据失败", "error");
    } finally {
      setLoading(false);
    }
  }, [showDialog]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  useEffect(() => {
    if (!voteEnd) return;
    const updateCountdown = () => {
      const end = new Date(voteEnd).getTime();
      const now = Date.now();
      if (now >= end) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: true });
        return;
      }
      const diff = end - now;
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        ended: false,
      });
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [voteEnd]);

  const handleVote = async (submissionId: number) => {
    setVoting(submissionId);
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });
      const data = await res.json();
      if (res.ok) {
        showDialog("投票成功！感谢您的支持", "success");
        fetchVotes();
      } else {
        showDialog(data.error || "投票失败", "error");
      }
    } catch {
      showDialog("网络错误，请重试", "error");
    } finally {
      setVoting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <PageTitle title="人气之星投票" />
        <h1 className="text-xl font-semibold">人气之星投票</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-lg border overflow-hidden">
              <div className="aspect-video bg-muted animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-3 w-full bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isSuccess = dialogType === "success";

  return (
    <div className="space-y-4">
      <PageTitle title="人气之星投票" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-xl font-semibold">人气之星投票</h1>
        {voteEnd && (
          <div className="flex items-center gap-2">
            <Timer className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {countdown.ended ? "投票已结束" : "距投票结束"}
            </span>
            {!countdown.ended && (
              <div className="flex items-center gap-1">
                {countdown.days > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[2rem] h-7 px-1.5 rounded bg-primary/10 text-primary text-sm font-semibold tabular-nums">
                    {countdown.days}<span className="text-xs font-normal ml-0.5">天</span>
                  </span>
                )}
                <span className="inline-flex items-center justify-center min-w-[2rem] h-7 px-1.5 rounded bg-primary/10 text-primary text-sm font-semibold tabular-nums">
                  {String(countdown.hours).padStart(2, "0")}
                </span>
                <span className="text-primary font-bold text-xs">:</span>
                <span className="inline-flex items-center justify-center min-w-[2rem] h-7 px-1.5 rounded bg-primary/10 text-primary text-sm font-semibold tabular-nums">
                  {String(countdown.minutes).padStart(2, "0")}
                </span>
                <span className="text-primary font-bold text-xs">:</span>
                <span className="inline-flex items-center justify-center min-w-[2rem] h-7 px-1.5 rounded bg-primary/10 text-primary text-sm font-semibold tabular-nums">
                  {String(countdown.seconds).padStart(2, "0")}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {works.map((work) => (
          <div key={work.id} className="rounded-lg border overflow-hidden hover:shadow-md transition-shadow">
            <ImageCarousel images={work.images} alt={work.title} />
            <div className="p-3 space-y-2">
              <p className="font-medium text-sm truncate">{work.title}</p>
              <div className="flex flex-wrap gap-1">
                {work.work_type && (
                  <Badge variant="secondary" className="text-xs">{work.work_type}</Badge>
                )}
                {work.os && (
                  <Badge variant="outline" className="text-xs">{work.os}</Badge>
                )}
                {work.tool && (
                  <Badge variant="outline" className="text-xs">{work.tool}</Badge>
                )}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-semibold text-primary">
                  {work.vote_count} 票
                </span>
                <Button
                  size="sm"
                  variant={votedSubmissionId === work.id ? "default" : "outline"}
                  disabled={!votingOpen || voting !== null || votedSubmissionId !== null}
                  onClick={() => handleVote(work.id)}
                  className="h-7 px-2 text-xs"
                >
                  <ThumbsUp className="size-3.5 mr-1" />
                  {voting === work.id
                    ? "投票中..."
                    : votedSubmissionId === work.id
                      ? "已投票"
                      : "投票"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {works.length === 0 && (
        <p className="text-center text-muted-foreground py-8">暂无参赛作品</p>
      )}

      {/* 投票结果弹窗 */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className={isSuccess ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}>
              {isSuccess ? <CheckCircle2 /> : <XCircle />}
            </AlertDialogMedia>
            <AlertDialogTitle>{isSuccess ? "投票成功" : "投票失败"}</AlertDialogTitle>
            <AlertDialogDescription>{dialogMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setDialogOpen(false)}>
              确定
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
