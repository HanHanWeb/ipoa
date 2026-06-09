import { Button } from "@/components/ui/button";

export function NavBar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <a href="/" className="flex items-center">
          <img
            src="https://intereco-basic-1305364972.cos.ap-nanjing.myqcloud.com/images/basic/ipoa.png"
            alt="IPOA Logo"
            className="h-8 w-auto"
            crossOrigin="anonymous"
          />
        </a>
        <Button
          size="sm"
          className="h-9 rounded-full bg-[#38b6ff] px-5 text-sm font-medium text-white hover:bg-[#2da4eb]"
          asChild
        >
          <a href="https://intereco.org.cn/d/318" target="_blank" rel="noopener noreferrer">
            进一步了解
          </a>
        </Button>
      </div>
    </nav>
  );
}
