import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

interface ReportingActivity {
  _id?: string;
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

// Fallback in-memory storage for testing when MongoDB is not available
let fallbackStorage: ReportingActivity[] = [];
let fallbackIdCounter = 1;

export async function GET() {
  try {
    console.log("Attempting to connect to MongoDB for reporting activities...");
    const db = await getDb();
    console.log("Database connection successful");

    // Test the connection by checking if we can access the collection
    const collection = db.collection<ReportingActivity>("reporting_activities");
    const count = await collection.countDocuments();
    console.log(
      `Collection 'reporting_activities' exists with ${count} documents`
    );

    const activities = await collection.find({}).toArray();
    console.log(`Found ${activities.length} reporting activities`);

    // Ensure _id is always a string for consistency
    const processedActivities = activities.map((activity) => ({
      ...activity,
      _id: activity._id?.toString(),
    }));

    return NextResponse.json(processedActivities);
  } catch (error) {
    console.error("Error fetching reporting activities from MongoDB:", error);
    console.log("Using fallback storage for reporting activities");
    console.log(
      "Fallback storage contents:",
      JSON.stringify(fallbackStorage, null, 2)
    );

    // Return fallback storage instead of error
    return NextResponse.json(fallbackStorage);
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("Attempting to add reporting activity...");
    const data = await req.json();
    console.log("Received data:", JSON.stringify(data, null, 2));

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

    // Validate required fields
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

    try {
      console.log("Connecting to MongoDB...");
      const db = await getDb();
      console.log("MongoDB connection successful");

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

      console.log(
        "Successfully inserted reporting activity with ID:",
        result.insertedId
      );
      return NextResponse.json({ insertedId: result.insertedId });
    } catch (dbError) {
      console.error(
        "MongoDB connection failed, using fallback storage:",
        dbError
      );

      // Use fallback storage
      const newActivity: ReportingActivity = {
        _id: `fallback_${fallbackIdCounter++}`,
        reportingPeriodStart,
        reportingPeriodEnd,
        scope,
        category,
        activityName,
        location,
        quantity,
        emissionFactorId,
        remarks,
        calculatedEmissions: 0, // We can't calculate without emission factor data
      };

      fallbackStorage.push(newActivity);
      console.log(
        "Successfully added to fallback storage with ID:",
        newActivity._id
      );
      return NextResponse.json({ insertedId: newActivity._id });
    }
  } catch (error) {
    console.error("Error adding reporting activity:", error);
    return NextResponse.json(
      {
        error: `Failed to add reporting activity: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    console.log("Attempting to update reporting activity...");
    const data = await req.json();
    console.log("Received update data:", JSON.stringify(data, null, 2));

    // Check if _id is present
    if (!data._id) {
      return NextResponse.json(
        { error: "Reporting activity ID is required" },
        { status: 400 }
      );
    }

    try {
      // Try MongoDB first
      const db = await getDb();
      console.log("MongoDB connection successful");

      // Import ObjectId from mongodb
      const { ObjectId } = await import("mongodb");

      // Convert string _id to ObjectId if it's not already
      let objectId;
      try {
        objectId =
          typeof data._id === "string" ? new ObjectId(data._id) : data._id;
        console.log("Converted _id to ObjectId:", objectId);
      } catch (idError) {
        console.error("Invalid ObjectId format:", data._id);
        return NextResponse.json(
          { error: "Invalid reporting activity ID format" },
          { status: 400 }
        );
      }

      const result = await db
        .collection<ReportingActivity>("reporting_activities")
        .updateOne({ _id: objectId }, { $set: data });

      console.log("MongoDB update result:", result);

      if (result.matchedCount === 0) {
        console.log(
          "Reporting activity not found in MongoDB, checking fallback storage..."
        );
        // Check if it's in fallback storage
        const fallbackIndex = fallbackStorage.findIndex(
          (a) => a._id === data._id
        );

        if (fallbackIndex !== -1) {
          // Update in fallback storage
          fallbackStorage[fallbackIndex] = {
            ...fallbackStorage[fallbackIndex],
            ...data,
          };
          console.log("Successfully updated in fallback storage");
          return NextResponse.json({ success: true });
        }

        return NextResponse.json(
          { error: "Reporting activity not found" },
          { status: 404 }
        );
      }

      console.log("Successfully updated reporting activity in MongoDB");
      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.error("MongoDB update failed, trying fallback storage:", dbError);

      // Try fallback storage
      const fallbackIndex = fallbackStorage.findIndex(
        (a) => a._id === data._id
      );

      if (fallbackIndex !== -1) {
        // Update in fallback storage
        fallbackStorage[fallbackIndex] = {
          ...fallbackStorage[fallbackIndex],
          ...data,
        };
        console.log("Successfully updated in fallback storage");
        return NextResponse.json({ success: true });
      }

      return NextResponse.json(
        { error: "Reporting activity not found in any storage" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error updating reporting activity:", error);
    return NextResponse.json(
      {
        error: `Failed to update reporting activity: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    console.log("Attempting to delete reporting activity...");

    // Get the ID from the URL search params
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Reporting activity ID is required" },
        { status: 400 }
      );
    }

    console.log("Deleting reporting activity with ID:", id);

    try {
      // Try MongoDB first
      const db = await getDb();
      const collection = db.collection<ReportingActivity>(
        "reporting_activities"
      );

      const result = await collection.deleteOne({ _id: id });

      if (result.deletedCount > 0) {
        console.log("Successfully deleted reporting activity from MongoDB");
        return NextResponse.json({
          success: true,
          message: "Reporting activity deleted successfully",
        });
      }

      // If not found in MongoDB, check fallback storage
      const fallbackIndex = fallbackStorage.findIndex((a) => a._id === id);

      if (fallbackIndex !== -1) {
        // Remove from fallback storage
        fallbackStorage.splice(fallbackIndex, 1);
        console.log(
          "Successfully deleted reporting activity from fallback storage"
        );
        return NextResponse.json({
          success: true,
          message: "Reporting activity deleted successfully",
        });
      }

      return NextResponse.json(
        { error: "Reporting activity not found" },
        { status: 404 }
      );
    } catch (dbError) {
      console.error("MongoDB delete failed, trying fallback storage:", dbError);

      // Try fallback storage
      const fallbackIndex = fallbackStorage.findIndex((a) => a._id === id);

      if (fallbackIndex !== -1) {
        // Remove from fallback storage
        fallbackStorage.splice(fallbackIndex, 1);
        console.log(
          "Successfully deleted reporting activity from fallback storage"
        );
        return NextResponse.json({
          success: true,
          message: "Reporting activity deleted successfully",
        });
      }

      return NextResponse.json(
        { error: "Reporting activity not found in any storage" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error deleting reporting activity:", error);
    return NextResponse.json(
      {
        error: `Failed to delete reporting activity: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
