import { NextResponse } from "next/server";

// GET /api/emission-factors/factors/standards
// Returns the list of GHG Reporting Standards for the dropdown.
export async function GET() {
  try {
    // To update the list, modify the seeding logic in getGhgReportingStandardsCollection in src/lib/mongodb.ts
    const { getGhgReportingStandardsCollection } = await import(
      "@/lib/mongodb"
    );
    const collection = await getGhgReportingStandardsCollection();
    const standards = await collection.find({}).toArray();
    return NextResponse.json(standards.map((s: any) => s.name));
  } catch (error) {
    console.error("Error fetching GHG Reporting Standards:", error);
    return NextResponse.json(
      { error: "Failed to fetch standards" },
      { status: 500 }
    );
  }
}
