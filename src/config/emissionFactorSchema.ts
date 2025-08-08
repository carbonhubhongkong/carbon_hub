// Centralized schema for emission factor profile fields
// To add, remove, or update fields, edit this file only. All form, CSV, and validation logic will use this schema.
// Each field should have: key, label, type, required, validation, and example.

export interface EmissionFactorField {
  key: string;
  label: string;
  type: "string" | "number" | "enum";
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    regex?: string;
    enumOptions?: string[];
    customError?: string;
  };
  example: string | number;
}

// Update this array to change the required fields for emission factor profiles.
export const emissionFactorFields: EmissionFactorField[] = [
  {
    key: "description",
    label: "Description",
    type: "string",
    required: true,
    example: "Grid electricity, Hong Kong",
  },
  {
    key: "scope",
    label: "Scope",
    type: "enum",
    required: true,
    validation: {
      enumOptions: ["Scope 1", "Scope 2", "Scope 3"],
    },
    example: "Scope 2",
  },
  {
    key: "category",
    label: "Category",
    type: "string",
    required: true,
    example: "Electricity",
  },
  {
    key: "location",
    label: "Country/Region/Location",
    type: "string",
    required: true,
    example: "Hong Kong",
  },
  {
    key: "unit",
    label: "Unit on Quantity",
    type: "string",
    required: true,
    example: "kWh",
  },
  {
    key: "dataSource",
    label: "Data Source/Collection Method",
    type: "string",
    required: true,
    example: "Utility bill",
  },
  {
    key: "methodType",
    label: "Method Type",
    type: "enum",
    required: true,
    validation: {
      enumOptions: [
        "Volume Based",
        "Spend Based",
        "Distance Based",
        "Mass Based",
      ],
    },
    example: "Volume Based",
  },
  {
    key: "co2ePerUnit",
    label: "CO2e per Unit",
    type: "number",
    required: true,
    validation: {
      min: 0,
    },
    example: 0.81,
  },
  {
    key: "emissionFactorUnit",
    label: "Emission Factor Unit",
    type: "string",
    required: true,
    example: "kg CO2e/kWh",
  },
  {
    key: "ghgReportingStandard",
    label: "GHG Reporting Standard",
    type: "enum",
    required: true,
    validation: {
      enumOptions: [
        "GHG Protocol",
        "GRI Standards",
        "ISO 14064",
        "IFRS - ISSB",
        "Custom",
      ],
    },
    example: "GHG Protocol",
  },
  {
    key: "sourceOrDisclosureRequirement",
    label: "Source or Disclosure Requirement",
    type: "string",
    required: true,
    example:
      "https://www.epd.gov.hk/epd/english/climate_change/files/EF_2022.pdf",
  },
];

// To update validation rules, add or modify the 'validation' property for each field.
// To update the CSV template or example row, edit the 'example' property for each field.
