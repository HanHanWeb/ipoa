interface StatItem {
  value: string;
  label: string;
}

const stats: StatItem[] = [
  { value: "6", label: "奖项类别" },
  { value: "100%", label: "公益免费" },
  { value: "9+", label: "专业评委" },
  { value: "∞", label: "创意可能" },
];

export function StatsSection() {
  return (
    <section className="relative bg-[#fafafa] py-20 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-500 sm:text-5xl">
                {stat.value}
              </div>
              <p className="mt-2 text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
