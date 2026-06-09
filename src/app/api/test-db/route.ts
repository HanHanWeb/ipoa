import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

export async function GET() {
  try {
    console.log("DB URL:", process.env.TURSO_DATABASE_URL ? "set" : "NOT SET");
    console.log("DB Token:", process.env.TURSO_AUTH_TOKEN ? "set" : "NOT SET");
    
    // Test connection
    console.log("Testing Turso connection...");
    await getDb().execute("SELECT 1");
    console.log("Connection successful");
    
    // Try to create table
    console.log("Creating users table...");
    await initDb();
    console.log("Table created/verified");
    
    // Check if table exists
    const result = await getDb().execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
    console.log("Tables found:", result.rows.length);
    
    return NextResponse.json({ 
      success: true, 
      dbUrl: process.env.TURSO_DATABASE_URL ? "set" : "NOT SET",
      dbToken: process.env.TURSO_AUTH_TOKEN ? "set" : "NOT SET",
      tableExists: result.rows.length > 0
    });
  } catch (err) {
    console.error("DB test error:", err);
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : String(err),
      dbUrl: process.env.TURSO_DATABASE_URL ? "set" : "NOT SET",
      dbToken: process.env.TURSO_AUTH_TOKEN ? "set" : "NOT SET"
    });
  }
}
