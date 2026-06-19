"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageTitle } from "@/components/page-title";

interface VoteWork {
  id: number;
  title: string;
  owner: string;
  image_url: string;
  work_type: string;
  vote_count: number;
}

export default function VotePage() {
  const [works, setWorks] = useState<VoteWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<number | null>(null);
  const [votedSubmissionId, setVotedSubmissionId] = useState<number | null>(null);
  const [votingOpen, setVotingOpen] = useState(true);
  const [message, setMessage] = useState("");

  const fetchVotes = async () => {
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
  };

  useEffect(() => {
    fetchVotes();
  }, []);

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
      <div className="space-y-6">
        <PageTitle title="人气之星投票" />
        <h1 className="text-2xl font-semibold">人气之星投票</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <div className="aspect-[4/3] bg-muted animate-pulse rounded-t-lg" />
              <CardContent className="p-4 space-y-2">
                <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle title="人气之星投票" />
      <h1 className="text-2xl font-semibold">人气之星投票</h1>

      {!votingOpen && (
        <p className="text-sm text-muted-foreground">投票暂未开放或已结束，请关注活动通知。</p>
      )}

      {message && (
        <p className={`text-sm ${message.includes("成功") ? "text-green-600" : "text-red-500"}`}>
          {message}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {works.map((work) => (
          <Card key={work.id} className="overflow-hidden">
            <div className="aspect-[4/3] bg-muted overflow-hidden">
              <img
                src={work.image_url}
                alt={work.title}
                className="w-full h-full object-cover"
              />
            </div>
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="font-medium truncate">{work.title}</p>
                <p className="text-sm text-muted-foreground">{work.owner}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {work.vote_count} 票
                </span>
                <Button
                  size="sm"
                  variant={votedSubmissionId === work.id ? "default" : "outline"}
                  disabled={!votingOpen || voting !== null || votedSubmissionId !== null}
                  onClick={() => handleVote(work.id)}
                >
                  {voting === work.id
                    ? "投票中..."
                    : votedSubmissionId === work.id
                      ? "已投票"
                      : "投票"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {works.length === 0 && (
        <p className="text-center text-muted-foreground py-12">暂无参赛作品</p>
      )}
    </div>
  );
}
