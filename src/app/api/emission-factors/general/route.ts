import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

interface GeneralFactor {
  description: string;
  scope: string;
  category: string;
  location: string;
  unit: string;
  dataSource: string;
}

export async function GET() {
  try {
    const db = await getDb();
    const factors = await db
      .collection<GeneralFactor>("general_factors")
      .find({})
      .toArray();
    return NextResponse.json(factors);
  } catch (error) {
    console.error("Error fetching general factors:", error);
    return NextResponse.json(
      { error: "Failed to fetch general factors" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { description, scope, category, location, unit, dataSource } = data;
    if (
      !description ||
      !scope ||
      !category ||
      !location ||
      !unit ||
      !dataSource
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    const db = await getDb();
    const result = await db
      .collection<GeneralFactor>("general_factors")
      .insertOne({ description, scope, category, location, unit, dataSource });
    return NextResponse.json({ insertedId: result.insertedId });
  } catch (error) {
    console.error("Error adding general factor:", error);
    return NextResponse.json(
      { error: "Failed to add general factor" },
      { status: 500 }
    );
  }
}
