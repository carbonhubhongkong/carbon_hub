import { NextResponse } from "next/server";

// Default standards as fallback
const DEFAULT_STANDARDS = [
  "GHG Protocol",
  "GRI Standards",
  "ISO 14064",
  "IFRS - ISSB",
  "Custom",
];

// GET /api/emission-factors/factors/standards
// Returns the list of GHG Reporting Standards for the dropdown.
export async function GET() {
  try {
    console.log("Attempting to fetch GHG Reporting Standards...");
    // To update the list, modify the seeding logic in getGhgReportingStandardsCollection in src/lib/mongodb.ts
    const { getGhgReportingStandardsCollection } = await import(
      "@/lib/mongodb"
    );
    const collection = await getGhgReportingStandardsCollection();
    const standards = await collection.find({}).toArray();
    console.log(`Found ${standards.length} GHG Reporting Standards`);

    if (standards.length === 0) {
      console.log("No standards found in database, using defaults");
      return NextResponse.json(DEFAULT_STANDARDS);
    }

    return NextResponse.json(standards.map((s: any) => s.name));
  } catch (error) {
    console.error("Error fetching GHG Reporting Standards:", error);
    console.log("Using default standards as fallback");
    // Return default standards instead of empty array to ensure dropdown works
    return NextResponse.json(DEFAULT_STANDARDS);
  }
}
