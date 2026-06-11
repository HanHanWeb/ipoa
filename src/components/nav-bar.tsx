import { AuthButton } from "@/components/auth-button";
import Link from "next/link";

export function NavBar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center">
            <img
              src="https://intereco-basic-1305364972.cos.ap-nanjing.myqcloud.com/images/basic/ipoa.png"
              alt="IPOA Logo"
              className="h-8 w-auto"
              crossOrigin="anonymous"
            />
          </a>
          <Link
            href="/awards"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            获奖名单
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <AuthButton />
        </div>
      </div>
    </nav>
  );
}
