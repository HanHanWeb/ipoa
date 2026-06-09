import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";

export default function SubmitPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">作品提交</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="size-5" />
            提交作品
          </CardTitle>
          <CardDescription>在此提交您的参赛作品</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">作品提交功能即将开放，敬请期待</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
