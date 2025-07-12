import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

interface ReportingActivity {
  reportingPeriodStart: string;
  reportingPeriodEnd: string;
  scope: string;
  category: string;
  activityName: string;
  location: string;
  quantity: number;
  emissionFactorId: string;
  remarks?: string;
  calculatedEmissions?: number;
}

export async function GET() {
  try {
    const db = await getDb();
    const activities = await db
      .collection<ReportingActivity>("reporting_activities")
      .find({})
      .toArray();
    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching reporting activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch reporting activities" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      reportingPeriodStart,
      reportingPeriodEnd,
      scope,
      category,
      activityName,
      location,
      quantity,
      emissionFactorId,
      remarks,
    } = data;

    if (
      !reportingPeriodStart ||
      !reportingPeriodEnd ||
      !scope ||
      !category ||
      !activityName ||
      !location ||
      typeof quantity !== "number" ||
      !emissionFactorId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Get the emission factor to calculate emissions
    const emissionFactor = await db
      .collection("emission_factors")
      .findOne({ _id: emissionFactorId });
    const calculatedEmissions = emissionFactor
      ? quantity * emissionFactor.co2ePerUnit
      : 0;

    const result = await db
      .collection<ReportingActivity>("reporting_activities")
      .insertOne({
        reportingPeriodStart,
        reportingPeriodEnd,
        scope,
        category,
        activityName,
        location,
        quantity,
        emissionFactorId,
        remarks,
        calculatedEmissions,
      });

    return NextResponse.json({ insertedId: result.insertedId });
  } catch (error) {
    console.error("Error adding reporting activity:", error);
    return NextResponse.json(
      { error: "Failed to add reporting activity" },
      { status: 500 }
    );
  }
}
