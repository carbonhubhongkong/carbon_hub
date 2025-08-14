// IndexedDB service layer for client-side data storage
// Replaces MongoDB functionality with browser-based storage

interface ReportingActivity {
  _id?: string;
  reportingPeriodStart: string;
  reportingPeriodEnd: string;
  scope: string;
  category: string;
  activityName: string;
  location: string;
  quantity: number;
  emissionFactorId?: string; // Keep for backward compatibility
  emissionFactorData?: {
    // New: Store emission factor data directly
    description: string;
    co2ePerUnit: number;
    emissionFactorUnit: string;
    unit: string;
  };
  remarks?: string;
  calculatedEmissions?: number;
}

interface EmissionFactor {
  _id?: string;
  description: string;
  scope: string;
  category: string;
  location: string;
  unit: string;
  dataSource: string;
  methodType: "Volume Based" | "Spend Based" | "Distance Based" | "Mass Based";
  co2ePerUnit: number;
  emissionFactorUnit: string;
  ghgReportingStandard: string;
  sourceOrDisclosureRequirement: string;
}

interface GhgReportingStandard {
  _id?: string;
  name: string;
}

class IndexedDBService {
  private dbName = "CarbonHubDB";
  private version = 1;
  private db: IDBDatabase | null = null;

  // Database initialization
  async init(): Promise<void> {
    console.log("IndexedDB: Initializing database...");
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error(
          "IndexedDB: Database initialization error:",
          request.error
        );
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("IndexedDB: Database initialized successfully");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        console.log(
          "IndexedDB: Database upgrade needed, creating object stores..."
        );
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains("reporting_activities")) {
          console.log("IndexedDB: Creating reporting_activities store");
          const activityStore = db.createObjectStore("reporting_activities", {
            keyPath: "_id",
            autoIncrement: true,
          });
          activityStore.createIndex("scope", "scope", { unique: false });
          activityStore.createIndex("category", "category", { unique: false });
          activityStore.createIndex("location", "location", { unique: false });
        }

        if (!db.objectStoreNames.contains("emission_factors")) {
          console.log("IndexedDB: Creating emission_factors store");
          const factorStore = db.createObjectStore("emission_factors", {
            keyPath: "_id",
            autoIncrement: true,
          });
          factorStore.createIndex("scope", "scope", { unique: false });
          factorStore.createIndex("category", "category", { unique: false });
          factorStore.createIndex("location", "location", { unique: false });
        }

        if (!db.objectStoreNames.contains("ghg_reporting_standards")) {
          console.log("IndexedDB: Creating ghg_reporting_standards store");
          const standardStore = db.createObjectStore(
            "ghg_reporting_standards",
            { keyPath: "_id", autoIncrement: true }
          );
          standardStore.createIndex("name", "name", { unique: true });
        }

