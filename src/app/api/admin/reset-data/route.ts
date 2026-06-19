import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const tables = ["submissions", "votes", "scores", "award_categories", "award_entries"];

    // 删除数据
    for (const table of tables) {
      await db.execute(`DELETE FROM ${table}`);
    }

    // 重置自增 ID（sqlite_sequence）
    for (const table of tables) {
      await db.execute(`DELETE FROM sqlite_sequence WHERE name = ?`, [table]);
    }

    return NextResponse.json({
      success: true,
      message: "已重置 submissions, votes, scores, award_categories, award_entries",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
