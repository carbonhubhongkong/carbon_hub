import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

// Updated emission factor schema to include GHG Reporting Standard and Source/Disclosure Requirement
interface EmissionFactor {
  co2ePerUnit: number;
  emissionFactorUnit: string;
  ghgReportingStandard: string; // required
  sourceOrDisclosureRequirement: string; // required
}

export async function GET() {
  try {
    const db = await getDb();
    const factors = await db
      .collection<EmissionFactor>("emission_factors")
      .find({})
      .toArray();
    // Ensure new fields are always present in the response
    const withDefaults = factors.map((f) => ({
      ...f,
      ghgReportingStandard: f.ghgReportingStandard || "N/A",
      sourceOrDisclosureRequirement: f.sourceOrDisclosureRequirement || "N/A",
    }));
    return NextResponse.json(withDefaults);
  } catch (error) {
    console.error("Error fetching emission factors:", error);
    return NextResponse.json(
      { error: "Failed to fetch emission factors" },
      { status: 500 }
    );
  }
}

// GET /api/emission-factors/factors/standards
// Returns the list of GHG Reporting Standards for the dropdown.
export async function GET_STANDARDS() {
  try {
    // To update the list, modify the seeding logic in getGhgReportingStandardsCollection in src/lib/mongodb.ts
    const { getGhgReportingStandardsCollection } = await import(
      "@/lib/mongodb"
    );
    const collection = await getGhgReportingStandardsCollection();
    const standards = await collection.find({}).toArray();
    return NextResponse.json(standards.map((s) => s.name));
  } catch (error) {
    console.error("Error fetching GHG Reporting Standards:", error);
    return NextResponse.json(
      { error: "Failed to fetch standards" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      co2ePerUnit,
      emissionFactorUnit,
      ghgReportingStandard,
      sourceOrDisclosureRequirement,
    } = data;
    // Validate required fields
    if (
      typeof co2ePerUnit !== "number" ||
      !emissionFactorUnit ||
      !ghgReportingStandard ||
      !sourceOrDisclosureRequirement
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const db = await getDb();
    const result = await db
      .collection<EmissionFactor>("emission_factors")
      .insertOne({
        co2ePerUnit,
        emissionFactorUnit,
        ghgReportingStandard,
        sourceOrDisclosureRequirement,
      });
    return NextResponse.json({ insertedId: result.insertedId });
  } catch (error) {
    console.error("Error adding emission factor:", error);
    return NextResponse.json(
      { error: "Failed to add emission factor" },
      { status: 500 }
    );
  }
}
