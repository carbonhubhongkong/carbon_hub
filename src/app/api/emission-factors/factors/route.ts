import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

interface EmissionFactor {
  co2ePerUnit: number;
  emissionFactorUnit: string;
}

export async function GET() {
  try {
    const db = await getDb();
    const factors = await db
      .collection<EmissionFactor>("emission_factors")
      .find({})
      .toArray();
    return NextResponse.json(factors);
  } catch (error) {
    console.error("Error fetching emission factors:", error);
    return NextResponse.json(
      { error: "Failed to fetch emission factors" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { co2ePerUnit, emissionFactorUnit } = data;
    if (typeof co2ePerUnit !== "number" || !emissionFactorUnit) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const db = await getDb();
    const result = await db
      .collection<EmissionFactor>("emission_factors")
      .insertOne({ co2ePerUnit, emissionFactorUnit });
    return NextResponse.json({ insertedId: result.insertedId });
  } catch (error) {
    console.error("Error adding emission factor:", error);
    return NextResponse.json(
      { error: "Failed to add emission factor" },
      { status: 500 }
    );
  }
}
