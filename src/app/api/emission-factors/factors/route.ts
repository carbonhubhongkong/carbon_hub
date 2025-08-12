import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { emissionFactorFields } from "@/config/emissionFactorSchema";

// Updated emission factor schema to include all fields needed by Stage1 component
interface EmissionFactor {
  _id?: string;
  // General fields
  description: string;
  scope: string;
  category: string;
  location: string;
  unit: string;
  dataSource: string;
  // Calculation method
  methodType: "Volume Based" | "Spend Based" | "Distance Based" | "Mass Based";
  // Emission factor fields
  co2ePerUnit: number;
  emissionFactorUnit: string;
  ghgReportingStandard: string; // required
  sourceOrDisclosureRequirement: string; // required
}

// Helper function to validate emission factor data using schema
function validateEmissionFactorData(data: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const field of emissionFactorFields) {
    const value = data[field.key];

    if (field.required) {
      if (field.type === "number") {
        if (
          value === undefined ||
          value === null ||
          typeof value !== "number" ||
          isNaN(value)
        ) {
          errors.push(`${field.label} is required and must be a valid number`);
        }
      } else {
        // For strings, check if it's undefined, null, or empty string
        // But allow empty strings if the field allows it (for CSV imports)
        if (
          value === undefined ||
          value === null ||
          (typeof value === "string" &&
            value.trim() === "" &&
            !field.allowEmpty)
        ) {
          errors.push(`${field.label} is required`);
        }
      }
    }

    // Additional validation for specific field types
    if (field.validation) {
      if (
        field.validation.min !== undefined &&
        typeof value === "number" &&
        value < field.validation.min
      ) {
        errors.push(`${field.label} must be at least ${field.validation.min}`);
      }
      if (
        field.validation.max !== undefined &&
        typeof value === "number" &&
        value > field.validation.max
      ) {
        errors.push(`${field.label} must be at most ${field.validation.max}`);
      }
      if (
        field.validation.enumOptions &&
        typeof value === "string" &&
        !field.validation.enumOptions.includes(value)
      ) {
        errors.push(
          `${field.label} must be one of: ${field.validation.enumOptions.join(
            ", "
          )}`
        );
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

// Fallback in-memory storage for testing when MongoDB is not available
let fallbackStorage: EmissionFactor[] = [];
let fallbackIdCounter = 1;

export async function GET() {
  try {
    console.log("Attempting to connect to MongoDB...");
    const db = await getDb();
    console.log("Database connection successful");

    // Test the connection by checking if we can access the collection
    const collection = db.collection<EmissionFactor>("emission_factors");
    const count = await collection.countDocuments();
    console.log(`Collection 'emission_factors' exists with ${count} documents`);

    const factors = await collection.find({}).toArray();
    console.log(`Found ${factors.length} emission factors`);
    console.log("Raw factors from MongoDB:", JSON.stringify(factors, null, 2));

    // Ensure new fields are always present in the response
    const withDefaults = factors.map((f) => ({
      ...f,
      _id: f._id?.toString(), // Ensure _id is a string
      description: f.description || "",
      scope: f.scope || "",
      category: f.category || "",
      location: f.location || "",
      unit: f.unit || "",
      dataSource: f.dataSource || "",
      methodType: f.methodType || "Volume Based",
      co2ePerUnit:
        typeof f.co2ePerUnit === "number"
          ? f.co2ePerUnit
          : Number(f.co2ePerUnit) || 0,
      emissionFactorUnit: f.emissionFactorUnit || "",
      ghgReportingStandard: f.ghgReportingStandard || "N/A",
      sourceOrDisclosureRequirement: f.sourceOrDisclosureRequirement || "N/A",
    }));

    console.log(
      "Processed factors with defaults:",
      JSON.stringify(withDefaults, null, 2)
    );
    return NextResponse.json(withDefaults);
  } catch (error) {
    console.error("Error fetching emission factors:", error);
    console.log("Using fallback storage for emission factors");
    console.log(
      "Fallback storage contents:",
      JSON.stringify(fallbackStorage, null, 2)
    );
    // Return fallback storage instead of empty array
    return NextResponse.json(fallbackStorage);
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("Attempting to add emission factor...");
    const data = await req.json();
    console.log("Received data:", JSON.stringify(data, null, 2));

    // Use the new validation function
    const validation = validateEmissionFactorData(data);
    if (!validation.isValid) {
      console.log("Validation failed:", validation.errors);
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    console.log("Validation passed, connecting to MongoDB...");

    try {
      const db = await getDb();
      console.log("MongoDB connection successful");

      // Test the connection by checking if we can access the collection
      const collection = db.collection<EmissionFactor>("emission_factors");
      const count = await collection.countDocuments();
      console.log(
        `Collection 'emission_factors' exists with ${count} documents`
      );

      const result = await collection.insertOne(data);

      console.log(
        "Successfully inserted emission factor with ID:",
        result.insertedId
      );
      return NextResponse.json({ insertedId: result.insertedId });
    } catch (dbError) {
      console.error(
        "MongoDB connection failed, using fallback storage:",
        dbError
      );

      // Use fallback storage
      const newFactor: EmissionFactor = {
        _id: `fallback_${fallbackIdCounter++}`,
        ...data,
      };

      fallbackStorage.push(newFactor);
      console.log(
        "Successfully added to fallback storage with ID:",
        newFactor._id
      );
      return NextResponse.json({ insertedId: newFactor._id });
    }
  } catch (error) {
    console.error("Error adding emission factor:", error);
    // Return a more specific error message
    return NextResponse.json(
      {
        error: `Failed to add emission factor: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    console.log("Attempting to update emission factor...");
    const data = await req.json();
    console.log("Received update data:", JSON.stringify(data, null, 2));

    // Check if _id is present
    if (!data._id) {
      return NextResponse.json(
        { error: "Emission factor ID is required" },
        { status: 400 }
      );
    }

    // Use the new validation function
    const validation = validateEmissionFactorData(data);
    if (!validation.isValid) {
      console.log("Validation failed:", validation.errors);
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    console.log("Validation passed, attempting to update...");

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
          { error: "Invalid emission factor ID format" },
          { status: 400 }
        );
      }

      const result = await db
        .collection<EmissionFactor>("emission_factors")
        .updateOne(
          { _id: objectId },
          {
            $set: data,
          }
        );

      console.log("MongoDB update result:", result);

      if (result.matchedCount === 0) {
        console.log(
          "Emission factor not found in MongoDB, checking fallback storage..."
        );
        // Check if it's in fallback storage
        const fallbackIndex = fallbackStorage.findIndex(
          (f) => f._id === data._id
        );
        console.log("Fallback storage search result:", {
          _id: data._id,
          fallbackIndex,
          fallbackStorageLength: fallbackStorage.length,
        });

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
          { error: "Emission factor not found" },
          { status: 404 }
        );
      }

      console.log("Successfully updated emission factor in MongoDB");
      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.error("MongoDB update failed, trying fallback storage:", dbError);

      // Try fallback storage
      const fallbackIndex = fallbackStorage.findIndex(
        (f) => f._id === data._id
      );
      console.log("Fallback storage search result:", {
        _id: data._id,
        fallbackIndex,
        fallbackStorageLength: fallbackStorage.length,
      });

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
        { error: "Emission factor not found in any storage" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error updating emission factor:", error);
    return NextResponse.json(
      {
        error: `Failed to update emission factor: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    console.log("Attempting to delete emission factor...");

    // Get the ID from the URL search params
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Emission factor ID is required" },
        { status: 400 }
      );
    }

    console.log("Deleting emission factor with ID:", id);

    try {
      // Try MongoDB first
      const db = await getDb();
      const collection = db.collection<EmissionFactor>("emission_factors");

      const result = await collection.deleteOne({ _id: id });

      if (result.deletedCount > 0) {
        console.log("Successfully deleted emission factor from MongoDB");
        return NextResponse.json({
          success: true,
          message: "Emission factor deleted successfully",
        });
      }

      // If not found in MongoDB, check fallback storage
      const fallbackIndex = fallbackStorage.findIndex((f) => f._id === id);

      if (fallbackIndex !== -1) {
        // Remove from fallback storage
        fallbackStorage.splice(fallbackIndex, 1);
        console.log(
          "Successfully deleted emission factor from fallback storage"
        );
        return NextResponse.json({
          success: true,
          message: "Emission factor deleted successfully",
        });
      }

      return NextResponse.json(
        { error: "Emission factor not found" },
        { status: 404 }
      );
    } catch (dbError) {
      console.error("MongoDB delete failed, trying fallback storage:", dbError);

      // Try fallback storage
      const fallbackIndex = fallbackStorage.findIndex((f) => f._id === id);

      if (fallbackIndex !== -1) {
        // Remove from fallback storage
        fallbackStorage.splice(fallbackIndex, 1);
        console.log(
          "Successfully deleted emission factor from fallback storage"
        );
        return NextResponse.json({
          success: true,
          message: "Emission factor deleted successfully",
        });
      }

      return NextResponse.json(
        { error: "Emission factor not found in any storage" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error deleting emission factor:", error);
    return NextResponse.json(
      {
        error: `Failed to delete emission factor: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
