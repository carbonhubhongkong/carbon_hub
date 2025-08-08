import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { emissionFactorFields } from "@/config/emissionFactorSchema";

interface CalculationMethod {
  methodType: "Volume Based" | "Spend Based" | "Distance Based" | "Mass Based";
}

export async function GET() {
  try {
    const db = await getDb();
    const methods = await db
      .collection<CalculationMethod>("calculation_methods")
      .find({})
      .toArray();
    return NextResponse.json(methods);
  } catch (error) {
    console.error("Error fetching calculation methods:", error);
    return NextResponse.json(
      { error: "Failed to fetch calculation methods" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { methodType } = data;

    // Get valid method types from the centralized schema
    const validMethodTypes =
      emissionFactorFields.find((f) => f.key === "methodType")?.validation
        ?.enumOptions || [];

    if (!methodType || !validMethodTypes.includes(methodType)) {
      return NextResponse.json(
        { error: "Invalid methodType" },
        { status: 400 }
      );
    }
    const db = await getDb();
    const result = await db
      .collection<CalculationMethod>("calculation_methods")
      .insertOne({ methodType });
    return NextResponse.json({ insertedId: result.insertedId });
  } catch (error) {
    console.error("Error adding calculation method:", error);
    return NextResponse.json(
      { error: "Failed to add calculation method" },
      { status: 500 }
    );
  }
}
