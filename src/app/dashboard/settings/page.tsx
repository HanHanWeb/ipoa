"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Save, Calendar as CalendarIcon, ListChecks } from "lucide-react";
import { PageTitle } from "@/components/page-title";

interface StageDate {
  date: Date | undefined;
  hour: string;
  minute: string;
}

function StageDatePicker({
  label,
  stage,
  onChange,
}: {
  label: string;
  stage: StageDate;
  onChange: (stage: StageDate) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex flex-col sm:flex-row gap-2">
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                data-empty={!stage.date}
                className="flex-1 justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
              />
            }
          >
            <CalendarIcon />
            {stage.date && !isNaN(stage.date.getTime())
              ? format(stage.date, "PPP", { locale: zhCN })
              : "选择日期"}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={stage.date}
              onSelect={(d) => onChange({ ...stage, date: d })}
              locale={zhCN}
            />
          </PopoverContent>
        </Popover>
        <Select value={stage.hour} onValueChange={(v) => v && onChange({ ...stage, hour: v })}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 24 }, (_, i) => (
              <SelectItem key={i} value={String(i).padStart(2, "0")}>
                {String(i).padStart(2, "0")}时
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stage.minute} onValueChange={(v) => v && onChange({ ...stage, minute: v })}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => (
              <SelectItem key={i} value={String(i * 5).padStart(2, "0")}>
                {String(i * 5).padStart(2, "0")}分
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

const defaultStage: StageDate = { date: undefined, hour: "00", minute: "00" };

export default function SettingsPage() {
  const [stageUpload, setStageUpload] = useState<StageDate>(defaultStage);
  const [stageReview, setStageReview] = useState<StageDate>(defaultStage);
  const [stageResult, setStageResult] = useState<StageDate>(defaultStage);
  const [voteStart, setVoteStart] = useState<StageDate>(defaultStage);
  const [voteEnd, setVoteEnd] = useState<StageDate>(defaultStage);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        const parseDate = (val: string | undefined): StageDate => {
          if (!val) return defaultStage;
          const d = new Date(val);
          if (isNaN(d.getTime())) return defaultStage;
          return {
            date: d,
            hour: String(d.getHours()).padStart(2, "0"),
            minute: String(d.getMinutes()).padStart(2, "0"),
          };
        };
        setStageUpload(parseDate(data.stage_upload_start));
        setStageReview(parseDate(data.stage_review_start));
        setStageResult(parseDate(data.stage_result_start));
        setVoteStart(parseDate(data.vote_start));
        setVoteEnd(parseDate(data.vote_end));
      });
  }, []);

  const buildISOString = (
    date: Date | undefined,
    hour: string,
    minute: string
  ) => {
    if (!date) return "";
    const d = new Date(date);
    d.setHours(Number(hour), Number(minute), 0, 0);
    const offset = "+08:00";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}:00${offset}`;
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage_upload_start: buildISOString(stageUpload.date, stageUpload.hour, stageUpload.minute),
        stage_review_start: buildISOString(stageReview.date, stageReview.hour, stageReview.minute),
        stage_result_start: buildISOString(stageResult.date, stageResult.hour, stageResult.minute),
        vote_start: buildISOString(voteStart.date, voteStart.hour, voteStart.minute),
        vote_end: buildISOString(voteEnd.date, voteEnd.hour, voteEnd.minute),
      }),
    });
    if (res.ok) {
      setMessage("保存成功");
    } else {
      setMessage("保存失败");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <PageTitle title="基础设置" />
      <h1 className="text-2xl font-semibold">基础设置</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="size-5" />
            活动阶段时间
          </CardTitle>
          <CardDescription>设置各阶段的开始时间，用于首页进度展示和倒计时</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <StageDatePicker label="作品提交 开始" stage={stageUpload} onChange={setStageUpload} />
            <StageDatePicker label="作品评审 开始" stage={stageReview} onChange={setStageReview} />
            <StageDatePicker label="结果公布 开始" stage={stageResult} onChange={setStageResult} />
            <StageDatePicker label="人气之星投票 开始" stage={voteStart} onChange={setVoteStart} />
            <StageDatePicker label="人气之星投票 结束" stage={voteEnd} onChange={setVoteEnd} />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-1 size-4" />
              {saving ? "保存中..." : "保存设置"}
            </Button>
            {message && (
              <span className="text-sm text-muted-foreground">{message}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
