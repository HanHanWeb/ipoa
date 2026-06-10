"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users } from "lucide-react";

interface UserItem {
  id: number;
  casdoor_id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  created_at: string;
  last_login: string;
  has_submitted: number;
}

const roleLabels: Record<string, string> = {
  admin: "管理员",
  reviewer: "审核员",
  user: "参赛者",
};

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  admin: "default",
  reviewer: "default",
  user: "secondary",
};

const roleBadgeStyle: Record<string, React.CSSProperties | undefined> = {
  reviewer: { backgroundColor: "#e34b6e" },
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setCurrentUserId(data.user?.id || ""));
    fetchUsers();
  }, []);

  const changeRole = async (targetId: string, newRole: string) => {
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId, role: newRole }),
    });
    fetchUsers();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">用户管理</h1>
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">用户管理</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            全部用户
          </CardTitle>
          <CardDescription>共 {users.length} 位用户</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>已提交作品</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.casdoor_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8 after:border-0">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>
                          {user.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariant[user.role] || "secondary"} style={roleBadgeStyle[user.role]}>
                      {roleLabels[user.role] || user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.has_submitted ? (
                      <Badge variant="default" className="bg-green-600">已提交</Badge>
                    ) : (
                      <Badge variant="secondary">未提交</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString("zh-CN")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      disabled={user.casdoor_id === currentUserId}
                      onValueChange={(v) => changeRole(user.casdoor_id, v ?? user.role)}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">管理员</SelectItem>
                        <SelectItem value="reviewer">审核员</SelectItem>
                        <SelectItem value="user">参赛者</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
