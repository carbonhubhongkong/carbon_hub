import { MongoClient, Db } from "mongodb";

// Get MongoDB URI from environment variables
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("MONGODB_URI environment variable is not set!");
  console.error(
    "Please check your .env.local file contains the MONGODB_URI variable."
  );
  console.error("Example: MONGODB_URI=mongodb://localhost:27017/carbon_hub");
  throw new Error(
    "Please define the MONGODB_URI environment variable in your .env.local file"
  );
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development, use a global variable so the value is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!(global as any)._mongoClientPromise) {
    client = new MongoClient(uri);
    (global as any)._mongoClientPromise = client.connect();
  }
  clientPromise = (global as any)._mongoClientPromise;
} else {
  // In production, it's best to not use a global variable.
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDb(): Promise<Db> {
  try {
    const client = await clientPromise;

    // Test the connection by running a simple command
    await client.db().admin().ping();

    return client.db(); // Uses the database specified in the URI
  } catch (error) {
    console.error("MongoDB connection failed:", error);

    if (error instanceof Error) {
      if (error.message.includes("ECONNREFUSED")) {
        throw new Error(
          "MongoDB connection refused. Please check if MongoDB is running."
        );
      } else if (error.message.includes("ENOTFOUND")) {
        throw new Error(
          "MongoDB host not found. Please check your connection string."
        );
      } else if (error.message.includes("Authentication failed")) {
        throw new Error(
          "MongoDB authentication failed. Please check your username and password."
        );
      } else if (error.message.includes("ENETUNREACH")) {
        throw new Error(
          "MongoDB network unreachable. Please check your network connection."
        );
      }
    }

    throw new Error(
      `MongoDB connection failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Returns the GHG Reporting Standards collection. If the collection is empty, seeds it with the default list.
 * To add or change the options, update the `defaultStandards` array below and re-run the seeding logic.
 */
export async function getGhgReportingStandardsCollection() {
  try {
    console.log("Connecting to MongoDB for GHG Reporting Standards...");
    const db = await getDb();
    console.log("Database connection successful");

    const collection = db.collection("ghg_reporting_standards");
    const count = await collection.countDocuments();
    console.log(`GHG Reporting Standards collection has ${count} documents`);

    if (count === 0) {
      console.log("Seeding GHG Reporting Standards collection...");
      const defaultStandards = [
        { name: "GHG Protocol" },
        { name: "GRI Standards" },
        { name: "ISO 14064" },
        { name: "IFRS - ISSB" },
        { name: "Custom" },
      ];
      await collection.insertMany(defaultStandards);
      console.log("Successfully seeded GHG Reporting Standards");
    }
    return collection;
  } catch (error) {
    console.error("Error in getGhgReportingStandardsCollection:", error);
    throw error;
  }
}
