import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Globe, MessageCircle, ExternalLink } from "lucide-react";

const links = [
  {
    title: "界面生态官网",
    description: "了解更多关于界面生态的信息",
    url: "https://intereco.org.cn",
    icon: Globe,
  },
  {
    title: "IPOA 赛事主页",
    description: "查看赛事详情与最新动态",
    url: "https://ipoa.interever.cn",
    icon: ExternalLink,
  },
];

export default function CommunityPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">社区联系</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* QQ Group */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="size-5" />
              QQ 交流群
            </CardTitle>
            <CardDescription>加入群聊与其他参赛者交流</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">群号</p>
              <p className="mt-1 text-xl font-semibold tracking-wide">
                1015280906
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              打开 QQ 搜索群号即可加入。
            </p>
          </CardContent>
        </Card>

        {/* Website Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-5" />
              相关网站
            </CardTitle>
            <CardDescription>访问官方网站获取更多信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted"
              >
                <link.icon className="size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{link.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {link.description}
                  </p>
                </div>
                <ExternalLink className="ml-auto size-4 shrink-0 text-muted-foreground" />
              </a>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
