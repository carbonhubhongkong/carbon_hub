import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI as string;
if (!uri) {
  throw new Error(
    "Please define the MONGODB_URI environment variable in .env.local"
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
  const client = await clientPromise;
  return client.db(); // Uses the database specified in the URI
}

/**
 * Returns the GHG Reporting Standards collection. If the collection is empty, seeds it with the default list.
 * To add or change the options, update the `defaultStandards` array below and re-run the seeding logic.
 */
export async function getGhgReportingStandardsCollection() {
  const db = await getDb();
  const collection = db.collection("ghg_reporting_standards");
  const count = await collection.countDocuments();
  if (count === 0) {
    const defaultStandards = [
      { name: "GHG Protocol" },
      { name: "GRI Standards" },
      { name: "ISO 14064" },
      { name: "IFRS - ISSB" },
      { name: "Custom" },
    ];
    await collection.insertMany(defaultStandards);
  }
  return collection;
}