        console.log("IndexedDB: Object stores created successfully");
      };
    });
  }

  // Ensure database is initialized
  private async ensureInit(): Promise<void> {
    if (!this.db) {
      console.log("IndexedDB: Database not initialized, initializing now...");
      await this.init();
    } else {
      console.log("IndexedDB: Database already initialized");
    }
  }

  // Generic CRUD operations
  private async add<T>(storeName: string, item: T): Promise<string> {
    await this.ensureInit();
    console.log(`IndexedDB: Adding item to ${storeName}:`, item);
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onsuccess = () => {
        console.log(
          `IndexedDB: Item added to ${storeName} with ID:`,
          request.result
        );
        resolve(request.result as string);
      };
      request.onerror = () => {
        console.error(
          `IndexedDB: Error adding item to ${storeName}:`,
          request.error
        );
        reject(request.error);
      };
    });
  }

  private async get<T>(storeName: string, id: string): Promise<T | null> {
    await this.ensureInit();
    console.log(`IndexedDB: Getting item from ${storeName} with ID:`, id);
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        console.log(
          `IndexedDB: Retrieved item from ${storeName}:`,
          request.result
        );
        resolve(request.result || null);
      };
      request.onerror = () => {
        console.error(
          `IndexedDB: Error getting item from ${storeName}:`,
          request.error
        );
        reject(request.error);
      };
    });
  }

  private async getAll<T>(storeName: string): Promise<T[]> {
    await this.ensureInit();
    console.log(`IndexedDB: Getting all items from ${storeName}`);
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        console.log(
          `IndexedDB: Retrieved ${
            request.result?.length || 0
          } items from ${storeName}`
        );
        resolve(request.result || []);
      };
      request.onerror = () => {
        console.error(
          `IndexedDB: Error getting all items from ${storeName}:`,
          request.error
        );
        reject(request.error);
      };
    });
  }

  private async update<T>(storeName: string, item: T): Promise<void> {
    await this.ensureInit();
    console.log(`IndexedDB: Updating item in ${storeName}:`, item);
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => {
        console.log(`IndexedDB: Item updated in ${storeName} successfully`);
        resolve();
      };
      request.onerror = () => {
        console.error(
          `IndexedDB: Error updating item in ${storeName}:`,
          request.error
        );
        reject(request.error);
      };
    });
  }

  private async delete(storeName: string, id: string): Promise<void> {
    await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async clear(storeName: string): Promise<void> {
    await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Reporting Activities operations
  async addReportingActivity(
    activity: Omit<ReportingActivity, "_id">
  ): Promise<string> {
    console.log("IndexedDB: Adding reporting activity:", activity);
    const id = await this.add("reporting_activities", activity);
    console.log("IndexedDB: Activity added with ID:", id);
    return id;
  }

  async getReportingActivity(id: string): Promise<ReportingActivity | null> {
    console.log("IndexedDB: Getting reporting activity with ID:", id);
    const result = await this.get<ReportingActivity>(
      "reporting_activities",
      id
    );
    console.log("IndexedDB: Retrieved activity:", result);
    return result;
  }

  async getAllReportingActivities(): Promise<ReportingActivity[]> {
    console.log("IndexedDB: Getting all reporting activities");
    const result = await this.getAll<ReportingActivity>("reporting_activities");
    console.log("IndexedDB: Retrieved activities:", result);
    return result;
  }

  async updateReportingActivity(activity: ReportingActivity): Promise<void> {
    console.log("IndexedDB: Updating reporting activity:", activity);
    await this.update("reporting_activities", activity);
    console.log("IndexedDB: Activity updated successfully");
  }

  async deleteReportingActivity(id: string): Promise<void> {
    console.log("IndexedDB: Deleting reporting activity with ID:", id);
    await this.delete("reporting_activities", id);
    console.log("IndexedDB: Activity deleted successfully");
  }

  // Emission Factors operations
  async addEmissionFactor(
    factor: Omit<EmissionFactor, "_id">
  ): Promise<string> {
    console.log("IndexedDB: Adding emission factor:", factor);
    const id = await this.add("emission_factors", factor);
    console.log("IndexedDB: Emission factor added with ID:", id);
    return id;
  }

  async getEmissionFactor(id: string): Promise<EmissionFactor | null> {
    console.log("IndexedDB: Getting emission factor with ID:", id);
    const result = await this.get<EmissionFactor>("emission_factors", id);
    console.log("IndexedDB: Retrieved emission factor:", result);
    return result;
  }

  async getAllEmissionFactors(): Promise<EmissionFactor[]> {
    console.log("IndexedDB: Getting all emission factors");
    const result = await this.getAll<EmissionFactor>("emission_factors");
    console.log("IndexedDB: Retrieved emission factors:", result);
    return result;
  }

  async updateEmissionFactor(factor: EmissionFactor): Promise<void> {
    console.log("IndexedDB: Updating emission factor:", factor);
    await this.update("emission_factors", factor);
    console.log("IndexedDB: Emission factor updated successfully");
  }

  async deleteEmissionFactor(id: string): Promise<void> {
    console.log("IndexedDB: Deleting emission factor with ID:", id);
    await this.delete("emission_factors", id);
    console.log("IndexedDB: Emission factor deleted successfully");
  }

  // GHG Reporting Standards operations
  async addGhgReportingStandard(
    standard: Omit<GhgReportingStandard, "_id">
  ): Promise<string> {
    const id = await this.add("ghg_reporting_standards", standard);
    return id;
  }

  async getAllGhgReportingStandards(): Promise<GhgReportingStandard[]> {
    return this.getAll<GhgReportingStandard>("ghg_reporting_standards");
  }

  // Seed default data
  async seedDefaultData(): Promise<void> {
    try {
      const standards = await this.getAllGhgReportingStandards();
      if (standards.length === 0) {
        const defaultStandards = [
          { name: "GHG Protocol" },
          { name: "GRI Standards" },
          { name: "ISO 14064" },
          { name: "IFRS - ISSB" },
          { name: "Custom" },
        ];

        for (const standard of defaultStandards) {
          await this.addGhgReportingStandard(standard);
        }
        console.log("Default GHG reporting standards seeded");
      }
    } catch (error) {
      console.error("Error seeding default data:", error);
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      await this.clear("reporting_activities");
      await this.clear("emission_factors");
      await this.clear("ghg_reporting_standards");
      console.log("All data cleared successfully");
    } catch (error) {
      console.error("Error clearing data:", error);
      throw error;
    }
  }

  // Export data for backup
  async exportData(): Promise<{
    reporting_activities: ReportingActivity[];
    emission_factors: EmissionFactor[];
    ghg_reporting_standards: GhgReportingStandard[];
  }> {
    try {
      const [activities, factors, standards] = await Promise.all([
        this.getAllReportingActivities(),
        this.getAllEmissionFactors(),
        this.getAllGhgReportingStandards(),
      ]);

      return {
        reporting_activities: activities,
        emission_factors: factors,
        ghg_reporting_standards: standards,
      };
    } catch (error) {
      console.error("Error exporting data:", error);
      throw error;
    }
  }

  // Import data from backup
  async importData(data: {
    reporting_activities: ReportingActivity[];
    emission_factors: EmissionFactor[];
    ghg_reporting_standards: GhgReportingStandard[];
  }): Promise<void> {
    try {
      // Clear existing data first
      await this.clearAllData();

      // Import new data
      for (const standard of data.ghg_reporting_standards) {
        await this.addGhgReportingStandard(standard);
      }

      for (const factor of data.emission_factors) {
        const { _id, ...factorData } = factor;
        await this.addEmissionFactor(factorData);
      }

      for (const activity of data.reporting_activities) {
        const { _id, ...activityData } = activity;
        await this.addReportingActivity(activityData);
      }

      console.log("Data imported successfully");
    } catch (error) {
      console.error("Error importing data:", error);
      throw error;
    }
  }
}

// Create and export singleton instance
const indexedDBService = new IndexedDBService();

// Initialize the service when the module is loaded
indexedDBService
  .init()
  .then(() => {
    indexedDBService.seedDefaultData();
  })
  .catch((error) => {
    console.error("Failed to initialize IndexedDB:", error);
  });

export default indexedDBService;
export type { ReportingActivity, EmissionFactor, GhgReportingStandard };
