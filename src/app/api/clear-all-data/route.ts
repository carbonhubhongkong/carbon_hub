import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function DELETE() {
  try {
    const db = await getDb();

    // Clear all data from all collections
    const collections = [
      "general_factors",
      "calculation_methods",
      "emission_factors",
      "reporting_activities",
    ];

    const deletePromises = collections.map((collectionName) =>
      db.collection(collectionName).deleteMany({})
    );

    await Promise.all(deletePromises);

    console.log("All user data cleared successfully");

    return NextResponse.json({
      success: true,
      message: "All data cleared successfully",
      deletedCollections: collections,
    });
  } catch (error) {
    console.error("Error clearing data:", error);
    return NextResponse.json(
      { error: "Failed to clear data" },
      { status: 500 }
    );
  }
}
