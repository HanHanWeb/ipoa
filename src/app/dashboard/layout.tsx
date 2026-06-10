"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Home, Upload, Users, Settings, UserCog, Megaphone, LogOut, ClipboardList, Loader2, MoreHorizontal } from "lucide-react";

const navItems = [
  { title: "活动首页", url: "/dashboard", icon: Home },
  { title: "作品提交", url: "/dashboard/submit", icon: Upload },
  { title: "社区联系", url: "/dashboard/community", icon: Users },
];

const adminItems = [
  { title: "作品列表", url: "/dashboard/works", icon: ClipboardList },
  { title: "用户管理", url: "/dashboard/users", icon: UserCog },
  { title: "公告管理", url: "/dashboard/notices", icon: Megaphone },
  { title: "基础设置", url: "/dashboard/settings", icon: Settings },
];

const reviewerItems = [
  { title: "作品列表", url: "/dashboard/works", icon: ClipboardList },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isReviewer, setIsReviewer] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; avatar: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setIsAdmin(data.user.role === "admin");
          setIsReviewer(data.user.role === "reviewer");
        }
      });
  }, []);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
              <SidebarMenuButton size="lg" render={<Link href="/" />} className="group-data-[collapsible=icon]:hidden">
                <img
                  src="https://intereco-basic-1305364972.cos.ap-nanjing.myqcloud.com/images/basic/ipoa.png"
                  alt="IPOA Logo"
                  className="h-8 w-auto"
                  crossOrigin="anonymous"
                />
              </SidebarMenuButton>
              <SidebarTrigger className="size-8 shrink-0 group-data-[collapsible=icon]:size-8" />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      render={<Link href={item.url} />}
                      isActive={pathname === item.url}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          {isAdmin && (
            <SidebarGroup>
              <SidebarGroupLabel>管理</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        render={<Link href={item.url} />}
                        isActive={pathname === item.url}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
          {isReviewer && !isAdmin && (
            <SidebarGroup>
              <SidebarGroupLabel>评委</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {reviewerItems.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        render={<Link href={item.url} />}
                        isActive={pathname === item.url}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm outline-none hover:bg-accent transition-colors group-data-[collapsible=icon]:justify-center" />
                  }
                >
                  {user ? (
                    <>
                      <Avatar size="sm" className="after:border-0">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>
                          {user.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                        <p className="truncate text-sm font-medium">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <MoreHorizontal className="size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                    </>
                  ) : (
                    <span className="flex flex-1 items-center justify-center">
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    </span>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="top" sideOffset={8} className="min-w-40">
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      variant="destructive"
                      render={<a href="/api/auth/logout" />}
                    >
                      <LogOut data-icon="inline-start" />
                      退出登录
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center gap-2 border-b px-4 py-2 md:hidden">
          <SidebarTrigger />
          <img
            src="https://intereco-basic-1305364972.cos.ap-nanjing.myqcloud.com/images/basic/ipoa.png"
            alt="IPOA Logo"
            className="h-6 w-auto"
            crossOrigin="anonymous"
          />
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
