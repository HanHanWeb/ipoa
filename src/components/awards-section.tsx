import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Award, Star, Flame, Heart, FileCheck, Eye, Package, Coins, CircleCheck } from "lucide-react";

interface Reward {
  label: string;
  icon: React.ReactNode;
}

interface AwardItem {
  title: string;
  ratio: string;
  icon: React.ReactNode;
  highlight?: boolean;
  rewards: Reward[];
  bg: string;
  iconBg: string;
  hoverBorder: string;
}

const awards: AwardItem[] = [
  {
    title: "一等奖",
    ratio: "占总参赛作品的 10%",
    icon: <Trophy className="size-5" />,
    highlight: true,
    rewards: [
      { label: "电子荣誉证书", icon: <FileCheck className="size-3.5" /> },
      { label: "优秀作品展示", icon: <Eye className="size-3.5" /> },
      { label: "社区周边、认证", icon: <Package className="size-3.5" /> },
      { label: "创作激励奖金", icon: <Coins className="size-3.5" /> },
    ],
    bg: "bg-amber-50",
    iconBg: "bg-amber-100 text-amber-600",
    hoverBorder: "hover:border-amber-300",
  },
  {
    title: "二等奖",
    ratio: "占总参赛作品的 20%",
    icon: <Award className="size-5" />,
    rewards: [
      { label: "电子荣誉证书", icon: <FileCheck className="size-3.5" /> },
      { label: "优秀作品展示", icon: <Eye className="size-3.5" /> },
      { label: "社区认证", icon: <CircleCheck className="size-3.5" /> },
    ],
    bg: "bg-blue-50",
    iconBg: "bg-blue-100 text-blue-600",
    hoverBorder: "hover:border-blue-300",
  },
  {
    title: "三等奖",
    ratio: "占总参赛作品的 30%",
    icon: <Award className="size-5" />,
    rewards: [
      { label: "电子荣誉证书", icon: <FileCheck className="size-3.5" /> },
      { label: "优秀作品展示", icon: <Eye className="size-3.5" /> },
      { label: "社区认证", icon: <CircleCheck className="size-3.5" /> },
    ],
    bg: "bg-orange-50",
    iconBg: "bg-orange-100 text-orange-600",
    hoverBorder: "hover:border-orange-300",
  },
  {
    title: "优秀奖",
    ratio: "占总参赛作品的 40%",
    icon: <Star className="size-5" />,
    rewards: [
      { label: "电子荣誉证书", icon: <FileCheck className="size-3.5" /> },
      { label: "优秀作品展示", icon: <Eye className="size-3.5" /> },
      { label: "社区认证", icon: <CircleCheck className="size-3.5" /> },
    ],
    bg: "bg-slate-50",
    iconBg: "bg-slate-200 text-slate-600",
    hoverBorder: "hover:border-slate-300",
  },
  {
    title: "黑马突围奖",
    ratio: "共 3 名",
    icon: <Flame className="size-5" />,
    rewards: [
      { label: "电子荣誉证书", icon: <FileCheck className="size-3.5" /> },
      { label: "优秀作品展示", icon: <Eye className="size-3.5" /> },
      { label: "社区认证", icon: <CircleCheck className="size-3.5" /> },
    ],
    bg: "bg-red-50",
    iconBg: "bg-red-100 text-red-600",
    hoverBorder: "hover:border-red-300",
  },
  {
    title: "人气之星",
    ratio: "共 1 名 · 社区投票",
    icon: <Heart className="size-5" />,
    rewards: [
      { label: "电子荣誉证书", icon: <FileCheck className="size-3.5" /> },
      { label: "优秀作品展示", icon: <Eye className="size-3.5" /> },
      { label: "社区认证", icon: <CircleCheck className="size-3.5" /> },
    ],
    bg: "bg-pink-50",
    iconBg: "bg-pink-100 text-pink-600",
    hoverBorder: "hover:border-pink-300",
  },
];

export function AwardsSection() {
  return (
    <section className="relative bg-white py-28 px-4">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-medium tracking-widest text-[#38b6ff] uppercase">
            Awards
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            丰厚奖励等你来拿
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">
            具有极高价值或高影响力的标杆性作品将获得丰厚奖励
          </p>
        </div>

        {/* Awards grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {awards.map((award) => (
            <Card
              key={award.title}
              className={`group relative overflow-hidden border-slate-200/80 py-0 transition-colors duration-200 ${award.hoverBorder} ${award.bg} ${
                award.highlight ? "border-amber-300/60 ring-1 ring-amber-200/50" : ""
              }`}
            >
              <CardContent className="px-4 py-3">
                {/* Icon + Title row */}
                <div className="mb-3 flex items-center gap-2.5">
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${award.iconBg}`}>
                    {award.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-slate-900">
                      {award.title}
                    </h3>
                    <p className="text-xs text-slate-500">{award.ratio}</p>
                  </div>
                </div>

                {/* Rewards list - single block with dividers */}
                <div className="rounded-lg bg-white/80 ring-1 ring-slate-200/60 divide-y divide-slate-200/60">
                  {award.rewards.map((reward) => (
                    <div
                      key={reward.label}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600"
                    >
                      <span className="text-emerald-500">{reward.icon}</span>
                      {reward.label}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
