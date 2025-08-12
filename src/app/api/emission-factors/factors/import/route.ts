import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { emissionFactorFields } from "@/config/emissionFactorSchema";

// In-memory rate limit store (for demo; use Redis or similar for production)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 5; // max imports
const RATE_WINDOW = 30 * 60 * 1000; // 30 minutes in ms

// Helper: Validate a row against the schema
function validateRow(row: Record<string, any>) {
  const errors: Record<string, string> = {};
  for (const field of emissionFactorFields) {
    const value = row[field.key];
    if (field.required && (value === undefined || value === "")) {
      errors[field.key] = "Required";
      continue;
    }
    if (field.type === "number" && value !== undefined && value !== "") {
      const num = Number(value);
      if (isNaN(num)) {
        errors[field.key] = "Must be a number";
        continue;
      }
      if (field.validation?.min !== undefined && num < field.validation.min) {
        errors[field.key] = `Must be >= ${field.validation.min}`;
      }
      if (field.validation?.max !== undefined && num > field.validation.max) {
        errors[field.key] = `Must be <= ${field.validation.max}`;
      }
      // Convert the value to a number for proper storage
      row[field.key] = num;
    }
    if (field.type === "enum" && value !== undefined && value !== "") {
      if (!field.validation?.enumOptions?.includes(value)) {
        errors[field.key] = "Invalid option";
      }
    }
    if (field.validation?.regex && value !== undefined && value !== "") {
      const re = new RegExp(field.validation.regex);
      if (!re.test(value)) {
        errors[field.key] = "Invalid format";
      }
    }
  }
  return errors;
}

export async function POST(req: NextRequest) {
  // Rate limiting by IP
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, lastReset: now };
  if (now - entry.lastReset > RATE_WINDOW) {
    entry.count = 0;
    entry.lastReset = now;
  }
  if (entry.count >= RATE_LIMIT) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Max ${RATE_LIMIT} imports per 30 minutes.`,
      },
      { status: 429 }
    );
  }
  entry.count++;
  rateLimitMap.set(ip, entry);

  try {
    const { rows } = await req.json(); // rows: array of objects
    if (!Array.isArray(rows)) {
      return NextResponse.json(
        { error: "Invalid payload: rows must be an array." },
        { status: 400 }
      );
    }
    const db = await getDb();
    let added = 0;
    let failed = 0;
    const failedRows: { row: any; errors: any }[] = [];
    for (const row of rows) {
      const errors = validateRow(row);
      if (Object.keys(errors).length > 0) {
        failed++;
        failedRows.push({ row, errors });
        continue;
      }
      try {
        await db.collection("emission_factors").insertOne(row);
        added++;
      } catch (e) {
        failed++;
        failedRows.push({ row, errors: { db: "Insert failed" } });
      }
    }
    return NextResponse.json({ added, failed, failedRows });
  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ error: "Bulk import failed." }, { status: 500 });
  }
}

// To change the rate limit, update RATE_LIMIT and RATE_WINDOW above.
// For production, use a persistent store (e.g., Redis) for rate limiting.
// To add authentication, check user session or token at the top of the handler.
