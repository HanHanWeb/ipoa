"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageTitle } from "@/components/page-title";

interface VoteWork {
  id: number;
  title: string;
  owner: string;
  images: string[];
  work_type: string;
  description: string;
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

  return (
    <div className="aspect-square bg-muted overflow-hidden relative">
      <img
        src={images[current]}
        alt={alt}
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
  const [message, setMessage] = useState("");

  const fetchVotes = useCallback(async () => {
    try {
      const res = await fetch("/api/votes");
      const data = await res.json();
      setWorks(data.works || []);
      setVotedSubmissionId(data.votedSubmissionId);
      setVotingOpen(data.votingOpen);
    } catch {
      setMessage("加载投票数据失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  const handleVote = async (submissionId: number) => {
    setVoting(submissionId);
    setMessage("");
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("投票成功！");
        fetchVotes();
      } else {
        setMessage(data.error || "投票失败");
      }
    } catch {
      setMessage("网络错误，请重试");
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
              <div className="aspect-square bg-muted animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                <div className="h-3 w-full bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageTitle title="人气之星投票" />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">人气之星投票</h1>
        {!votingOpen && (
          <p className="text-sm text-muted-foreground">投票暂未开放或已结束</p>
        )}
        {message && (
          <p className={`text-sm ${message.includes("成功") ? "text-green-600" : "text-red-500"}`}>
            {message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {works.map((work) => (
          <div key={work.id} className="rounded-lg border overflow-hidden hover:shadow-md transition-shadow">
            <ImageCarousel images={work.images} alt={work.title} />
            <div className="p-3 space-y-2">
              <p className="font-medium text-sm truncate">{work.title}</p>
              <p className="text-xs text-muted-foreground truncate">{work.owner}</p>
              {work.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{work.description}</p>
              )}
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
    </div>
  );
}
