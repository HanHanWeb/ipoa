"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Trophy,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  Search,
} from "lucide-react";
import { PageTitle } from "@/components/page-title";

interface AwardCategory {
  id: number;
  title: string;
  ratio: string;
  sort_order: number;
}

interface AwardEntry {
  id: number;
  category_id: number;
  work_title: string;
  authors: string;
  description: string;
  sort_order: number;
}

interface WorkItem {
  id: number;
  title: string;
  owner: string;
}

export default function AwardsPage() {
  const [categories, setCategories] = useState<AwardCategory[]>([]);
  const [entries, setEntries] = useState<AwardEntry[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 添加奖项分类
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newRatio, setNewRatio] = useState("");

  // 编辑奖项分类
  const [editCategory, setEditCategory] = useState<AwardCategory | null>(null);
  const [editCategoryOpen, setEditCategoryOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editRatio, setEditRatio] = useState("");

  // 添加获奖作品
  const [addEntryCategoryId, setAddEntryCategoryId] = useState<number | null>(null);
  const [addEntryOpen, setAddEntryOpen] = useState(false);
  const [newWorkTitle, setNewWorkTitle] = useState("");
  const [newAuthors, setNewAuthors] = useState<string[]>([""]);
  const [newComment, setNewComment] = useState("");

  // 编辑获奖作品
  const [editEntry, setEditEntry] = useState<AwardEntry | null>(null);
  const [editEntryOpen, setEditEntryOpen] = useState(false);
  const [editWorkTitle, setEditWorkTitle] = useState("");
  const [editAuthors, setEditAuthors] = useState<string[]>([""]);
  const [editComment, setEditComment] = useState("");

  // 搜索相关
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<WorkItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // 展开的分类
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  const fetchData = async () => {
    const res = await fetch("/api/awards");
    const data = await res.json();
    setCategories(data.categories || []);
    setEntries(data.entries || []);
    setEnabled(data.enabled || false);
    setLoading(false);
  };

  const fetchWorks = async () => {
    try {
      const res = await fetch("/api/works");
      const data = await res.json();
      setWorks((data.works || []).map((w: { id: number; title: string; owner: string }) => ({
        id: w.id,
        title: w.title,
        owner: w.owner,
      })));
    } catch {}
  };

  useEffect(() => {
    fetchData();
    fetchWorks();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const results = works.filter(
        (w) =>
          w.title.toLowerCase().includes(query) ||
          w.owner.toLowerCase().includes(query)
      );
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery, works]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleEnabled = async (val: boolean) => {
    setEnabled(val);
    await fetch("/api/awards", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "toggle", enabled: val }),
    });
  };

  const handleAddCategory = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    await fetch("/api/awards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle,
        ratio: newRatio,
        sort_order: categories.length,
      }),
    });
    setSaving(false);
    setAddCategoryOpen(false);
    setNewTitle("");
    setNewRatio("");
    fetchData();
  };

  const handleEditCategory = async () => {
    if (!editCategory || !editTitle.trim()) return;
    setSaving(true);
    await fetch("/api/awards", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "category",
        id: editCategory.id,
        title: editTitle,
        ratio: editRatio,
        sort_order: editCategory.sort_order,
      }),
    });
    setSaving(false);
    setEditCategoryOpen(false);
    setEditCategory(null);
    fetchData();
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("删除此奖项将同时删除其下所有获奖作品，确定？")) return;
    await fetch("/api/awards", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "category", id }),
    });
    fetchData();
  };

  const handleAddEntry = async () => {
    if (!addEntryCategoryId || !newWorkTitle.trim()) return;
    setSaving(true);
    await fetch("/api/awards", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "entry",
        category_id: addEntryCategoryId,
        work_title: newWorkTitle,
        authors: newAuthors.filter((a) => a.trim()),
        description: newComment,
        sort_order: entries.filter((e) => e.category_id === addEntryCategoryId).length,
      }),
    });
    setSaving(false);
    setAddEntryOpen(false);
    setNewWorkTitle("");
    setNewAuthors([""]);
    setNewComment("");
    setSearchQuery("");
    fetchData();
  };

  const handleEditEntry = async () => {
    if (!editEntry || !editWorkTitle.trim()) return;
    setSaving(true);
    await fetch("/api/awards", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "update_entry",
        id: editEntry.id,
        work_title: editWorkTitle,
        authors: editAuthors.filter((a) => a.trim()),
        description: editComment,
        sort_order: editEntry.sort_order,
      }),
    });
    setSaving(false);
    setEditEntryOpen(false);
    setEditEntry(null);
    fetchData();
  };

  const handleDeleteEntry = async (id: number) => {
    await fetch("/api/awards", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "entry", id }),
    });
    fetchData();
  };

  const toggleExpand = (id: number) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getEntriesForCategory = (categoryId: number) => {
    return entries.filter((e) => e.category_id === categoryId);
  };

  const parseAuthors = (authors: string): string[] => {
    try {
      return JSON.parse(authors);
    } catch {
      return [];
    }
  };

  const selectWork = (work: WorkItem) => {
    setNewWorkTitle(work.title);
    setNewAuthors([work.owner]);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle title="获奖名单" />
      <h1 className="text-2xl font-semibold">获奖名单</h1>

      {/* 开关设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-5" />
            获奖名单页面
          </CardTitle>
          <CardDescription>开启后，用户可以在侧边栏看到获奖名单入口</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch checked={enabled} onCheckedChange={toggleEnabled} />
            <Label>{enabled ? "已开启" : "已关闭"}</Label>
          </div>
        </CardContent>
      </Card>

      {/* 添加奖项按钮 */}
      <div className="flex justify-end">
        <Button onClick={() => setAddCategoryOpen(true)}>
          <Plus className="mr-1 size-4" />
          添加奖项
        </Button>
      </div>

      {/* 奖项列表 */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            暂无奖项，请点击上方按钮添加
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => {
            const catEntries = getEntriesForCategory(cat.id);
            const isExpanded = expandedCategories.has(cat.id);
            return (
              <Card key={cat.id}>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleExpand(cat.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {isExpanded ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </button>
                      <Trophy className="size-5 text-primary" />
                      <div>
                        <CardTitle className="text-base">{cat.title}</CardTitle>
                        {cat.ratio && (
                          <p className="text-xs text-muted-foreground">{cat.ratio}</p>
                        )}
                      </div>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {catEntries.length} 件作品
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAddEntryCategoryId(cat.id);
                          setNewWorkTitle("");
                          setNewAuthors([""]);
                          setNewComment("");
                          setSearchQuery("");
                          setAddEntryOpen(true);
                        }}
                      >
                        <Plus className="mr-1 size-3" />
                        添加作品
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditCategory(cat);
                          setEditTitle(cat.title);
                          setEditRatio(cat.ratio);
                          setEditCategoryOpen(true);
                        }}
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteCategory(cat.id)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && catEntries.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {catEntries.map((entry) => {
                        const authors = parseAuthors(entry.authors);
                        return (
                          <div
                            key={entry.id}
                            className="rounded-md border p-3"
                          >
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm">{entry.work_title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {authors.length > 0 ? authors.join("、") : "未填写作者"}
                                </p>
                                {entry.description && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">
                                    评审意见：{entry.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditEntry(entry);
                                    setEditWorkTitle(entry.work_title);
                                    setEditAuthors(parseAuthors(entry.authors).length > 0 ? parseAuthors(entry.authors) : [""]);
                                    setEditComment(entry.description);
                                    setEditEntryOpen(true);
                                  }}
                                >
                                  <Pencil className="size-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteEntry(entry.id)}
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* 添加奖项分类弹窗 */}
      <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加奖项</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>奖项名称</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="如：一等奖"
              />
            </div>
            <div className="space-y-2">
              <Label>比例/名额</Label>
              <Input
                value={newRatio}
                onChange={(e) => setNewRatio(e.target.value)}
                placeholder="如：占总参赛作品的 10%"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddCategoryOpen(false)}>
                取消
              </Button>
              <Button onClick={handleAddCategory} disabled={saving}>
                {saving ? "添加中..." : "添加"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑奖项分类弹窗 */}
      <Dialog open={editCategoryOpen} onOpenChange={setEditCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑奖项</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>奖项名称</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>比例/名额</Label>
              <Input
                value={editRatio}
                onChange={(e) => setEditRatio(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditCategoryOpen(false)}>
                取消
              </Button>
              <Button onClick={handleEditCategory} disabled={saving}>
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 添加获奖作品弹窗 */}
      <Dialog open={addEntryOpen} onOpenChange={setAddEntryOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>添加获奖作品</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2" ref={searchRef}>
              <Label>搜索作品</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="输入作品名称或作者搜索"
                  className="pl-9"
                />
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto rounded-md border bg-background shadow-lg">
                    {searchResults.map((work) => (
                      <button
                        key={work.id}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                        onClick={() => selectWork(work)}
                      >
                        <p className="font-medium">{work.title}</p>
                        <p className="text-xs text-muted-foreground">{work.owner}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>作品名称</Label>
              <Input
                value={newWorkTitle}
                onChange={(e) => setNewWorkTitle(e.target.value)}
                placeholder="请输入作品名称"
              />
            </div>
            <div className="space-y-2">
              <Label>作者（可多个）</Label>
              {newAuthors.map((author, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={author}
                    onChange={(e) => {
                      const updated = [...newAuthors];
                      updated[idx] = e.target.value;
                      setNewAuthors(updated);
                    }}
                    placeholder={`作者 ${idx + 1}`}
                  />
                  {newAuthors.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setNewAuthors(newAuthors.filter((_, i) => i !== idx));
                      }}
                    >
                      <X className="size-3" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setNewAuthors([...newAuthors, ""]);
                }}
              >
                <Plus className="mr-1 size-3" />
                添加作者
              </Button>
            </div>
            <div className="space-y-2">
              <Label>评审意见（可选）</Label>
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="请输入评审意见"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddEntryOpen(false)}>
                取消
              </Button>
              <Button onClick={handleAddEntry} disabled={saving}>
                {saving ? "添加中..." : "添加"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑获奖作品弹窗 */}
      <Dialog open={editEntryOpen} onOpenChange={setEditEntryOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑获奖作品</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>作品名称</Label>
              <Input
                value={editWorkTitle}
                onChange={(e) => setEditWorkTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>作者（可多个）</Label>
              {editAuthors.map((author, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={author}
                    onChange={(e) => {
                      const updated = [...editAuthors];
                      updated[idx] = e.target.value;
                      setEditAuthors(updated);
                    }}
                    placeholder={`作者 ${idx + 1}`}
                  />
                  {editAuthors.length > 1 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditAuthors(editAuthors.filter((_, i) => i !== idx))}
                    >
                      <X className="size-3" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditAuthors([...editAuthors, ""])}
              >
                <Plus className="mr-1 size-3" />
                添加作者
              </Button>
            </div>
            <div className="space-y-2">
              <Label>评审意见（可选）</Label>
              <Textarea
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditEntryOpen(false)}>
                取消
              </Button>
              <Button onClick={handleEditEntry} disabled={saving}>
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
