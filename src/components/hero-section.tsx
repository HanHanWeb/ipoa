import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-start justify-center overflow-hidden bg-white px-4">
      {/* Subtle radial gradient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(56,182,255,0.08)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[600px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(56,182,255,0.05)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl w-full">
        {/* Main title */}
        <h1 className="hero-title mb-6 max-w-4xl text-4xl font-medium leading-[1.1] tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl">
          <span className="block">界面生态</span>
          <span className="mt-2 block text-[#38b6ff]">
            PPTOS 创意设计大赛
          </span>
        </h1>

        {/* Description */}
        <p className="mb-8 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg">
          为搭建 PPT OS 设计爱好者公益交流展示平台、挖掘创意人才，界面生态特举办界面生态 PPTOS 创意设计大赛。大赛为纯公益在线赛事，全程不收取任何费用。
        </p>

        {/* CTA Button */}
        <Button
          size="lg"
          className="group/btn h-11 gap-1.5 rounded-full bg-[#38b6ff] px-8 text-sm font-medium text-white shadow-lg shadow-[#38b6ff]/20 hover:bg-[#2da4eb]"
          render={<a href="https://intereco.org.cn/d/318" target="_blank" rel="noopener noreferrer" />}
        >
          <span className="inline-flex items-center gap-1">
            进一步了解
            <ChevronRight className="size-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
          </span>
        </Button>
      </div>
    </section>
  );
}
